import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiArrowRight,
  FiChevronRight,
  FiCheck,
  FiEdit3,
  FiExternalLink,
  FiEye,
  FiSearch,
  FiStar,
  FiX,
} from "react-icons/fi";
import { LuCoffee, LuGraduationCap, LuPlane, LuSparkles } from "react-icons/lu";
import LeaderboardListRow from "../components/marketplace/LeaderboardListRow.jsx";
import MarketingFooter from "../components/layout/MarketingFooter.jsx";
import MarketingNav from "../components/layout/MarketingNav.jsx";
import { apiFetch } from "../lib/api.js";
import { categoryRibbonLabel, displayCompanyName, marketplaceListingPath, pillarKeyFromCategory } from "../lib/marketplaceDisplay.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  apiCompanySlugToJourneyCompanyId,
  deriveMostRecentVisitRow,
  journeyCompanyIdToApiSlug,
  journeyCompanyIdToPartnerLabel,
  partnerOriginalWebsiteUrl,
  partnerStorefrontPath,
} from "../lib/marketplaceUserTracking.js";
import { useMarketplaceUserTracking } from "../hooks/useMarketplaceUserTracking.js";
import {
  compareListingsByPopularityDesc,
  getCompanyAnalytics,
  getProductAnalytics,
  getProductReviewDetail,
  readAnalyticsReviews,
  subscribeAnalyticsUpdated,
} from "../lib/fusionhubAnalytics.js";
import { calculateEngagementScore } from "../lib/engagementScore.js";

