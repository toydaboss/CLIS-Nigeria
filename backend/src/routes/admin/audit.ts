import { Router } from "express";
import { pool } from "../../db";
import { adminOnly, auth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/audit — paginated + filtered audit log (admin only)
router.get("/", auth, adminOnly, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const { operation, state, user: userFilter, from, to } = req.query;

  const params: (string | number)[] = [];
  let where = "WHERE 1=1";

  if (operation && operation !== "all") {
    params.push(operation as string);
    where += ` AND a.operation = $${params.length}`;
  }
  if (userFilter) {
    params.push(`${userFilter}%`);
    where += ` AND a.user_code ILIKE $${params.length}`;
  }
  if (from) {
    params.push(from as string);
    where += ` AND a.timestamp >= $${params.length}`;
  }
  if (to) {
    params.push(to as string);
    where += ` AND a.timestamp <= $${params.length}`;
  }
  if (state && state !== "all") {
    params.push(`%${state}%`);
    where += ` AND a.record_ref ILIKE $${params.length}`;
  }

  try {
    const { rows } = await pool.query(
      `SELECT a.id, a.timestamp, a.user_code, a.operation, a.record_ref,
              a.before_state, a.after_state
       FROM audit_log a
       ${where}
       ORDER BY a.timestamp DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    const {
      rows: [{ count }],
    } = await pool.query(`SELECT COUNT(*) FROM audit_log a ${where}`, params);
    return res.json({ entries: rows, total: parseInt(count), limit, offset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
