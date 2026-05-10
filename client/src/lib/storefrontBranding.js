import { LuCoffee, LuGraduationCap, LuPlane, LuSparkles } from "react-icons/lu";
import { compareListingsByPopularityDesc } from "./fusionhubAnalytics.js";
import { calculateEngagementScoreFromCounts } from "./engagementScore.js";

/** Curated copy + imagery for storefronts (metrics come from live analytics). */
export const STOREFRONT_COMPANY_META = {
  "srikavya-enterprise": {
    categoryLabel: "Coffee",
    description:
      "Premium coffee products, artisan blends, cafe supplies, and subscription experiences.",
    heroImage:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1600&q=85",
    Icon: LuCoffee,
    accent: {
      badge: "bg-amber-100 text-amber-950 ring-amber-200/80",
      heroRing: "ring-amber-200/60",
      softBg: "from-amber-50/90 via-white to-orange-50/50",
      iconWrap: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-950 ring-2 ring-amber-300/70",
      stat: "text-amber-700",
    },
    searchPlaceholder: "Search coffee products, blends, subscriptions...",
    filterChips: [
      { key: "all", label: "All" },
      { key: "coffee_products", label: "Coffee Products" },
      { key: "subscriptions", label: "Subscriptions" },
      { key: "cafe_supplies", label: "Cafe Supplies" },
      { key: "brewing_gear", label: "Brewing Gear" },
    ],
  },
  krativerse: {
    categoryLabel: "Creative Services",
    description:
      "Video production, photography, branding, campaigns, and creative storytelling services.",
    heroImage:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=85",
    Icon: LuSparkles,
    accent: {
      badge: "bg-violet-100 text-violet-950 ring-violet-200/80",
      heroRing: "ring-violet-200/60",
      softBg: "from-violet-50/90 via-white to-fuchsia-50/40",
      iconWrap: "bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-950 ring-2 ring-violet-300/75",
      stat: "text-violet-700",
    },
    searchPlaceholder: "Search creative services, video, branding...",
    filterChips: [
      { key: "all", label: "All" },
      { key: "video", label: "Video Production" },
      { key: "photo", label: "Photography" },
      { key: "branding", label: "Branding" },
      { key: "campaigns", label: "Campaigns" },
    ],
  },
  "travel-agency": {
    categoryLabel: "Travel",
    description:
      "Travel planning, luxury vacations, adventure packages, and curated destination experiences.",
    heroImage:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
    Icon: LuPlane,
    accent: {
      badge: "bg-sky-100 text-sky-950 ring-sky-200/80",
      heroRing: "ring-sky-200/60",
      softBg: "from-sky-50/90 via-white to-cyan-50/45",
      iconWrap: "bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-950 ring-2 ring-sky-300/70",
      stat: "text-sky-700",
    },
    searchPlaceholder: "Search trips, packages, destinations...",
    filterChips: [
      { key: "all", label: "All" },
      { key: "luxury", label: "Luxury" },
      { key: "honeymoon", label: "Honeymoon" },
      { key: "adventure", label: "Adventure" },
      { key: "family", label: "Family" },
      { key: "corporate", label: "Corporate" },
    ],
  },
  "nexus-academy": {
    categoryLabel: "Education",
    description:
      "Online courses, workshops, certifications, and career-focused learning programs.",
    heroImage:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop",
    Icon: LuGraduationCap,
    accent: {
      badge: "bg-emerald-100 text-emerald-950 ring-emerald-200/80",
      heroRing: "ring-emerald-200/60",
      softBg: "from-emerald-50/90 via-white to-teal-50/45",
      iconWrap: "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-950 ring-2 ring-emerald-300/70",
      stat: "text-emerald-700",
    },
    searchPlaceholder: "Search courses, workshops, skills...",
    filterChips: [
      { key: "all", label: "All" },
      { key: "programming", label: "Programming" },
      { key: "ai", label: "AI" },
      { key: "data", label: "Data" },
      { key: "web", label: "Web" },
      { key: "career", label: "Career Skills" },
    ],
  },
};

/** Slug order for “Top 5 in this Storefront” (matches assignment naming). */
export const STOREFRONT_TOP5_SLUGS = {
  "srikavya-enterprise": [
    "morning-sunrise-blend",
    "midnight-espresso",
    "ethiopian-yirgacheffe",
    "subscribe-and-save-program",
    "pour-over-kit",
  ],
  krativerse: [
    "growth-package-hero-social",
    "photography-brand-editorial",
    "branding-identity-design-studio",
    "starter-package-video-social",
    "branding-motion-graphics-suite",
  ],
  "travel-agency": [
    "luxury-cruise-journey",
    "honeymoon-escape-package",
    "mountain-adventure-tour",
    "family-vacation-package",
    "beach-holiday-package",
  ],
  "nexus-academy": [
    "introduction-to-computer-science",
    "web-development-design",
    "machine-learning-fundamentals",
    "database-systems",
    "software-engineering",
  ],
};

const HUB_GRADIENT_HOVER =
  "transition duration-300 hover:brightness-[1.045] hover:shadow-[0_10px_32px_-8px_rgba(124,58,237,0.38),0_6px_20px_-10px_rgba(6,182,212,0.22)] active:brightness-[1.02]";

export { HUB_GRADIENT_HOVER };

export const BEAN_BREW_STOREFRONT_SLUG = "srikavya-enterprise";

