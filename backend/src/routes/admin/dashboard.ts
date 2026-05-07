import { Router } from "express";
import { pool } from "../../db";
import { auth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/dashboard/stats
router.get("/stats", auth, async (req, res) => {
  try {
    const {
      rows: [stats],
    } = await pool.query(`
      SELECT
        COUNT(*)                                          AS total_titles,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS titles_this_month,
        COUNT(*) FILTER (WHERE status = 'disputed')      AS active_disputes,
        COUNT(*) FILTER (WHERE status = 'pending')       AS pending_reviews
      FROM titles
    `);

    return res.json({
      totalTitles: parseInt(stats.total_titles),
      titlesThisMonth: parseInt(stats.titles_this_month),
      activeDisputes: parseInt(stats.active_disputes),
      pendingReviews: parseInt(stats.pending_reviews),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/dashboard/recent
router.get("/recent", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.timestamp, a.user_code, a.operation, a.record_ref,
             t.jurisdiction_state, t.lga, t.status
      FROM audit_log a
      LEFT JOIN titles t ON t.title_ref = a.record_ref
      ORDER BY a.timestamp DESC
      LIMIT 10
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/dashboard/chart — registrations last 14 days
router.get("/chart", auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT date_trunc('day', registration_date)::date AS day, COUNT(*) AS count
      FROM titles
      WHERE registration_date >= NOW() - INTERVAL '14 days'
      GROUP BY day
      ORDER BY day
    `);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
