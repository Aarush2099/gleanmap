// Per-theme passport stamp SVG icons. Each is an original, single-colour path
// using currentColor, intended for a 32×32 viewBox.

import type { ReactNode } from "react";

export const STAMP_THEMES: string[] = [
  "Why","Footprint","Cities","Food","Water","Fashion","Waste","Oceans",
  "Climate Justice","Holiday","Forests","Outdoors","Indigenous Peoples","Body",
  "Soil","Food Waste","Wellness","Connect","Plant-Based","Fair Trade","Nature",
  "Purpose","Energy","Advocate","Commitment","Activate","Reflect","Inspire",
];

const ICONS: Record<string, ReactNode> = {
  // Why — speech bubble with "?"
  "Why": (
    <g>
      <path d="M5 7c0-1.6 1.4-3 3-3h16c1.6 0 3 1.4 3 3v12c0 1.6-1.4 3-3 3h-8l-5 4v-4H8c-1.6 0-3-1.4-3-3V7z" fill="currentColor" />
      <text x="16" y="18" fontSize="11" fontWeight="800" textAnchor="middle" fill="#fff">?</text>
    </g>
  ),
  // Footprint
  "Footprint": (
    <g fill="currentColor">
      <ellipse cx="16" cy="19" rx="6" ry="9" />
      <circle cx="9" cy="9" r="2" /><circle cx="13" cy="6" r="2" />
      <circle cx="18" cy="5.5" r="2" /><circle cx="22" cy="7" r="2" />
      <circle cx="24" cy="11" r="2" />
    </g>
  ),
  // Cities — 3 buildings
  "Cities": (
    <g fill="currentColor">
      <rect x="4" y="14" width="6" height="14" />
      <rect x="12" y="6" width="8" height="22" />
      <rect x="22" y="11" width="6" height="17" />
    </g>
  ),
  // Food — fork + leaf
  "Food": (
    <g fill="currentColor">
      <rect x="8" y="5" width="2" height="22" /><rect x="6" y="5" width="2" height="6" />
      <rect x="10" y="5" width="2" height="6" /><rect x="12" y="5" width="2" height="6" />
      <path d="M18 6c5 0 9 4 9 9 0 6-5 11-11 11 0-6 0-13 2-20z" />
    </g>
  ),
  // Water — drop
  "Water": <path d="M16 3c5 7 9 11 9 16a9 9 0 0 1-18 0c0-5 4-9 9-16z" fill="currentColor" />,
  // Fashion — clothes hanger
  "Fashion": (
    <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 9a3 3 0 1 1 3-3" />
      <path d="M16 9 4 21h24L16 9z" fill="currentColor" />
    </g>
  ),
  // Waste — recycling triangle of arrows
  "Waste": (
    <g fill="currentColor">
      <path d="M16 4l5 8h-3l-2 4-5-9 5-3zM4 24l5-8 2 3 5-2-5 9-7-2zM28 24l-9-1 1-3-4-3 9-1 3 8z" />
    </g>
  ),
  // Oceans — 3 waves
  "Oceans": (
    <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M3 10c3-3 6-3 9 0s6 3 9 0 6-3 8 0" />
      <path d="M3 18c3-3 6-3 9 0s6 3 9 0 6-3 8 0" />
      <path d="M3 26c3-3 6-3 9 0s6 3 9 0 6-3 8 0" />
    </g>
  ),
  // Climate Justice — balance scale
  "Climate Justice": (
    <g fill="currentColor">
      <rect x="15" y="6" width="2" height="20" /><rect x="11" y="26" width="10" height="2" />
      <path d="M4 10h12L10 18zM16 10h12L22 18z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </g>
  ),
  // Holiday — sun
  "Holiday": (
    <g fill="currentColor">
      <circle cx="16" cy="16" r="6" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="16" y1="3" x2="16" y2="7" /><line x1="16" y1="25" x2="16" y2="29" />
        <line x1="3" y1="16" x2="7" y2="16" /><line x1="25" y1="16" x2="29" y2="16" />
        <line x1="6" y1="6" x2="9" y2="9" /><line x1="23" y1="23" x2="26" y2="26" />
        <line x1="6" y1="26" x2="9" y2="23" /><line x1="23" y1="9" x2="26" y2="6" />
      </g>
    </g>
  ),
  // Forests — pine tree
  "Forests": (
    <g fill="currentColor">
      <path d="M16 3l-7 10h4l-5 7h5l-4 6h14l-4-6h5l-5-7h4z" />
      <rect x="14" y="26" width="4" height="4" />
    </g>
  ),
  // Outdoors — mountain with path
  "Outdoors": (
    <g fill="currentColor">
      <path d="M3 26l8-14 6 9 3-4 9 9z" />
      <path d="M11 26c2-3 4-3 6-1s4 1 6-1" fill="none" stroke="#fff" strokeWidth="1" />
    </g>
  ),
  // Indigenous Peoples — feather
  "Indigenous Peoples": (
    <g fill="currentColor">
      <path d="M22 4c-9 1-15 9-15 18l3 3 12-12c2-2 3-6 0-9z" />
      <rect x="6" y="22" width="14" height="1.5" transform="rotate(-45 13 23)" />
    </g>
  ),
  // Body — leaf-figure
  "Body": (
    <g fill="currentColor">
      <circle cx="16" cy="7" r="3" />
      <path d="M16 11c-5 0-8 4-8 9 0 7 4 12 8 12s8-5 8-12c0-5-3-9-8-9z" />
    </g>
  ),
  // Soil — seedling from ground
  "Soil": (
    <g fill="currentColor">
      <path d="M16 22V12c0-4 3-7 7-7-1 5-3 9-7 10z" />
      <path d="M16 22v-6c0-3-2-5-5-5 1 4 2 7 5 8z" />
      <rect x="3" y="23" width="26" height="6" />
    </g>
  ),
  // Food Waste — fruit with cross
  "Food Waste": (
    <g fill="currentColor">
      <circle cx="16" cy="18" r="9" />
      <path d="M16 6c1-2 3-3 4-3-1 2-2 4-4 5z" />
      <line x1="6" y1="8" x2="26" y2="28" stroke="#fff" strokeWidth="2.5" />
    </g>
  ),
  // Wellness — 3-petal lotus
  "Wellness": (
    <g fill="currentColor">
      <path d="M16 6c-3 3-3 8 0 12 3-4 3-9 0-12z" />
      <path d="M6 14c1 4 5 6 10 4-2-4-7-5-10-4z" />
      <path d="M26 14c-1 4-5 6-10 4 2-4 7-5 10-4z" />
      <rect x="14" y="18" width="4" height="8" rx="2" />
    </g>
  ),
  // Connect — two hands shaking (simplified)
  "Connect": (
    <g fill="currentColor">
      <path d="M3 14l8-4 4 4-5 5-7-2z" />
      <path d="M29 14l-8-4-4 4 5 5 7-2z" />
      <rect x="13" y="14" width="6" height="4" />
    </g>
  ),
  // Plant-Based — herb sprig
  "Plant-Based": (
    <g fill="currentColor">
      <path d="M16 4c0 5 0 18 0 24" stroke="currentColor" strokeWidth="2" fill="none" />
      <ellipse cx="11" cy="9" rx="5" ry="2" transform="rotate(-30 11 9)" />
      <ellipse cx="21" cy="13" rx="5" ry="2" transform="rotate(30 21 13)" />
      <ellipse cx="11" cy="18" rx="5" ry="2" transform="rotate(-30 11 18)" />
      <ellipse cx="21" cy="22" rx="5" ry="2" transform="rotate(30 21 22)" />
    </g>
  ),
  // Fair Trade — globe with handshake
  "Fair Trade": (
    <g fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="16" cy="16" r="12" />
      <path d="M4 16h24M16 4c4 4 4 20 0 24M16 4c-4 4-4 20 0 24" />
      <path d="M11 16l3 3 7-7" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  // Nature — butterfly
  "Nature": (
    <g fill="currentColor">
      <path d="M16 10c-3-6-12-7-13 0-1 5 6 9 13 6z" />
      <path d="M16 10c3-6 12-7 13 0 1 5-6 9-13 6z" />
      <path d="M16 10c-3 4-3 10 0 16 3-6 3-12 0-16z" />
    </g>
  ),
  // Purpose — compass rose
  "Purpose": (
    <g fill="currentColor">
      <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 4l3 12-3 4-3-4zM16 28l-3-12 3-4 3 4zM4 16l12-3 4 3-4 3zM28 16l-12 3-4-3 4-3z" />
    </g>
  ),
  // Energy — lightning bolt
  "Energy": <path d="M18 3L6 18h8l-3 11 14-17h-9l3-9z" fill="currentColor" />,
  // Advocate — megaphone
  "Advocate": (
    <g fill="currentColor">
      <path d="M4 12v8l16 6V6z" />
      <path d="M22 10c2 1 3 3 3 6s-1 5-3 6" fill="none" stroke="currentColor" strokeWidth="2" />
    </g>
  ),
  // Commitment — ribbon knot
  "Commitment": (
    <g fill="currentColor">
      <path d="M16 5c-4 0-7 3-7 6s3 5 7 5 7-2 7-5-3-6-7-6z" />
      <path d="M16 16l-6 11 4-2 2 3 2-3 4 2z" />
    </g>
  ),
  // Activate — raised fist
  "Activate": (
    <g fill="currentColor">
      <rect x="9" y="14" width="14" height="10" rx="2" />
      <rect x="11" y="9" width="3" height="6" />
      <rect x="14" y="7" width="3" height="8" />
      <rect x="17" y="9" width="3" height="6" />
      <rect x="20" y="11" width="3" height="4" />
      <rect x="12" y="24" width="8" height="5" />
    </g>
  ),
  // Reflect — half moon + star
  "Reflect": (
    <g fill="currentColor">
      <path d="M22 6a11 11 0 1 0 0 20 9 9 0 0 1 0-20z" />
      <path d="M8 7l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" />
    </g>
  ),
  // Inspire — flame
  "Inspire": (
    <path
      d="M16 3c2 5 8 7 8 14a8 8 0 0 1-16 0c0-3 2-5 4-6 0 3 2 4 3 3 0-4-1-7 1-11z"
      fill="currentColor"
    />
  ),
};

type Props = {
  theme: string;
  completed: boolean;
  isRestDay?: boolean;
  day?: number;
  className?: string;
};

export function StampIcon({ theme, completed, isRestDay = false, day, className }: Props) {
  const baseSize = "w-12 h-12 md:w-16 md:h-16";
  if (isRestDay) {
    return (
      <div
        className={`${baseSize} rounded-lg flex flex-col items-center justify-center ${className ?? ""}`}
        style={{ border: "1px solid rgba(255,255,255,0.10)" }}
        title={day ? `Day ${day}: Rest day` : "Rest day"}
        aria-label="Rest day"
      >
        <div
          className="size-3 rounded-full"
          style={{ border: "1px solid rgba(255,255,255,0.35)" }}
        />
        <span className="mt-1 text-[8px] font-mono uppercase tracking-widest text-white/40">
          Rest
        </span>
      </div>
    );
  }

  const icon = ICONS[theme] ?? ICONS["Why"];
  const completedStyle: React.CSSProperties = {
    border: "1.5px solid rgb(34,197,94)",
    background: "rgba(34,197,94,0.08)",
    boxShadow: "0 0 6px rgba(34,197,94,0.3)",
    color: "rgb(34,197,94)",
  };
  const incompleteStyle: React.CSSProperties = {
    border: "1px dashed rgba(255,255,255,0.18)",
    background: "transparent",
    filter: "grayscale(1)",
    opacity: 0.35,
    color: "rgba(255,255,255,0.55)",
  };

  return (
    <div
      className={`${baseSize} rounded-lg flex items-center justify-center ${className ?? ""}`}
      style={completed ? completedStyle : incompleteStyle}
      title={
        day != null
          ? `Day ${day}: ${theme} — ${completed ? "Submitted ✓" : "Not yet submitted"}`
          : `${theme} — ${completed ? "Submitted ✓" : "Not yet submitted"}`
      }
      aria-label={`${theme} stamp ${completed ? "completed" : "incomplete"}`}
    >
      <svg viewBox="0 0 32 32" className="w-3/5 h-3/5" aria-hidden="true">
        {icon}
      </svg>
    </div>
  );
}
