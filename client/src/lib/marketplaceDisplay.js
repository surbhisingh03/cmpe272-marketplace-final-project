/** Canonical path for the marketplace listing detail page (single product/service). */
export function marketplaceListingPath(slug) {
  const s = slug != null ? String(slug).trim() : "";
  if (!s) return "/marketplace/explore";
  return `/marketplace/listing/${encodeURIComponent(s)}`;
}

/** Brand-friendly company labels for FusionHub storefronts */
export function displayCompanyName(companySlug) {
  switch (companySlug) {
    case "srikavya-enterprise":
      return "Bean & Brew Co.";
    case "krativerse":
      return "Krativerse";
    case "travel-agency":
      return "Seaside Travels";
    case "nexus-academy":
      return "Nexus Academy";
    default:
      return companySlug?.replace(/-/g, " ") || "Partner";
  }
}

/** Maps granular DB category → Marketplace pillar (filter chips: Coffee / Creative / Travel / Education) */
export function pillarKeyFromCategory(category) {
  switch (category) {
    case "Coffee":
    case "Subscription":
    case "Gift Set":
    case "Cafe Drink":
    case "Cafe Experience":
    case "Cafe Catering":
    case "Cafe Supplies":
      return "coffee";
    case "Creative":
    case "Creative Consultation":
    case "Video Production":
    case "Photography":
    case "Creative Branding":
    case "Creative Package":
      return "creative";
    case "Travel":
    case "Travel Booking":
      return "travel";
    case "Education":
      return "education";
    default:
      return "coffee";
  }
}

export function categoryRibbonLabel(category) {
  switch (category) {
    case "Coffee":
      return "Coffee Product";
    case "Subscription":
      return "Coffee Subscription";
    case "Gift Set":
      return "Gift Set";
    case "Cafe Drink":
      return "Cafe Drink";
    case "Cafe Experience":
      return "Cafe Experience";
    case "Cafe Catering":
      return "Cafe Catering";
    case "Cafe Supplies":
      return "Cafe Supplies";
    case "Creative":
      return "Creative Service";
    case "Creative Consultation":
      return "Creative Consultation";
    case "Video Production":
      return "Video Production";
    case "Photography":
      return "Photography";
    case "Creative Branding":
      return "Creative Branding";
    case "Creative Package":
      return "Package";
    case "Travel":
      return "Travel Experience";
    case "Travel Booking":
      return "Travel Booking";
    case "Education":
      return "Academy Course";
    default:
      return category || "Marketplace listing";
  }
}

export function listingKind(category) {
  switch (category) {
    case "Coffee":
    case "Gift Set":
    case "Cafe Supplies":
    case "Subscription":
      return "products";
    case "Creative":
    case "Creative Consultation":
    case "Video Production":
    case "Photography":
    case "Creative Branding":
    case "Creative Package":
      return "services";
    case "Travel Booking":
      return "services";
    case "Travel":
    case "Cafe Experience":
    case "Cafe Drink":
      return "experiences";
    case "Cafe Catering":
      return "services";
    case "Education":
      return "courses";
    default:
      return "products";
  }
}
