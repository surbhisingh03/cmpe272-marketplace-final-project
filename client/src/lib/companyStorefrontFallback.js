/** When `/api/marketplace/companies/:slug` fails, build the same shape from `/catalog` items. */

const DEFAULT_BANNERS = {
  "srikavya-enterprise":
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=1600&auto=format&fit=crop",
  krativerse:
    "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1600&q=85",
  "travel-agency": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1600&auto=format&fit=crop",
  "nexus-academy": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1600&auto=format&fit=crop",
};

export function buildStorefrontPayloadFromCatalog(items, apiSlug) {
  if (!apiSlug || !Array.isArray(items)) return null;
  const rows = items.filter((i) => i.companySlug === apiSlug);
  if (!rows.length) return null;

  const first = rows[0];
  let sumR = 0;
  let cntR = 0;
  let sumRev = 0;
  for (const r of rows) {
    const ar = Number(r.avgRating);
    if (ar > 0) {
      sumR += ar;
      cntR++;
    }
    sumRev += Number(r.reviewCount || 0);
  }
  const avgRating = cntR ? sumR / cntR : 0;

  const products = [...rows]
    .sort(
      (a, b) =>
        Number(b.popularityScore || 0) - Number(a.popularityScore || 0) ||
        Number(b.visitCount || 0) - Number(a.visitCount || 0),
    )
    .map((i) => ({
      id: i.id,
      slug: i.slug,
      name: i.name,
      excerpt: i.excerpt || "",
      heroImage: i.heroImage,
      visitCount: Number(i.visitCount || 0),
      popularityScore: Number(i.popularityScore || 0),
      category: i.category,
    }));

  return {
    company: {
      slug: apiSlug,
      name: first.companyName,
      tagline: `Shop ${first.companyName} in FusionHub Marketplace`,
      description: `Browse products and services from ${first.companyName}. Rate, review, and explore listings connected through FusionHub.`,
      bannerUrl: DEFAULT_BANNERS[apiSlug] || first.heroImage || DEFAULT_BANNERS["srikavya-enterprise"],
      externalUrl: first.companyUrl || "",
      avgRating,
      reviewCount: sumRev,
    },
    products,
  };
}
