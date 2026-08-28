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

-- Default Password: 'password123'
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `verification_status`, `created_at`) VALUES
('u-admin-1', 'Dr. Sarah Jenkins', 'admin@university.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ADMIN', 'VERIFIED', NOW()),
('u-student-1', 'Alex Rivera', 'alex.rivera@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-2', 'Priya Sharma', 'priya.sharma@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'PENDING', NOW()),
('u-student-3', 'Marcus Chen', 'marcus.chen@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-4', 'Ananya Gupta', 'ananya.gupta@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-5', 'Liam O\'Connor', 'liam.o@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-6', 'Sophia Rodriguez', 'sophia.r@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-7', 'Rohan Mehta', 'rohan.m@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-8', 'Emily Zhang', 'emily.z@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-9', 'Vikramaditya Singh', 'vikram.s@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-10', 'Chloe Bennett', 'chloe.b@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-student-11', 'Arjan Dev', 'arjan.d@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'PENDING', NOW()),
('u-student-12', 'Isabella Rossi', 'isabella.r@student.edu', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'STUDENT', 'VERIFIED', NOW()),
('u-alumni-1', 'David Vance', 'david.vance@techcorp.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-2', 'Elena Rostova', 'elena.r@ai-labs.io', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-3', 'Kevin Patel', 'k.patel@cloudsystems.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-4', 'Sarah Al-Mansoor', 'sarah.m@microsoft.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-5', 'Michael Thorne', 'm.thorne@meta.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-6', 'Natasha Kapoor', 'natasha.k@crowdstrike.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-7', 'James Wilson', 'j.wilson@snowflake.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-8', 'Meera Krishnan', 'meera.k@apple.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-9', 'Daniel Kim', 'daniel.k@databricks.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-10', 'Rachel Adams', 'rachel.a@stripe.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-11', 'Siddharth Verma', 's.verma@paloalto.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW()),
('u-alumni-12', 'Jessica Taylor', 'j.taylor@uber.com', '$2a$10$vN9H2B.P8K7LqjJ.mZ8sEO8E0wV5dM66C9gL8m6N446Bq', 'ALUMNI', 'VERIFIED', NOW());

INSERT INTO `student_profiles` (`user_id`, `reg_number`, `student_id_card_url`, `academic_year`, `department`, `career_goals`, `interests`) VALUES
('u-student-1', 'REG2024-8921', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop', '3rd Year', 'Computer Science & Engineering', 'Aspiring Full Stack Engineer aiming for top product tech roles with focus on scalable Web APIs & Cloud.', '["d-1", "d-3", "d-5"]'),
('u-student-2', 'REG2025-1042', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop', '2nd Year', 'Artificial Intelligence & Data Science', 'Passionate about Deep Learning and Natural Language Processing applications.', '["d-2", "d-5"]'),
('u-student-3', 'REG2023-4410', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop', '4th Year', 'Information Technology', 'Preparing for DevOps & Site Reliability Engineering placements.', '["d-3", "d-4"]'),
('u-student-4', 'REG2024-5120', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&auto=format&fit=crop', '3rd Year', 'Electronics & Communication', 'Embedded Firmware & Edge AI Architecture.', '["d-1", "d-2"]'),
('u-student-5', 'REG2024-9912', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop', '3rd Year', 'Computer Science', 'Microservices & System Architecture.', '["d-1", "d-6"]'),
('u-student-6', 'REG2025-3341', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&auto=format&fit=crop', '2nd Year', 'Data Science', 'Machine Learning Pipelines & Data Engineering.', '["d-2", "d-5"]'),
('u-student-7', 'REG2023-7714', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop', '4th Year', 'Information Technology', 'Kubernetes & Multi-cloud Infrastructure.', '["d-3"]'),
('u-student-8', 'REG2024-1189', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop', '3rd Year', 'AI & Machine Learning', 'Generative AI & LLM Fine-tuning.', '["d-2"]'),
('u-student-9', 'REG2023-6002', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop', '4th Year', 'Computer Science', 'High-frequency distributed systems.', '["d-1", "d-4"]'),
('u-student-10', 'REG2024-7832', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop', '3rd Year', 'Cyber Security', 'Ethical Hacking & Cloud Security Auditing.', '["d-4"]'),
('u-student-11', 'REG2025-9011', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop', '1st Year', 'Software Engineering', 'Backend APIs & Database Design.', '["d-1", "d-5"]'),
('u-student-12', 'REG2023-4550', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&auto=format&fit=crop', '4th Year', 'Cloud Computing', 'AWS Cloud Architecture & SRE.', '["d-3", "d-6"]');

INSERT INTO `alumni_profiles` (`user_id`, `alumni_id_card_url`, `company`, `designation`, `experience_years`, `graduation_year`, `linkedin_url`, `max_capacity`, `current_capacity`, `expertise`, `bio`) VALUES
('u-alumni-1', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&auto=format&fit=crop', 'Google / TechCorp', 'Senior Software Engineer', 7, 2019, 'https://linkedin.com/in/david-vance', 5, 1, '["d-1", "d-3"]', '7+ years building high throughput distributed microservices.'),
('u-alumni-2', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop', 'OpenAI / AI Labs', 'Staff AI Research Scientist', 6, 2020, 'https://linkedin.com/in/elena-rostova', 5, 1, '["d-2", "d-5"]', 'Focusing on LLM fine-tuning and PyTorch production deployment.'),
('u-alumni-3', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&auto=format&fit=crop', 'Amazon Web Services', 'Cloud Solutions Architect', 5, 2021, 'https://linkedin.com/in/kevin-patel', 5, 1, '["d-3", "d-4"]', 'Kubernetes, AWS Infrastructure as Code (Terraform).'),
('u-alumni-4', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop', 'Microsoft', 'Principal Software Engineer', 9, 2017, 'https://linkedin.com/in/sarah-al-mansoor', 5, 2, '["d-1", "d-2"]', 'C# .NET Core, Azure Microservices, and Enterprise Architecture.'),
('u-alumni-5', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop', 'Meta / Facebook', 'Lead Product Manager', 8, 2018, 'https://linkedin.com/in/michael-thorne', 5, 1, '["d-6", "d-1"]', 'Agile Product Strategy, Technical Product Management.'),
('u-alumni-6', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&auto=format&fit=crop', 'CrowdStrike', 'Cybersecurity Director', 10, 2016, 'https://linkedin.com/in/natasha-kapoor', 5, 1, '["d-4", "d-3"]', 'Threat hunting, SOC operations, Incident response.'),
('u-alumni-7', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop', 'Snowflake', 'Principal Data Architect', 8, 2018, 'https://linkedin.com/in/james-wilson', 5, 0, '["d-5", "d-2"]', 'ETL pipelines, Snowflake Data Warehousing, PySpark.'),
('u-alumni-8', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop', 'Apple', 'Senior iOS System Architect', 7, 2019, 'https://linkedin.com/in/meera-krishnan', 5, 1, '["d-1", "d-6"]', 'Swift UI, Distributed iOS System Architecture.'),
('u-alumni-9', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop', 'Databricks', 'Senior MLOps Lead', 6, 2020, 'https://linkedin.com/in/daniel-kim', 5, 1, '["d-2", "d-3"]', 'Model Deployment, MLflow, Kubernetes for AI.'),
('u-alumni-10', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop', 'Stripe', 'Staff Infrastructure Engineer', 9, 2017, 'https://linkedin.com/in/rachel-adams', 5, 0, '["d-3", "d-1"]', 'FinTech Cloud Reliability, High Availability.'),
('u-alumni-11', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&auto=format&fit=crop', 'Palo Alto Networks', 'Senior SecOps Specialist', 6, 2020, 'https://linkedin.com/in/siddharth-verma', 5, 0, '["d-4", "d-5"]', 'Network Penetration Testing, Ethical Hacking.'),
('u-alumni-12', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop', 'Uber', 'Group Product Manager', 8, 2018, 'https://linkedin.com/in/jessica-taylor', 5, 1, '["d-6", "d-5"]', 'Platform Products, Marketplace Dynamics.');

INSERT INTO `domains` (`id`, `name`, `category`, `description`, `icon`, `is_archived`, `created_at`) VALUES
('d-1', 'Software Engineering & Architecture', 'Core Engineering', 'Object Oriented Design, Microservices, Data Structures & System Architecture', 'Code', 0, NOW()),
('d-2', 'Artificial Intelligence & Machine Learning', 'Advanced Tech', 'Neural Networks, NLP, Computer Vision, LLMs & MLOps Pipelines', 'Cpu', 0, NOW()),
('d-3', 'Cloud Computing & DevOps', 'Infrastructure', 'AWS, Azure, Docker, Kubernetes, CI/CD pipelines & Infrastructure as Code', 'Cloud', 0, NOW()),
('d-4', 'Cyber Security & Network Defense', 'Security', 'Ethical Hacking, Penetration Testing, Cryptography & Network Security', 'Shield', 0, NOW()),
('d-5', 'Data Science & Analytics', 'Data', 'Exploratory Analysis, SQL, Data Warehousing, PowerBI & Big Data', 'Database', 0, NOW()),
('d-6', 'Product Management & Tech Strategy', 'Management', 'Agile Methodologies, Product Roadmaps, Metrics & User Research', 'Briefcase', 0, NOW());

INSERT INTO `mentorship_requests` (`id`, `student_id`, `mentor_id`, `domain_id`, `status`, `message`, `requested_at`) VALUES
('mr-1', 'u-student-1', 'u-alumni-1', 'd-1', 'ACCEPTED', 'Hi David! I would love your mentorship on backend system architecture.', NOW()),
('mr-2', 'u-student-3', 'u-alumni-2', 'd-2', 'ACCEPTED', 'Hello Elena, I want to transition into ML research.', NOW()),
('mr-3', 'u-student-4', 'u-alumni-4', 'd-1', 'ACCEPTED', 'Hi Sarah, guidance on enterprise C# microservices.', NOW());

INSERT INTO `active_mentorships` (`id`, `student_id`, `mentor_id`, `domain_id`, `status`, `started_at`) VALUES
('am-1', 'u-student-1', 'u-alumni-1', 'd-1', 'ACTIVE', NOW()),
('am-2', 'u-student-3', 'u-alumni-2', 'd-2', 'ACTIVE', NOW()),
('am-3', 'u-student-4', 'u-alumni-4', 'd-1', 'ACTIVE', NOW());

INSERT INTO `sessions` (`id`, `mentorship_id`, `scheduled_at`, `duration_mins`, `topic`, `status`, `meeting_link`, `notes`, `feedback`) VALUES
('s-1', 'am-1', DATE_ADD(NOW(), INTERVAL 2 DAY), 45, 'System Design Mock Interview & Resume Review', 'SCHEDULED', 'https://meet.google.com/abc-defg-hij', '', ''),
('s-2', 'am-1', DATE_SUB(NOW(), INTERVAL 5 DAY), 60, 'Orientation & Learning Roadmap Formulation', 'COMPLETED', 'https://meet.google.com/abc-defg-hij', 'Recommended working through Designing Data-Intensive Applications.', 'Alex showed great enthusiasm.');

INSERT INTO `milestones` (`id`, `mentorship_id`, `title`, `description`, `due_date`, `status`) VALUES
('m-1', 'am-1', 'Complete RESTful API Architecture Best Practices Project', 'Implement JWT authentication and rate limiting.', DATE_ADD(NOW(), INTERVAL 10 DAY), 'IN_PROGRESS'),
('m-2', 'am-1', 'Data Structures & Algorithms Mock Assessment', 'Solve 5 medium Graph problems.', DATE_SUB(NOW(), INTERVAL 2 DAY), 'COMPLETED');

INSERT INTO `resources` (`id`, `mentor_id`, `domain_id`, `title`, `description`, `file_url`, `external_link`, `created_at`) VALUES
('r-1', 'u-alumni-1', 'd-1', 'System Design Interview Cheatsheet 2026', 'Comprehensive guide covering Caching, Load Balancing, and Messaging Queues.', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 'https://github.com/donnemartin/system-design-primer', NOW()),
('r-2', 'u-alumni-2', 'd-2', 'PyTorch Production Deployment Guide', 'Hands-on guide to exporting models to ONNX and serving using TorchScript.', '', 'https://pytorch.org/tutorials/', NOW());

INSERT INTO `announcements` (`id`, `author_id`, `title`, `content`, `category`, `target_domain_id`, `created_at`) VALUES
('ann-1', 'u-admin-1', 'Google Placement & Internship Guidance Drive 2026', 'We are thrilled to announce an exclusive guidance webinar conducted by verified Google Alumni mentors for 3rd and 4th year CSE/IT students.', 'PLACEMENT', 'd-1', NOW()),
('ann-2', 'u-alumni-2', 'AI/ML Hands-on Workshop: Building LLM Agents with LangChain', 'Join us this Saturday for a live coding workshop on fine-tuning foundational models.', 'WORKSHOP', 'd-2', NOW());

INSERT INTO `audit_logs` (`id`, `admin_id`, `action`, `target_user_id`, `details`, `timestamp`) VALUES
('al-1', 'u-admin-1', 'USER_VERIFICATION_APPROVED', 'u-student-1', 'Verified Student ID Card for Alex Rivera (REG2024-8921)', NOW()),
('al-2', 'u-admin-1', 'ALUMNI_VERIFICATION_APPROVED', 'u-alumni-1', 'Verified Alumni Identity & LinkedIn Profile for David Vance', NOW());
