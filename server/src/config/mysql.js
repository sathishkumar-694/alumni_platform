import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from './env.js';

let pool = null;

export const getMySQLPool = () => {
  if (!pool) {
    const poolConfig = {
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      port: config.mysql.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

    if (config.mysql.ssl) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }

    pool = mysql.createPool(poolConfig);
  }
  return pool;
};

const inMemoryStore = {
  users: [
    { id: 'admin-1', name: 'Campus Admin', email: 'admin@bitsathy.ac.in', password_hash: bcrypt.hashSync('admin', 10), role: 'ADMIN', verification_status: 'VERIFIED', created_at: new Date() }
  ],
  student_profiles: [],
  alumni_profiles: [],
  id_verifications: [],
  mentorship_requests: [],
  active_mentorships: [],
  sessions: [],
  milestones: [],
  resources: [],
  announcements: [],
  audit_logs: [],
  domains: [
    { id: 'd-1', name: 'Software Engineering & Web Systems', category: 'Core Engineering', description: 'Full-stack development, distributed systems, React, Node.js, and database design.' },
    { id: 'd-2', name: 'Artificial Intelligence & Machine Learning', category: 'Data Science & AI', description: 'Deep learning, neural networks, NLP, LLMs, computer vision, and Python data science.' },
    { id: 'd-3', name: 'Cloud Architecture & DevOps', category: 'Infrastructure & Cloud', description: 'AWS, Azure, Docker, Kubernetes, CI/CD pipelines, and microservices architecture.' },
    { id: 'd-4', name: 'Mechanical Engineering & CAD/FEA', category: 'Core Engineering', description: 'SOLIDWORKS, Finite Element Analysis (FEA), thermodynamics, CNC, and CAD design.' },
    { id: 'd-5', name: 'Cybersecurity & Network Systems', category: 'Security', description: 'Ethical hacking, penetration testing, cryptography, network security, and SIEM tools.' },
    { id: 'd-6', name: 'Biotechnology & Bio-Informatics', category: 'Bio & Life Sciences', description: 'Genetic engineering, bio-computation, clinical data analysis, and pharmaceutical systems.' }
  ],
  domain_requests: [],
  job_referrals: [],
  referral_applications: [],
  notifications: []
};

let isUseInMemoryFallback = false;

