import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";

/**
 * Auth middleware. On success attaches `req.user` (the Mongo document) and
 * `req.studentId` (the agent-service student context).
 */
export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Not authenticated." } });
    }
    const token = header.slice(7).trim();
    let decoded;
    try {
      decoded = jwt.verify(token, env.jwtSecret);
    } catch {
      return res.status(401).json({ error: { code: "TOKEN_EXPIRED", message: "Session expired. Please sign in again." } });
    }
    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Account not found." } });
    }
    req.user = user;
    req.studentId = user.studentId || "S101";
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin access required." } });
  }
  next();
}
