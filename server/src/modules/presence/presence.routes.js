import { Router } from 'express';
import { queryMySQL } from '../../config/mysql.js';
import { verifyJWT } from '../../middleware/auth.middleware.js';
import { ApiResponse } from '../../shared/responseHelper.js';
import { asyncHandler } from '../../shared/asyncHandler.js';

const router = Router();

/**
 * Ensure online_status table exists.
 */
export const ensureOnlineStatusSchema = async () => {
  await queryMySQL(`
    CREATE TABLE IF NOT EXISTS \`online_status\` (
      \`user_id\`    VARCHAR(50)  NOT NULL PRIMARY KEY,
      \`last_seen\`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_os_last_seen (\`last_seen\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

/**
 * POST /api/v1/presence/heartbeat
 * Client calls this every 30s while user is active on the page.
 */
router.post('/heartbeat', verifyJWT, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await queryMySQL(
    `INSERT INTO \`online_status\` (\`user_id\`, \`last_seen\`)
     VALUES (?, NOW())
     ON DUPLICATE KEY UPDATE \`last_seen\` = NOW()`,
    [userId]
  );
  return res.status(200).json(new ApiResponse(200, null, 'ok'));
}));

/**
 * GET /api/v1/presence/:userId
 * Returns whether a specific user is currently online.
 * "Online" = last_seen within the past 45 seconds.
 */
router.get('/:userId', verifyJWT, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const rows = await queryMySQL(
    'SELECT `last_seen` FROM `online_status` WHERE `user_id` = ?',
    [userId]
  );
  if (!rows[0]) {
    return res.status(200).json(new ApiResponse(200, { online: false, last_seen: null }, 'Offline'));
  }
  const lastSeen = new Date(rows[0].last_seen);
  const diffSec = (Date.now() - lastSeen.getTime()) / 1000;
  const online = diffSec <= 45;
  return res.status(200).json(
    new ApiResponse(200, { online, last_seen: rows[0].last_seen }, online ? 'Online' : 'Offline')
  );
}));

/**
 * GET /api/v1/presence/batch?ids=u1,u2,u3
 * Batch presence check for multiple users at once.
 */
router.get('/', verifyJWT, asyncHandler(async (req, res) => {
  const ids = (req.query.ids || '').split(',').filter(Boolean);
  if (ids.length === 0) {
    return res.status(200).json(new ApiResponse(200, {}, 'No IDs provided'));
  }
  const placeholders = ids.map(() => '?').join(',');
  const rows = await queryMySQL(
    `SELECT \`user_id\`, \`last_seen\` FROM \`online_status\` WHERE \`user_id\` IN (${placeholders})`,
    ids
  );
  const result = {};
  for (const id of ids) {
    const row = rows.find(r => r.user_id === id);
    if (!row) {
      result[id] = { online: false, last_seen: null };
    } else {
      const diffSec = (Date.now() - new Date(row.last_seen).getTime()) / 1000;
      result[id] = { online: diffSec <= 45, last_seen: row.last_seen };
    }
  }
  return res.status(200).json(new ApiResponse(200, result, 'Presence fetched'));
}));

export default router;