export function combinedListingScore(p) {
  const v = Number(p.visitCount || 0);
  const r = Number(p.reviewCount || 0);
  const a = r > 0 ? Number(p.avgRating || 0) : 0;
  return calculateEngagementScoreFromCounts(v, r, a);
}

export function storefrontListingScore(apiSlug, p) {
  void apiSlug;
  return combinedListingScore(p);
}

/** Bean & Brew catalog rows → storefront filter chip (company-specific, not API category). */
const BEAN_BREW_COFFEE_SLUGS = new Set([
  "morning-sunrise-blend",
  "midnight-espresso",
  "ethiopian-yirgacheffe",
  "velvet-reserve",
  "colombian-supremo",
  "sumatra-mandheling",
  "costa-rican-tarrazu",
]);

export function beanBrewCatalogChipKey(product) {
  const slug = String(product.slug || "")
    .trim()
    .toLowerCase();
  if (BEAN_BREW_COFFEE_SLUGS.has(slug)) return "coffee_products";
  if (slug === "subscribe-and-save-program") return "subscriptions";
  if (slug === "pour-over-kit" || slug === "precision-burr-grinder") return "brewing_gear";
  if (slug === "artisan-ceramic-mug") return "cafe_supplies";
  return null;
}

/** All searchable text for chip matching (matches seeded catalog fields from API). */
function storefrontProductBlob(product) {
  return [product.name, product.excerpt, product.description, product.category, product.slug]
    .filter((x) => x != null && String(x).trim())
    .join(" ")
    .toLowerCase();
}

export function productMatchesStorefrontChip(apiSlug, chipKey, product) {
  if (!chipKey || chipKey === "all") return true;

  const company = String(apiSlug || "").trim().toLowerCase();
  const cat = (product.category || "").toLowerCase();
  const slug = String(product.slug || "")
    .trim()
    .toLowerCase();
  const blob = storefrontProductBlob(product);

  switch (company) {
    case "srikavya-enterprise": {
      const rowKey = beanBrewCatalogChipKey(product);
      return rowKey != null && rowKey === chipKey;
    }
    case "krativerse": {
      if (chipKey === "video") {
        return (
          cat.includes("video") ||
          cat === "creative package" ||
          slug.startsWith("video-") ||
          blob.includes("video") ||
          blob.includes("videos") ||
          blob.includes("documentary") ||
          blob.includes("commercial") ||
          blob.includes("television") ||
          blob.includes("broadcast") ||
          (cat === "creative consultation" &&
            (blob.includes("shot list") ||
              blob.includes("production plan") ||
              blob.includes("script outline") ||
              blob.includes("treatment")))
        );
      }
      if (chipKey === "photo") {
        return cat.includes("photo") || blob.includes("photography") || blob.includes("photoshoot") || slug.startsWith("photography-");
      }
      if (chipKey === "branding") {
        return cat.includes("branding") || blob.includes("branding") || blob.includes("identity") || blob.includes("visual systems");
      }
      if (chipKey === "campaigns") {
        return (
          cat === "creative package" ||
          blob.includes("campaign") ||
          blob.includes("social") ||
          blob.includes("cutdown") ||
          blob.includes("platform format") ||
          blob.includes("paid social") ||
          blob.includes("formats") ||
          slug.includes("package")
        );
      }
      return false;
    }
    case "travel-agency": {
      if (chipKey === "luxury") {
        return (
          blob.includes("luxury") ||
          blob.includes("premium cruising") ||
          blob.includes("ocean-view") ||
          blob.includes("fine dining") ||
          blob.includes("concierge") ||
          slug.includes("luxury") ||
          slug.includes("cruise")
        );
      }
      if (chipKey === "honeymoon") return blob.includes("honeymoon") || slug.includes("honeymoon");
      if (chipKey === "adventure") {
        return (
          blob.includes("adventure") ||
          blob.includes("mountain") ||
          blob.includes("trek") ||
          blob.includes("safari") ||
          slug.includes("mountain") ||
          slug.includes("wildlife")
        );
      }
      if (chipKey === "family") return blob.includes("family") || slug.includes("family");
      if (chipKey === "corporate") {
        return (
          blob.includes("corporate") ||
          blob.includes("business") ||
          slug.includes("flight") ||
          slug.includes("hotel") ||
          cat.includes("booking")
        );
      }
      return false;
    }
    case "nexus-academy": {
      if (chipKey === "programming") {
        return (
          blob.includes("python") ||
          blob.includes("programming") ||
          blob.includes("computer science") ||
          blob.includes("algorithm") ||
          blob.includes("data structure") ||
          cat.includes("computer")
        );
      }
      if (chipKey === "ai") {
        return (
          blob.includes("machine learning") ||
          slug.includes("machine-learning") ||
          (blob.includes("machine") && blob.includes("learning"))
        );
      }
      if (chipKey === "data") {
        return (
          blob.includes("database") ||
          slug.includes("database") ||
          (blob.includes("data") && !blob.includes("machine learning"))
        );
      }
      if (chipKey === "web") {
        return blob.includes("web") || slug.includes("web-development");
      }
      if (chipKey === "career") {
        return (
          blob.includes("career") ||
          blob.includes("cyber") ||
          blob.includes("software engineering") ||
          slug.includes("software-engineering")
        );
      }
      return false;
    }
    default:
      return true;
  }
}

export function sortStorefrontProducts(list, sortKey, apiSlug = null) {
  void apiSlug;
  const out = [...list];
  out.sort((a, b) => {
    switch (sortKey) {
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
