import { createContext, useCallback, useContext, useEffect } from "react";
import { useActivityFeed } from "../../hooks/useActivityFeed.js";
import { useToast } from "./ActivityToast.jsx";

const ActivityFeedContext = createContext(null);

export function ActivityFeedRuntimeProvider({ visitedProductIds, children }) {
  const { addToast } = useToast();

  const onNewReviewActivities = useCallback(
    (revs) => {
      const set = visitedProductIds instanceof Set ? visitedProductIds : new Set(visitedProductIds || []);
      for (const r of revs) {
        if (r.product_id == null) continue;
        if (set.has(Number(r.product_id))) addToast(r);
      }
    },
    [addToast, visitedProductIds]
  );

  const feed = useActivityFeed({ onNewReviewActivities });

  return <ActivityFeedContext.Provider value={feed}>{children}</ActivityFeedContext.Provider>;
}

export function useActivityFeedContext() {
  return useContext(ActivityFeedContext);
}

/** Assigns `ref.current = addOptimisticActivity` while mounted (for parent forms outside context tree depth). */
export function ActivityFeedRegisterOptimistic({ assignRef }) {
  const ctx = useActivityFeedContext();
  const fn = ctx?.addOptimisticActivity;
  useEffect(() => {
    if (!assignRef) return;
    assignRef.current = fn || null;
    return () => {
      assignRef.current = null;
    };
  }, [assignRef, fn]);
  return null;
}
