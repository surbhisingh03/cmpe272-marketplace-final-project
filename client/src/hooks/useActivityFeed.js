import { useState, useEffect, useRef, useCallback } from "react";
import { apiPath } from "../lib/api.js";

const POLL_INTERVAL = 5000;

function activityFeedBaseUrl() {
  const custom = import.meta.env.VITE_ACTIVITY_FEED_URL;
  if (custom && String(custom).trim()) return String(custom).replace(/\/$/, "");
  return apiPath("/api/marketplace/activity-feed");
}

export const COMPANY_COLORS = {
  "nexus-academy": {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
    border: "border-purple-200",
  },
  "travel-agency": {
    bg: "bg-teal-100",
    text: "text-teal-700",
    dot: "bg-teal-500",
    border: "border-teal-200",
  },
  kavya: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  "srikavya-enterprise": {
    bg: "bg-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  krativerse: {
    bg: "bg-pink-100",
    text: "text-pink-700",
    dot: "bg-pink-500",
    border: "border-pink-200",
  },
};

export const ACTIVITY_META = {
  review: {
    icon: "⭐",
    label: (item) => `reviewed ${item.product_name || "a listing"}`,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  visit: {
    icon: "👁",
    label: (item) => `visited ${item.product_name || "a listing"}`,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  signup: {
    icon: "🎉",
    label: () => "joined the marketplace",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
};

/**
 * @param {object} [opts]
 * @param {number} [opts.limit]
 * @param {boolean} [opts.autoStart]
 * @param {boolean} [opts.isPausedExternal]
 * @param {(reviews: object[]) => void} [opts.onNewReviewActivities]
 */
export function useActivityFeed({
  limit = 20,
  autoStart = true,
  isPausedExternal = false,
  onNewReviewActivities,
} = {}) {
  const [activities, setActivities] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newCount, setNewCount] = useState(0);
  const [error, setError] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [highlightKeys, setHighlightKeys] = useState([]);

  const lastTimestampRef = useRef(0);
  const intervalRef = useRef(null);
  const onNewReviewActivitiesRef = useRef(onNewReviewActivities);
  onNewReviewActivitiesRef.current = onNewReviewActivities;

  const paused = isPaused || isPausedExternal;

  const addHighlightKeys = useCallback((keys) => {
    if (!keys.length) return;
    setHighlightKeys((prev) => [...new Set([...prev, ...keys])]);
    window.setTimeout(() => {
      setHighlightKeys((prev) => prev.filter((k) => !keys.includes(k)));
    }, 3000);
  }, []);

  const fetchActivities = useCallback(
    async (isInitial = false) => {
      if (paused) return;
      const base = activityFeedBaseUrl();
      try {
        const since = isInitial ? 0 : lastTimestampRef.current;
        const res = await fetch(`${base}?limit=${limit}&since=${since}&t=${Date.now()}`, {
          credentials: "omit",
        });
        if (!res.ok) throw new Error("Feed unavailable");

        const data = await res.json();
        setIsConnected(true);
        setError(null);

        const list = Array.isArray(data.activities) ? data.activities : [];
        if (!list.length) {
          if (isInitial) setIsLoading(false);
          return;
        }

        if (isInitial) {
          setActivities(list);
          lastTimestampRef.current = Math.max(...list.map((a) => Number(a.timestamp) || 0));
          setIsLoading(false);
          return;
        }

        const lastTs = lastTimestampRef.current;
        const newItems = list.filter((a) => Number(a.timestamp) > lastTs);
        if (!newItems.length) return;

        const keys = newItems.map((item) => `${item.type}-${item.id}`);
        addHighlightKeys(keys);

        const maxTs = Math.max(...newItems.map((a) => Number(a.timestamp) || 0));
        lastTimestampRef.current = maxTs;
        setNewCount((prev) => prev + newItems.length);

        const reviewsOnly = newItems.filter((a) => a.type === "review");
        if (reviewsOnly.length) onNewReviewActivitiesRef.current?.(reviewsOnly);

        setActivities((prev) => {
          const combined = [...newItems, ...prev];
          return combined.slice(0, 50);
        });
      } catch (err) {
        setIsConnected(false);
        setError(err?.message || "Feed unavailable");
        if (isInitial) setIsLoading(false);
      }
    },
    [paused, limit, addHighlightKeys]
  );

  const addOptimisticActivity = useCallback((item) => {
    const row = {
      type: "review",
      id: item.id ?? `optimistic-${Date.now()}`,
      user_name: item.user_name,
      product_name: item.product_name,
      company_name: item.company_name,
      company_slug: item.company_slug ?? null,
      rating: item.rating,
      review_text: item.review_text ?? "",
      timestamp: item.timestamp ?? Math.floor(Date.now() / 1000),
      product_id: item.product_id ?? null,
    };
    setActivities((prev) => [row, ...prev].slice(0, 50));
    const ts = Number(row.timestamp) || 0;
    if (ts > lastTimestampRef.current) lastTimestampRef.current = ts;
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    fetchActivities(true);
    intervalRef.current = window.setInterval(() => fetchActivities(false), POLL_INTERVAL);
  }, [fetchActivities]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const pause = useCallback(() => setIsPaused(true), []);
  const resume = useCallback(() => {
    setIsPaused(false);
    setNewCount(0);
  }, []);

  const markAllRead = useCallback(() => setNewCount(0), []);

  useEffect(() => {
    if (autoStart) startPolling();
    return () => stopPolling();
  }, [autoStart, startPolling, stopPolling]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        stopPolling();
        setIsConnected(false);
      } else {
        startPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [startPolling, stopPolling]);

  return {
    activities,
    isConnected,
    isLoading,
    isPaused: paused,
    newCount,
    error,
    highlightKeys,
    pause,
    resume,
    markAllRead,
    refetch: () => fetchActivities(false),
    addOptimisticActivity,
  };
}
