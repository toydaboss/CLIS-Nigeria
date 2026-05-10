import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import { User } from "../../db/models/User";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const JWT_TEMP_SECRET = process.env.JWT_TEMP_SECRET || "dev-temp-secret";

// POST /api/auth/login — step 1: credentials
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).lean();
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const tempToken = jwt.sign(
      { userId: user._id.toString(), step: "mfa" },
      JWT_TEMP_SECRET,
      { expiresIn: "5m" },
    );

    return res.json({ tempToken, name: user.name, email: user.email });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/mfa — step 2: TOTP verification
router.post("/mfa", async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code) {
    return res.status(400).json({ error: "tempToken and code required" });
  }

  let decoded: { userId: string; step: string };
  try {
    decoded = jwt.verify(tempToken, JWT_TEMP_SECRET) as typeof decoded;
  } catch {
    return res.status(401).json({ error: "Invalid or expired temp token" });
  }

  if (decoded.step !== "mfa") {
    return res.status(401).json({ error: "Invalid token step" });
  }

  try {
    const user = await User.findById(decoded.userId).lean();
    if (!user) return res.status(401).json({ error: "User not found" });

    const isValid = authenticator.verify({
      token: code.replace(/\s/g, ""),
      secret: user.mfaSecret,
    });
    if (!isValid) {
      return res.status(401).json({ error: "Invalid TOTP code" });
    }

    const accessToken = jwt.sign(
      {
        userId: user._id.toString(),
        userCode: user.userCode,
        role: user.role,
        jurisdictionState: user.jurisdictionState,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    return res.json({
      accessToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        userCode: user.userCode,
        jurisdictionState: user.jurisdictionState,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout — client discards the token
router.post("/logout", (_req, res) => res.json({ ok: true }));

export default router;
