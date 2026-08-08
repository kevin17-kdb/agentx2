import { Bot, LogOut, Signal, Wifi, WifiOff } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";

const STUDENTS = [
  { id: "S101", name: "Alex Chen", branch: "CSE · 3rd yr" },
  { id: "S102", name: "Priya Sharma", branch: "ECE · 4th yr" },
  { id: "S103", name: "Rahul Verma", branch: "ME · 2nd yr" },
  { id: "S104", name: "Sneha Iyer", branch: "CSE · 3rd yr" },
  { id: "S105", name: "Arjun Nair", branch: "IT · 4th yr" },
  { id: "S106", name: "Kavya Reddy", branch: "CSE · 2nd yr" },
];

const statusMap = {
  connected: { Icon: Wifi, label: "Agents online", cls: "text-emerald-400" },
  connecting: { Icon: Signal, label: "Connecting…", cls: "text-amber-400" },
  disconnected: { Icon: WifiOff, label: "Reconnecting…", cls: "text-rose-400" },
};

export default function Header({ status, mode, themeId, onThemeChange, studentId, onStudentChange, username, onLogout }) {
  const s = statusMap[status] || statusMap.connecting;

  return (
    <header className="glass-strong z-10 mx-4 mt-4 flex items-center justify-between rounded-2xl px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="shadow-glow flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
          <Bot className="h-6 w-6 text-accent" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide">
            AgentX <span className="text-accent">2026</span>
          </div>
          <div className="text-[11px] text-ink-dim">
            Smart Campus Multi-Agent AI · Sarvepalli Radhakrishna Engineering College
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden rounded-full border border-edge px-3 py-1 font-mono text-[11px] text-ink-dim md:block">
          llm: {mode}
        </span>
        <span className="flex items-center gap-2 rounded-full border border-edge px-3 py-1 text-[11px]">
          <s.Icon className={`h-3.5 w-3.5 ${s.cls}`} />
          <span className="text-ink-dim">{s.label}</span>
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-edge px-3 py-1 text-[11px] text-ink-dim lg:flex">
          <span className="text-accent">@</span>
          {username}
        </span>
        <select
          value={studentId}
          onChange={(e) => onStudentChange(e.target.value)}
          className="cursor-pointer rounded-xl border border-edge bg-panel px-3 py-1.5 text-sm text-ink outline-none transition hover:border-glow focus:border-glow"
        >
          {STUDENTS.map((st) => (
            <option key={st.id} value={st.id} className="bg-elev text-ink">
              {st.name} · {st.branch}
            </option>
          ))}
        </select>
        <ThemeSwitcher themeId={themeId} onChange={onThemeChange} />
        <button
          onClick={onLogout}
          title="Sign out"
          className="flex items-center gap-1.5 rounded-xl border border-edge bg-panel px-3 py-1.5 text-sm text-ink-dim transition hover:border-rose-400/50 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:block">Sign out</span>
        </button>
      </div>
    </header>
  );
}
