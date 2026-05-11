import { Router } from "express";
import { Title } from "../db/models/Title";

const router = Router();

// GET /api/titles/:ref — public title verification
router.get("/titles/:ref", async (req, res) => {
  const { ref } = req.params;
  const clean = ref.trim().toUpperCase();

  if (!/^[A-Z]+(?:\s+[A-Z]+)*-\d{4}-\d{5}$/.test(clean)) {
    return res.status(400).json({
      error: "Invalid title reference format. Expected STATE-YEAR-NNNNN.",
    });
  }

  try {
    const title = await Title.findOne({ titleRef: clean }).lean();

    if (!title) {
      return res.json({ found: false, searched: clean });
    }

    return res.json({
      found: true,
      titleRef: title.titleRef,
      jurisdictionState: title.jurisdictionState,
      registrationDate: title.registrationDate,
      status: title.status,
      disputeCase: title.disputeCase || null,
      lastVerified: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
