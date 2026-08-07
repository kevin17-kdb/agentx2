import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import { env } from "./config/env.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import ragRoutes from "./routes/rag.js";
import healthRoutes from "./routes/health.js";
import errorHandler from "./middleware/error.js";
import User from "./models/User.js";

const DEMO_USERS = [
  { username: "admin", password: "admin123", role: "admin", name: "Admin", studentId: "S102" },
  { username: "kevin", password: "kevin123", role: "student", name: "Kevin", studentId: "S101" },
  { username: "emily", password: "emily123", role: "student", name: "Emily", studentId: "S103" },
  { username: "messi", password: "messi123", role: "student", name: "Messi", studentId: "S104" },
];

let mongoServer = null;

async function connectDb() {
  let uri = env.mongoUri;
  if (!uri) {
    console.log("[db] MONGO_URI not set — starting in-memory MongoDB (mongodb-memory-server)…");
    mongoServer = await MongoMemoryServer.create();
    uri = mongoServer.getUri();
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });
  console.log(`[db] MongoDB connected: ${mongoServer ? "in-memory" : env.mongoUri}`);
}

async function seedDemoUsers() {
  const count = await User.estimatedDocumentCount();
  if (count > 0) return;
  for (const u of DEMO_USERS) await User.create(u);
  console.log("[db] Seeded demo users: admin kevin emily messi (password: <name>123)");
}

async function main() {
  await connectDb();
  await seedDemoUsers();

  const app = express();
  app.use(cors({ origin: env.clientOrigins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_req, res) => res.json({ service: "agentx-server", status: "ok" }));
  app.use("/api/health", healthRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/rag", ragRoutes);

  app.use((req, res) => res.status(404).json({ error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } }));
  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[server] AgentX API listening on http://127.0.0.1:${env.port}`);
  });
}

process.on("SIGINT", async () => {
  await mongoose.disconnect();
  await mongoServer?.stop();
  process.exit(0);
});

main().catch((err) => {
  console.error("[server] Fatal startup error:", err);
  process.exit(1);
});
