import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";
import { apiFetch } from "../../lib/api.js";

const RATING_LABELS = ["", "Terrible", "Poor", "OK", "Good", "Excellent"];

function burstConfetti() {
  if (typeof document === "undefined") return;
  const colors = ["#f472b6", "#a78bfa", "#60a5fa", "#34d399", "#fbbf24", "#f87171", "#c084fc"];
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight * 0.38;
  const pieces = [];
  for (let i = 0; i < 30; i += 1) {
    const el = document.createElement("div");
    const bg = colors[i % colors.length];
    el.style.cssText = `position:fixed;left:${originX}px;top:${originY}px;width:7px;height:7px;border-radius:2px;background:${bg};pointer-events:none;z-index:9999;opacity:1;`;
    document.body.appendChild(el);
    pieces.push({
      el,
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() * -14) - 4,
      rot: (Math.random() - 0.5) * 0.25,
    });
  }
  const start = performance.now();
  const duration = 2000;
  const gravity = 0.35;
  let raf = 0;
  const tick = (now) => {
    const t = (now - start) / duration;
    const fade = Math.max(0, 1 - t);
    for (const p of pieces) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.el.style.left = `${p.x}px`;
      p.el.style.top = `${p.y}px`;
      p.el.style.transform = `rotate(${p.rot * (now - start)}deg)`;
      p.el.style.opacity = String(fade);
    }
    if (now - start < duration) {
      raf = requestAnimationFrame(tick);
    } else {
      for (const p of pieces) p.el.remove();
    }
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export default function ReviewModal({ open, onClose, productId, productName, onSubmitted }) {
  const [rating, setRating] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [popTick, setPopTick] = useState(0);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    setRating(null);
    setHoverIdx(null);
    setTitle("");
    setBody("");
    setRecommend(true);
    setError("");
    setBusy(false);
    setPopTick(0);
    const ta = bodyRef.current;
    if (ta) {
      ta.style.height = "auto";
    }
  }, [open]);

  const displayIdx = hoverIdx ?? rating ?? 0;
  const labelText = displayIdx >= 1 && displayIdx <= 5 ? RATING_LABELS[displayIdx] : "";

  const resizeBody = useCallback((el) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (rating == null) return;
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/reviews/products/${productId}`, {
        method: "POST",
        body: JSON.stringify({ title, body, rating, recommend }),
      });
      burstConfetti();
      onSubmitted?.({ rating, title: title.trim(), body: body.trim() });
      onClose?.();
    } catch (err) {
      setError(err.payload?.error || err.message || "Could not submit");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/15 bg-hub-surface/90 p-6 shadow-glow backdrop-blur-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 hover:bg-white/10"
            >
              <FiX />
            </button>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Verified review</div>
            <h3 className="mt-2 font-display text-xl font-semibold text-white">Share your signal</h3>
            <p className="mt-1 text-sm text-slate-400">{productName}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <div className="text-xs text-slate-400">Rating</div>
                <div
                  className="mt-2 flex select-none gap-1"
                  onMouseLeave={() => setHoverIdx(null)}
                  role="group"
                  aria-label="Star rating"
                >
                  {[1, 2, 3, 4, 5].map((n) => {
                    const upTo = hoverIdx ?? rating ?? 0;
                    const isLit = upTo >= n;
                    const hoverBand = hoverIdx != null && n <= hoverIdx;
                    return (
                      <motion.button
                        key={n}
                        type="button"
                        animate={
                          popTick > 0 && rating != null && n <= rating
                            ? { scale: [1.5, 1] }
                            : { scale: hoverBand ? 1.1 : 1 }
                        }
                        transition={{ type: "spring", stiffness: 520, damping: 22 }}
                        onMouseEnter={() => setHoverIdx(n)}
                        onClick={() => {
                          setRating(n);
                          setPopTick((t) => t + 1);
                        }}
                        className={`rounded-lg p-1 text-4xl leading-none transition ${
                          isLit ? "text-amber-400" : "text-gray-300"
                        }`}
                        style={
                          isLit
                            ? {
                                filter: "drop-shadow(0 0 6px #f59e0b)",
                              }
                            : undefined
                        }
                        aria-label={`${n} stars`}
                      >
                        ★
                      </motion.button>
                    );
                  })}
                </div>
                <div className="relative mt-2 min-h-[1.25rem]">
                  <motion.p
                    key={labelText || "empty"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: labelText ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-center text-sm font-medium text-amber-200/90"
                  >
                    {labelText}
                  </motion.p>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Title</label>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent focus:ring-hub-violet/35"
                  placeholder="Immaculate onboarding"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Review</label>
                <textarea
                  ref={bodyRef}
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => {
                    setBody(e.target.value);
                    resizeBody(e.target);
                  }}
                  onInput={(e) => resizeBody(e.target)}
                  className="mt-1 min-h-[6rem] w-full resize-none overflow-hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent focus:ring-hub-violet/35"
                  placeholder="What stood out?"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-transparent"
                />
                Recommend this service
              </label>
              {error && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={busy || rating == null}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold text-white shadow-glowSm transition disabled:cursor-not-allowed disabled:bg-slate-600 disabled:bg-none disabled:text-slate-300 disabled:opacity-70 ${
                  rating != null && !busy
                    ? "bg-gradient-to-r from-hub-violet to-hub-cyan"
                    : "bg-slate-600"
                }`}
              >
                {busy ? (
                  <>
                    <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" aria-hidden>
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-80"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Submitting…
                  </>
                ) : (
                  "Publish review"
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
