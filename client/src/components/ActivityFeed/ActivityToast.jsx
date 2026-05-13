import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ACTIVITY_META } from "../../hooks/useActivityFeed.js";

const ToastContext = createContext(null);

let toastId = 0;

export function ActivityToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 300);
  }, []);

  const addToast = useCallback(
    (activity) => {
      const id = ++toastId;
      setToasts((prev) => {
        const next = [...prev, { id, activity, exiting: false }];
        if (next.length > 3) return next.slice(next.length - 3);
        return next;
      });
      window.setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ addToast, removeToast, toasts }), [addToast, removeToast, toasts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-72 flex-col gap-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      addToast: () => {},
      removeToast: () => {},
      toasts: [],
    };
  }
  return ctx;
}

function StarRow({ rating }) {
  const r = Math.min(5, Math.max(0, Number(rating) || 0));
  return (
    <div className="mt-1 flex gap-0.5 text-amber-500" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= r ? "text-amber-500" : "text-gray-200"}>
          ★
        </span>
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }) {
  const { activity, exiting } = toast;
  const meta = ACTIVITY_META.review;
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      className={`pointer-events-auto flex w-72 gap-3 rounded-xl border border-purple-100 bg-white p-3 shadow-lg shadow-purple-500/10 transition-transform duration-300 ${
        exiting || !entered ? "translate-x-full" : "translate-x-0"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm ${meta.bgColor} ${meta.color}`}
      >
        {meta.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-purple-600">New activity</p>
        <p className="mt-0.5 text-sm text-gray-800">
          <span className="font-semibold">{activity.user_name || "Someone"}</span> reviewed{" "}
          <span className="font-medium">{activity.product_name || "a product"}</span>
        </p>
        {activity.rating != null ? <StarRow rating={activity.rating} /> : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-gray-400 transition hover:text-gray-600"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
