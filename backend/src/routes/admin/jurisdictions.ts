import { Router } from "express";
import { Title } from "../../db/models/Title";
import { User } from "../../db/models/User";
import { adminOnly, auth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/jurisdictions — title + registrar stats per state
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const [titleStats, registrarStats] = await Promise.all([
      Title.aggregate([
        {
          $group: {
            _id: "$jurisdictionState",
            totalTitles: { $sum: 1 },
            registeredTitles: {
              $sum: { $cond: [{ $eq: ["$status", "registered"] }, 1, 0] },
            },
            disputedTitles: {
              $sum: { $cond: [{ $eq: ["$status", "disputed"] }, 1, 0] },
            },
            pendingTitles: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            lastActivity: { $max: "$createdAt" },
          },
        },
        { $sort: { totalTitles: -1 } },
      ]),
      User.aggregate([
        { $match: { role: "registrar", jurisdictionState: { $ne: null } } },
        { $group: { _id: "$jurisdictionState", registrars: { $sum: 1 } } },
      ]),
    ]);

    const registrarMap = new Map(
      registrarStats.map((r) => [r._id, r.registrars]),
    );

    const jurisdictions = titleStats.map((s) => ({
      state: s._id,
      totalTitles: s.totalTitles,
      registeredTitles: s.registeredTitles,
      disputedTitles: s.disputedTitles,
      pendingTitles: s.pendingTitles,
      registrars: registrarMap.get(s._id) ?? 0,
      lastActivity: s.lastActivity,
    }));

    const totals = {
      states: jurisdictions.length,
      titles: jurisdictions.reduce((a, j) => a + j.totalTitles, 0),
      disputes: jurisdictions.reduce((a, j) => a + j.disputedTitles, 0),
      registrars: jurisdictions.reduce((a, j) => a + j.registrars, 0),
    };

    return res.json({ jurisdictions, totals });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
