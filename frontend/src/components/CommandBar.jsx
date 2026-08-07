import { motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";

export default function CommandBar({ onSend, disabled }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input");
    const value = input?.value.trim();
    if (value) {
      onSend(value);
      if (input) input.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-1.5 focus-within:border-glow">
      <div className="flex items-center gap-2 px-3">
        <Sparkles className="h-4 w-4 shrink-0 text-accent" />
        <input
          placeholder="Ask your campus agents anything…"
          className="flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={disabled}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent transition hover:opacity-85 disabled:opacity-40"
          title="Send"
        >
          <ArrowUp className="h-4 w-4" style={{ color: "var(--bg-base)" }} />
        </button>
      </div>
    </form>
  );
}
