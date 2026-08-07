import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Launches the zero-dependency agent service (agent-service/api.py).
 *
 * The wrapper itself is stdlib-only, but it imports backend/ (LangGraph, RAG), which
 * requires the project venv. Prefer the repo venv's python; fall back to `python`.
 * Runs from the repo root so `backend.*` imports resolve.
 */
const root = process.cwd();
const venvPy =
  process.platform === "win32"
    ? join(root, ".venv", "Scripts", "python.exe")
    : join(root, ".venv", "bin", "python");

const py = existsSync(venvPy) ? venvPy : "python";

if (process.platform === "win32" && !process.env.PYTHONIOENCODING) {
  process.env.PYTHONIOENCODING = "utf-8";
}

const child = spawn(py, ["agent-service/api.py"], { cwd: root, stdio: "inherit" });
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error(`[agent] failed to start with "${py}": ${err.message}`);
  process.exit(1);
});
