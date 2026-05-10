import { Router } from "express";
import { AuditLog } from "../../db/models/AuditLog";
import { Title } from "../../db/models/Title";
import { auth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/titles/:ref — admin internal lookup
router.get("/:ref", auth, async (req, res) => {
  const ref = req.params.ref.toUpperCase().trim();
  try {
    const title = await Title.findOne({ titleRef: ref }).lean();
    if (!title) return res.json({ found: false, searched: ref });
    return res.json({ found: true, title });
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
    const nearby = await Title.find({
      latitude: { $gt: latitude - 0.0002, $lt: latitude + 0.0002 },
      longitude: { $gt: longitude - 0.0002, $lt: longitude + 0.0002 },
      titleRef: { $ne: titleRef },
    })
      .select("titleRef")
      .limit(3)
      .lean();

    const title = await Title.create({
      titleRef,
      ownerNinLast4,
      ownerNameMasked,
      jurisdictionState,
      lga,
      latitude,
      longitude,
      documentRef,
      registrationDate: new Date(registrationDate),
      registeredBy: req.user!.userCode,
    });

    await AuditLog.create({
      userCode: req.user!.userCode,
      operation: "INSERT",
      recordRef: titleRef,
      beforeState: null,
      afterState: { status: "registered" },
    });

    return res.status(201).json({
      title,
      nearby: nearby.map((t) => t.titleRef),
    });
  } catch (err: any) {
    if (err.code === 11000) {
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

  try {
    const before = await Title.findOne(
      { titleRef: ref },
      "status disputeCase",
    ).lean();
    if (!before) return res.status(404).json({ error: "Title not found" });

    await Title.updateOne(
      { titleRef: ref },
      { status: "disputed", disputeCase, lastModified: new Date() },
    );

    await AuditLog.create({
      userCode: req.user!.userCode,
      operation: "FLAG_DISPUTE",
      recordRef: ref,
      beforeState: { disputed: false },
      afterState: { disputed: true, case: disputeCase },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/titles — list titles (paginated)
router.get("/", auth, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const status = req.query.status as string | undefined;
  const state = req.query.state as string | undefined;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (state) filter.jurisdictionState = new RegExp(state, "i");

  try {
    const [titles, total] = await Promise.all([
      Title.find(
        filter,
        "titleRef jurisdictionState lga registrationDate status registeredBy disputeCase",
      )
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Title.countDocuments(filter),
    ]);
    return res.json({ titles, total, limit, offset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
