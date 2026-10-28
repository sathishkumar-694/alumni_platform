import { db } from '../../config/db.js';
import { getMySQLPool } from '../../config/mysql.js';

export class UsersRepository {
  async updateStudentProfile(userId, profileData) {
    return await db.studentProfiles.createOrUpdate(userId, profileData);
  }

  async updateAlumniProfile(userId, profileData) {
    return await db.alumniProfiles.createOrUpdate(userId, profileData);
  }

  async findAllUsers() {
    return await db.users.find();
  }

  async findUserById(id) {
    return await db.users.findById(id);
  }

  async updateUser(id, updates) {
    return await db.users.update(id, updates);
  }

  async getStudentProfile(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async getAlumniProfile(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }

  async logAuditAction(adminId, action, targetUserId, details) {
    return await db.auditLogs.log(adminId, action, targetUserId, details);
  }

  async deleteUserAndRelatedData(userId) {
    const pool = getMySQLPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query('SELECT id, role FROM users WHERE id = ? FOR UPDATE', [userId]);
      if (!rows[0]) {
        await connection.rollback();
        return false;
      }

      const [mentorships] = await connection.query(
        'SELECT id FROM active_mentorships WHERE student_id = ? OR mentor_id = ?',
        [userId, userId]
      );
      const mentorshipIds = mentorships.map((row) => row.id);
      if (mentorshipIds.length) {
        const marks = mentorshipIds.map(() => '?').join(',');
        for (const table of ['chat_messages', 'sessions', 'milestones']) {
          await connection.query(`DELETE FROM \`${table}\` WHERE mentorship_id IN (${marks})`, mentorshipIds);
        }
      }

      for (const [table, column] of [
        ['student_profiles', 'user_id'], ['alumni_profiles', 'user_id'],
        ['id_verifications', 'user_id'], ['mentorship_requests', 'student_id'],
        ['mentorship_requests', 'mentor_id'], ['active_mentorships', 'student_id'],
        ['active_mentorships', 'mentor_id'], ['chat_messages', 'sender_id'],
        ['notifications', 'user_id'], ['online_status', 'user_id'],
        ['resources', 'mentor_id'], ['announcements', 'author_id'],
        ['job_referrals', 'alumni_id'], ['referral_applications', 'student_id'],
        ['resume_analyses', 'user_id'], ['domain_requests', 'mentor_id'],
        ['reassign_requests', 'student_id'], ['reassign_requests', 'old_mentor_id']
      ]) {
        await connection.query(`DELETE FROM \`${table}\` WHERE \`${column}\` = ?`, [userId]);
      }

      await connection.query('UPDATE audit_logs SET target_user_id = NULL WHERE target_user_id = ?', [userId]);
      await connection.query('DELETE FROM users WHERE id = ?', [userId]);
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const usersRepository = new UsersRepository();
