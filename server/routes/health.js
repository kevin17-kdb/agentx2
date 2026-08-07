import { Router } from "express";
import mongoose from "mongoose";
import { agentClient } from "../services/agentClient.js";

const router = Router();

router.get("/", async (_req, res) => {
  const agentHealth = await agentClient.health();
  res.json({
    status: "ok",
    service: "agentx-server",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    agentService: agentHealth.ok ? "up" : "down",
    agent: agentHealth,
  });
});

export default router;
