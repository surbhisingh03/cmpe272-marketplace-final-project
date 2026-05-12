import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeAnalyticsUpdated } from "../lib/fusionhubAnalytics.js";
import {
  LS_ANALYTICS_REVIEWS,
  LS_ANALYTICS_VISITS,
  LS_LAST_VISITED,
  appendCompanySurfaceVisit,
  appendLocalReview,
  appendMarketplaceVisit,
  apiCompanySlugToJourneyCompanyId,
  countLocalReviewsForUser,
  deriveMostRecentVisitLine,
  deriveMostRecentVisitPath,
  deriveVisitedJourneyCompanyIds,
  deriveYourJourneyTopItems,
  getMarketplaceTrackingUserKey,
  journeyCompanyIdToPartnerLabel,
  marketplaceCompanyDisplayName,
  persistCurrentTrackedUser,
  readVisitsFiltered,
  resetDemoMarketplaceTracking,
  resetLocalActivityStorage,
  subscribeTrackingUpdated,
  trackingDisplayFirstName,
} from "../lib/marketplaceUserTracking.js";

export function hubDisplayFirstName(user) {
  return trackingDisplayFirstName(user);
}

export function useMarketplaceUserTracking(user, isAuthenticated) {
  const userKey = useMemo(() => (isAuthenticated ? getMarketplaceTrackingUserKey(user) : null), [
    user,
    isAuthenticated,
  ]);
  const hubFirstName = useMemo(() => hubDisplayFirstName(user), [user]);

  const [tick, setTick] = useState(0);

  const sync = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    sync();
    const off = subscribeTrackingUpdated(sync);
    const offA = subscribeAnalyticsUpdated(sync);
    const onStorage = (e) => {
      if (
        !e.key ||
        e.key === LS_ANALYTICS_VISITS ||
        e.key === LS_ANALYTICS_REVIEWS ||
        e.key === LS_LAST_VISITED
      )
        sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      off();
      offA();
      window.removeEventListener("storage", onStorage);
    };
  }, [sync]);

  useEffect(() => {
    if (!isAuthenticated || !userKey || !user) return;
    const label = hubFirstName || trackingDisplayFirstName(user) || "You";
    persistCurrentTrackedUser({ userKey, user: label });
  }, [hubFirstName, isAuthenticated, user, userKey]);

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return;
    window.__fusionhubResetLocalActivity = resetLocalActivityStorage;
    window.__fusionhubResetDemoTracking = resetDemoMarketplaceTracking;
    return () => {
      delete window.__fusionhubResetLocalActivity;
      delete window.__fusionhubResetDemoTracking;
    };
  }, []);

  const visits = useMemo(() => (userKey ? readVisitsFiltered(userKey) : []), [userKey, tick]);

  const visitedJourneyCompanyIds = useMemo(
    () => (userKey ? deriveVisitedJourneyCompanyIds(userKey) : new Set()),
    [userKey, tick],
  );

  /** Authoritative UI line from visit records only (never show stale LS from another demo profile). */
  const lastVisitedLine = useMemo(() => {
    if (!userKey) return "";
    return deriveMostRecentVisitLine(userKey);
  }, [userKey, tick]);

  const recordVisit = useCallback(
    ({ companySlug, action, itemSlug, numericItemId, itemName, path }) => {
      if (!isAuthenticated || !user) return;
      appendMarketplaceVisit({
        user,
        hubFirstName,
        companySlug,
        action,
        itemSlug,
        numericItemId,
        itemName,
        path,
      });
      sync();
    },
    [hubFirstName, isAuthenticated, sync, user],
  );

  const recordCompanySurface = useCallback(
    ({ journeyCompanyId, companyName, action, path }) => {
      if (!isAuthenticated || !user) return;
      appendCompanySurfaceVisit({
        user,
        hubFirstName,
        companyId: journeyCompanyId,
        companyName,
        action,
        path,
      });
      sync();
    },
    [hubFirstName, isAuthenticated, sync, user],
  );

  const recordReview = useCallback(
    ({ rating, productId, productSlug, companySlug, itemName, comment }) => {
      if (!isAuthenticated || !userKey || !user) return;
      const companyId = apiCompanySlugToJourneyCompanyId(companySlug);
      appendLocalReview({
        userKey,
        user: hubFirstName || trackingDisplayFirstName(user) || "You",
        productId,
        productSlug: productSlug || null,
        companyId,
        companyName: companyId ? journeyCompanyIdToPartnerLabel(companyId) : marketplaceCompanyDisplayName(companySlug),
        rating,
        itemName: itemName || "Listing",
        comment: typeof comment === "string" ? comment : "",
      });
      sync();
    },
    [hubFirstName, isAuthenticated, sync, user, userKey],
  );

  const reviewCountSelf = useMemo(() => (userKey ? countLocalReviewsForUser(userKey) : 0), [userKey, tick]);

  const yourJourneyItems = useMemo(
    () => (userKey ? deriveYourJourneyTopItems(userKey, 5) : []),
    [userKey, tick],
  );

  const lastVisitPath = useMemo(() => (userKey ? deriveMostRecentVisitPath(userKey) : null), [userKey, tick]);

  return {
    trackingUserKey: userKey,
    hubFirstName,
    visits,
    visitedJourneyCompanyIds,
    lastVisitedLine,
    lastVisitPath,
    recordVisit,
    recordCompanySurface,
    recordReview,
    reviewCountSelf,
    yourJourneyItems,
    resetLocalActivity: () => {
      resetLocalActivityStorage();
      sync();
    },
    resetDemo: () => {
      resetDemoMarketplaceTracking();
      sync();
    },
    reload: sync,
  };
}
