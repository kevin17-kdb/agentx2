/**
 * Duotone campus illustration rendered in SVG, colored by the active theme's
 * duotone palette. Stands in for a photographic campus shot without requiring
 * a bundled image asset.
 */
export default function CampusScene() {
  const lo = "var(--duotone-lo)";
  const mid = "var(--duotone-mid)";
  const hi = "var(--duotone-hi)";

  return (
    <svg viewBox="0 0 800 620" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={lo} />
          <stop offset="1" stopColor={mid} />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mid} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
      </defs>

      {/* sky + sun */}
      <rect width="800" height="620" fill="url(#sky)" />
      <circle cx="620" cy="130" r="46" fill={hi} opacity="0.55" />
      <circle cx="620" cy="130" r="60" fill={hi} opacity="0.18" />

      {/* distant birds */}
      {[[180, 110], [220, 96], [260, 114], [300, 100]].map(([x, y], i) => (
        <path key={i} d={`M ${x - 9} ${y} q 5 6 9 0 q 4 6 9 0`} stroke={hi} strokeWidth="2.4" fill="none" opacity="0.7" />
      ))}

      {/* ground */}
      <path d="M0 430 Q 200 400 400 430 T 800 430 V 620 H 0 Z" fill="url(#ground)" />

      {/* quad walkway */}
      <path d="M400 620 L 348 430 L 400 392 L 452 430 Z" fill={lo} opacity="0.85" />
      <path d="M400 620 L 366 470 L 400 452 L 434 470 Z" fill={mid} opacity="0.5" />

      {/* trees left */}
      <g fill={mid}>
        <circle cx="95" cy="390" r="34" />
        <circle cx="60" cy="412" r="26" />
        <circle cx="130" cy="410" r="24" />
        <rect x="90" y="412" width="10" height="30" fill={lo} />
      </g>
      {/* trees right */}
      <g fill={mid}>
        <circle cx="705" cy="388" r="38" />
        <circle cx="745" cy="414" r="24" />
        <circle cx="668" cy="414" r="22" />
        <rect x="700" y="414" width="10" height="30" fill={lo} />
      </g>

      {/* library building */}
      <g fill={lo} stroke={hi} strokeWidth="2">
        <rect x="120" y="252" width="220" height="180" />
        <polygon points="120,252 230,196 340,252" />
      </g>
      <g fill={mid}>
        <rect x="160" y="292" width="30" height="50" />
        <rect x="205" y="292" width="30" height="50" />
        <rect x="250" y="292" width="30" height="50" />
        <rect x="150" y="360" width="160" height="6" />
      </g>
      <g stroke={hi} strokeWidth="2" opacity="0.7">
        <line x1="120" y1="252" x2="120" y2="432" />
        <line x1="230" y1="196" x2="230" y2="432" />
        <line x1="340" y1="252" x2="340" y2="432" />
      </g>

      {/* lecture hall (right) */}
      <g fill={lo} stroke={hi} strokeWidth="2">
        <rect x="540" y="292" width="170" height="140" />
        <polygon points="540,292 625,252 710,292" />
      </g>
      <g fill={mid}>
        <rect x="562" y="330" width="42" height="34" rx="3" />
        <rect x="616" y="330" width="42" height="34" rx="3" />
        <rect x="562" y="378" width="42" height="34" rx="3" />
        <rect x="616" y="378" width="42" height="34" rx="3" />
      </g>

      {/* clock tower */}
      <g stroke={hi} strokeWidth="2.5">
        <rect x="352" y="150" width="96" height="150" fill={lo} />
        <rect x="352" y="300" width="96" height="132" fill={lo} />
        <polygon points="342,300 400,266 458,300" fill={mid} />
      </g>
      <circle cx="400" cy="212" r="24" fill={mid} stroke={hi} strokeWidth="2.5" />
      <g stroke={hi} strokeWidth="2.5">
        <line x1="400" y1="212" x2="400" y2="194" />
        <line x1="400" y1="212" x2="412" y2="216" />
        <circle cx="400" cy="212" r="2.5" fill={hi} />
      </g>
      <g fill={mid}>
        <rect x="382" y="252" width="36" height="44" />
        <rect x="382" y="324" width="36" height="20" />
      </g>
      <rect x="358" y="432" width="84" height="8" fill={hi} />

      {/* lampposts along walkway */}
      {[[360, 460], [408, 470], [352, 540], [440, 528]].map(([x, y], i) => (
        <g key={i} stroke={hi} strokeWidth="2.2" fill="none" opacity="0.8">
          <line x1={x} y1={y} x2={x} y2={y - 34} />
          <path d={`M ${x - 8} ${y - 30} Q ${x} ${y - 40} ${x + 8} ${y - 30}`} />
          <line x1={x - 8} y1={y - 30} x2={x - 8} y2={y - 22} />
        </g>
      ))}

      {/* subtle sky haze */}
      <rect width="800" height="620" fill={hi} opacity="0.05" />
    </svg>
  );
}
