import { Router } from "express";
import auth from "../middleware/auth.js";
import { chatLimiter } from "../middleware/rateLimit.js";
import { agentClient } from "../services/agentClient.js";

const router = Router();

/**
 * Buffered proxy to the Python agent-service. The agent trace (plan + tool
 * events) is returned in the response and rendered by the client after the
 * fact — buffering is a deliberate simplification over WS streaming.
 */
router.post("/", auth, chatLimiter, async (req, res, next) => {
  try {
    const { query, session_id } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json({ error: { code: "VALIDATION", message: "Query cannot be empty." } });
    }
    const result = await agentClient.chat({
      query,
      student_id: req.studentId,
      session_id: session_id || undefined,
    });
    res.json({ ...result, student_id: req.studentId, username: req.user.username });
  } catch (err) {
    next(err);
  }
});

/**
 * Records a human decision on a pending draft (email / grievance). The buffered
 * agent run already returned hitl_payload — this endpoint confirms the intent;
 * actual dispatch is a stub in buffered mode.
 */
router.post("/respond", auth, async (req, res, next) => {
  try {
    const { action, draft_id, session_id } = req.body || {};
    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: { code: "VALIDATION", message: "action must be 'approve' or 'reject'." } });
    }
    res.json({
      status: action === "approve" ? "approved" : "rejected",
      draft_id,
      session_id,
      message: action === "approve"
        ? `${draft_id} approved and dispatched.`
        : `${draft_id} rejected; transmission cancelled.`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
