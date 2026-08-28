import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from './env.js';

let pool = null;

export const getMySQLPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: config.mysql.host,
      user: config.mysql.user,
      password: config.mysql.password,
      database: config.mysql.database,
      port: config.mysql.port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
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

    // Ensure Ashwanth Student Account
    const studentHash = bcrypt.hashSync('7376231BT111', 10);
    const [existingStudent] = await connectionPool.query("SELECT * FROM `users` WHERE LOWER(`email`) = 'ashwanth.bt23@bitsathy.ac.in'");
    if (existingStudent.length === 0) {
      const sId = 'u-ashwanth';
      await connectionPool.query(
        "INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `verification_status`) VALUES (?, ?, ?, ?, ?, ?)",
        [sId, 'Ashwanth', 'ashwanth.bt23@bitsathy.ac.in', studentHash, 'STUDENT', 'VERIFIED']
      );
      await connectionPool.query(
        "INSERT INTO `student_profiles` (`id`, `user_id`, `reg_number`, `academic_year`, `department`, `career_goals`) VALUES (?, ?, ?, ?, ?, ?)",
        ['sp-ashwanth', sId, '7376231BT111', '3rd Year', 'Biotechnology', 'Pursuing Full-Stack & Bio-Tech Systems']
      );
    } else {
      await connectionPool.query(
        "UPDATE `users` SET `password_hash` = ?, `verification_status` = 'VERIFIED' WHERE LOWER(`email`) = 'ashwanth.bt23@bitsathy.ac.in'",
        [studentHash]
      );
    }

    // Ensure Arumugam Alumni Mentor Account
    const alumniHash = bcrypt.hashSync('7376231EC001', 10);
    const [existingAlumni] = await connectionPool.query("SELECT * FROM `users` WHERE LOWER(`email`) = 'arumugam@tech.gmail.com'");
    if (existingAlumni.length === 0) {
      const aId = 'u-arumugam';
      await connectionPool.query(
        "INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `verification_status`) VALUES (?, ?, ?, ?, ?, ?)",
        [aId, 'Arumugam', 'arumugam@tech.gmail.com', alumniHash, 'ALUMNI', 'VERIFIED']
      );
      await connectionPool.query(
        "INSERT INTO `alumni_profiles` (`id`, `user_id`, `company`, `designation`, `experience_years`, `graduation_year`, `max_capacity`, `current_capacity`, `bio`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ['ap-arumugam', aId, 'Tech Solutions', 'Lead Systems Engineer', 6, 2020, 5, 0, 'Passionate alumni mentor guiding students in engineering & software architecture.']
      );
    } else {
      await connectionPool.query(
        "UPDATE `users` SET `password_hash` = ?, `verification_status` = 'VERIFIED' WHERE LOWER(`email`) = 'arumugam@tech.gmail.com'",
        [alumniHash]
      );
    }
  } catch (err) {
    // Ignore schema check failures if database not initialized
  }
};
