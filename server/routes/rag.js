import { Router } from "express";
import auth from "../middleware/auth.js";
import { agentClient } from "../services/agentClient.js";

const router = Router();

router.post("/search", auth, async (req, res, next) => {
  try {
    const { query, top_k } = req.body || {};
    if (!query || !query.trim()) {
      return res.status(400).json({ error: { code: "VALIDATION", message: "Query cannot be empty." } });
    }
    const result = await agentClient.ragSearch({ query, top_k: top_k || 3 });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
