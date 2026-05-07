import { Router } from "express";
import { pool } from "../db";

const router = Router();

// GET /api/titles/:ref — public title verification
router.get("/titles/:ref", async (req, res) => {
  const { ref } = req.params;
  const clean = ref.trim().toUpperCase();

  // Basic format validation: STATE-YEAR-NNNNN
  if (!/^[A-Z]+(?:\s+[A-Z]+)*-\d{4}-\d{5}$/.test(clean)) {
    return res
      .status(400)
      .json({
        error: "Invalid title reference format. Expected STATE-YEAR-NNNNN.",
      });
  }

  try {
    const { rows } = await pool.query(
      `SELECT title_ref, jurisdiction_state, registration_date, status, dispute_case, last_modified
       FROM titles WHERE title_ref = $1`,
      [clean],
    );

    if (rows.length === 0) {
      return res.json({ found: false, searched: clean });
    }

    const t = rows[0];
    return res.json({
      found: true,
      titleRef: t.title_ref,
      jurisdictionState: t.jurisdiction_state,
      registrationDate: t.registration_date,
      status: t.status,
      disputeCase: t.dispute_case || null,
      lastVerified: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
