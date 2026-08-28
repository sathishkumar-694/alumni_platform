import { queryMySQL } from './mysql.js';

const parseJSON = (data) => {
  if (!data) return [];
  if (typeof data === 'object') return data;
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const formatMySQLDateTime = (dateInput) => {
  if (!dateInput) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

export const db = {
  users: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `users` ORDER BY `created_at` DESC');
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `users` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    findByEmail: async (email) => {
      const rows = await queryMySQL('SELECT * FROM `users` WHERE LOWER(`email`) = LOWER(?)', [email]);
      return rows[0] || null;
    },
    create: async (userData) => {
      const id = userData.id || `u-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `verification_status`) VALUES (?, ?, ?, ?, ?, ?)',
        [id, userData.name, userData.email, userData.password_hash, userData.role, userData.verification_status || 'PENDING']
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
    findByUserId: async (userId) => {
      const rows = await queryMySQL('SELECT * FROM `student_profiles` WHERE `user_id` = ?', [userId]);
      if (!rows[0]) return null;
      return {
        ...rows[0],
        interests: parseJSON(rows[0].interests)
      };
    },
    createOrUpdate: async (userId, data) => {
      const existing = await queryMySQL('SELECT * FROM `student_profiles` WHERE `user_id` = ?', [userId]);
      const formattedInterests = JSON.stringify(data.interests || []);
      if (existing.length > 0) {
        await queryMySQL(
          'UPDATE `student_profiles` SET `reg_number` = ?, `academic_year` = ?, `department` = ?, `career_goals` = ?, `student_id_card_url` = ?, `interests` = ? WHERE `user_id` = ?',
          [data.reg_number, data.academic_year, data.department, data.career_goals || '', data.student_id_card_url || '', formattedInterests, userId]
        );
      } else {
        const id = `sp-${Date.now()}`;
        await queryMySQL(
          'INSERT INTO `student_profiles` (`id`, `user_id`, `reg_number`, `academic_year`, `department`, `career_goals`, `student_id_card_url`, `interests`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, userId, data.reg_number, data.academic_year, data.department, data.career_goals || '', data.student_id_card_url || '', formattedInterests]
        );
      }
      return await db.studentProfiles.findByUserId(userId);
    }
  },

  alumniProfiles: {
    findByUserId: async (userId) => {
      const rows = await queryMySQL('SELECT * FROM `alumni_profiles` WHERE `user_id` = ?', [userId]);
      if (!rows[0]) return null;
      return {
        ...rows[0],
        expertise: parseJSON(rows[0].expertise)
      };
    },
    createOrUpdate: async (userId, data) => {
      const existing = await queryMySQL('SELECT * FROM `alumni_profiles` WHERE `user_id` = ?', [userId]);
      const formattedExpertise = JSON.stringify(data.expertise || []);
      if (existing.length > 0) {
        await queryMySQL(
          'UPDATE `alumni_profiles` SET `company` = ?, `designation` = ?, `experience_years` = ?, `graduation_year` = ?, `linkedin_url` = ?, `alumni_id_card_url` = ?, `max_capacity` = ?, `current_capacity` = ?, `bio` = ?, `expertise` = ? WHERE `user_id` = ?',
          [data.company, data.designation, data.experience_years || 1, data.graduation_year || 2020, data.linkedin_url || '', data.alumni_id_card_url || '', data.max_capacity || 5, data.current_capacity || 0, data.bio || '', formattedExpertise, userId]
        );
      } else {
        const id = `ap-${Date.now()}`;
        await queryMySQL(
          'INSERT INTO `alumni_profiles` (`id`, `user_id`, `company`, `designation`, `experience_years`, `graduation_year`, `linkedin_url`, `alumni_id_card_url`, `max_capacity`, `current_capacity`, `bio`, `expertise`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, userId, data.company, data.designation, data.experience_years || 1, data.graduation_year || 2020, data.linkedin_url || '', data.alumni_id_card_url || '', data.max_capacity || 5, data.current_capacity || 0, data.bio || '', formattedExpertise]
        );
      }
      return await db.alumniProfiles.findByUserId(userId);
    }
  },

  domains: {
    find: async () => {
      const rows = await queryMySQL('SELECT * FROM `domains` ORDER BY `name` ASC');
      return rows.map(r => ({
        ...r,
        stats: parseJSON(r.stats)
      }));
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `domains` WHERE `id` = ?', [id]);
      if (!rows[0]) return null;
      return {
        ...rows[0],
        stats: parseJSON(rows[0].stats)
      };
    },
    create: async (domainData) => {
      const id = domainData.id || `d-${Date.now()}`;
      const formattedStats = JSON.stringify(domainData.stats || { interested_students: 0, available_mentors: 0, milestone_completion_rate: 0 });
      await queryMySQL(
        'INSERT INTO `domains` (`id`, `name`, `category`, `description`, `icon`, `stats`) VALUES (?, ?, ?, ?, ?, ?)',
        [id, domainData.name, domainData.category, domainData.description, domainData.icon || 'Code', formattedStats]
      );
      return await db.domains.findById(id);
    }
  },

  mentorshipRequests: {
    find: async () => {
      return await queryMySQL('SELECT * FROM `mentorship_requests` ORDER BY `requested_at` DESC');
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `mentorship_requests` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `req-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `mentorship_requests` (`id`, `student_id`, `mentor_id`, `domain_id`, `status`, `message`) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.student_id, data.mentor_id, data.domain_id, data.status || 'PENDING', data.message || '']
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
      return await queryMySQL('SELECT * FROM `active_mentorships` ORDER BY `started_at` DESC');
    },
    findById: async (id) => {
      const rows = await queryMySQL('SELECT * FROM `active_mentorships` WHERE `id` = ?', [id]);
      return rows[0] || null;
    },
    create: async (data) => {
      const id = data.id || `am-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `active_mentorships` (`id`, `student_id`, `mentor_id`, `domain_id`, `status`) VALUES (?, ?, ?, ?, ?)',
        [id, data.student_id, data.mentor_id, data.domain_id, data.status || 'ACTIVE']
      );
      const rows = await queryMySQL('SELECT * FROM `active_mentorships` WHERE `id` = ?', [id]);
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
      await queryMySQL(`UPDATE \`active_mentorships\` SET ${fields.join(', ')} WHERE \`id\` = ?`, values);
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
      const id = data.id || `ann-${Date.now()}`;
      await queryMySQL(
        'INSERT INTO `announcements` (`id`, `author_id`, `title`, `content`, `category`, `target_domain_id`) VALUES (?, ?, ?, ?, ?, ?)',
        [id, data.author_id, data.title, data.content, data.category || 'GENERAL', data.target_domain_id || null]
      );
      const rows = await queryMySQL('SELECT * FROM `announcements` WHERE `id` = ?', [id]);
      return rows[0];
    }
  },

  jobReferrals: {
    find: async () => {
      const rows = await queryMySQL('SELECT * FROM `job_referrals` ORDER BY `created_at` DESC');
      return rows.map(r => ({
        ...r,
        skills: parseJSON(r.skills)
      }));
    },
    create: async (data) => {
      const id = data.id || `job-${Date.now()}`;
      const formattedSkills = JSON.stringify(data.skills || []);
      await queryMySQL(
        'INSERT INTO `job_referrals` (`id`, `alumni_id`, `title`, `company`, `location`, `experience_req`, `skills`, `description`, `status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [id, data.alumni_id, data.title, data.company, data.location, data.experience_req || '0 - 1 Yr', formattedSkills, data.description || '', data.status || 'OPEN']
      );
      const rows = await queryMySQL('SELECT * FROM `job_referrals` WHERE `id` = ?', [id]);
      return {
        ...rows[0],
        skills: parseJSON(rows[0]?.skills)
      };
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
