import { Router } from "express";
import { pool } from "../../db";
import { auth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/titles/:ref — admin internal lookup (full metadata)
router.get("/:ref", auth, async (req, res) => {
  const ref = req.params.ref.toUpperCase().trim();
  try {
    const { rows } = await pool.query(
      `SELECT * FROM titles WHERE title_ref = $1`,
      [ref],
    );
    if (rows.length === 0) return res.json({ found: false, searched: ref });
    return res.json({ found: true, title: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/titles — register new title
router.post("/", auth, async (req, res) => {
  const {
    ownerNinLast4,
    ownerNameMasked,
    jurisdictionState,
    lga,
    latitude,
    longitude,
    documentRef,
    registrationDate,
    titleRef,
  } = req.body;

  if (!titleRef || !ownerNinLast4 || !jurisdictionState || !registrationDate) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Check for overlap (naïve proximity check — within ~0.0002° ≈ 20m)
    const { rows: nearby } = await pool.query(
      `
      SELECT title_ref FROM titles
      WHERE ABS(latitude - $1) < 0.0002 AND ABS(longitude - $2) < 0.0002
        AND title_ref != $3
      LIMIT 3
    `,
      [latitude, longitude, titleRef],
    );

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        `
        INSERT INTO titles
          (title_ref, owner_nin_last4, owner_name_masked, jurisdiction_state, lga,
           latitude, longitude, document_ref, registration_date, status, registered_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'registered',$10)
        RETURNING *
      `,
        [
          titleRef,
          ownerNinLast4,
          ownerNameMasked,
          jurisdictionState,
          lga,
          latitude,
          longitude,
          documentRef,
          registrationDate,
          req.user!.userCode,
        ],
      );

      await client.query(
        `
        INSERT INTO audit_log (user_code, operation, record_ref, before_state, after_state)
        VALUES ($1, 'INSERT', $2, NULL, $3)
      `,
        [
          req.user!.userCode,
          titleRef,
          JSON.stringify({ status: "registered" }),
        ],
      );

      await client.query("COMMIT");
      return res
        .status(201)
        .json({ title: rows[0], nearby: nearby.map((r) => r.title_ref) });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Title reference already exists" });
    }
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/titles/:ref/dispute — flag a dispute
router.patch("/:ref/dispute", auth, async (req, res) => {
  const ref = req.params.ref.toUpperCase().trim();
  const { disputeCase } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: before } = await client.query(
      "SELECT status, dispute_case FROM titles WHERE title_ref = $1",
      [ref],
    );
    if (before.length === 0)
      return res.status(404).json({ error: "Title not found" });

    await client.query(
      `UPDATE titles SET status='disputed', dispute_case=$1, last_modified=NOW() WHERE title_ref=$2`,
      [disputeCase, ref],
    );
    await client.query(
      `
      INSERT INTO audit_log (user_code, operation, record_ref, before_state, after_state)
      VALUES ($1,'FLAG_DISPUTE',$2,$3,$4)
    `,
      [
        req.user!.userCode,
        ref,
        JSON.stringify({ disputed: false }),
        JSON.stringify({ disputed: true, case: disputeCase }),
      ],
    );

    await client.query("COMMIT");
    return res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// GET /api/admin/titles — list titles (paginated)
router.get("/", auth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const status = req.query.status as string | undefined;
  const state = req.query.state as string | undefined;

  let where = "WHERE 1=1";
  const params: (string | number)[] = [];
  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }
  if (state) {
    params.push(state);
    where += ` AND jurisdiction_state ILIKE $${params.length}`;
  }

  try {
    const { rows } = await pool.query(
      `SELECT title_ref, jurisdiction_state, lga, registration_date, status, registered_by
       FROM titles ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );
    const {
      rows: [{ count }],
    } = await pool.query(`SELECT COUNT(*) FROM titles ${where}`, params);
    return res.json({ titles: rows, total: parseInt(count), limit, offset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
