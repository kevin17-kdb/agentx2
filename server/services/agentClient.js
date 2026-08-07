import { env } from "../config/env.js";
import { HttpError } from "../middleware/error.js";

const TIMEOUT_MS = 15_000;
const RETRIES = 1;

/**
 * Calls the Python agent-service with a timeout and a single retry, mirroring
 * the "retry once, then degrade gracefully" philosophy of the agent runtime.
 */
async function fetchWithRetry(path, body) {
  let lastErr = null;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${env.agentServiceUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new HttpError(res.status, data.error?.code || "AGENT_ERROR", data.error?.message || "Agent service error.");
      }
      return data;
    } catch (err) {
      lastErr = err;
      if (err instanceof HttpError) throw err; // don't retry real HTTP errors
    } finally {
      clearTimeout(timer);
    }
  }
  throw new HttpError(
    503,
    "AGENT_SERVICE_UNAVAILABLE",
    "The agent service is unavailable right now. Please try again in a moment."
  );
}

export const agentClient = {
  chat(payload) {
    return fetchWithRetry("/chat", payload);
  },
  ragSearch(payload) {
    return fetchWithRetry("/rag/search", payload);
  },
  async health() {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${env.agentServiceUrl}/health`, { signal: controller.signal });
      clearTimeout(timer);
      return { ok: res.ok, ...(await res.json().catch(() => ({}))) };
    } catch {
      return { ok: false, status: "unreachable" };
    }
  },
};

export { HttpError };