function formatReviewWhen(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

function hubMarketplaceFirstName(user) {
  if (!user) return "";
  const raw = user.displayName?.trim();
  if (raw) return raw.split(/\s+/)[0] || raw;
  const local = user.email?.split("@")[0]?.trim();
  return local ? local.charAt(0).toUpperCase() + local.slice(1).toLowerCase() : "";
}

function userActivityInitials(user) {
  if (!user) return "?";
  const raw = (user.displayName || user.name || "").trim();
  if (raw) {
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[0][0]}`.toUpperCase();
  }
  const email = user.email?.split("@")[0] || "?";
  return email.slice(0, 2).toUpperCase();
}

function activityDayStartMs(iso) {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function activityDayLabel(iso) {
  const sod = activityDayStartMs(iso);
  const today = activityDayStartMs(new Date());
  if (sod === today) return "Today";
  if (sod === today - 86400000) return "Yesterday";
  const d = new Date(iso);
  const y = new Date().getFullYear();
  if (d.getFullYear() === y) return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Group sorted visits so each calendar day gets one header + items */
function groupJourneyItemsByDay(rows) {
  const groups = [];
  let lastKey = null;
  for (const v of rows) {
    const key = String(activityDayStartMs(v.timestamp));
    const label = activityDayLabel(v.timestamp);
    if (key !== lastKey) {
      groups.push({ key, label, items: [] });
      lastKey = key;
    }
    groups[groups.length - 1].items.push(v);
  }
  return groups;
}

const ACTIVITY_COMPANY_FILTERS = [
  { slug: "all", label: "All" },
  { slug: "nexus-academy", label: "Nexus Academy" },
  { slug: "travel-agency", label: "Travel Agency" },
  { slug: "srikavya-enterprise", label: "Kavya's Co." },
  { slug: "krativerse", label: "Krativerse" },
];

const ACTIVITY_COMPANY_SWATCH = {
  "nexus-academy": "#7c3aed",
  "travel-agency": "#0891b2",
  "srikavya-enterprise": "#d97706",
  krativerse: "#db2777",
};

const SHELL = "mx-auto w-full max-w-[1320px] px-8";

const PARTNERS = [
  {
    slug: "srikavya-enterprise",
    name: "Bean & Brew Co.",
    category: "Coffee",
    pillarKey: "coffee",
    icon: LuCoffee,
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1000&auto=format&fit=crop",
  },
  {
    slug: "krativerse",
    name: "Krativerse",
    category: "Creative Services",
    pillarKey: "creative",
    icon: LuSparkles,
    image:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1000&q=85",
  },
  {
    slug: "travel-agency",
    name: "Seaside Travels",
    category: "Travel",
    pillarKey: "travel",
    icon: LuPlane,
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop",
  },
  {
    slug: "nexus-academy",
    name: "Nexus Academy",
    category: "Education",
    pillarKey: "education",
    icon: LuGraduationCap,
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1000&auto=format&fit=crop",
  },
];

const CATEGORY_CHIPS = [
  { key: "all", label: "All" },
  { key: "coffee", label: "Coffee" },
  { key: "creative", label: "Creative Services" },
  { key: "travel", label: "Travel" },
  { key: "education", label: "Education" },
];

const COMPANY_CHIPS = [
  { slug: "all", label: "All Companies" },
  { slug: "srikavya-enterprise", label: "Bean & Brew Co." },
  { slug: "krativerse", label: "Krativerse" },
  { slug: "travel-agency", label: "Seaside Travels" },
  { slug: "nexus-academy", label: "Nexus Academy" },
];

const SORT_OPTIONS = [
  { key: "popular", label: "Most Popular" },
  { key: "rated", label: "Highest Rated" },
  { key: "reviewed", label: "Most Reviewed" },
  { key: "newest", label: "Newest" },
];

/** Matches catalog seed slugs → UI labels requested for storefront-style discovery picks */
const FEATURED_SPECS = [
  { slug: "morning-sunrise-blend" },
  { slug: "ethiopian-yirgacheffe" },
  { slug: "growth-package-hero-social", displayName: "Video Production Package" },
  { slug: "photography-brand-editorial", displayName: "Photography Session" },
  { slug: "luxury-cruise-journey", displayName: "Luxury Travel Planning" },
  { slug: "honeymoon-escape-package", displayName: "Honeymoon Package" },
  { slug: "introduction-to-computer-science", displayName: "Python Programming Course" },
  { slug: "web-development-design", displayName: "Web Development Bootcamp" },
];

const PARTNER_CARD_ACCENTS = {
  "srikavya-enterprise": {
    tint: "from-amber-500/92 via-orange-950/92 to-[#3d2414]/96",
    iconWrap: "bg-amber-100 text-amber-950 ring-2 ring-amber-300/70",
    statPill: "bg-white/20 text-white ring-white/35 backdrop-blur-sm",
    ring: "hover:ring-2 hover:ring-amber-400/80",
    ctaGlow: "shadow-[0_20px_50px_-22px_rgba(180,83,9,0.55)]",
  },
  krativerse: {
    tint: "from-violet-600/92 via-purple-950/94 to-[#2e1068]/96",
    iconWrap: "bg-violet-100 text-violet-950 ring-2 ring-violet-300/80",
    statPill: "bg-white/20 text-white ring-white/35 backdrop-blur-sm",
    ring: "hover:ring-2 hover:ring-violet-400/80",
    ctaGlow: "shadow-[0_20px_50px_-22px_rgba(124,58,237,0.5)]",
  },
  "travel-agency": {
    tint: "from-sky-500/92 via-cyan-800/93 to-[#0e4f6b]/96",
    iconWrap: "bg-sky-100 text-sky-950 ring-2 ring-sky-300/75",
    statPill: "bg-white/20 text-white ring-white/35 backdrop-blur-sm",
    ring: "hover:ring-2 hover:ring-sky-400/80",
    ctaGlow: "shadow-[0_20px_50px_-22px_rgba(14,165,233,0.45)]",
  },
  "nexus-academy": {
    tint: "from-emerald-500/90 via-teal-900/93 to-[#064e3b]/96",
    iconWrap: "bg-emerald-100 text-emerald-950 ring-2 ring-emerald-300/75",
    statPill: "bg-white/20 text-white ring-white/35 backdrop-blur-sm",
    ring: "hover:ring-2 hover:ring-emerald-400/80",
    ctaGlow: "shadow-[0_20px_50px_-22px_rgba(16,185,129,0.48)]",
  },
};

const PARTNER_WEBSITE_FALLBACK = {
  "srikavya-enterprise": "https://srikavyagelli.com/index.php",
  krativerse: "https://krativerse.com/",
  "travel-agency": "https://surbhisingh.com/travel-agency/index.php",
  "nexus-academy": "http://geeshitha.com/nexus-academy/",
};

const HUB_JOURNEY_VISITED_STYLES = {
  "srikavya-enterprise": "bg-amber-50 text-amber-950 ring-2 ring-amber-400/75 shadow-sm",
  krativerse: "bg-violet-50 text-violet-950 ring-2 ring-violet-400/75 shadow-sm",
  "travel-agency": "bg-sky-50 text-sky-950 ring-2 ring-sky-400/75 shadow-sm",
  "nexus-academy": "bg-emerald-50 text-emerald-950 ring-2 ring-emerald-400/75 shadow-sm",
};

// Listing analytics use localStorage (fusionhub_visits / fusionhub_reviews); see itemsLive in ExploreMarketplace.

function sortList(list, key) {
  const out = [...list];
  out.sort((a, b) => {
    switch (key) {
      case "rated":
        return Number(b.avgRating ?? 0) - Number(a.avgRating ?? 0);
      case "reviewed":
        return Number(b.reviewCount ?? 0) - Number(a.reviewCount ?? 0);
      case "newest":
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      case "popular":
      default:
        return compareListingsByPopularityDesc(a, b);
    }
  });
  return out;
}

function Media({ src, className }) {
  const [err, setErr] = useState(false);
  if (err || !src) return <div className={`bg-slate-200 ${className}`} />;
  return <img src={src} alt="" className={className} loading="lazy" onError={() => setErr(true)} />;
}

function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-0.5" role="group" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`rounded p-0.5 ${n <= value ? "text-amber-500" : "text-slate-300 hover:text-slate-400"}`}
        >
          <FiStar className={`h-6 w-6 ${n <= value ? "fill-current" : ""}`} aria-hidden />
        </button>
      ))}
    </div>
  );
}

function resolveSlug(items, slug) {
  return items.find((it) => it.slug === slug) || null;
}

function mergeHubListing(itemsLive, slug, displayTitle) {
  const live = resolveSlug(itemsLive, slug);
  if (!live) return null;
  return {
    ...live,
    name: displayTitle ?? live.name,
  };
}

function partnerCompanyTopListings(itemsLive, companySlug) {
  const sub = itemsLive.filter((i) => i.companySlug === companySlug);
  return [...sub].sort(compareListingsByPopularityDesc).slice(0, 5);
}

/** Shared hover polish for primary CTAs on the hub */
const HUB_GRADIENT_HOVER =
  "transition duration-300 hover:brightness-[1.045] hover:shadow-[0_10px_32px_-8px_rgba(124,58,237,0.38),0_6px_20px_-10px_rgba(6,182,212,0.22)] active:brightness-[1.02]";

function MarketplaceListingCard({
  listing,
  onOpenDetails,
  onWriteReview,
  compactCaption = false,
}) {
  const company = displayCompanyName(listing.companySlug);
  const badge = categoryRibbonLabel(listing.category);
  const avg = Number(listing.avgRating ?? 0);

  return (
    <article className="group flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-md transition duration-300 ease-out hover:z-[1] hover:-translate-y-1 hover:border-violet-200/80 hover:shadow-xl hover:shadow-slate-200/60">
      <div className="relative shrink-0">
        <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <Media src={listing.heroImage} className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.06]" />
        </div>
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 shadow-sm ring-1 ring-slate-200/80">
          {badge}
        </span>
      </div>
      <div className={`flex min-h-0 flex-1 flex-col px-4 ${compactCaption ? "pb-3 pt-2.5" : "pb-4 pt-3"}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{company}</p>
        <h3 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug text-slate-900">{listing.name}</h3>
        <p className={`mt-1.5 flex-1 text-sm text-slate-600 ${compactCaption ? "line-clamp-1" : "line-clamp-2 min-h-[2.5rem]"}`}>
          {listing.excerpt || "Featured listing"}
        </p>
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-0.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <span className="font-semibold text-amber-600">{avg > 0 ? `${avg.toFixed(1)}★` : "No rating yet"}</span>
          <span>{Number(listing.reviewCount ?? 0)} reviews</span>
          <span>{Number(listing.visitCount ?? 0).toLocaleString()} visits</span>
        </div>
        <div className="mt-3 mt-auto space-y-1.5">
          <button
            type="button"
            onClick={() => onOpenDetails(listing)}
            className={`flex min-h-[44px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-bold text-white shadow-sm ${HUB_GRADIENT_HOVER}`}
          >
            View Details
          </button>
          <button type="button" onClick={() => onWriteReview(listing)} className="w-full pb-1 text-center text-sm font-semibold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-900">
            Write Review
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ExploreMarketplace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const allMode = searchParams.get("all") === "1";
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const hubFirstName = useMemo(() => hubMarketplaceFirstName(user), [user]);
  /** Signed-in UX while token hydrates avoids flashing guest CTAs (Create Account / Sign In). */
  const showLoggedInHub = isAuthenticated || authLoading;

  const {
    visits,
    visitedJourneyCompanyIds,
    lastVisitedLine,
    lastVisitPath,
    recordVisit,
    recordCompanySurface,
    recordReview,
    reviewCountSelf,
    yourJourneyItems,
    resetLocalActivity,
    trackingUserKey,
  } = useMarketplaceUserTracking(user, isAuthenticated);

  const scrollToPartnerCompanies = useCallback(() => {
    document.getElementById("partner-marketplace")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [co, setCo] = useState("all");
  const [activityCompanyFilter, setActivityCompanyFilter] = useState("all");
  const [sort, setSort] = useState("popular");

  const [drawerId, setDrawerId] = useState(null);
  const [drawerLoad, setDrawerLoad] = useState(false);
  const [product, setProduct] = useState(null);
  const [ratingAgg, setRatingAgg] = useState({ average: 0, count: 0 });
  const [dist, setDist] = useState(null);

  const [stars, setStars] = useState(0);
  const [titleIn, setTitleIn] = useState("");
  const [bodyIn, setBodyIn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [analyticsTick, setAnalyticsTick] = useState(0);

  useEffect(() => {
    const off = subscribeAnalyticsUpdated(() => setAnalyticsTick((t) => t + 1));
    return off;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/marketplace/catalog");
      const list = res?.items;
      setItems(Array.isArray(list) ? list : []);
    } catch {
      setError("Couldn’t load catalog.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const itemsLive = useMemo(() => {
    void analyticsTick;
    return items.map((it) => {
      const a = getProductAnalytics(it.id);
      const visitCount = a.visits;
      const reviewCount = a.reviewCount;
      const avgRating = reviewCount > 0 ? a.avgRating : 0;
      return {
        ...it,
        visitCount,
        reviewCount,
        avgRating,
        popularityScore: calculateEngagementScore({
          visitCount,
          reviewCount,
          averageRating: avgRating,
        }),
      };
    });
  }, [items, analyticsTick]);

  const stats = useMemo(() => {
    if (!itemsLive.length) {
      return [
        { v: "—", l: "Products & Services" },
        { v: "4", l: "Partner Companies" },
        { v: "0", l: "Reviews" },
        { v: "0", l: "Visits" },
      ];
    }
    const rev = itemsLive.reduce((a, x) => a + Number(x.reviewCount || 0), 0);
    const vis = itemsLive.reduce((a, x) => a + Number(x.visitCount || 0), 0);
    return [
      { v: itemsLive.length.toLocaleString(), l: "Products & Services" },
      { v: "4", l: "Partner Companies" },
      { v: rev.toLocaleString(), l: "Reviews" },
      { v: vis.toLocaleString(), l: "Visits" },
    ];
  }, [itemsLive]);

  const partnerPresentation = useMemo(() => {
    void analyticsTick;
    const out = {};
    for (const p of PARTNERS) {
      const sub = items.filter((i) => i.companySlug === p.slug);
      const jid = apiCompanySlugToJourneyCompanyId(p.slug);
      const ca = getCompanyAnalytics(jid);
      out[p.slug] = {
        listings: sub.length,
        visits: ca.totalVisits,
        reviewCount: ca.reviewCount,
        avgRating: ca.reviewCount > 0 ? ca.avgRating : null,
        websiteUrl: sub[0]?.companyUrl || PARTNER_WEBSITE_FALLBACK[p.slug],
      };
    }
    return out;
  }, [items, analyticsTick]);

  const hubFeaturedMerged = useMemo(
    () => FEATURED_SPECS.map((s) => mergeHubListing(itemsLive, s.slug, s.displayName)).filter(Boolean),
    [itemsLive],
  );

  const hubTopFiveMerged = useMemo(() => {
    const sorted = [...itemsLive].sort(compareListingsByPopularityDesc);
    return sorted.slice(0, 5).map((row, i) => ({
      rank: i + 1,
      slug: row.slug,
      id: row.id,
      companySlug: row.companySlug,
      title: row.name,
      companyLabel: displayCompanyName(row.companySlug),
      heroImage: row.heroImage,
      category: row.category,
      ratingDisplay: row.reviewCount > 0 ? row.avgRating : 0,
      reviewsDisplay: row.reviewCount,
      visitsDisplay: row.visitCount,
      popularityScore: row.popularityScore ?? 0,
      listingTo:
        row.slug != null ? marketplaceListingPath(row.slug) : `/marketplace/products/${row.id}`,
    }));
  }, [itemsLive]);

  const latestReviewsFeed = useMemo(() => {
    void analyticsTick;
    return [...readAnalyticsReviews()]
      .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
      .slice(0, 8);
  }, [analyticsTick]);

  const filtered = useMemo(() => {
    let list = [...itemsLive];
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter((it) => {
        const blob = `${it.name} ${it.excerpt} ${displayCompanyName(it.companySlug)}`.toLowerCase();
        return blob.includes(s);
      });
    }
    if (cat !== "all") list = list.filter((it) => pillarKeyFromCategory(it.category) === cat);
    if (co !== "all") list = list.filter((it) => it.companySlug === co);
    return sortList(list, sort);
  }, [itemsLive, q, cat, co, sort]);

  const filterKey = searchParams.toString();
  useEffect(() => {
    if (!allMode) return;
    setQ(searchParams.get("q") ?? "");
    setCat(searchParams.get("cat") || "all");
    setCo(searchParams.get("co") || "all");
    setSort(searchParams.get("sort") || "popular");
  }, [allMode, filterKey]);

  const goViewAll = useCallback(() => navigate("/marketplace/explore?all=1"), [navigate]);

  const closeDrawer = useCallback(() => setDrawerId(null), []);

  const openListingOrStorefront = useCallback(
    (listing) => {
      const coSlug = listing?.companySlug;
      if (listing?.slug) {
        navigate(marketplaceListingPath(listing.slug));
      } else if (listing?.id) {
        navigate(`/marketplace/products/${listing.id}`);
      } else if (coSlug) {
        const jId = apiCompanySlugToJourneyCompanyId(coSlug);
        const to = jId ? partnerStorefrontPath(jId) : `/marketplace/companies/${coSlug}`;
        navigate(to);
      }
    },
    [navigate],
  );

  const continueJourneyHref = useMemo(() => lastVisitPath || "/marketplace/explore", [lastVisitPath]);

  const filteredJourneyActivity = useMemo(() => {
    const sorted = [...yourJourneyItems].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));
    if (activityCompanyFilter === "all") return sorted;
    const jid = apiCompanySlugToJourneyCompanyId(activityCompanyFilter);
    if (jid == null) return sorted;
    return sorted.filter((v) => String(v.companyId) === String(jid));
  }, [yourJourneyItems, activityCompanyFilter]);

  const journeyActivityGroups = useMemo(() => groupJourneyItemsByDay(filteredJourneyActivity), [filteredJourneyActivity]);

  const partnerCompaniesVisited = visitedJourneyCompanyIds.size;
  const partnerCompaniesRemaining = Math.max(0, PARTNERS.length - partnerCompaniesVisited);

  const handleContinueJourneyClick = useCallback(() => {
    if (!isAuthenticated || !user || !trackingUserKey) return;
    const recent = deriveMostRecentVisitRow(trackingUserKey);
    if (!recent?.companyId) return;
    const slugFromRecent = journeyCompanyIdToApiSlug(recent.companyId);
    if (!slugFromRecent) return;
    recordVisit({
      companySlug: slugFromRecent,
      action: "continue_journey",
      itemSlug: recent?.itemSlug ?? null,
      numericItemId: recent?.numericItemId ?? null,
      itemName: recent?.itemName ?? null,
      path: continueJourneyHref,
    });
  }, [continueJourneyHref, isAuthenticated, recordVisit, trackingUserKey, user]);

  useEffect(() => {
    if (!drawerId) {
      document.body.style.overflow = "";
      setProduct(null);
      setRatingAgg({ average: 0, count: 0 });
      setDist(null);
      setStars(0);
      setTitleIn("");
      setBodyIn("");
      setFormErr("");
      return;
    }
    document.body.style.overflow = "hidden";
    setDrawerLoad(true);
    apiFetch(`/api/marketplace/products/${drawerId}`)
      .then((pd) => {
        setProduct(pd.product);
        const detail = getProductReviewDetail(drawerId);
        setRatingAgg({ average: detail.avg, count: detail.count });
        setDist(detail.dist);
      })
      .catch(() => setProduct(null))
      .finally(() => setDrawerLoad(false));

    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerId]);

  useEffect(() => {
    const h = (e) => e.key === "Escape" && drawerId && closeDrawer();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [drawerId, closeDrawer]);

  function submitReview(e) {
    e.preventDefault();
    setFormErr("");
    if (!isAuthenticated) {
      const from =
        product?.slug != null
          ? `${marketplaceListingPath(product.slug)}?review=1`
          : `/marketplace/products/${drawerId}?review=1`;
      navigate("/login", { state: { from } });
      return;
    }
    if (stars < 1) {
      setFormErr("Select a star rating.");
      return;
    }
    const b = bodyIn.trim();
    if (!b) {
      setFormErr("Add a short comment.");
      return;
    }
    if (!product?.companySlug) {
      setFormErr("Missing listing.");
      return;
    }
    setSubmitting(true);
    try {
      recordReview({
        rating: stars,
        productId: drawerId,
        productSlug: product.slug ?? null,
        companySlug: product.companySlug,
        itemName: product.name,
        comment: b,
      });
      setStars(0);
      setTitleIn("");
      setBodyIn("");
      const detail = getProductReviewDetail(drawerId);
      setRatingAgg({ average: detail.avg, count: detail.count });
      setDist(detail.dist);
      setAnalyticsTick((t) => t + 1);
      load();
    } catch (err) {
      setFormErr(err?.message || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function openReview(item) {
    if (!isAuthenticated) {
      navigate("/login", {
        state: {
          from: item?.slug ? `${marketplaceListingPath(item.slug)}?review=1` : "/marketplace/explore",
        },
      });
    } else if (item?.slug) {
      navigate(`${marketplaceListingPath(item.slug)}?review=1`);
    } else if (item?.companySlug) {
      const jId = apiCompanySlugToJourneyCompanyId(item.companySlug);
      const to = jId ? partnerStorefrontPath(jId) : `/marketplace/companies/${item.companySlug}`;
      navigate(to);
    }
  }

  const total = Math.max(Number(dist?.total || 0), 1);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <div className="relative z-10">
        <MarketingNav />

      {!allMode ? (
        <>
          {/* SECTION 1 — Marketplace Hub Hero */}
          <section className={`${SHELL} pt-8 pb-5`}>
            <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-8 shadow-[0_20px_55px_-28px_rgba(15,23,42,0.18)] lg:p-10">
              <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
                <div className="flex flex-col justify-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-violet-600">
                    YOUR MARKETPLACE HUB
                  </p>
                  {showLoggedInHub ? (
                    <>
                      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 md:text-[2.15rem]">
                        Hi {hubFirstName || "there"}, welcome back to FusionHub Marketplace
                      </h1>
                      <p className="mt-4 text-[17px] leading-relaxed text-slate-600">
                        Explore Bean &amp; Brew Co., Krativerse, Seaside Travels, and Nexus Academy.{" "}
                        <span className="font-semibold text-slate-800">My Visit History</span> is personal to your account;{" "}
                        <span className="font-semibold text-slate-800">Trending Globally</span> highlights top listings based on
                        visits, reviews, and ratings from all marketplace users.
                      </p>
                      <ul className="mt-8 grid gap-4 text-[15px] text-slate-800 sm:grid-cols-2">
                        <li className="flex gap-3">
                          <FiCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                          {partnerCompaniesVisited} partner {partnerCompaniesVisited === 1 ? "company" : "companies"} you&apos;ve
                          engaged with (storefront, listing, or external site)
                        </li>
                        <li className="flex gap-3">
                          <FiCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                          {partnerCompaniesRemaining} partner {partnerCompaniesRemaining === 1 ? "company" : "companies"} not
                          visited yet
                        </li>
                        <li className="flex gap-3">
                          <FiCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                          {reviewCountSelf} review{reviewCountSelf === 1 ? "" : "s"} you&apos;ve submitted in this browser
                        </li>
                        <li className="flex gap-3">
                          <FiCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                          Top listings are ranked by marketplace engagement—not from your visit history alone
                        </li>
                      </ul>
                      <div className="mt-10 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={scrollToPartnerCompanies}
                          className={`inline-flex min-h-[48px] min-w-[10rem] flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 text-[15px] font-bold text-white shadow-lg shadow-violet-500/20 ${HUB_GRADIENT_HOVER}`}
                        >
                          Continue Exploring
                        </button>
                        <Link
                          to="/reviews"
                          className="inline-flex min-h-[48px] min-w-[10rem] flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-8 text-[15px] font-bold text-slate-900 shadow-sm transition hover:border-violet-300"
                        >
                          Write a Review
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 md:text-[2.15rem]">
                        Welcome to FusionHub Marketplace
                      </h1>
                      <p className="mt-4 text-[17px] leading-relaxed text-slate-600">
                        One account connects your journey across Bean &amp; Brew Co., Krativerse, Seaside Travels, and Nexus Academy.
                      </p>
                      <ul className="mt-8 grid gap-4 text-[15px] text-slate-800 sm:grid-cols-2">
                        <li className="flex gap-3">
                          <FiCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                          Create one marketplace user account
                        </li>
                        <li className="flex gap-3">
                          <FiCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                          Track visits across partner companies
                        </li>
                        <li className="flex gap-3">
                          <FiCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                          Review and rate any product or service
                        </li>
                        <li className="flex gap-3">
                          <FiCheck className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" aria-hidden />
                          View top-five rankings across the marketplace
                        </li>
                      </ul>
                      <div className="mt-10 flex flex-wrap gap-3">
                        <Link
                          to="/signup"
                          className={`inline-flex min-h-[48px] min-w-[10rem] flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-8 text-[15px] font-bold text-white shadow-lg shadow-violet-500/20 ${HUB_GRADIENT_HOVER}`}
                        >
                          Create Account
                        </Link>
                        <Link
                          to="/login"
                          state={{ from: "/marketplace/explore" }}
                          className="inline-flex min-h-[48px] min-w-[10rem] flex-1 items-center justify-center rounded-2xl border border-slate-300 bg-white px-8 text-[15px] font-bold text-slate-900 shadow-sm transition hover:border-violet-300"
                        >
                          Sign In
                        </Link>
                      </div>
                    </>
                  )}
                </div>

                <aside className="flex flex-col rounded-3xl border border-white/70 bg-gradient-to-br from-white via-white to-violet-50/80 p-7 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.12)] ring-1 ring-violet-100/60">
                  <h2 className="text-xl font-bold text-slate-900">My Visit History</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Your visits are saved when you open storefronts or view product details.
                  </p>
                  {isAuthenticated ? (
                    visits.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 px-4 py-4">
                        <p className="text-[15px] font-semibold leading-snug text-slate-800">
                          You have not visited any partner storefronts yet.
                        </p>
                        <button
                          type="button"
                          onClick={scrollToPartnerCompanies}
                          className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 text-[14px] font-bold text-white shadow-md ${HUB_GRADIENT_HOVER}`}
                        >
                          Start Exploring
                        </button>
                      </div>
                    ) : null
                  ) : (
                    <p className="mt-3 text-sm text-slate-600">
                      Sign in to track visits. Nothing is recorded until you browse while logged in.
                    </p>
                  )}
                  <div className="mt-8 flex flex-wrap items-start justify-between gap-x-4 gap-y-8 sm:flex-nowrap">
                    {PARTNERS.map((corp, idx) => {
                      const Icon = corp.icon;
                      const journeyId = apiCompanySlugToJourneyCompanyId(corp.slug);
                      const wiredVisited =
                        Boolean(isAuthenticated && journeyId && visitedJourneyCompanyIds.has(journeyId));
                      const nextCorp = PARTNERS[idx + 1];
                      const nextJourneyId = nextCorp ? apiCompanySlugToJourneyCompanyId(nextCorp.slug) : null;
                      const nextVisited =
                        Boolean(nextJourneyId && isAuthenticated && visitedJourneyCompanyIds.has(nextJourneyId));
                      const connectorActive = idx < PARTNERS.length - 1 && wiredVisited && nextVisited;
                      return (
                        <div key={corp.slug} className="flex shrink-0 items-start gap-0.5 sm:flex-1">
                          <div className={`flex w-full flex-col items-center ${wiredVisited ? "" : "opacity-[0.7]"}`}>
                            <div
                              className={`relative flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-2xl ${
                                wiredVisited
                                  ? `${HUB_JOURNEY_VISITED_STYLES[corp.slug]} shadow-md shadow-emerald-600/18 ring-2 ring-emerald-400/55`
                                  : "border-[2px] border-dashed border-slate-400/55 bg-slate-50/90 text-slate-500 shadow-none"
                              }`}
                            >
                              <Icon className={`h-8 w-8 ${wiredVisited ? "" : "opacity-90"}`} aria-hidden />
                              {wiredVisited ? (
                                <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 shadow-md ring-2 ring-white">
                                  <FiCheck className="h-3.5 w-3.5 text-white" aria-hidden />
                                </span>
                              ) : (
                                <span className="absolute -bottom-2 whitespace-nowrap rounded-full bg-white/95 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-600 ring-1 ring-slate-300/70">
                                  Not visited yet
                                </span>
                              )}
                            </div>
                            <span
                              className={`mt-3 px-1 text-center text-[11px] font-bold leading-snug ${wiredVisited ? "text-slate-900" : "text-slate-600"}`}
                            >
                              {corp.name}
                            </span>
                          </div>
                          {idx < PARTNERS.length - 1 ? (
                            <FiChevronRight
                              className={`mx-0.5 mt-10 shrink-0 sm:mx-1 ${
                                connectorActive ? "text-emerald-300/90" : "text-slate-300/80"
                              }`}
                              aria-hidden
                            />
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-10 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-[15px] leading-snug text-slate-700 shadow-sm">
                    <span className="font-bold text-slate-950">Last visited:</span>{" "}
                    {!isAuthenticated
                      ? "Sign in while you browse to track visits."
                      : visits.length === 0
                        ? "No visits yet"
                        : lastVisitedLine || "No visits yet"}
                  </p>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      to={continueJourneyHref}
                      onClick={handleContinueJourneyClick}
                      className={`inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 text-[15px] font-bold text-white shadow-md ${HUB_GRADIENT_HOVER}`}
                    >
                      Continue Exploring <FiArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                    </Link>
                    <a
                      href="#recent-activity"
                      className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-[15px] font-bold text-slate-900 shadow-sm transition hover:border-violet-400"
                    >
                      Recent activity
                    </a>
                  </div>
                  {import.meta.env.DEV ? (
                    <button
                      type="button"
                      onClick={() => resetLocalActivity()}
                      className="mt-4 w-full rounded-xl border border-dashed border-amber-400/80 bg-amber-50 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-amber-900"
                    >
                      Reset Local Activity
                    </button>
                  ) : null}
                </aside>
              </div>
            </div>
          </section>

          {/* SECTION 2 — Marketplace Top 5 (global) */}
          <section className="border-t border-slate-200/85 bg-white py-10 lg:py-11">
            <div className={SHELL}>
              <h2 className="font-display text-2xl font-bold text-slate-900 md:text-[1.75rem]">
                🏆 Top 5 Marketplace
              </h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                Top listings based on visits, reviews, and ratings.
              </p>
              <p className="mt-2 max-w-3xl text-[13px] font-medium leading-snug text-slate-500">
                Ranked by marketplace engagement.
              </p>
              {itemsLive.length === 0 ? (
                <p className="mt-6 max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white/90 px-5 py-4 text-sm leading-relaxed text-slate-600">
                  Load the catalog to see top listings.
                </p>
              ) : null}
              <div className="mt-8 max-w-3xl">
                {hubTopFiveMerged.length === 0 ? (
                  <p className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-6 text-sm text-slate-600">
                    No listings available to rank yet.
                  </p>
                ) : (
                  <ul className="flex list-none flex-col gap-3 p-0">
                    {hubTopFiveMerged.map((row) => (
                      <li key={row.slug || row.id} className="list-none">
                        <LeaderboardListRow
                          rank={row.rank}
                          title={row.title}
                          subtitle={row.companyLabel}
                          category={row.category}
                          reviewCount={row.reviewsDisplay}
                          avgRating={row.ratingDisplay}
                          to={row.listingTo}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* My activity — visit history (signed-in) */}
          <section id="recent-activity" className="scroll-mt-[88px] border-t border-white/85">
            <div
              className="w-full px-8 py-10 lg:py-11"
              style={{ background: "var(--grad-hero, linear-gradient(135deg, #1a0533 0%, #0f1a4e 100%))" }}
            >
              <div className={`${SHELL} flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between`}>
                <div className="min-w-0">
                  <h2 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">My activity</h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/65">
                    Every product you&apos;ve explored across all companies
                  </p>
                </div>
                {isAuthenticated && user ? (
                  <div
                    className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-lg font-extrabold text-white shadow-inner backdrop-blur-sm"
                    aria-hidden
                  >
                    {userActivityInitials(user)}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="bg-[#f4f6fb] pb-10 pt-6 lg:pb-11 lg:pt-8">
              <div className={SHELL}>
                {isAuthenticated ? (
                  <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter activity by company">
                    {ACTIVITY_COMPANY_FILTERS.map((f) => {
                      const active = activityCompanyFilter === f.slug;
                      return (
                        <button
                          key={f.slug}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setActivityCompanyFilter(f.slug)}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                            active
                              ? "border border-transparent text-white shadow-sm"
                              : "border border-[#e5e7eb] bg-white text-[#6b7280] hover:border-slate-300 hover:text-slate-800"
                          }`}
                          style={active ? { background: "var(--grad-purple, linear-gradient(135deg, #7c3aed, #4f46e5))" } : undefined}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {!isAuthenticated ? (
                  <p className="mt-8 rounded-[14px] border border-[#e5e7eb] bg-white px-6 py-6 text-[15px] text-slate-700 shadow-sm">
                    <span className="font-bold text-slate-950">Sign in</span> to see your visit history in this browser.
                    <Link
                      to="/login"
                      state={{ from: "/marketplace/explore" }}
                      className="ml-2 inline font-bold text-[#7c3aed] underline decoration-violet-300 underline-offset-2"
                    >
                      Go to login
                    </Link>
                    .
                  </p>
                ) : yourJourneyItems.length === 0 ? (
                  <p className="mt-8 rounded-[14px] border border-dashed border-slate-300 bg-white px-6 py-6 text-[15px] text-slate-600">
                    No recent activity yet. Open a storefront or use View Details on a listing.
                  </p>
                ) : filteredJourneyActivity.length === 0 ? (
                  <p className="mt-8 rounded-[14px] border border-dashed border-slate-300 bg-white px-6 py-6 text-[15px] text-slate-600">
                    No visits for this company yet. Try another filter or explore the marketplace.
                  </p>
                ) : (
                  <div className="mt-6">
                    {journeyActivityGroups.map((g) => (
                      <div key={g.key} className="mb-2">
                        <div className="sticky top-0 z-[2] -mx-1 bg-[#f4f6fb]/90 px-1 py-1 backdrop-blur-sm">
                          <span
                            className="inline-block rounded-[20px] bg-[#f9fafb] px-3 py-1 text-[11px] font-bold text-[#9ca3af]"
                            style={{ margin: "16px 0 8px" }}
                          >
                            {g.label}
                          </span>
                        </div>
                        <ul className="mt-2 flex list-none flex-col gap-3 p-0">
                          {g.items.map((v) => {
                            const apiSlug = journeyCompanyIdToApiSlug(v.companyId);
                            const merged =
                              v.numericItemId != null
                                ? itemsLive.find((it) => Number(it.id) === Number(v.numericItemId)) ?? null
                                : v.itemSlug && v.itemSlug !== "storefront"
                                  ? mergeHubListing(itemsLive, v.itemSlug, v.itemName || undefined)
                                  : null;
                            const toHref =
                              merged?.slug != null
                                ? marketplaceListingPath(merged.slug)
                                : v.companyId
                                  ? partnerStorefrontPath(v.companyId)
                                  : apiSlug
                                    ? `/marketplace/companies/${apiSlug}`
                                    : "/marketplace/explore";
                            const swatchColor = (apiSlug && ACTIVITY_COMPANY_SWATCH[apiSlug]) || "#64748b";
                            const companyLine = v.companyName || journeyCompanyIdToPartnerLabel(v.companyId);
                            return (
                              <li
                                key={`${v.timestamp}-${v.companyId}-${v.itemId ?? "sf"}-${v.visitType || v.action}`}
                                className="list-none"
                              >
                                <div className="flex flex-row items-center justify-between gap-4 rounded-[14px] border border-[#f0f0f0] bg-white px-[18px] py-[14px] shadow-sm">
                                  <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <span
                                      className="mt-1.5 h-[10px] w-[10px] shrink-0 rounded-[4px]"
                                      style={{ backgroundColor: swatchColor }}
                                      aria-hidden
                                    />
                                    <div className="min-w-0">
                                      <p className="truncate text-[14px] font-bold leading-snug text-slate-900">
                                        {v.itemName || "Visit"}
                                      </p>
                                      <p className="mt-0.5 truncate text-[12px] text-[#6b7280]">{companyLine}</p>
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                                    <p className="text-[12px] text-[#9ca3af]">{formatReviewWhen(v.timestamp)}</p>
                                    <Link to={toHref} className="text-[12px] font-bold text-[#7c3aed] hover:underline">
                                      View
                                    </Link>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* SECTION 3 — Explore Partner Companies */}
          <section id="partner-marketplace" className="border-t border-white/60 bg-white/35 py-10 backdrop-blur-[2px] lg:py-11 scroll-mt-[88px]">
            <div className={SHELL}>
              <h2 className="font-display text-2xl font-bold text-slate-900 md:text-[1.75rem]">Explore Partner Companies</h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                Each partner storefront includes its own top-five products/services and full catalog.
              </p>

              <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7">
                {PARTNERS.map((corp) => {
                  const acc = PARTNER_CARD_ACCENTS[corp.slug];
                  const Icon = corp.icon;
                  const topList = partnerCompanyTopListings(itemsLive, corp.slug);
                  const companyListingCount = itemsLive.filter((i) => i.companySlug === corp.slug).length;
                  const totals = partnerPresentation[corp.slug];
                  const journeyId = apiCompanySlugToJourneyCompanyId(corp.slug);
                  const storefrontTo = journeyId ? partnerStorefrontPath(journeyId) : `/marketplace/companies/${corp.slug}`;
                  const originalWebsiteHref =
                    (journeyId && partnerOriginalWebsiteUrl(journeyId)) ||
                    totals?.websiteUrl ||
                    PARTNER_WEBSITE_FALLBACK[corp.slug];
                  const avgStr =
                    totals?.reviewCount > 0 && totals?.avgRating != null
                      ? Number(totals.avgRating).toFixed(2)
                      : "No rating yet";
                  const visitsStr =
                    totals?.visits != null ? Number(totals.visits).toLocaleString() : "0";
                  const listingsStr = totals?.listings != null ? String(totals.listings) : "—";

                  return (
                    <article
                      key={corp.slug}
                      className={`flex h-full flex-col overflow-hidden rounded-[1.55rem] border border-slate-200/90 bg-white p-7 shadow-[0_16px_50px_-32px_rgba(15,23,42,0.22)] transition duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_24px_56px_-32px_rgba(15,23,42,0.18)] ${acc.ring}`}
                    >
                      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-4">
                          <span
                            className={`relative flex h-[4.35rem] w-[4.35rem] shrink-0 items-center justify-center rounded-2xl border border-slate-100 shadow-inner ${acc.iconWrap}`}
                          >
                            <Icon className="h-10 w-10" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Category: {corp.category}</p>
                            <h3 className="mt-2 font-display text-xl font-bold text-slate-900">{corp.name}</h3>
                            <dl className="mt-5 grid gap-3 sm:grid-cols-3">
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Average Rating</dt>
                                <dd className="mt-1 text-lg font-black tabular-nums text-amber-600">{avgStr}</dd>
                              </div>
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total Visits</dt>
                                <dd className="mt-1 text-lg font-black tabular-nums text-slate-950">{visitsStr}</dd>
                              </div>
                              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                <dt className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Listings</dt>
                                <dd className="mt-1 text-lg font-black tabular-nums text-slate-950">{listingsStr}</dd>
                              </div>
                            </dl>
                          </div>
                        </div>
                        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-[11.75rem]">
                          <Link
                            to={storefrontTo}
                            onClick={() => {
                              if (isAuthenticated && user && journeyId) {
                                recordCompanySurface({
                                  journeyCompanyId: journeyId,
                                  companyName: corp.name,
                                  action: "open_storefront",
                                  path: storefrontTo,
                                });
                              }
                            }}
                            className={`inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-4 text-[14px] font-bold text-white shadow-md ${acc.ctaGlow} ${HUB_GRADIENT_HOVER}`}
                          >
                            Open Storefront <FiArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                          </Link>
                          <a
                            href={originalWebsiteHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (isAuthenticated && user && journeyId) {
                                recordCompanySurface({
                                  journeyCompanyId: journeyId,
                                  companyName: corp.name,
                                  action: "visit_external_website",
                                  path: null,
                                });
                              }
                            }}
                            className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-[14px] font-bold text-slate-900 shadow-sm transition hover:border-violet-300"
                          >
                            Visit Original Website <FiExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                          </a>
                        </div>
                      </div>

                      <div className="mt-7 border-t border-slate-100 pt-7">
                        <p className="text-[13px] font-black uppercase tracking-wide text-slate-900">
                          🏆 Top 5 in this Storefront
                        </p>
                        <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                          Top listings based on visits, reviews, and ratings for this company.
                        </p>
                        <p className="mt-1 text-[12px] font-medium text-slate-400">Ranked by marketplace engagement.</p>
                        {companyListingCount === 0 ? (
                          <p className="mt-4 text-sm leading-relaxed text-slate-600">No listings for this partner in the catalog.</p>
                        ) : null}
                        {topList.length > 0 ? (
                          <ul className="mt-4 flex list-none flex-col gap-3 p-0">
                            {topList.map((merged, idx) => (
                              <li key={merged.slug || merged.id} className="list-none">
                                <LeaderboardListRow
                                  rank={idx + 1}
                                  title={merged.name}
                                  subtitle={null}
                                  category={merged.category}
                                  reviewCount={merged.reviewCount}
                                  avgRating={merged.avgRating}
                                  to={
                                    merged.slug != null
                                      ? marketplaceListingPath(merged.slug)
                                      : `/marketplace/products/${merged.id}`
                                  }
                                />
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 4 — Latest Reviews */}
          <section className="border-t border-slate-200/85 bg-white py-10 lg:py-11">
            <div className={SHELL}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-slate-900 md:text-[1.75rem]">Latest Reviews</h2>
                  <p className="mt-2 max-w-3xl text-[15px] text-slate-600">
                    Recent marketplace reviews from users across partner companies.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) navigate("/login", { state: { from: "/marketplace/explore?review=1" } });
                      else {
                        const listing = resolveSlug(itemsLive, "morning-sunrise-blend");
                        if (listing?.slug) {
                          navigate(`${marketplaceListingPath(listing.slug)}#write-review`);
                        }
                      }
                    }}
                    className={`inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-6 text-sm font-bold text-white shadow-md ${HUB_GRADIENT_HOVER}`}
                  >
                    Write a Review
                  </button>
                  <Link
                    to="/reviews"
                    className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-slate-200 px-6 text-sm font-bold text-slate-900 hover:border-violet-300"
                  >
                    View All Reviews
                  </Link>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                {latestReviewsFeed.length === 0 ? (
                  <p className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-center text-sm text-slate-600 md:col-span-2">
                    No reviews yet. Be the first to write one.
                  </p>
                ) : (
                  latestReviewsFeed.slice(0, 4).map((r) => (
                    <div
                      key={r.id}
                      className="rounded-3xl border border-slate-200/95 bg-[#fdfdff] px-7 py-6 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.28)] transition duration-300 ease-out hover:-translate-y-0.5 hover:border-violet-200/80 hover:shadow-[0_22px_64px_-32px_rgba(15,23,42,0.32)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{r.userName || "Member"}</p>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-900 ring-1 ring-emerald-200">
                          Verified Marketplace User
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-0.5 text-amber-500" role="img" aria-label={`${r.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FiStar
                            key={star}
                            className={`h-4 w-4 ${star <= Number(r.rating || 0) ? "fill-current" : "text-slate-200"}`}
                            aria-hidden
                          />
                        ))}
                      </div>
                      <p className="mt-3 text-base font-semibold text-slate-900">
                        {r.comment?.trim() ? `“${r.comment.trim()}”` : "—"}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {r.itemName || "Listing"} · {r.companyName || journeyCompanyIdToPartnerLabel(r.companyId)}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">{formatReviewWhen(r.timestamp)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* SECTION 5 — Featured Products Preview */}
          <section className="border-t border-white/60 bg-white/35 py-10 backdrop-blur-[2px] lg:pb-14">
            <div className={SHELL}>
              <h2 className="font-display text-2xl font-bold text-slate-900 md:text-[1.75rem]">Featured Products &amp; Services</h2>
              <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-600">
                A quick preview of popular listings. Open a storefront to browse the full catalog.
              </p>
              {loading && !hubFeaturedMerged.length ? (
                <p className="mt-10 text-center text-[15px] text-slate-500">Loading…</p>
              ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {hubFeaturedMerged.map((listing) => (
                    <MarketplaceListingCard
                      key={listing.slug}
                      listing={listing}
                      compactCaption
                      onOpenDetails={(l) => openListingOrStorefront(l)}
                      onWriteReview={(l) => openReview(l)}
                    />
                  ))}
                </div>
              )}
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={goViewAll}
                  className={`inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] px-10 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/20 ${HUB_GRADIENT_HOVER}`}
                >
                  View All Marketplace Listings <FiArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <header className="border-b border-slate-200/80 bg-[#F8FAFC] pt-10 pb-8">
            <div className={`${SHELL} flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between`}>
              <div className="max-w-xl">
                <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">All Marketplace Listings</h1>
                <p className="mt-3 text-lg text-slate-600">Filter and browse every product and service from partner storefronts.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                {stats.map((s) => (
                  <div
                    key={s.l}
                    className="min-w-[8.75rem] rounded-2xl border border-slate-200/90 bg-white px-4 py-3 text-center shadow-sm sm:text-left"
                  >
                    <div className="text-xl font-bold tabular-nums text-slate-900">{s.v}</div>
                    <div className="mt-0.5 text-xs font-medium text-slate-500">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </header>

          <div className="sticky top-16 z-30 border-b border-slate-200 bg-white shadow-sm">
            <div className={`${SHELL} space-y-4 py-4`}>
              <div className="relative">
                <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search products, services, or companies..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-12 pr-4 text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-500/15"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
                {CATEGORY_CHIPS.map((c) => (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCat(c.key)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      cat === c.key
                        ? "bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-white shadow-md"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
                {COMPANY_CHIPS.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setCo(c.slug)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      co === c.slug
                        ? "bg-violet-100 text-violet-900 ring-2 ring-violet-300/60"
                        : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                <div className="ml-auto flex w-full min-w-[12rem] items-center sm:w-auto">
                  <label htmlFor="sort-mp" className="sr-only">
                    Sort
                  </label>
                  <select
                    id="sort-mp"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-violet-500/20"
                    style={{
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.65rem center",
                      backgroundSize: "12px",
                    }}
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className={`${SHELL} py-5`}>
            <Link to="/marketplace/explore" className="inline-flex items-center gap-2 text-sm font-bold text-violet-700 underline decoration-violet-300 underline-offset-2 hover:text-violet-950">
              ← Back to marketplace discovery
            </Link>
          </div>
          <section className="border-t border-slate-200/80 bg-white pb-16 pt-2">
            <div className={SHELL}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-display text-2xl font-bold text-slate-900">All listings</h2>
                <p className="text-sm font-medium text-slate-500">
                  {filtered.length} of {items.length} listings
                </p>
              </div>
              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
              {loading ? (
                <p className="mt-12 text-center text-slate-500">Loading…</p>
              ) : filtered.length === 0 ? (
                <p className="mt-12 text-center text-slate-500">No listings match your filters.</p>
              ) : (
                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filtered.map((item) => (
                    <MarketplaceListingCard
                      key={item.id}
                      listing={item}
                      onOpenDetails={(l) => openListingOrStorefront(l)}
                      onWriteReview={(l) => openReview(l)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <MarketingFooter />

      {/* Drawer */}
      <div
        className={`fixed inset-0 z-[100] flex justify-end ${drawerId ? "pointer-events-auto" : "pointer-events-none"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={closeDrawer}
          className={`flex-1 bg-slate-900/40 transition-opacity ${drawerId ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ease-out ${
            drawerId ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-600">Listing</span>
            <button type="button" onClick={closeDrawer} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <FiX size={22} />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {drawerLoad ? (
              <div className="animate-pulse space-y-4 p-5">
                <div className="aspect-video rounded-2xl bg-slate-200" />
                <div className="h-8 rounded bg-slate-200" />
              </div>
            ) : product ? (
              <div className="p-5 pb-10">
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                  <Media src={product.heroImage} className="aspect-video w-full object-cover" />
                </div>
                <h2 id="drawer-title" className="mt-6 text-xl font-bold text-slate-900">
                  {product.name}
                </h2>
                <p className="mt-1 text-sm font-semibold text-violet-700">{product.companyName}</p>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">{product.description || product.excerpt}</p>
                <div className="mt-5 flex flex-wrap gap-4 border-y border-slate-100 py-4 text-sm">
                  <span className="font-semibold text-amber-600">
                    {ratingAgg.count > 0
                      ? `${Number(ratingAgg.average || 0).toFixed(1)}★ (${ratingAgg.count} reviews)`
                      : "No rating yet"}
                  </span>
                  <span className="text-slate-600">
                    {drawerId ? getProductAnalytics(drawerId).visits.toLocaleString() : 0} visits
                  </span>
                </div>
                {(() => {
                  const pj = product.companySlug ? apiCompanySlugToJourneyCompanyId(product.companySlug) : null;
                  const externalHref =
                    (pj && partnerOriginalWebsiteUrl(pj)) || product.companyUrl || null;
                  if (!externalHref) return null;
                  const sfPath = pj ? partnerStorefrontPath(pj) : `/marketplace/companies/${product.companySlug}`;
                  return (
                    <a
                      href={externalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (isAuthenticated && user && pj) {
                          recordCompanySurface({
                            journeyCompanyId: pj,
                            companyName: product.companyName,
                            action: "visit_external_website",
                            path: sfPath,
                          });
                        }
                      }}
                      className="mt-4 inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 hover:border-violet-300"
                    >
                      Visit Original Website <FiExternalLink size={16} />
                    </a>
                  );
                })()}

                <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Rating mix</p>
                  <div className="mt-3 space-y-2">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const key = `s${star}`;
                      const cnt = Number(dist?.[key] || 0);
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-6 text-slate-500">{star}★</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                              style={{ width: `${(cnt / total) * 100}%` }}
                            />
                          </div>
                          <span className="w-6 text-right text-slate-500">{cnt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-8">
                  <p className="text-sm font-bold text-slate-900">Write a review</p>
                  {!isAuthenticated ? (
                    <p className="mt-2 text-sm text-slate-600">
                      <Link
                        to="/login"
                        state={{
                          from: product?.slug != null ? marketplaceListingPath(product.slug) : `/marketplace/products/${drawerId}`,
                        }}
                        className="font-bold text-violet-700 underline"
                      >
                        Sign in
                      </Link>{" "}
                      to submit.
                    </p>
                  ) : (
                    <form onSubmit={submitReview} className="mt-4 space-y-4">
                      <div>
                        <p className="mb-2 text-xs text-slate-500">Your rating</p>
                        <StarInput value={stars} onChange={setStars} />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Title (optional)</label>
                        <input
                          value={titleIn}
                          onChange={(e) => setTitleIn(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                          maxLength={180}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-600">Comment</label>
                        <textarea
                          value={bodyIn}
                          onChange={(e) => setBodyIn(e.target.value)}
                          rows={4}
                          className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500/20"
                        />
                      </div>
                      {formErr ? <p className="text-sm text-red-600">{formErr}</p> : null}
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] py-3 text-sm font-bold text-white disabled:opacity-50"
                      >
                        {submitting ? "Submitting…" : "Submit Review"}
                      </button>
                    </form>
                  )}
                </div>

                <Link
                  to={product?.slug != null ? marketplaceListingPath(product.slug) : `/marketplace/products/${drawerId}`}
                  onClick={() => closeDrawer()}
                  className="mt-6 block text-center text-sm font-semibold text-violet-700 underline"
                >
                  Open full page
                </Link>
              </div>
            ) : (
              <p className="p-8 text-center text-slate-500">Could not load product.</p>
            )}
          </div>
        </aside>
      </div>
      </div>
    </div>
  );
}
