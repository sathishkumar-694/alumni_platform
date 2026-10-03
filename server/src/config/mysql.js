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

export const queryMySQL = async (sql, params = []) => {
  try {
    const connectionPool = getMySQLPool();
    const [rows] = await connectionPool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('[MySQL Warning] Execute query failed:', error.message);
    throw error;
  }
};

export const ensureDatabaseSchema = async () => {
  try {
    const connectionPool = getMySQLPool();
    await connectionPool.query("ALTER TABLE `sessions` MODIFY COLUMN `status` VARCHAR(100) NOT NULL DEFAULT 'SCHEDULED'");
    await connectionPool.query("ALTER TABLE `sessions` MODIFY COLUMN `meeting_link` TEXT");

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

    // Ensure Ashwanth Student Account
    const studentHash = bcrypt.hashSync('7376231BT111', 10);
    const [existingStudent] = await connectionPool.query("SELECT * FROM `users` WHERE LOWER(`email`) = 'ashwanth.bt23@bitsathy.ac.in'");
    let sId = 'u-ashwanth';
    if (existingStudent.length === 0) {
      await connectionPool.query(
        "INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `verification_status`) VALUES (?, ?, ?, ?, ?, ?)",
        [sId, 'Ashwanth', 'ashwanth.bt23@bitsathy.ac.in', studentHash, 'STUDENT', 'VERIFIED']
      );
      await connectionPool.query(
        "INSERT INTO `student_profiles` (`id`, `user_id`, `reg_number`, `academic_year`, `department`, `career_goals`) VALUES (?, ?, ?, ?, ?, ?)",
        ['sp-ashwanth', sId, '7376231BT111', '3rd Year', 'Biotechnology', 'Pursuing Full-Stack & Bio-Tech Systems']
      );
    } else {
      sId = existingStudent[0].id;
      await connectionPool.query(
        "UPDATE `users` SET `password_hash` = ?, `verification_status` = 'VERIFIED' WHERE LOWER(`email`) = 'ashwanth.bt23@bitsathy.ac.in'",
        [studentHash]
      );
    }

    // Ensure Arumugam Alumni Mentor Account
    const alumniHash = bcrypt.hashSync('7376231EC001', 10);
    const [existingAlumni] = await connectionPool.query("SELECT * FROM `users` WHERE LOWER(`email`) = 'arumugam@tech.gmail.com'");
    let aId = 'u-arumugam';
    if (existingAlumni.length === 0) {
      await connectionPool.query(
        "INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `verification_status`) VALUES (?, ?, ?, ?, ?, ?)",
        [aId, 'Arumugam', 'arumugam@tech.gmail.com', alumniHash, 'ALUMNI', 'VERIFIED']
      );
      await connectionPool.query(
        "INSERT INTO `alumni_profiles` (`id`, `user_id`, `company`, `designation`, `experience_years`, `graduation_year`, `max_capacity`, `current_capacity`, `bio`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['ap-arumugam', aId, 'Tech Solutions', 'Lead Systems Engineer', 6, 2020, 5, 0, 'Passionate alumni mentor guiding students in engineering & software architecture.']
      );
    } else {
      aId = existingAlumni[0].id;
      await connectionPool.query(
        "UPDATE `users` SET `password_hash` = ?, `verification_status` = 'VERIFIED' WHERE LOWER(`email`) = 'arumugam@tech.gmail.com'",
        [alumniHash]
      );
    }

    // Seed Real MySQL Notifications for Ashwanth (Student) if empty
    const [studentNotifs] = await connectionPool.query("SELECT COUNT(*) as count FROM `notifications` WHERE `user_id` = ?", [sId]);
    if (studentNotifs[0].count === 0) {
      await connectionPool.query(
        "INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `desc`, `target_tab`, `is_read`) VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)",
        [
          `n-s1-${Date.now()}`, sId, 'ACCEPTANCE', '🎉 Mentorship Request Accepted!', 'Alumni Mentor Arumugam accepted your mentorship request. You are now paired!', 'active_mentorships', 0,
          `n-s2-${Date.now()}`, sId, 'SESSION', '📅 Virtual Meeting Time Finalized', 'Your 1-on-1 session with Arumugam is confirmed. Click to launch WebRTC video call.', 'sessions', 0
        ]
      );
    }

    // Seed Real MySQL Notifications for Arumugam (Mentor) if empty
    const [alumniNotifs] = await connectionPool.query("SELECT COUNT(*) as count FROM `notifications` WHERE `user_id` = ?", [aId]);
    if (alumniNotifs[0].count === 0) {
      await connectionPool.query(
        "INSERT INTO `notifications` (`id`, `user_id`, `type`, `title`, `desc`, `target_tab`, `is_read`) VALUES (?, ?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?, ?)",
        [
          `n-a1-${Date.now()}`, aId, 'REQUEST', '📩 New Mentorship Request Received', 'Student Ashwanth (Biotechnology) requested 1-on-1 mentorship in Software Engineering.', 'requests', 0,
          `n-a2-${Date.now()}`, aId, 'REFERRAL', '💼 Student Requested Job Referral', 'Ashwanth applied for an internal referral for your SDE hiring drive at Google.', 'referrals', 0
        ]
      );
    }

  } catch (err) {
    console.warn('[Database Schema Warning]:', err.message);
  }
};