const runInMemoryQuery = (sql, params = []) => {
  const cleanSql = sql.trim();
  const lowerSql = cleanSql.toLowerCase();

  // Handle SELECT COUNT(*)
  if (lowerSql.includes('select count(*)')) {
    const tableName = cleanSql.match(/from\s+[`]?(\w+)[`]?/i)?.[1];
    const table = inMemoryStore[tableName] || [];
    return [{ count: table.length }];
  }

  // Handle SELECT * FROM table
  if (lowerSql.startsWith('select')) {
    const tableName = cleanSql.match(/from\s+[`]?(\w+)[`]?/i)?.[1];
    if (!tableName || !inMemoryStore[tableName]) return [];

    let rows = [...inMemoryStore[tableName]];

    // Simple WHERE matching
    if (lowerSql.includes('where')) {
      if (lowerSql.includes('lower(`email`) = lower(?)') || lowerSql.includes('email = ?')) {
        const targetEmail = String(params[0]).toLowerCase();
        rows = rows.filter(r => r.email && r.email.toLowerCase() === targetEmail);
      } else if (lowerSql.includes('`id` = ?') || lowerSql.includes('id = ?')) {
        rows = rows.filter(r => r.id === params[0]);
      } else if (lowerSql.includes('`user_id` = ?') || lowerSql.includes('user_id = ?')) {
        rows = rows.filter(r => r.user_id === params[0]);
      } else if (lowerSql.includes('`status` = ?') || lowerSql.includes('status = ?')) {
        rows = rows.filter(r => r.status === params[0]);
      } else if (lowerSql.includes('`mentorship_id` = ?') || lowerSql.includes('mentorship_id = ?')) {
        rows = rows.filter(r => r.mentorship_id === params[0]);
      }
    }

    return rows;
  }

  // Handle INSERT INTO table
  if (lowerSql.startsWith('insert into')) {
    const tableName = cleanSql.match(/insert\s+into\s+[`]?(\w+)[`]?/i)?.[1];
    if (tableName && inMemoryStore[tableName]) {
      const matchCols = cleanSql.match(/\(([^)]+)\)\s+values/i);
      if (matchCols) {
        const cols = matchCols[1].split(',').map(c => c.trim().replace(/[`]/g, ''));
        const newObj = {};
        cols.forEach((col, idx) => {
          newObj[col] = params[idx];
        });
        inMemoryStore[tableName].push(newObj);
      }
    }
    return [{ affectedRows: 1 }];
  }

  // Handle UPDATE table
  if (lowerSql.startsWith('update')) {
    const tableName = cleanSql.match(/update\s+[`]?(\w+)[`]?/i)?.[1];
    if (tableName && inMemoryStore[tableName]) {
      const targetId = params[params.length - 1];
      const targetItem = inMemoryStore[tableName].find(item => item.id === targetId || item.user_id === targetId);
      if (targetItem) {
        if (lowerSql.includes('status` = ?')) {
          targetItem.status = params[0];
          targetItem.verification_status = params[0];
        } else if (lowerSql.includes('is_read` = 1')) {
          targetItem.is_read = 1;
        }
      }
    }
    return [{ affectedRows: 1 }];
  }

  // Handle DELETE FROM table
  if (lowerSql.startsWith('delete from')) {
    const tableName = cleanSql.match(/delete\s+from\s+[`]?(\w+)[`]?/i)?.[1];
    if (tableName && inMemoryStore[tableName]) {
      const targetId = params[0];
      inMemoryStore[tableName] = inMemoryStore[tableName].filter(item => item.id !== targetId);
    }
    return [{ affectedRows: 1 }];
  }

  return [];
};

export const queryMySQL = async (sql, params = []) => {
  if (isUseInMemoryFallback) {
    return runInMemoryQuery(sql, params);
  }

  try {
    const connectionPool = getMySQLPool();
    const [rows] = await connectionPool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('[MySQL Warning] Execute query failed:', error.message, '-> Switching to resilient mock DB engine');
    isUseInMemoryFallback = true;
    return runInMemoryQuery(sql, params);
  }
};

export const ensureDatabaseSchema = async () => {
  try {
    const connectionPool = getMySQLPool();

    // 1. Users Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`users\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`name\` VARCHAR(100) NOT NULL,
        \`email\` VARCHAR(150) NOT NULL UNIQUE,
        \`password_hash\` VARCHAR(255) NOT NULL,
        \`role\` ENUM('STUDENT', 'ALUMNI', 'ADMIN') NOT NULL,
        \`verification_status\` ENUM('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Student Profiles Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`student_profiles\` (
        \`user_id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`reg_number\` VARCHAR(50) NOT NULL,
        \`student_id_card_url\` TEXT,
        \`academic_year\` VARCHAR(30) DEFAULT '3rd Year',
        \`department\` VARCHAR(100) DEFAULT 'Computer Science & Engineering',
        \`career_goals\` TEXT,
        \`interests\` JSON
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Alumni Profiles Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`alumni_profiles\` (
        \`user_id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`alumni_id_card_url\` TEXT,
        \`company\` VARCHAR(100) NOT NULL,
        \`designation\` VARCHAR(100) NOT NULL,
        \`experience_years\` INT DEFAULT 1,
        \`graduation_year\` INT DEFAULT 2020,
        \`linkedin_url\` VARCHAR(255),
        \`max_capacity\` INT DEFAULT 5,
        \`current_capacity\` INT DEFAULT 0,
        \`expertise\` JSON,
        \`bio\` TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. ID Verifications Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`id_verifications\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`user_id\` VARCHAR(100) NOT NULL,
        \`document_type\` VARCHAR(50) DEFAULT 'ID_CARD',
        \`document_url\` TEXT,
        \`status\` ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
        \`submitted_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Mentorship Requests Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`mentorship_requests\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`student_id\` VARCHAR(100) NOT NULL,
        \`mentor_id\` VARCHAR(100) NOT NULL,
        \`domain_id\` VARCHAR(100) NOT NULL,
        \`status\` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
        \`message\` TEXT,
        \`requested_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Active Mentorships Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`active_mentorships\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`student_id\` VARCHAR(100) NOT NULL,
        \`mentor_id\` VARCHAR(100) NOT NULL,
        \`domain_id\` VARCHAR(100) NOT NULL,
        \`status\` ENUM('ACTIVE', 'COMPLETED', 'REASSIGNED') NOT NULL DEFAULT 'ACTIVE',
        \`started_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Sessions Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`sessions\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`mentorship_id\` VARCHAR(100) NOT NULL,
        \`scheduled_at\` DATETIME NOT NULL,
        \`duration_mins\` INT DEFAULT 45,
        \`topic\` VARCHAR(255) NOT NULL,
        \`status\` VARCHAR(100) NOT NULL DEFAULT 'SCHEDULED',
        \`meeting_link\` TEXT,
        \`notes\` TEXT,
        \`feedback\` TEXT,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Milestones Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`milestones\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`mentorship_id\` VARCHAR(100) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`due_date\` DATETIME NOT NULL,
        \`status\` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED') NOT NULL DEFAULT 'PENDING',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Resources Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`resources\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`mentor_id\` VARCHAR(100) NOT NULL,
        \`domain_id\` VARCHAR(100) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`description\` TEXT,
        \`file_url\` TEXT,
        \`external_link\` TEXT,
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. Announcements Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`announcements\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`author_id\` VARCHAR(100) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`content\` TEXT NOT NULL,
        \`target_role\` ENUM('ALL', 'STUDENT', 'ALUMNI') DEFAULT 'ALL',
        \`created_at\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. Audit Logs Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`admin_id\` VARCHAR(100) NOT NULL,
        \`action\` VARCHAR(100) NOT NULL,
        \`target_user_id\` VARCHAR(100),
        \`details\` TEXT,
        \`timestamp\` DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try {
      await connectionPool.query("ALTER TABLE `sessions` MODIFY COLUMN `status` VARCHAR(100) NOT NULL DEFAULT 'SCHEDULED'");
      await connectionPool.query("ALTER TABLE `sessions` MODIFY COLUMN `meeting_link` TEXT");
    } catch (e) {
      // ignore if alter is fine
    }

    // Create Real-Time Technical Domains Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`domains\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) DEFAULT 'General Engineering',
        \`description\` TEXT NOT NULL,
        \`icon\` VARCHAR(50) DEFAULT 'Code',
        \`is_archived\` TINYINT(1) DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure category default if table already exists
    try {
      await connectionPool.query("ALTER TABLE `domains` MODIFY COLUMN `category` VARCHAR(100) DEFAULT 'General Engineering'");
    } catch (e) {
      // ignore alter warning
    }

    // Auto-seed sample Technical Domains if table is empty
    const [existingDomains] = await connectionPool.query("SELECT COUNT(*) as count FROM `domains`");
    if (existingDomains[0].count === 0) {
      await connectionPool.query(
        "INSERT INTO `domains` (`id`, `name`, `category`, `description`) VALUES (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?), (?, ?, ?, ?)",
        [
          'd-1', 'Software Engineering & Web Systems', 'Core Engineering', 'Full-stack development, distributed systems, React, Node.js, and database design.',
          'd-2', 'Artificial Intelligence & Machine Learning', 'Data Science & AI', 'Deep learning, neural networks, NLP, LLMs, computer vision, and Python data science.',
          'd-3', 'Cloud Architecture & DevOps', 'Infrastructure & Cloud', 'AWS, Azure, Docker, Kubernetes, CI/CD pipelines, and microservices architecture.',
          'd-4', 'Mechanical Engineering & CAD/FEA', 'Core Engineering', 'SOLIDWORKS, Finite Element Analysis (FEA), thermodynamics, CNC, and CAD design.',
          'd-5', 'Cybersecurity & Network Systems', 'Security', 'Ethical hacking, penetration testing, cryptography, network security, and SIEM tools.',
          'd-6', 'Biotechnology & Bio-Informatics', 'Bio & Life Sciences', 'Genetic engineering, bio-computation, clinical data analysis, and pharmaceutical systems.'
        ]
      );
    }

    // Create Mentor Domain Addition Requests Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`domain_requests\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`mentor_id\` VARCHAR(100) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'PENDING',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create Real-Time Job Referrals Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`job_referrals\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`alumni_id\` VARCHAR(100) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`company\` VARCHAR(255) NOT NULL,
        \`location\` VARCHAR(255) NOT NULL,
        \`experience_req\` VARCHAR(100) DEFAULT '0 - 1 Yr',
        \`skills\` TEXT NOT NULL,
        \`description\` TEXT NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'OPEN',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create Real-Time Student Referral Applications Table
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`referral_applications\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`job_id\` VARCHAR(100) NOT NULL,
        \`student_id\` VARCHAR(100) NOT NULL,
        \`status\` VARCHAR(50) DEFAULT 'PENDING',
        \`applied_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create Real-Time Notifications Table in MySQL
    await connectionPool.query(`
      CREATE TABLE IF NOT EXISTS \`notifications\` (
        \`id\` VARCHAR(100) PRIMARY KEY,
        \`user_id\` VARCHAR(100) NOT NULL,
        \`type\` VARCHAR(50) NOT NULL,
        \`title\` VARCHAR(255) NOT NULL,
        \`desc\` TEXT NOT NULL,
        \`target_tab\` VARCHAR(100) DEFAULT 'dashboard',
        \`is_read\` TINYINT(1) DEFAULT 0,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_user_notif\` (\`user_id\`, \`is_read\`, \`created_at\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

  } catch (err) {
    console.warn('[Database Schema Warning]:', err.message);
  }
};
