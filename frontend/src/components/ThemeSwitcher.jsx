import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Palette, Sparkles } from "lucide-react";
import { THEMES } from "../theme";

export default function ThemeSwitcher({ themeId, onChange }) {
  const [open, setOpen] = useState(false);
  const current = THEMES.find((t) => t.id === themeId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl border border-edge bg-panel px-3 py-1.5 text-sm text-ink transition hover:border-glow"
        title="Switch theme"
      >
        <Palette className="h-4 w-4 text-accent" />
        <span className="hidden sm:block">{current?.name}</span>
        <span className="flex gap-1">
          {current?.swatches.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          ))}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              className="glass-strong absolute right-0 top-12 z-40 w-72 rounded-2xl p-2 shadow-2xl"
            >
              <div className="flex items-center gap-2 px-2 py-1.5 text-[11px] uppercase tracking-widest text-ink-dim">
                <Sparkles className="h-3.5 w-3.5" /> Visual Themes
              </div>
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onChange(t.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-panel ${
                    t.id === themeId ? "bg-panel" : ""
                  }`}
                >
                  <span className="mt-0.5 flex gap-1">
                    {t.swatches.map((c) => (
                      <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                    ))}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink">{t.name}</span>
                    <span className="block text-[11px] text-ink-dim">{t.blurb}</span>
                  </span>
                  {t.id === themeId && <Check className="mt-1 h-4 w-4 text-accent" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
