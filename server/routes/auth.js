import { Router } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import { HttpError } from "../middleware/error.js";
import { authLimiter } from "../middleware/rateLimit.js";

const router = Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { username, password, name, studentId, role } = req.body || {};
    if (!username || !password || password.length < 6) {
      throw new HttpError(400, "VALIDATION", "Username and a 6+ character password are required.");
    }
    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) throw new HttpError(409, "USERNAME_TAKEN", `Username '${username}' is already taken.`);
    const user = await User.create({
      username,
      password,
      name: name || username,
      studentId: studentId || "S101",
      role: role === "admin" ? "admin" : "student",
    });
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const user = await User.findOne({ username: (username || "").toLowerCase() });
    if (!user || !(await user.comparePassword(password || ""))) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid username or password.");
    }
    res.json({ token: signToken(user), user: user.toPublic() });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", auth, (req, res) => {
  // Stateless JWT — the client simply discards the token. Endpoint exists so the
  // client doesn't have to special-case logout.
  res.json({ status: "logged_out" });
});

router.get("/me", auth, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

export default router;
