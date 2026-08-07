import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, MousePointerClick } from "lucide-react";
import Message from "./Message";
import CommandBar from "./CommandBar";

export default function ChatPanel({ messages, thinking, onSend, suggestions }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  return (
    <div className="glass flex min-w-0 flex-1 flex-col rounded-2xl overflow-hidden">
      {/* Message area */}
      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !thinking ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="shadow-glow flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15"
            >
              <MousePointerClick className="h-8 w-8 text-accent" />
            </motion.div>
            <div>
              <div className="gradient-text text-lg font-semibold">10 agents. One command.</div>
              <div className="mt-1 text-sm text-ink-dim">
                The orchestrator plans autonomously, specialized agents call tools, and a live
                reasoning trace shows you every step. Try one of these:
              </div>
            </div>
            <div className="grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSend(s)}
                  className="glass rounded-xl px-3 py-2.5 text-left text-xs text-ink-dim transition hover:border-glow hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <Message key={m.id} message={m} />
            ))}
            {thinking && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                <div className="shadow-glow flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15">
                  <Loader2 className="h-4 w-4 animate-spin text-accent" />
                </div>
                <div className="text-xs text-ink-dim">Agents are thinking…</div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Command bar */}
      <div className="px-4 pb-4">
        <CommandBar onSend={onSend} disabled={thinking} />
        <div className="mt-2 text-center text-[10px] text-ink-faint">
          Multi-agent orchestration · RAG · tool calling · memory · human-in-the-loop approvals
        </div>
      </div>
    </div>
  );
}
