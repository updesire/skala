/**
 * SKALA Database Schema & Entity Definitions
 * PostgreSQL / Supabase / Neon Compatible Architecture
 */

export interface DbUser {
  id: string; // UUID
  email?: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
  updated_at: string;
}

export interface DbProfile {
  id: string; // UUID
  user_id: string; // UUID -> users.id
  display_name: string;
  color_base: string;
  color_accent: string;
  color_glow: string;
  color_border: string;
  presence_state: string;
  texture: string;
  breath_rate: number;
  motion_personality: string;
  bio_snippet?: string;
  timezone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DbSession {
  id: string; // UUID / secure token
  user_id: string; // UUID -> users.id
  token_hash: string;
  role: 'user' | 'admin' | 'super_admin';
  ip_address?: string;
  user_agent?: string;
  expires_at: string;
  created_at: string;
  last_active_at: string;
}

export interface DbCircle {
  id: string; // UUID or slug
  name: string;
  description?: string;
  host_id: string; // UUID -> users.id
  color_theme?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCircleMember {
  id: string; // UUID
  circle_id: string; // UUID -> circles.id
  user_id: string; // UUID -> users.id
  role: 'host' | 'member' | 'guest';
  is_muted: boolean;
  joined_at: string;
}

export interface DbConnection {
  id: string; // UUID
  user_a_id: string; // UUID -> users.id
  user_b_id: string; // UUID -> users.id
  relationship_type: string;
  is_muted: boolean;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbSignal {
  id: string; // UUID
  space_id: string;
  sender_id: string; // UUID -> users.id
  sender_name: string;
  recipient_id?: string; // UUID -> users.id or null (broadcast)
  wave_shape: string;
  intensity: number;
  tempo: number;
  color: string;
  private_intention?: string;
  symbol_meaning?: string;
  source_type?: 'gesture' | 'tap_loop' | 'resonance' | 'biometric_rhythm';
  custom_tap_loop_data?: any;
  created_at: string;
}

export interface DbSharedLanguageEntry {
  id: string; // UUID
  user_id: string; // author UUID
  partner_id: string; // partner UUID
  wave_shape: string;
  intensity: number;
  label: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DbSignalPattern {
  id: string; // UUID
  user_id: string;
  name: string;
  pattern_type: 'tap_loop' | 'wave_rhythm' | 'biometric_rhythm';
  payload_json: any;
  created_at: string;
  updated_at: string;
}

export interface DbMemory {
  id: string; // UUID
  user_id: string; // owner
  partner_id: string;
  signal_id?: string;
  shared_meaning: string;
  reflection_note?: string;
  created_at: string;
}

export interface DbDevice {
  id: string; // UUID
  user_id: string;
  device_token?: string;
  platform: 'web_pwa' | 'android_capacitor' | 'ios_pwa';
  last_seen_at: string;
}

export interface DbPushSubscription {
  id: string; // UUID
  user_id: string;
  space_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  privacy_level: 'normal' | 'private' | 'generic';
  created_at: string;
  updated_at: string;
}

export interface DbUserPreferences {
  user_id: string; // UUID
  language: 'fa' | 'en';
  quiet_hours_enabled: boolean;
  quiet_hours_start: string; // "23:30"
  quiet_hours_end: string;   // "07:30"
  sound_enabled: boolean;
  haptics_enabled: boolean;
  reduced_motion: boolean;
  visual_quality: 'high' | 'medium' | 'low';
  notification_show_sender: boolean;
  notification_show_type: boolean;
  updated_at: string;
}

export interface DbPresenceSession {
  id: string; // UUID
  user_id: string;
  space_id: string;
  presence_state: string;
  local_hour?: number; // 0..23
  timezone?: string;
  last_heartbeat_at: string;
}

/**
 * Standard PostgreSQL DDL Script for production deployment on PostgreSQL / Supabase / Neon.
 */
export const POSTGRESQL_DDL = `
-- SKALA PostgreSQL / Supabase / Neon Migration Script

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(30) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100) NOT NULL,
  color_base VARCHAR(30) NOT NULL,
  color_accent VARCHAR(30) NOT NULL,
  color_glow VARCHAR(60) NOT NULL,
  color_border VARCHAR(30) NOT NULL,
  presence_state VARCHAR(50) DEFAULT 'present',
  texture VARCHAR(50) DEFAULT 'fluid',
  breath_rate NUMERIC(4,2) DEFAULT 4.5,
  motion_personality VARCHAR(50) DEFAULT 'meditative',
  bio_snippet TEXT,
  timezone VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(128) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circles (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  color_theme VARCHAR(50),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circle_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  circle_id VARCHAR(100) NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(30) DEFAULT 'member',
  is_muted BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50),
  is_muted BOOLEAN DEFAULT FALSE,
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a_id, user_b_id)
);

CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id VARCHAR(100) NOT NULL,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_name VARCHAR(100) NOT NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  wave_shape VARCHAR(50) NOT NULL,
  intensity NUMERIC(4,2) NOT NULL,
  tempo NUMERIC(4,2) NOT NULL,
  color VARCHAR(50) NOT NULL,
  private_intention TEXT,
  symbol_meaning TEXT,
  source_type VARCHAR(50) DEFAULT 'gesture',
  custom_tap_loop_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_language_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wave_shape VARCHAR(50) NOT NULL,
  intensity NUMERIC(4,2) NOT NULL,
  label VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  space_id VARCHAR(100) NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  privacy_level VARCHAR(30) DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(10) DEFAULT 'fa',
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start VARCHAR(10) DEFAULT '23:30',
  quiet_hours_end VARCHAR(10) DEFAULT '07:30',
  sound_enabled BOOLEAN DEFAULT TRUE,
  haptics_enabled BOOLEAN DEFAULT TRUE,
  reduced_motion BOOLEAN DEFAULT FALSE,
  visual_quality VARCHAR(20) DEFAULT 'high',
  notification_show_sender BOOLEAN DEFAULT TRUE,
  notification_show_type BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;
