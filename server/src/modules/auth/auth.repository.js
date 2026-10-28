import { db } from '../../config/db.js';
import { getMySQLPool } from '../../config/mysql.js';

export class AuthRepository {
  async findUserByEmail(email) {
    return await db.users.findByEmail(email);
  }

  async findUserById(id) {
    return await db.users.findById(id);
  }

  async createUser(userData) {
    return await db.users.create(userData);
  }

  async createStudentProfile(userId, profileData) {
    return await db.studentProfiles.createOrUpdate(userId, profileData);
  }

  async createAlumniProfile(userId, profileData) {
    return await db.alumniProfiles.createOrUpdate(userId, profileData);
  }

  async findStudentProfileByUserId(userId) {
    return await db.studentProfiles.findByUserId(userId);
  }

  async findAlumniProfileByUserId(userId) {
    return await db.alumniProfiles.findByUserId(userId);
  }

  // ─── Password Reset Token Methods ───────────────────────────────────────────

  async ensurePasswordResetTable() {
    const pool = getMySQLPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id           INT AUTO_INCREMENT PRIMARY KEY,
        user_id      VARCHAR(100) NOT NULL,
        token_hash   CHAR(64) NOT NULL,
        expires_at   DATETIME NOT NULL,
        used         TINYINT(1) DEFAULT 0,
        created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX idx_token_hash (token_hash),
        INDEX idx_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    // Upgrade tables created by the earlier unfinished reset-flow version.
    try {
      await pool.query('ALTER TABLE password_reset_tokens MODIFY COLUMN user_id VARCHAR(100) NOT NULL');
    } catch (_) {}
    try {
      await pool.query('ALTER TABLE password_reset_tokens MODIFY COLUMN token VARCHAR(255) NULL');
    } catch (_) {}
    try {
      await pool.query('ALTER TABLE password_reset_tokens ADD COLUMN token_hash CHAR(64) NULL');
    } catch (_) {}
    try {
      await pool.query('ALTER TABLE password_reset_tokens ADD UNIQUE INDEX idx_token_hash (token_hash)');
    } catch (_) {}
  }

  async createResetToken(userId, tokenHash, expiresAt) {
    const pool = getMySQLPool();
    // Delete any previous tokens for this user
    await pool.query(`DELETE FROM password_reset_tokens WHERE user_id = ?`, [userId]);
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)`,
      [userId, tokenHash, expiresAt]
    );
  }

  async resetPasswordWithToken(tokenHash, passwordHash) {
    const pool = getMySQLPool();
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        `SELECT user_id FROM password_reset_tokens
         WHERE token_hash = ? AND used = 0 AND expires_at > NOW()
         LIMIT 1 FOR UPDATE`,
        [tokenHash]
      );
      const resetRecord = rows[0];
      if (!resetRecord) {
        await connection.rollback();
        return false;
      }

      const [updateResult] = await connection.query(
        `UPDATE users SET password_hash = ? WHERE id = ?`,
        [passwordHash, resetRecord.user_id]
      );
      if (updateResult.affectedRows !== 1) {
        throw new Error('User account for reset token no longer exists');
      }

      await connection.query(
        `UPDATE password_reset_tokens SET used = 1 WHERE token_hash = ?`,
        [tokenHash]
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

export const authRepository = new AuthRepository();
