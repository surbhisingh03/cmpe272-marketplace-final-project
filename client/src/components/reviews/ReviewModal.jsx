import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiStar, FiX } from "react-icons/fi";
import { apiFetch } from "../../lib/api.js";

export default function ReviewModal({ open, onClose, productId, productName, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await apiFetch(`/api/reviews/products/${productId}`, {
        method: "POST",
        body: JSON.stringify({ title, body, rating, recommend }),
      });
      onSubmitted?.({ rating, title: title.trim(), body: body.trim() });
      onClose?.();
      setTitle("");
      setBody("");
      setRating(5);
      setRecommend(true);
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
            <h3 className="mt-2 font-display text-xl font-semibold text-white">
              Share your signal
            </h3>
            <p className="mt-1 text-sm text-slate-400">{productName}</p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <div className="text-xs text-slate-400">Rating</div>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className="rounded-lg border border-white/10 bg-white/5 p-2 text-amber-300 hover:bg-white/10"
                    >
                      <FiStar className={n <= rating ? "fill-current" : "opacity-40"} />
                    </button>
                  ))}
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
                  required
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none ring-2 ring-transparent focus:ring-hub-violet/35"
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
                disabled={busy}
                className="w-full rounded-2xl bg-gradient-to-r from-hub-violet to-hub-cyan py-3 text-sm font-semibold text-white shadow-glowSm disabled:opacity-50"
              >
                {busy ? "Submitting…" : "Publish review"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
