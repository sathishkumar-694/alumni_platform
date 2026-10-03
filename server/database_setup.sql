-- ============================================================================
-- CampusBridge - MySQL Database Setup & Seed Script
-- Execute this SQL script in MySQL Workbench, phpMyAdmin, or MySQL CLI
-- ============================================================================

CREATE DATABASE IF NOT EXISTS `campusbridge` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `campusbridge`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `announcements`;
DROP TABLE IF EXISTS `resources`;
DROP TABLE IF EXISTS `milestones`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `active_mentorships`;
DROP TABLE IF EXISTS `mentorship_requests`;
DROP TABLE IF EXISTS `alumni_profiles`;
DROP TABLE IF EXISTS `student_profiles`;
DROP TABLE IF EXISTS `domains`;
DROP TABLE IF EXISTS `users`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Users Table
CREATE TABLE `users` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('STUDENT', 'ALUMNI', 'ADMIN') NOT NULL,
  `verification_status` ENUM('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED') NOT NULL DEFAULT 'PENDING',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Student Profiles Table
CREATE TABLE `student_profiles` (
  `user_id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `reg_number` VARCHAR(50) NOT NULL,
  `student_id_card_url` TEXT,
  `academic_year` VARCHAR(30) DEFAULT '3rd Year',
  `department` VARCHAR(100) DEFAULT 'Computer Science & Engineering',
  `career_goals` TEXT,
  `interests` JSON,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Alumni Profiles Table
CREATE TABLE `alumni_profiles` (
  `user_id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `alumni_id_card_url` TEXT,
  `company` VARCHAR(100) NOT NULL,
  `designation` VARCHAR(100) NOT NULL,
  `experience_years` INT DEFAULT 1,
  `graduation_year` INT DEFAULT 2020,
  `linkedin_url` VARCHAR(255),
  `max_capacity` INT DEFAULT 5,
  `current_capacity` INT DEFAULT 0,
  `expertise` JSON,
  `bio` TEXT,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Domains Table
CREATE TABLE `domains` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL UNIQUE,
  `category` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `icon` VARCHAR(50) DEFAULT 'Code',
  `is_archived` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Mentorship Requests Table
CREATE TABLE `mentorship_requests` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `student_id` VARCHAR(50) NOT NULL,
  `mentor_id` VARCHAR(50) NOT NULL,
  `domain_id` VARCHAR(50) NOT NULL,
  `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `message` TEXT,
  `requested_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mentor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Active Mentorships Table
CREATE TABLE `active_mentorships` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `student_id` VARCHAR(50) NOT NULL,
  `mentor_id` VARCHAR(50) NOT NULL,
  `domain_id` VARCHAR(50) NOT NULL,
  `status` ENUM('ACTIVE', 'COMPLETED', 'REASSIGNED') NOT NULL DEFAULT 'ACTIVE',
  `started_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`mentor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Sessions Table
CREATE TABLE `sessions` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `mentorship_id` VARCHAR(50) NOT NULL,
  `scheduled_at` DATETIME NOT NULL,
  `duration_mins` INT DEFAULT 45,
  `topic` VARCHAR(255) NOT NULL,
  `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
  `meeting_link` TEXT,
  `notes` TEXT,
  `feedback` TEXT,
  FOREIGN KEY (`mentorship_id`) REFERENCES `active_mentorships`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Milestones Table
CREATE TABLE `milestones` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `mentorship_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `due_date` DATETIME,
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  FOREIGN KEY (`mentorship_id`) REFERENCES `active_mentorships`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Resources Table
CREATE TABLE `resources` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `mentor_id` VARCHAR(50) NOT NULL,
  `domain_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `file_url` TEXT,
  `external_link` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`mentor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`domain_id`) REFERENCES `domains`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Announcements Table
CREATE TABLE `announcements` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `author_id` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `category` ENUM('PLACEMENT', 'INTERNSHIP', 'WORKSHOP', 'GENERAL') NOT NULL DEFAULT 'GENERAL',
  `target_domain_id` VARCHAR(50),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Audit Logs Table
CREATE TABLE `audit_logs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `admin_id` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `target_user_id` VARCHAR(50),
  `details` TEXT,
  `timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


