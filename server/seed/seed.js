import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".env") });

import User from "../models/User.js";

const DEMO_USERS = [
  { username: "admin", password: "admin123", role: "admin", name: "Admin", studentId: "S102" },
  { username: "kevin", password: "kevin123", role: "student", name: "Kevin", studentId: "S101" },
  { username: "emily", password: "emily123", role: "student", name: "Emily", studentId: "S103" },
  { username: "messi", password: "messi123", role: "student", name: "Messi", studentId: "S104" },
];

async function main() {
  let uri = process.env.MONGO_URI;
  let server = null;
  if (!uri) {
    console.log("[seed] No MONGO_URI — using in-memory MongoDB.");
    server = await MongoMemoryServer.create();
    uri = server.getUri();
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15_000 });

  for (const u of DEMO_USERS) {
    const existing = await User.findOne({ username: u.username });
    if (existing) {
      console.log(`[seed] exists: ${u.username}`);
      continue;
    }
    await User.create(u);
    console.log(`[seed] created: ${u.username} (${u.role}, ${u.studentId})`);
  }

  await mongoose.disconnect();
  await server?.stop();
  console.log("[seed] done. Demo users: admin/admin123 kevin/kevin123 emily/emily123 messi/messi123");
}

main().catch((err) => {
  console.error("[seed] failed:", err);
  process.exit(1);
});
