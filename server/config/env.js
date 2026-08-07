import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const REQUIRED = ["JWT_SECRET", "PORT"];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[env] Missing required env vars: ${missing.join(", ")}`);
  console.error("[env] Copy server/.env.example to server/.env and fill in the values.");
  process.exit(1);
}

export const env = {
  port: parseInt(process.env.PORT, 10),
  mongoUri: process.env.MONGO_URI || "", // empty => auto-start in-memory MongoDB
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  agentServiceUrl: process.env.AGENT_SERVICE_URL || "http://127.0.0.1:8100",
  clientOrigins: (process.env.CLIENT_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  nodeEnv: process.env.NODE_ENV || "development",
};
