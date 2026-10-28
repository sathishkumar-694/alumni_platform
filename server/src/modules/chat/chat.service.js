import { queryMySQL } from '../../config/mysql.js';
import { ApiError } from '../../shared/ApiError.js';

/**
 * Ensures the chat_messages table exists in the DB.
 * Called once on server startup via ensureDatabaseSchema.
 */
export const ensureChatSchema = async () => {
  await queryMySQL(`
    CREATE TABLE IF NOT EXISTS \`chat_messages\` (
      \`id\`              VARCHAR(60)  NOT NULL PRIMARY KEY,
      \`mentorship_id\`   VARCHAR(50)  NOT NULL,
      \`sender_id\`       VARCHAR(50)  NOT NULL,
      \`content\`         TEXT         NOT NULL,
      \`is_read\`         TINYINT(1)   DEFAULT 0,
      \`created_at\`      DATETIME     DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_chat_mentorship (\`mentorship_id\`),
      INDEX idx_chat_sender     (\`sender_id\`),
      INDEX idx_chat_created    (\`created_at\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

export const chatService = {
  /**
   * Verify the requesting user is actually part of this active mentorship.
   * This is the core privacy guard — only the matched pair can chat.
   */
  async _assertAccess(userId, mentorshipId) {
    const rows = await queryMySQL(
      'SELECT * FROM `active_mentorships` WHERE `id` = ?',
      [mentorshipId]
    );
    const mentorship = rows[0];
    if (!mentorship) {
      throw new ApiError(404, 'Mentorship not found');
    }
    const isParticipant =
      mentorship.student_id === userId || mentorship.mentor_id === userId;
    if (!isParticipant) {
      throw new ApiError(403, 'Forbidden: You are not part of this mentorship conversation');
    }
    return mentorship;
  },

  /**
   * Returns all mentorship conversations for the current user,
   * enriched with the other participant's details and the latest message.
   */
  async getMyConversations(user) {
    const mentorships = await queryMySQL(
      `SELECT am.*, 
              u_student.name  AS student_name,
              u_mentor.name   AS mentor_name,
              u_student.email AS student_email,
              u_mentor.email  AS mentor_email,
              d.name          AS domain_name,
              d.icon          AS domain_icon
       FROM active_mentorships am
       JOIN users u_student ON u_student.id = am.student_id
       JOIN users u_mentor  ON u_mentor.id  = am.mentor_id
       LEFT JOIN domains d  ON d.id         = am.domain_id
       WHERE (am.student_id = ? OR am.mentor_id = ?)
       ORDER BY am.id DESC`,
      [user.id, user.id]
    );

    // For each mentorship, fetch last message + unread count
    const conversations = await Promise.all(
      mentorships.map(async (m) => {
        const [lastMsg] = await queryMySQL(
          'SELECT * FROM `chat_messages` WHERE `mentorship_id` = ? ORDER BY `created_at` DESC LIMIT 1',
          [m.id]
        );
        const [{ unread_count }] = await queryMySQL(
          'SELECT COUNT(*) AS unread_count FROM `chat_messages` WHERE `mentorship_id` = ? AND `sender_id` != ? AND `is_read` = 0',
          [m.id, user.id]
        );

        const otherUser =
          user.id === m.student_id
            ? { id: m.mentor_id, name: m.mentor_name, email: m.mentor_email, role: 'ALUMNI' }
            : { id: m.student_id, name: m.student_name, email: m.student_email, role: 'STUDENT' };

        return {
          mentorship_id: m.id,
          status: m.status,
          domain: { name: m.domain_name || 'General', icon: m.domain_icon || 'Code' },
          other_user: otherUser,
          last_message: lastMsg || null,
          unread_count: Number(unread_count),
          started_at: m.started_at
        };
      })
    );

    return conversations;
  },

  /**
   * Paginated message history for a specific mentorship.
   * Privacy: _assertAccess throws 403 if user isn't part of the pair.
   */
  async getMessages(user, mentorshipId, page = 1, limit = 50) {
    await this._assertAccess(user.id, mentorshipId);

    // mysql2's prepared-statement protocol can reject placeholders in LIMIT/OFFSET
    // with some MySQL-compatible hosts. Keep the values numeric before embedding.
    const safePage = Number.isSafeInteger(Number(page)) ? Math.max(1, Number(page)) : 1;
    const safeLimit = Number.isSafeInteger(Number(limit)) ? Math.min(100, Math.max(1, Number(limit))) : 50;
    const offset = (safePage - 1) * safeLimit;
    const messages = await queryMySQL(
      `SELECT cm.*, u.name AS sender_name, u.role AS sender_role
       FROM \`chat_messages\` cm
       JOIN \`users\` u ON u.id = cm.sender_id
       WHERE cm.mentorship_id = ?
       ORDER BY cm.created_at DESC
       LIMIT ${safeLimit} OFFSET ${offset}`,
      [mentorshipId]
    );

    const [{ total }] = await queryMySQL(
      'SELECT COUNT(*) AS total FROM `chat_messages` WHERE `mentorship_id` = ?',
      [mentorshipId]
    );

    // Return oldest-first for the UI
    return {
      messages: messages.reverse(),
      pagination: { page: safePage, limit: safeLimit, total: Number(total), pages: Math.ceil(Number(total) / safeLimit) }
    };
  },

  /**
   * Send a message in a mentorship chat.
   * Privacy: _assertAccess prevents unauthorized writes.
   */
  async sendMessage(user, mentorshipId, content) {
    await this._assertAccess(user.id, mentorshipId);

    const id = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    await queryMySQL(
      'INSERT INTO `chat_messages` (`id`, `mentorship_id`, `sender_id`, `content`) VALUES (?, ?, ?, ?)',
      [id, mentorshipId, user.id, content]
    );

    const rows = await queryMySQL(
      `SELECT cm.*, u.name AS sender_name, u.role AS sender_role
       FROM \`chat_messages\` cm
       JOIN \`users\` u ON u.id = cm.sender_id
       WHERE cm.id = ?`,
      [id]
    );
    return rows[0];
  },

  /**
   * Mark all messages in a conversation as read for the current user.
   */
  async markConversationRead(user, mentorshipId) {
    await this._assertAccess(user.id, mentorshipId);
    await queryMySQL(
      'UPDATE `chat_messages` SET `is_read` = 1 WHERE `mentorship_id` = ? AND `sender_id` != ?',
      [mentorshipId, user.id]
    );
    return true;
  }
};
