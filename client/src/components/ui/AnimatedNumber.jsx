import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

function fmt(n, decimals) {
  if (decimals === 0) return Math.round(n).toLocaleString();
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export default function AnimatedNumber({ value = 0, decimals = 0, durationMs = 1400 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-24px" });
  const [v, setV] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const target = Number(value) || 0;
    const start = performance.now();
    let raf;
    const ease = (p) => 1 - Math.pow(1 - p, 3);
    const tick = (t) => {
      const p = Math.min(1, (t - start) / durationMs);
      setV(target * ease(p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, durationMs]);

  return (
    <span ref={ref} className="tabular-nums">
      {fmt(v, decimals)}
    </span>
  );
}
