import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------- */
/* MFORGE charts — static bars, metric cards (no touch animations)   */
/* Theme-aware: uses design tokens from index.css (.mf-*)            */
/* ---------------------------------------------------------------- */

/** Animated count-up value (counts 0 → target on mount/target change). */
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0);
  const raf = useRef(0);

  useEffect(() => {
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round((target || 0) * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

/**
 * Static bar chart. `bars` = 0–100 heights. `colors` (optional) applies one
 * color per bar; otherwise bars use the default low-key fill with `peakIndexes`.
 * No hover transitions or touch feedback.
 */
export function BarsChart({ bars = [], colors = null, peaks = [], height = 92 }) {
  return (
    <div>
      <div className="mf-chart" style={{ height }}>
        {bars.map((h, i) => (
          <div
            key={i}
            className={"bar" + (peaks.includes(i) ? " on" : "")}
            style={{
              height: `${h}%`,
              backgroundColor: colors
                ? colors[i % colors.length]
                : undefined,
            }}
            role="presentation"
          />
        ))}
      </div>
      {bars.length > 0 && (
        <div className="mf-chart-foot" style={{ marginTop: 6 }}>
          <span>{bars.length} points</span>
          <span style={{ color: "var(--accent)" }}>peak {Math.max(...bars)}%</span>
        </div>
      )}
    </div>
  );
}

/** Compact static sparkline for list rows / cards. */
export function Sparkline({ bars = [], peaks = [], width = "100%" }) {
  const norm = bars.length ? Math.max(...bars) : 1;
  return (
    <div className="mf-chart" style={{ height: 34, gap: 3, width }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className={"bar" + (peaks.includes(i) ? " on" : "")}
          style={{ height: `${(h / norm) * 100}%`, minWidth: 4, flex: 1 }}
        />
      ))}
    </div>
  );
}

/**
 * Metric card — mirrors the Mossforge signature card. Static bars, no hover
 * interaction. `value` is shown directly (no animated count on touch).
 */
export function MetricForgeCard({
  title = "System Activity · queries / hr",
  value = 1408,
  delta = "+18.4%",
  foot = ["Cell A · Cell B · Cell C", "Δ 30D · live"],
  bars = [22, 28, 26, 32, 30, 86, 34, 88, 30, 92, 36],
  peaks = [5, 7, 9],
  colors = null,
  ranges = ["7D", "30D", "QTR"],
  onRange,
  range,
  dark = false,
}) {
  return (
    <div className={"card mf-metric-card" + (dark ? " mf-dark-panel" : "")}>
      <div className="mf-card-deco" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span className="eyebrow-label">{title}</span>
        {ranges.length > 0 && (
          <div className="mf-tabs">
            {ranges.map((r) => (
              <button
                key={r}
                className={"mf-tab" + (range === r ? " on" : "")}
                onClick={() => r !== range && onRange?.(r)}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mf-metric-row">
        <span className="mf-metric-value">{value.toLocaleString()}</span>
        <span className="mf-delta">↗ {delta}</span>
      </div>

      <BarsChart bars={bars} colors={colors} peaks={peaks} />

      <div className="mf-chart-foot" style={{ marginTop: 12 }}>
        <span>{foot[0]}</span>
        <span>{foot[1]}</span>
      </div>
    </div>
  );
}