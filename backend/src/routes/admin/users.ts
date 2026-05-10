import bcrypt from "bcryptjs";
import { Router } from "express";
import { authenticator } from "otplib";
import { User } from "../../db/models/User";
import { adminOnly, auth } from "../../middleware/auth";

const router = Router();

// GET /api/admin/users — list all users
router.get("/", auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find({}, "-passwordHash -mfaSecret")
      .sort({ createdAt: 1 })
      .lean();
    return res.json(users);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/admin/users — create a new user
router.post("/", auth, adminOnly, async (req, res) => {
  const { email, name, role, jurisdictionState, password } = req.body;

  if (!email || !name || !role || !password) {
    return res
      .status(400)
      .json({ error: "email, name, role and password are required" });
  }
  if (!["admin", "registrar"].includes(role)) {
    return res.status(400).json({ error: "role must be admin or registrar" });
  }
  if (role === "registrar" && !jurisdictionState) {
    return res
      .status(400)
      .json({ error: "jurisdictionState is required for registrar role" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const mfaSecret = authenticator.generateSecret();
    const prefix =
      role === "admin" ? "ADM" : jurisdictionState!.slice(0, 3).toUpperCase();
    const userCode = `USR-${prefix}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

    const user = await User.create({
      email: email.toLowerCase().trim(),
      name,
      role,
      jurisdictionState: role === "admin" ? null : jurisdictionState,
      passwordHash,
      mfaSecret,
      userCode,
    });

    const safe = user.toObject() as unknown as Record<string, unknown>;
    delete safe.passwordHash;
    delete safe.mfaSecret;

    return res.status(201).json({
      user: safe,
      totpSecret: mfaSecret,
      totpUri: authenticator.keyuri(email, "CLIS Nigeria", mfaSecret),
    });
  } catch (err: any) {
    if (err.code === 11000)
      return res.status(409).json({ error: "Email already registered" });
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/users/:id/role — change role
router.patch("/:id/role", auth, adminOnly, async (req, res) => {
  const { role, jurisdictionState } = req.body;

  if (!role || !["admin", "registrar"].includes(role)) {
    return res
      .status(400)
      .json({ error: "Valid role (admin or registrar) required" });
  }
  if (req.params.id === req.user!.userId) {
    return res.status(400).json({ error: "Cannot change your own role" });
  }
  if (role === "registrar" && !jurisdictionState) {
    return res
      .status(400)
      .json({ error: "jurisdictionState required for registrar" });
  }

  try {
    const result = await User.updateOne(
      { _id: req.params.id },
      { role, jurisdictionState: role === "admin" ? null : jurisdictionState },
    );
    if (result.matchedCount === 0)
      return res.status(404).json({ error: "User not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/users/:id — remove user
router.delete("/:id", auth, adminOnly, async (req, res) => {
  if (req.params.id === req.user!.userId) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }
  try {
    const result = await User.deleteOne({ _id: req.params.id });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "User not found" });
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
