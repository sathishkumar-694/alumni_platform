import { queryMySQL } from './mysql.js';

const formatMySQLDateTime = (dateValue) => {
  if (!dateValue) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

export const db = {
  users: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `users`');
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `users` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    findByEmail: async (email) => {
      const rows = await queryMySQL('SELECT * FROM `users` WHERE LOWER(`email`) = LOWER(?)', [email]);
      return rows[0] || null;
    },
    create: async (user) => {
      const id = user.id || `u-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `verification_status`) VALUES (?, ?, ?, ?, ?, ?)',
        [id, user.name, user.email, user.password_hash, user.role, user.verification_status || 'PENDING']
      );
      const rows = await queryMySQL('SELECT * FROM `users` WHERE `id` = ?', [id]);
      return rows[0];
    },
    update: async (id, updates) => {
      const fields = [];
      const values = [];
      Object.keys(updates).forEach(key => {
        fields.push(`\`${key}\` = ?`);
        values.push(updates[key]);
      });
      values.push(id);
      await queryMySQL(`UPDATE \`users\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
      const rows = await queryMySQL('SELECT * FROM `users` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  studentProfiles: {
    find: async () => {
      const rows = await queryMySQL('SELECT * FROM `student_profiles`');
      return rows.map(r => ({
        ...r,
        interests: r.interests ? (typeof r.interests === 'string' ? JSON.parse(r.interests) : r.interests) : []
      }));
    },
    findByUserId: async (userId) => {
      const rows = await queryMySQL('SELECT * FROM `student_profiles` WHERE `user_id` = ?', [userId]);
      if (!rows[0]) return null;
      return {
        ...rows[0],
        interests: rows[0].interests ? (typeof rows[0].interests === 'string' ? JSON.parse(rows[0].interests) : rows[0].interests) : []
      };
    },
    create: async (profile) => {
      const interestsJson = JSON.stringify(profile.interests || []);
      await queryMySQL(
        'INSERT INTO `student_profiles` (`user_id`, `reg_number`, `student_id_card_url`, `academic_year`, `department`, `career_goals`, `interests`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [profile.user_id, profile.reg_number || '', profile.student_id_card_url || '', profile.academic_year || '3rd Year', profile.department || 'Computer Science & Engineering', profile.career_goals || '', interestsJson]
      );
      const rows = await queryMySQL('SELECT * FROM `student_profiles` WHERE `user_id` = ?', [profile.user_id]);
      return { ...rows[0], interests: profile.interests || [] };
    },
    update: async (userId, updates) => {
      if (!updates || Object.keys(updates).length === 0) return await db.studentProfiles.findByUserId(userId);
      const fields = [];
      const values = [];
      Object.keys(updates).forEach(key => {
        fields.push(`\`${key}\` = ?`);
        values.push(key === 'interests' ? JSON.stringify(updates[key]) : updates[key]);
      });
      values.push(userId);
      await queryMySQL(`UPDATE \`student_profiles\` SET ${fields.join(', ')} WHERE \`user_id\` = ?`, values);
      return await db.studentProfiles.findByUserId(userId);
    },
    createOrUpdate: async (userId, data) => {
      const existing = await db.studentProfiles.findByUserId(userId);
      if (existing) {
        return await db.studentProfiles.update(userId, data);
      } else {
        return await db.studentProfiles.create({ ...data, user_id: userId });
      }
    }
  },

  alumniProfiles: {
    find: async () => {
      const rows = await queryMySQL('SELECT * FROM `alumni_profiles`');
      return rows.map(r => ({
        ...r,
        expertise: r.expertise ? (typeof r.expertise === 'string' ? JSON.parse(r.expertise) : r.expertise) : []
      }));
    },
    findByUserId: async (userId) => {
      const rows = await queryMySQL('SELECT * FROM `alumni_profiles` WHERE `user_id` = ?', [userId]);
      if (!rows[0]) return null;
      return {
        ...rows[0],
        expertise: rows[0].expertise ? (typeof rows[0].expertise === 'string' ? JSON.parse(rows[0].expertise) : rows[0].expertise) : []
      };
    },
    create: async (profile) => {
      const expertiseJson = JSON.stringify(profile.expertise || []);
      await queryMySQL(
        'INSERT INTO `alumni_profiles` (`user_id`, `alumni_id_card_url`, `company`, `designation`, `experience_years`, `graduation_year`, `linkedin_url`, `max_capacity`, `current_capacity`, `expertise`, `bio`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [profile.user_id, profile.alumni_id_card_url || '', profile.company || '', profile.designation || '', profile.experience_years || 1, profile.graduation_year || 2020, profile.linkedin_url || '', profile.max_capacity || 5, profile.current_capacity || 0, expertiseJson, profile.bio || '']
      );
      const rows = await queryMySQL('SELECT * FROM `alumni_profiles` WHERE `user_id` = ?', [profile.user_id]);
      return { ...rows[0], expertise: profile.expertise || [] };
    },
    update: async (userId, updates) => {
      if (!updates || Object.keys(updates).length === 0) return await db.alumniProfiles.findByUserId(userId);
      const fields = [];
      const values = [];
      Object.keys(updates).forEach(key => {
        fields.push(`\`${key}\` = ?`);
        values.push(key === 'expertise' ? JSON.stringify(updates[key]) : updates[key]);
      });
      values.push(userId);
      await queryMySQL(`UPDATE \`alumni_profiles\` SET ${fields.join(', ')} WHERE \`user_id\` = ?`, values);
      return await db.alumniProfiles.findByUserId(userId);
    },
    createOrUpdate: async (userId, data) => {
      const existing = await db.alumniProfiles.findByUserId(userId);
      if (existing) {
        return await db.alumniProfiles.update(userId, data);
      } else {
        return await db.alumniProfiles.create({ ...data, user_id: userId });
      }
    }
  },

  domains: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `domains` ORDER BY `name` ASC');
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `domains` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `d-${Date.now()}`;
      const category = data.category || 'Core Engineering';
      const icon = data.icon || 'Code';
      await queryMySQL(
        'INSERT INTO `domains` (`id`, `name`, `category`, `description`, `icon`) VALUES (?, ?, ?, ?, ?)',
        [id, data.name, category, data.description || '', icon]
      );
      const rows = await queryMySQL('SELECT * FROM `domains` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  domainRequests: {
    findPending: async () => {
      return await queryMySQL('SELECT * FROM `domain_requests` WHERE `status` = ? ORDER BY `created_at` DESC', ['PENDING']);
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `domain_requests` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `dr-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `domain_requests` (`id`, `mentor_id`, `name`, `description`, `status`) VALUES (?, ?, ?, ?, ?)',
        [id, data.mentor_id, data.name, data.description || '', 'PENDING']
      );
      const rows = await queryMySQL('SELECT * FROM `domain_requests` WHERE `id` = ?', [id]);
      return rows[0];
    },
    updateStatus: async (id, status) => {
      await queryMySQL('UPDATE `domain_requests` SET `status` = ? WHERE `id` = ?', [status, id]);
      const rows = await queryMySQL('SELECT * FROM `domain_requests` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  verifications: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `id_verifications` ORDER BY `submitted_at` DESC');
    },
    findByUserId: async (userId) => {
      const rows = await queryMySQL('SELECT * FROM `id_verifications` WHERE `user_id` = ?', [userId]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `v-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `id_verifications` (`id`, `user_id`, `document_type`, `document_url`, `status`) VALUES (?, ?, ?, ?, ?)',
        [id, data.user_id, data.document_type || 'ID_CARD', data.document_url || '', data.status || 'PENDING']
      );
      const rows = await queryMySQL('SELECT * FROM `id_verifications` WHERE `id` = ?', [id]);
      return rows[0];
    },
    update: async (userId, updates) => {
      const fields = [];
      const values = [];
      Object.keys(updates).forEach(key => {
        fields.push(`\`${key}\` = ?`);
        values.push(updates[key]);
      });
      values.push(userId);
      await queryMySQL(`UPDATE \`id_verifications\` SET ${fields.join(', ')} WHERE \`user_id\` = ?`, values);
      return await db.verifications.findByUserId(userId);
    }
  },

  mentorshipRequests: {
    find: async () => {
      try {
        return await queryMySQL('SELECT * FROM `mentorship_requests` ORDER BY `requested_at` DESC');
      } catch (err) {
        return await queryMySQL('SELECT * FROM `mentorship_requests` ORDER BY `id` DESC');
      }
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `mentorship_requests` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `mr-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `mentorship_requests` (`id`, `student_id`, `mentor_id`, `domain_id`, `message`, `status`) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.student_id, data.mentor_id, data.domain_id || 'd-1', data.message || '', data.status || 'PENDING']
      );
      const rows = await queryMySQL('SELECT * FROM `mentorship_requests` WHERE `id` = ?', [id]);
      return rows[0];
    },
    update: async (id, updates) => {
      const fields = [];
      const values = [];
      Object.keys(updates).forEach(key => {
        fields.push(`\`${key}\` = ?`);
        values.push(updates[key]);
      });
      values.push(id);
      await queryMySQL(`UPDATE \`mentorship_requests\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
      const rows = await queryMySQL('SELECT * FROM `mentorship_requests` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  activeMentorships: {
    find: async () => {
      try {
        return await queryMySQL('SELECT * FROM `active_mentorships` ORDER BY `id` DESC');
      } catch (err) {
        return await queryMySQL('SELECT * FROM `active_mentorships`');
      }
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `active_mentorships` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `am-${Date.now()}`;
      const formattedStartDate = formatMySQLDateTime(data.start_date || new Date());
      await queryMySQL(
        'INSERT INTO `active_mentorships` (`id`, `student_id`, `mentor_id`, `domain_id`, `status`) VALUES (?, ?, ?, ?, ?)',
        [id, data.student_id, data.mentor_id, data.domain_id || 'd-1', data.status || 'ACTIVE']
      );
      const rows = await queryMySQL('SELECT * FROM `active_mentorships` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  sessions: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `sessions` ORDER BY `scheduled_at` ASC');
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `sessions` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `s-${Date.now()}`;
      const formattedScheduledAt = formatMySQLDateTime(data.scheduled_at);
      await queryMySQL(
        'INSERT INTO `sessions` (`id`, `mentorship_id`, `scheduled_at`, `duration_mins`, `topic`, `status`, `meeting_link`, `notes`, `feedback`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, data.mentorship_id, formattedScheduledAt, data.duration_mins || 45, data.topic, data.status || 'SCHEDULED', data.meeting_link || '', data.notes || '', data.feedback || '']
      );
      const rows = await queryMySQL('SELECT * FROM `sessions` WHERE `id` = ?', [id]);
      return rows[0];
    },
    update: async (id, updates) => {
      const fields = [];
      const values = [];
      Object.keys(updates).forEach(key => {
        fields.push(`\`${key}\` = ?`);
        values.push(key === 'scheduled_at' ? formatMySQLDateTime(updates[key]) : updates[key]);
      });
      values.push(id);
      await queryMySQL(`UPDATE \`sessions\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
      const rows = await queryMySQL('SELECT * FROM `sessions` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  milestones: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `milestones` ORDER BY `due_date` ASC');
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `milestones` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `m-${Date.now()}`;
      const formattedDueDate = formatMySQLDateTime(data.due_date);
      await queryMySQL(
        'INSERT INTO `milestones` (`id`, `mentorship_id`, `title`, `description`, `due_date`, `status`) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.mentorship_id, data.title, data.description || '', formattedDueDate, data.status || 'PENDING']
      );
      const rows = await queryMySQL('SELECT * FROM `milestones` WHERE `id` = ?', [id]);
      return rows[0];
    },
    update: async (id, updates) => {
      const fields = [];
      const values = [];
      Object.keys(updates).forEach(key => {
        fields.push(`\`${key}\` = ?`);
        values.push(key === 'due_date' ? formatMySQLDateTime(updates[key]) : updates[key]);
      });
      values.push(id);
      await queryMySQL(`UPDATE \`milestones\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
      const rows = await queryMySQL('SELECT * FROM `milestones` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  resources: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `resources` ORDER BY `created_at` DESC');
    },
    create: async (data) => {
      const id = data.id || `r-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `resources` (`id`, `mentor_id`, `domain_id`, `title`, `description`, `file_url`, `external_link`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, data.mentor_id, data.domain_id, data.title, data.description || '', data.file_url || '', data.external_link || '']
      );
      const rows = await queryMySQL('SELECT * FROM `resources` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  announcements: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `announcements` ORDER BY `created_at` DESC');
    },
    create: async (data) => {
      const id = data.id || `anc-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `announcements` (`id`, `author_id`, `title`, `content`, `category`, `target_domain_id`) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.author_id, data.title, data.content, data.category || 'GENERAL', data.target_domain_id || null]
      );
      const rows = await queryMySQL('SELECT * FROM `announcements` WHERE `id` = ?', [id]);
      return rows[0];
    },
    delete: async (id) => {
      return await queryMySQL('DELETE FROM `announcements` WHERE `id` = ?', [id]);
    }
  },

  jobReferrals: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `job_referrals` ORDER BY `created_at` DESC');
    },
    create: async (data) => {
      const id = data.id || `ref-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `job_referrals` (`id`, `alumni_id`, `title`, `company`, `location`, `experience_req`, `skills`, `description`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, data.alumni_id, data.title, data.company, data.location, data.experience_req || '0 - 1 Yr', data.skills || '', data.description || '', data.status || 'OPEN']
      );
      const rows = await queryMySQL('SELECT * FROM `job_referrals` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  referralApplications: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `referral_applications` ORDER BY `applied_at` DESC');
    },
    create: async (data) => {
      const id = data.id || `refapp-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `referral_applications` (`id`, `job_id`, `student_id`, `status`) VALUES (?, ?, ?, ?)',
        [id, data.job_id, data.student_id, data.status || 'PENDING']
      );
      const rows = await queryMySQL('SELECT * FROM `referral_applications` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  notifications: {
    findByUserId: async (userId) => {
      const rows = await queryMySQL(
        'SELECT * FROM `notifications` WHERE `user_id` = ? ORDER BY `created_at` DESC',
        [userId]
      );
      return rows.map(r => ({
        ...r,
        read: Boolean(r.is_read)
      }));
    },
    create: async (data) => {
      const id = data.id || `n-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `desc`, `target_tab`, `is_read`) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, data.user_id, data.type, data.title, data.desc || '', data.target_tab || 'dashboard', data.is_read || 0]
      );
      const rows = await queryMySQL('SELECT * FROM `notifications` WHERE `id` = ?', [id]);
      return { ...rows[0], read: Boolean(rows[0]?.is_read) };
    },
    markAsRead: async (id, userId) => {
      await queryMySQL('UPDATE `notifications` SET `is_read` = 1 WHERE `id` = ? AND `user_id` = ?', [id, userId]);
      const rows = await queryMySQL('SELECT * FROM `notifications` WHERE `id` = ?', [id]);
      return { ...rows[0], read: true };
    },
    markAllAsRead: async (userId) => {
      await queryMySQL('UPDATE `notifications` SET `is_read` = 1 WHERE `user_id` = ?', [userId]);
      return true;
    }
  },

  auditLogs: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `audit_logs` ORDER BY `timestamp` DESC');
    },
    log: async (adminId, action, targetUserId, details) => {
      const id = `al-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `audit_logs` (`id`, `admin_id`, `action`, `target_user_id`, `details`) VALUES (?, ?, ?, ?, ?)',
        [id, adminId, action, targetUserId || null, details || '']
      );
      const rows = await queryMySQL('SELECT * FROM `audit_logs` WHERE `id` = ?', [id]);
      return rows[0];
    }
  }
};
