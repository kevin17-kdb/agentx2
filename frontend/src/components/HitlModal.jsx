import { motion } from "framer-motion";
import { CheckCircle2, FileText, MailCheck, Send, XCircle } from "lucide-react";

export default function HitlModal({ hitl, onRespond, onClose }) {
  const p = hitl.payload || {};
  const isEmail = Boolean(p.recipient);
  const isGrievance = Boolean(p.ticket_id);
  const submitted = hitl.action === "approve" || hitl.action === "reject";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        className="glass-strong shadow-glow w-full max-w-lg rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-edge px-5 py-4">
          <div className="shadow-glow flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15">
            {isEmail ? <MailCheck className="h-5 w-5 text-accent" /> : isGrievance ? <FileText className="h-5 w-5 text-accent" /> : <FileText className="h-5 w-5 text-accent" />}
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">
              Human-in-the-Loop Approval
            </div>
            <div className="text-[11px] text-ink-dim">
              {isEmail ? "Draft email ready to dispatch" : isGrievance ? "Grievance ticket ready to submit" : "Action needs your approval"}
            </div>
          </div>
        </div>

        <div className="max-h-[45vh] space-y-2 overflow-y-auto px-5 py-4 text-xs text-ink-dim">
          {isEmail && (
            <>
              <div className="grid grid-cols-[72px_1fr] gap-1">
                <span className="text-ink-faint">To</span><span className="text-ink">{p.recipient}</span>
                <span className="text-ink-faint">Subject</span><span className="text-ink">{p.subject}</span>
              </div>
              <div className="mt-2 rounded-lg border border-edge bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-ink-dim">
                {p.body}
              </div>
            </>
          )}
          {isGrievance && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[90px_1fr] gap-1">
                <span className="text-ink-faint">Ticket</span><span className="font-mono text-ink">{p.ticket_id}</span>
                <span className="text-ink-faint">Category</span><span className="text-ink">{p.category}</span>
                <span className="text-ink-faint">SLA</span><span className="text-ink">{p.expected_sla}</span>
                <span className="text-ink-faint">To</span><span className="text-ink">{p.recipient}</span>
              </div>
              <div className="mt-2 rounded-lg border border-edge bg-black/30 p-3 text-[11px] text-ink-dim">
                {p.description}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-edge px-5 py-4">
          {submitted ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              {hitl.action === "approve" ? "Approved & dispatched" : "Rejected & cancelled"}
            </div>
          ) : (
            <>
              <button
                onClick={() => onRespond("reject")}
                disabled={hitl.submitting}
                className="flex items-center gap-2 rounded-xl border border-edge px-4 py-2 text-sm text-ink-dim transition hover:border-rose-400/50 hover:text-rose-300 disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" /> Reject
              </button>
              <button
                onClick={() => onRespond("approve")}
                disabled={hitl.submitting}
                className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium disabled:opacity-50"
                style={{ color: "var(--bg-base)" }}
              >
                <Send className="h-4 w-4" /> Approve & Send
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
