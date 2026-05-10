import { motion } from "framer-motion";

const dots = [
  { top: "22%", left: "18%", delay: 0 },
  { top: "30%", left: "44%", delay: 0.3 },
  { top: "28%", left: "62%", delay: 0.1 },
  { top: "40%", left: "76%", delay: 0.5 },
  { top: "48%", left: "30%", delay: 0.2 },
  { top: "52%", left: "52%", delay: 0.4 },
  { top: "58%", left: "68%", delay: 0.15 },
];

export default function WorldMesh() {
  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-hub-violet/30 via-transparent to-hub-cyan/25">
      <div className="absolute inset-0 opacity-35">
        <svg viewBox="0 0 800 380" className="h-full w-full">
          <path
            d="M96 122c38-42 132-92 246-74 146 26 284 174 356 246M120 266c112-104 294-174 482-154M582 84c74 84 134 226 154 342"
            fill="none"
            stroke="url(#wm)"
            strokeWidth="1.2"
          />
          <defs>
            <linearGradient id="wm" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity=".8" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity=".85" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute h-3 w-3 rounded-full bg-hub-cyan shadow-[0_0_18px_rgba(6,182,212,.9)]"
          style={{ top: d.top, left: d.left }}
          animate={{ scale: [1, 1.4, 1], opacity: [0.65, 1, 0.65] }}
          transition={{ repeat: Infinity, duration: 3.8, ease: "easeInOut", delay: d.delay }}
        />
      ))}
      <div className="absolute bottom-4 left-4 rounded-xl border border-white/15 bg-hub-bg/65 px-3 py-2 text-[11px] text-slate-200 backdrop-blur-xl">
        Real-time visitation mesh · stylized corridors
      </div>
    </div>
  );
}
