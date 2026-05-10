import { Router } from "express";
import { AuditLog } from "../../db/models/AuditLog";
import { Title } from "../../db/models/Title";
import { auth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/dashboard/stats
router.get("/stats", auth, async (req, res) => {
  try {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );

    const [totalTitles, titlesThisMonth, activeDisputes, pendingReviews] =
      await Promise.all([
        Title.countDocuments(),
        Title.countDocuments({ createdAt: { $gte: startOfMonth } }),
        Title.countDocuments({ status: "disputed" }),
        Title.countDocuments({ status: "pending" }),
      ]);

    return res.json({
      totalTitles,
      titlesThisMonth,
      activeDisputes,
      pendingReviews,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/dashboard/recent
router.get("/recent", auth, async (req, res) => {
  try {
    const entries = await AuditLog.aggregate([
      { $sort: { timestamp: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "titles",
          localField: "recordRef",
          foreignField: "titleRef",
          as: "title",
        },
      },
      { $unwind: { path: "$title", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          timestamp: 1,
          userCode: 1,
          operation: 1,
          recordRef: 1,
          jurisdictionState: "$title.jurisdictionState",
          lga: "$title.lga",
          status: "$title.status",
        },
      },
    ]);
    return res.json(entries);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/dashboard/chart — registrations last 14 days
router.get("/chart", auth, async (req, res) => {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const rows = await Title.aggregate([
      { $match: { registrationDate: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$registrationDate" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { day: "$_id", count: 1, _id: 0 } },
    ]);
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
