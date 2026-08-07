import { motion } from "framer-motion";
import { Activity, BrainCircuit, Check, ChevronRight, Loader2, TerminalSquare, TriangleAlert, Wrench } from "lucide-react";

function stepStatus(entries, i, done) {
  const starts = entries.filter((e) => e.kind === "agent_start").length;
  const ends = entries.filter((e) => e.kind === "agent_end").length;
  if (done || ends > i) return "done";
  if (starts > i) return "running";
  return "pending";
}

export default function TracePanel({ run, thinking }) {
  const entries = run?.entries || [];

  return (
    <aside className="glass flex w-[360px] shrink-0 flex-col overflow-hidden rounded-2xl xl:w-[400px]">
      <div className="flex items-center gap-2 border-b border-edge px-4 py-3">
        <Activity className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-dim">
          Agent Reasoning Trace
        </span>
        {thinking && <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-accent" />}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {!run ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 py-20 text-center">
            <BrainCircuit className="h-10 w-10 text-ink-faint" />
            <div className="text-xs text-ink-faint">
              Send a command to watch the orchestrator plan, route, and reason — live.
            </div>
          </div>
        ) : (
          <>
            {/* Planner reasoning */}
            <div className="rounded-xl border border-edge bg-panel p-3">
              <div className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                <TerminalSquare className="h-3 w-3" /> Orchestrator · Plan
              </div>
              <p className="font-mono text-[11px] leading-relaxed text-ink-dim">{run.reasoning}</p>
            </div>

            {/* Plan steps */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest text-ink-faint">Planned steps</div>
              {run.steps.map((s, i) => {
                const st = stepStatus(entries, i, run.status === "done");
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                      st === "done"
                        ? "border-accent/30 bg-accent/10 text-ink"
                        : st === "running"
                        ? "border-glow bg-panel text-ink"
                        : "border-edge bg-panel/40 text-ink-faint"
                    }`}
                  >
                    {st === "done" ? (
                      <Check className="h-3.5 w-3.5 text-accent" />
                    ) : st === "running" ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{s.task}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Live event stream */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase tracking-widest text-ink-faint">Live stream</div>
              {entries.map((e, i) => {
                if (e.kind === "agent_start") {
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-bold"
                        style={{ background: `${e.color}22`, color: e.color, border: `1px solid ${e.color}44` }}
                      >
                        {e.glyph}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-xs font-medium text-ink">{e.task}</div>
                        <div className="text-[10px] text-ink-faint">Agent: {e.agent}</div>
                      </div>
                    </motion.div>
                  );
                }
                if (e.kind === "tool_call") {
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                      className="ml-8 flex items-start gap-1.5 border-l border-edge pl-3">
                      <Wrench className="mt-0.5 h-3 w-3 shrink-0 text-accent2" />
                      <div className="min-w-0 font-mono text-[11px] text-ink-dim">
                        <span className="text-accent2">{e.tool}</span>
                        <span className="text-ink-faint">({e.args ? JSON.stringify(e.args).slice(0, 70) : ""})</span>
                      </div>
                    </motion.div>
                  );
                }
                if (e.kind === "tool_result") {
                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="ml-8 border-l border-edge pl-3 text-[11px] text-ink-dim">
                      <span className={e.status === "success" ? "text-emerald-400" : "text-amber-400"}>
                        {e.status === "success" ? "ok · " : "⚠ · "}
                      </span>
                      {e.summary}
                    </motion.div>
                  );
                }
                if (e.kind === "error") {
                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="ml-8 flex items-start gap-1.5 border-l border-rose-400/40 pl-3 text-[11px] text-rose-300">
                      <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
                      <span>
                        {e.retry && "Retrying once… "}
                        {e.degraded && "Degraded gracefully — "}
                        {e.message}
                      </span>
                    </motion.div>
                  );
                }
                return null;
              })}
              {thinking && (
                <div className="ml-8 flex items-center gap-2 border-l border-edge pl-3 text-[11px] text-ink-faint">
                  <Loader2 className="h-3 w-3 animate-spin" /> working…
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
