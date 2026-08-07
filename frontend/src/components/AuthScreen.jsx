import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, KeyRound, Loader2, LogIn, ShieldCheck, User, UserPlus } from "lucide-react";
import { THEMES } from "../theme";

const STUDENTS = [
  { id: "S101", name: "Alex Chen", branch: "CSE · 3rd yr" },
  { id: "S102", name: "Priya Sharma", branch: "ECE · 4th yr" },
  { id: "S103", name: "Rahul Verma", branch: "ME · 2nd yr" },
  { id: "S104", name: "Sneha Iyer", branch: "CSE · 3rd yr" },
  { id: "S105", name: "Arjun Nair", branch: "IT · 4th yr" },
  { id: "S106", name: "Kavya Reddy", branch: "CSE · 2nd yr" },
];

export default function AuthScreen({ onAuthenticate, themeId }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [studentId, setStudentId] = useState("S101");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const err = await onAuthenticate(mode, username, password, studentId);
    if (err) setError(err);
    else setPassword("");
    setBusy(false);
  };

  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-strong shadow-glow rounded-3xl p-8"
        >
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <div className="shadow-glow flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15">
              <Bot className="h-8 w-8 text-accent" />
            </div>
            <div>
              <div className="gradient-text text-2xl font-bold tracking-tight">
                AgentX 2026
              </div>
              <div className="mt-1 text-xs text-ink-dim">
                Smart Campus Multi-Agent AI · Vasavi College of Engineering
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-edge bg-panel p-1">
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition ${
                  mode === m ? "bg-accent text-base" : "text-ink-dim hover:text-ink"
                }`}
              >
                {m === "login" ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {m === "login" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink-dim">
                <User className="h-3.5 w-3.5" /> Username
              </span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                placeholder={mode === "login" ? "student" : "Choose a username"}
                className="w-full rounded-xl border border-edge bg-panel px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-glow"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink-dim">
                <KeyRound className="h-3.5 w-3.5" /> Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={mode === "login" ? "demo123" : "Min. 6 characters"}
                className="w-full rounded-xl border border-edge bg-panel px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-glow"
              />
            </label>

            {mode === "register" && (
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-ink-dim">
                  <ShieldCheck className="h-3.5 w-3.5" /> Link student profile
                </span>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-edge bg-panel px-4 py-2.5 text-sm text-ink outline-none focus:border-glow"
                >
                  {STUDENTS.map((st) => (
                    <option key={st.id} value={st.id} className="bg-elev text-ink">
                      {st.name} · {st.branch}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-300"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-sm font-semibold transition hover:opacity-85 disabled:opacity-50"
              style={{ color: "var(--bg-base)" }}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-edge bg-panel/60 p-3 text-[11px] leading-relaxed text-ink-dim">
            <span className="font-semibold text-ink">Demo account:</span> username{" "}
            <code className="font-mono text-accent2">student</code> · password{" "}
            <code className="font-mono text-accent2">demo123</code>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
