import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";

export default function Message({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="shadow-glow mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
          <Bot className="h-4 w-4 text-accent" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser ? "bg-accent/15 border border-accent/25 text-ink" : "glass text-ink"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="md">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}

        <div className="mt-2 flex items-center gap-2 text-[10px] text-ink-faint">
          <span>
            {new Date(message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {message.meta?.agents && (
            <>
              <span>·</span>
              <span>{message.meta.agents} agents · {message.meta.steps} steps</span>
            </>
          )}
          {message.meta?.system && <span>· system</span>}
        </div>
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/10">
          <User className="h-4 w-4 text-ink-dim" />
        </div>
      )}
    </motion.div>
  );
}
