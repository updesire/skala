import mysql from 'mysql2/promise';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

let pool: mysql.Pool | null = null;
let isConnected = false;
let connectionError: string | null = null;

export function getMySQLConfig(): MySQLConfig | null {
  const host = process.env.DB_HOST || process.env.MYSQL_HOST;
  const user = process.env.DB_USER || process.env.MYSQL_USER;
  const database = process.env.DB_NAME || process.env.MYSQL_DATABASE;
  const password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);

  if (!host || !user || !database) {
    return null;
  }

  return { host, port, user, password, database };
}

export async function initMySQLPool(): Promise<boolean> {
  const config = getMySQLConfig();
  if (!config) {
    console.log('[SKALA MySQL] No MySQL credentials configured in environment. Using robust disk storage fallback.');
    isConnected = false;
    connectionError = 'No DB_HOST / DB_USER / DB_NAME configured in environment';
    return false;
  }

  try {
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      charset: 'utf8mb4',
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    isConnected = true;
    connectionError = null;
    console.log(`[SKALA MySQL] Connected successfully to MySQL database "${config.database}" at ${config.host}:${config.port}`);

    // Auto-create core tables if not exist
    await runAutoMigrations();

    return true;
  } catch (err: any) {
    isConnected = false;
    connectionError = err.message || 'Failed to connect to MySQL';
    console.warn('[SKALA MySQL] Connection warning:', connectionError, '- Falling back to local persistence.');
    return false;
  }
}

export async function runAutoMigrations() {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(191) NOT NULL UNIQUE,
        password_hash VARCHAR(255) DEFAULT NULL,
        name VARCHAR(128) NOT NULL,
        role ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user',
        presence VARCHAR(32) NOT NULL DEFAULT 'present',
        texture VARCHAR(32) NOT NULL DEFAULT 'fluid',
        breath_rate FLOAT NOT NULL DEFAULT 4.5,
        color_json JSON DEFAULT NULL,
        last_seen BIGINT UNSIGNED DEFAULT NULL,
        created_at BIGINT UNSIGNED NOT NULL,
        updated_at BIGINT UNSIGNED NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        token VARCHAR(128) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        role ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user',
        created_at BIGINT UNSIGNED NOT NULL,
        expires_at BIGINT UNSIGNED NOT NULL,
        INDEX idx_sessions_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS spaces (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(191) NOT NULL,
        description TEXT DEFAULT NULL,
        host_name VARCHAR(128) NOT NULL,
        host_email VARCHAR(191) DEFAULT NULL,
        host_id VARCHAR(64) DEFAULT NULL,
        is_system_space TINYINT(1) NOT NULL DEFAULT 0,
        created_at BIGINT UNSIGNED NOT NULL,
        updated_at BIGINT UNSIGNED NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint VARCHAR(512) PRIMARY KEY,
        p256dh VARCHAR(255) NOT NULL,
        auth VARCHAR(255) NOT NULL,
        user_id VARCHAR(64) DEFAULT NULL,
        space_id VARCHAR(64) NOT NULL,
        privacy_level VARCHAR(32) NOT NULL DEFAULT 'normal',
        created_at BIGINT UNSIGNED NOT NULL,
        INDEX idx_push_space (space_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[SKALA MySQL] Auto-migrations verified successfully.');
  } catch (err) {
    console.warn('[SKALA MySQL] Auto-migration error:', err);
  }
}

export function getPool() {
  return pool;
}

export function getMySQLStatus() {
  const config = getMySQLConfig();
  return {
    isConnected,
    connectionError,
    config: config ? { host: config.host, port: config.port, database: config.database, user: config.user } : null,
  };
}
