-- =================================================================
-- SKALA Platform - MySQL / MariaDB Database Schema
-- Optimized for Linux Shared Hosting (cPanel / DirectAdmin / Plesk)
-- Charset: utf8mb4 (Full Persian / Unicode & Emoji Support)
-- =================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(128) NOT NULL,
  `role` ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user',
  `presence` VARCHAR(32) NOT NULL DEFAULT 'present',
  `texture` VARCHAR(32) NOT NULL DEFAULT 'fluid',
  `breath_rate` FLOAT NOT NULL DEFAULT 4.5,
  `color_json` JSON DEFAULT NULL,
  `last_seen` BIGINT UNSIGNED DEFAULT NULL,
  `created_at` BIGINT UNSIGNED NOT NULL,
  `updated_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_email` (`email`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Sessions Table
CREATE TABLE IF NOT EXISTS `sessions` (
  `token` VARCHAR(128) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `role` ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user',
  `created_at` BIGINT UNSIGNED NOT NULL,
  `expires_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`token`),
  KEY `idx_sessions_user_id` (`user_id`),
  KEY `idx_sessions_expires_at` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Spaces (Circles) Table
CREATE TABLE IF NOT EXISTS `spaces` (
  `id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `host_name` VARCHAR(128) NOT NULL,
  `host_email` VARCHAR(191) DEFAULT NULL,
  `host_id` VARCHAR(64) DEFAULT NULL,
  `is_system_space` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` BIGINT UNSIGNED NOT NULL,
  `updated_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_spaces_host_email` (`host_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Space Members (Live Participants) Table
CREATE TABLE IF NOT EXISTS `space_members` (
  `space_id` VARCHAR(64) NOT NULL,
  `user_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `relationship` VARCHAR(128) DEFAULT NULL,
  `bio_snippet` VARCHAR(255) DEFAULT NULL,
  `presence` VARCHAR(32) NOT NULL DEFAULT 'present',
  `texture` VARCHAR(32) NOT NULL DEFAULT 'fluid',
  `breath_rate` FLOAT NOT NULL DEFAULT 4.5,
  `color_json` JSON DEFAULT NULL,
  `angle` FLOAT DEFAULT 0,
  `distance` FLOAT DEFAULT 0.5,
  `x` FLOAT DEFAULT 0.5,
  `y` FLOAT DEFAULT 0.5,
  `is_admin` TINYINT(1) NOT NULL DEFAULT 0,
  `last_seen` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`space_id`, `user_id`),
  KEY `idx_space_members_space` (`space_id`),
  KEY `idx_space_members_last_seen` (`last_seen`),
  CONSTRAINT `fk_space_members_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Signals Stream Table
CREATE TABLE IF NOT EXISTS `signals` (
  `id` VARCHAR(64) NOT NULL,
  `space_id` VARCHAR(64) NOT NULL,
  `sender_id` VARCHAR(64) NOT NULL,
  `sender_name` VARCHAR(128) NOT NULL,
  `recipient_id` VARCHAR(64) DEFAULT NULL,
  `wave` VARCHAR(64) NOT NULL,
  `intensity` FLOAT NOT NULL DEFAULT 0.6,
  `tempo` FLOAT NOT NULL DEFAULT 1.0,
  `color` VARCHAR(64) NOT NULL DEFAULT '#0ea5e9',
  `symbol_meaning` VARCHAR(255) DEFAULT NULL,
  `private_intention` VARCHAR(255) DEFAULT NULL,
  `source_type` VARCHAR(32) DEFAULT 'gesture',
  `custom_tap_loop_json` JSON DEFAULT NULL,
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_signals_space` (`space_id`),
  KEY `idx_signals_created_at` (`created_at`),
  CONSTRAINT `fk_signals_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Push Subscriptions Table
CREATE TABLE IF NOT EXISTS `push_subscriptions` (
  `endpoint` VARCHAR(512) NOT NULL,
  `p256dh` VARCHAR(255) NOT NULL,
  `auth` VARCHAR(255) NOT NULL,
  `user_id` VARCHAR(64) DEFAULT NULL,
  `space_id` VARCHAR(64) NOT NULL,
  `privacy_level` VARCHAR(32) NOT NULL DEFAULT 'normal',
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`endpoint`(191)),
  KEY `idx_push_space_id` (`space_id`),
  KEY `idx_push_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Tap Loops Table
CREATE TABLE IF NOT EXISTS `tap_loops` (
  `id` VARCHAR(64) NOT NULL,
  `space_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `taps_json` JSON NOT NULL,
  `total_duration` INT NOT NULL,
  `author_name` VARCHAR(128) NOT NULL,
  `author_id` VARCHAR(64) DEFAULT NULL,
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tap_loops_space` (`space_id`),
  CONSTRAINT `fk_tap_loops_space` FOREIGN KEY (`space_id`) REFERENCES `spaces` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Admin Audit & System Broadcasts Log
CREATE TABLE IF NOT EXISTS `admin_broadcasts` (
  `id` VARCHAR(64) NOT NULL,
  `sender_email` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `wave` VARCHAR(32) NOT NULL DEFAULT 'radiant_burst',
  `spaces_reached_count` INT NOT NULL DEFAULT 0,
  `created_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =================================================================
-- INITIAL SEED DATA
-- Default Super Admin: soraun.com@gmail.com
-- Default Master Space: main-cosmic-circle
-- =================================================================

INSERT INTO `users` (`id`, `email`, `password_hash`, `name`, `role`, `presence`, `texture`, `breath_rate`, `color_json`, `created_at`, `updated_at`)
VALUES (
  'user-superadmin-master',
  'soraun.com@gmail.com',
  NULL,
  'مدیر ارشد (soraun)',
  'super_admin',
  'present',
  'aurora',
  4.5,
  '{"name": "Solar Amber", "primary": "#f59e0b", "glow": "rgba(245, 158, 11, 0.65)", "ambient": "rgba(245, 158, 11, 0.18)", "accent": "#fbbf24", "border": "#f59e0b"}',
  1700000000000,
  1700000000000
) ON DUPLICATE KEY UPDATE `role` = 'super_admin';

INSERT INTO `spaces` (`id`, `name`, `description`, `host_name`, `host_email`, `host_id`, `is_system_space`, `created_at`, `updated_at`)
VALUES (
  'main-cosmic-circle',
  'حلقه اصلی اسکالا • SKALA Sanctuary',
  'فضای مرکزی و کیهانی حضور آرامش‌بخش و ارتباط نوری',
  'مدیر ارشد (soraun)',
  'soraun.com@gmail.com',
  'user-superadmin-master',
  1,
  1700000000000,
  1700000000000
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

SET FOREIGN_KEY_CHECKS = 1;
