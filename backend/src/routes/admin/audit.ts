import { Router } from "express";
import { AuditLog } from "../../db/models/AuditLog";
import { adminOnly, auth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/audit — paginated + filtered audit log (admin only)
router.get("/", auth, adminOnly, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 25, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  const { operation, state, user: userFilter, from, to } = req.query;

  const filter: Record<string, unknown> = {};
  if (operation && operation !== "all") filter.operation = operation;
  if (userFilter) filter.userCode = new RegExp(`^${userFilter}`, "i");
  if (state && state !== "all")
    filter.recordRef = new RegExp(state as string, "i");
  if (from || to) {
    const ts: Record<string, Date> = {};
    if (from) ts.$gte = new Date(from as string);
    if (to) ts.$lte = new Date(to as string);
    filter.timestamp = ts;
  }

  try {
    const [entries, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(filter),
    ]);
    return res.json({ entries, total, limit, offset });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
