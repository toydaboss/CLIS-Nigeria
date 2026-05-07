import bcrypt from "bcryptjs";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { authenticator } from "otplib";
import { pool } from "../../db";

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
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Issue a short-lived temp token for the MFA step
    const tempToken = jwt.sign(
      { userId: user.id, step: "mfa" },
      JWT_TEMP_SECRET,
      { expiresIn: "5m" },
    );

    return res.json({
      tempToken,
      name: user.name,
      email: user.email,
    });
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

  let decoded: { userId: number; step: string };
  try {
    decoded = jwt.verify(tempToken, JWT_TEMP_SECRET) as typeof decoded;
  } catch {
    return res.status(401).json({ error: "Invalid or expired temp token" });
  }

  if (decoded.step !== "mfa") {
    return res.status(401).json({ error: "Invalid token step" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      decoded.userId,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ error: "User not found" });

    const user = rows[0];

    // Verify TOTP
    const isValid = authenticator.verify({
      token: code.replace(/\s/g, ""),
      secret: user.mfa_secret,
    });
    if (!isValid) {
      return res.status(401).json({ error: "Invalid TOTP code" });
    }

    // Issue full access token
    const accessToken = jwt.sign(
      {
        userId: user.id,
        userCode: user.user_code,
        role: user.role,
        jurisdictionState: user.jurisdiction_state,
      },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    return res.json({
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        userCode: user.user_code,
        jurisdictionState: user.jurisdiction_state,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/logout — just a signal; client discards the token
router.post("/logout", (_req, res) => res.json({ ok: true }));

export default router;
