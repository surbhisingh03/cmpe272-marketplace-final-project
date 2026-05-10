import { LISTING_DETAILS_BY_SLUG } from "./listingDetailsBySlug.js";

/**
 * Partner-faithful FusionHub catalog — listings mirror each teammate’s public storefront
 * (Bean & Brew Co. products.php, Krativerse packages + “What we do”, Seaside services.php,
 * Nexus Academy homepage classes). Slugs align with source site paths where applicable.
 *
 * `map` must be `{ "srikavya-enterprise": id, "krativerse": id, "travel-agency": id, "nexus-academy": id }`.
 */

function P(map, cidKey, slug, name, excerpt, description, heroImage, category, visits, seedAvg, seedReviews) {
  return {
    cid: map[cidKey],
    slug,
    name,
    excerpt,
    description,
    hero_image: heroImage,
    category,
    visits,
    seedAvg,
    seedReviews,
  };
}

/* —— Shared stock imagery (Bean & Brew URLs match srikavyagelli.com/products.php) —— */
const IMG_BEAN_MORNING = "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=1200&q=80";
const IMG_BEAN_MIDNIGHT = "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1200&q=80";
const IMG_BEAN_VELVET = "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=1200&q=80";
const IMG_BEAN_ETHIOPIA = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1200&q=80";
const IMG_BEAN_COLOMBIA = "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&q=80";
const IMG_BEAN_SUMATRA = "https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=1200&q=80";
const IMG_BEAN_COSTA = "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1200&q=80";
const IMG_BEAN_MUG = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80";
const IMG_BEAN_GRINDER = "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=1200&q=80";
const IMG_BEAN_POUROVER = "https://images.unsplash.com/photo-1572119865084-43c285814d63?w=1200&q=80";

const IMG_KR_VIDEO1 = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=80";
/** Replaced 404ing photo-1542038787076 — Unsplash retired/redirect-broke that asset. */
const IMG_KR_VIDEO2 =
  "https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&w=1200&q=80";
const IMG_KR_PHOTO1 = "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=1200&q=80";
const IMG_KR_PHOTO2 = "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=1200&q=80";
const IMG_KR_BRAND1 = "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80";
const IMG_KR_BRAND2 = "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80";
/** Motion graphics tile — use a stable Unsplash still (avoids intermittent 404s on older photo IDs). */
const IMG_KR_MOTION = "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&w=1200&q=80";
/** Replaced 404ing photo-1574267432553 */
const IMG_KR_PKG =
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&w=1200&q=80";

const IMG_TR_BEACH = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_MOUNT = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_HONEY = "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_FAMILY = "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_CRUISE = "https://images.unsplash.com/photo-1541417904950-b855846fe074?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_CITY = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_WILD = "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_HERITAGE = "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_FLIGHT = "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=80";
const IMG_TR_HOTEL = "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=80";

const IMG_EDU1 = "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80";
const IMG_EDU2 = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1200&q=80";
const IMG_EDU3 = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80";
const IMG_EDU4 = "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&q=80";
const IMG_EDU5 = "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80";

export function getMarketplaceProductSeeds(map) {
  const rows = [
    /* —— Bean & Brew Co. (srikavyagelli.com/products.php) — 10 catalog SKUs + Subscribe & Save banner —— */
    P(
      map,
      "srikavya-enterprise",
      "morning-sunrise-blend",
      "Morning Sunrise Blend",
      "Bright and smooth with citrus + caramel notes.",
      "Signature house blend — expertly crafted for daily brewing.",
      IMG_BEAN_MORNING,
      "Coffee",
      920,
      4.92,
      48
    ),
    P(
      map,
      "srikavya-enterprise",
      "midnight-espresso",
      "Midnight Espresso",
      "Bold espresso roast with chocolate undertones.",
      "Dark roast calibrated for espresso drinks.",
      IMG_BEAN_MIDNIGHT,
      "Coffee",
      880,
      4.88,
      42
    ),
    P(
      map,
      "srikavya-enterprise",
      "velvet-reserve",
      "Velvet Reserve",
      "Smoky, bold, and velvety with a long finish.",
      "Staff pick blend with a rich, lingering finish.",
      IMG_BEAN_VELVET,
      "Coffee",
      760,
      4.85,
      38
    ),
    P(
      map,
      "srikavya-enterprise",
      "ethiopian-yirgacheffe",
      "Ethiopian Yirgacheffe",
      "Floral, fruity, bright acidity; blueberry + jasmine.",
      "Single-origin Ethiopian coffee with a bright, floral profile, wine-like cup character, and notes of blueberry and jasmine.",
      IMG_BEAN_ETHIOPIA,
      "Coffee",
      840,
      4.9,
      45
    ),
    P(
      map,
      "srikavya-enterprise",
      "colombian-supremo",
      "Colombian Supremo",
      "Balanced and sweet with a clean, smooth finish.",
      "Colombia microlot spotlight on balance.",
      IMG_BEAN_COLOMBIA,
      "Coffee",
      710,
      4.78,
      35
    ),
    P(
      map,
      "srikavya-enterprise",
      "sumatra-mandheling",
      "Sumatra Mandheling",
      "Earthy, full-bodied, low acidity; dark chocolate notes.",
      "Indonesian single-origin for depth lovers.",
      IMG_BEAN_SUMATRA,
      "Coffee",
      695,
      4.76,
      33
    ),
    P(
      map,
      "srikavya-enterprise",
      "costa-rican-tarrazu",
      "Costa Rican Tarrazú",
      "Bright and honey-sweet with citrus sparkle.",
      "High-grown Costa Rica with lively acidity.",
      IMG_BEAN_COSTA,
      "Coffee",
      668,
      4.8,
      31
    ),
    P(
      map,
      "srikavya-enterprise",
      "artisan-ceramic-mug",
      "Artisan Ceramic Mug",
      "Handcrafted 12oz mug — your daily ritual, elevated.",
      "Coffee accessory from the Brew Better collection.",
      IMG_BEAN_MUG,
      "Cafe Supplies",
      520,
      4.65,
      26
    ),
    P(
      map,
      "srikavya-enterprise",
      "precision-burr-grinder",
      "Precision Burr Grinder",
      "Conical burrs, 40 settings — fresh grounds, every time.",
      "Popular home barista upgrade.",
      IMG_BEAN_GRINDER,
      "Cafe Supplies",
      610,
      4.72,
      30
    ),
    P(
      map,
      "srikavya-enterprise",
      "pour-over-kit",
      "Pour Over Kit",
      "Everything you need to brew café-quality pour-over.",
      "Complete pour-over set.",
      IMG_BEAN_POUROVER,
      "Cafe Supplies",
      580,
      4.68,
      28
    ),
    P(
      map,
      "srikavya-enterprise",
      "subscribe-and-save-program",
      "Subscribe & Save Program",
      "Freshly roasted coffee delivered on your schedule — save 15% on every order.",
      "Matches Bean & Brew’s subscription CTA on products.php: customizable delivery cadence and recurring savings.",
      IMG_BEAN_MORNING,
      "Subscription",
      990,
      4.84,
      52
    ),

    /* —— Krativerse / Echo Creative Studio (krativerse.com + packages.php + homepage “What we do”) —— */
    P(
      map,
      "krativerse",
      "creative-treatment-pack-resonance",
      "Creative Treatment Pack (Resonance Finder)",
      "Personalized script outline, shot list, visual direction, and production plan — start with the free questionnaire.",
      "Mirrors the onsite flow: Resonance Finder → Treatment Pack → production. Positioning lines match krativerse.com positioning.",
      IMG_KR_BRAND1,
      "Creative Consultation",
      1120,
      4.9,
      46
    ),
    P(
      map,
      "krativerse",
      "video-commercial-spot-production",
      "Video Production — Commercial Spots",
      "High-impact commercials for television, web, and paid social.",
      "From krativerse.com Video Production: commercials and brand films with clear deliverables.",
      IMG_KR_VIDEO1,
      "Video Production",
      980,
      4.86,
      40
    ),
    P(
      map,
      "krativerse",
      "video-documentary-story-production",
      "Video Production — Documentary & Long-Form Story",
      "Documentary and cinematic storytelling that builds emotional connection.",
      "Covers the “documentaries” and “cinematic storytelling” line on the Krativerse homepage.",
      IMG_KR_VIDEO2,
      "Video Production",
      870,
      4.82,
      36
    ),
    P(
      map,
      "krativerse",
      "video-corporate-communications",
      "Video Production — Corporate & Brand Films",
      "Corporate videos, explainers, and internal communications with polish.",
      "Aligned with “corporate videos” in the Video Production section.",
      IMG_KR_VIDEO1,
      "Video Production",
      910,
      4.79,
      38
    ),
    P(
      map,
      "krativerse",
      "photography-brand-editorial",
      "Photography — Brand & Editorial Shoots",
      "Stunning visuals for brands and editorial-style campaigns.",
      "From krativerse.com Photography: brand and editorial content.",
      IMG_KR_PHOTO1,
      "Photography",
      830,
      4.77,
      34
    ),
    P(
      map,
      "krativerse",
      "photography-events-coverage",
      "Photography — Live Events & Experiences",
      "Event coverage with fast turnaround selects for social and press.",
      "Covers the “events” focus in the Photography block.",
      IMG_KR_PHOTO2,
      "Photography",
      760,
      4.74,
      32
    ),
    P(
      map,
      "krativerse",
      "branding-identity-design-studio",
      "Creative Branding — Identity & Visual Systems",
      "Identity design and visual systems that build recognition.",
      "Mirrors “Creative Branding: identity design” on the homepage.",
      IMG_KR_BRAND2,
      "Creative Branding",
      720,
      4.81,
      33
    ),
    P(
      map,
      "krativerse",
      "branding-motion-graphics-suite",
      "Creative Branding — Motion Graphics",
      "Motion graphics packages for logo stings, UI promos, and social cutdowns.",
      "Directly from the Creative Branding description: motion graphics support.",
      IMG_KR_MOTION,
      "Creative Branding",
      690,
      4.75,
      30
    ),
    P(
      map,
      "krativerse",
      "starter-package-video-social",
      "Starter Package — From $5,000",
      "1 video up to 60s · 2 cuts (16:9 + 9:16) · 1-day shoot · script + shot list · 2 revision rounds.",
      "Verbatim tier from krativerse.com/packages.php (Starter).",
      IMG_KR_PKG,
      "Creative Package",
      1050,
      4.88,
      44
    ),
    P(
      map,
      "krativerse",
      "growth-package-hero-social",
      "Growth Package — From $15,000",
      "1 hero + 3 social cuts · 4 formats · 2-day shoot · treatment + storyboard · b-roll library.",
      "Verbatim tier from packages.php — labeled “Most Popular” on site.",
      IMG_KR_PKG,
      "Creative Package",
      980,
      4.92,
      42
    ),
    P(
      map,
      "krativerse",
      "scale-package-campaign-suite",
      "Scale Package — From $40,000",
      "Campaign suite (3–5 videos), all platform formats, 3–5 day shoot, dedicated producer, extended delivery window.",
      "Verbatim Scale tier from packages.php.",
      IMG_KR_VIDEO2,
      "Creative Package",
      890,
      4.9,
      39
    ),

    /* —— Seaside Travels (surbhisingh.com/travel-agency/services.php) — 10 listings —— */
    P(
      map,
      "travel-agency",
      "beach-holiday-package",
      "Beach Holiday Package",
      "Relax in handpicked beach resorts with curated activities, smooth transfers, and sunset experiences.",
      "Relax in handpicked beach resorts with curated activities, smooth transfers, and sunset experiences — season-dependent pricing on the partner site.",
      IMG_TR_BEACH,
      "Travel",
      1180,
      4.83,
      41
    ),
    P(
      map,
      "travel-agency",
      "mountain-adventure-tour",
      "Mountain Adventure Tour",
      "Explore scenic mountain routes with guided trekking plans, cozy stays, and adventure-ready itineraries.",
      "Explore scenic mountain routes with guided trekking plans, cozy stays, and adventure-ready itineraries.",
      IMG_TR_MOUNT,
      "Travel",
      1010,
      4.78,
      36
    ),
    P(
      map,
      "travel-agency",
      "honeymoon-escape-package",
      "Honeymoon Escape Package",
      "Celebrate your new beginning with intimate stays, private experiences, and memorable romantic moments.",
      "Celebrate your new beginning with intimate stays, private experiences, and memorable romantic moments.",
      IMG_TR_HONEY,
      "Travel",
      970,
      4.81,
      39
    ),
    P(
      map,
      "travel-agency",
      "family-vacation-package",
      "Family Vacation Package",
      "Kid-friendly and senior-friendly itineraries with balanced sightseeing, rest time, and support.",
      "Kid-friendly and senior-friendly itineraries with balanced sightseeing, rest time, and support — pricing varies by family size and destination.",
      IMG_TR_FAMILY,
      "Travel",
      760,
      4.73,
      32
    ),
    P(
      map,
      "travel-agency",
      "luxury-cruise-journey",
      "Luxury Cruise Journey",
      "Premium cruising with fine dining, ocean-view suites, curated ports, and concierge support.",
      "Premium cruising with fine dining, ocean-view suites, curated ports, and concierge support.",
      IMG_TR_CRUISE,
      "Travel",
      930,
      4.79,
      37
    ),
    P(
      map,
      "travel-agency",
      "city-explorer-tour",
      "City Explorer Tour",
      "Discover vibrant city life with paced itineraries, curated attractions, and central accommodations.",
      "Discover vibrant city life with paced itineraries, curated attractions, and central accommodations.",
      IMG_TR_CITY,
      "Travel",
      690,
      4.71,
      30
    ),
    P(
      map,
      "travel-agency",
      "wildlife-safari-experience",
      "Wildlife Safari Experience",
      "National parks and reserves with professional safari planning and eco-conscious stays.",
      "National parks and reserves with professional safari planning and eco-conscious stays.",
      IMG_TR_WILD,
      "Travel",
      815,
      4.76,
      34
    ),
    P(
      map,
      "travel-agency",
      "cultural-heritage-trip",
      "Cultural Heritage Trip",
      "Heritage circuits, local guides, and deeply enriching experiences.",
      "Heritage circuits, local guides, and deeply enriching experiences.",
      IMG_TR_HERITAGE,
      "Travel",
      645,
      4.72,
      29
    ),
    P(
      map,
      "travel-agency",
      "flight-booking-service",
      "Flight Booking Service",
      "Domestic and international flights with route guidance, fare comparisons, and schedule optimization.",
      "Full-service flight support: route guidance, fare comparisons, and schedule optimization. Fees and fares depend on airline and route.",
      IMG_TR_FLIGHT,
      "Travel Booking",
      1100,
      4.7,
      35
    ),
    P(
      map,
      "travel-agency",
      "hotel-reservation-service",
      "Hotel Reservation Service",
      "Verified hotels and resorts with location-first recommendations and transparent options.",
      "Verified hotels and resorts with location-first recommendations; rates depend on city, dates, and room class.",
      IMG_TR_HOTEL,
      "Travel Booking",
      1020,
      4.68,
      33
    ),

    /* —— Nexus Academy (geeshitha.com/nexus-academy/ homepage catalog) —— */
    P(
      map,
      "nexus-academy",
      "introduction-to-computer-science",
      "Introduction to Computer Science",
      "Core CS foundations with Professor Dr. Sarah Chen — popular catalog pick.",
      "Listed under “Popular” on the Nexus homepage with instructor-select positioning.",
      IMG_EDU1,
      "Education",
      890,
      4.82,
      41
    ),
    P(
      map,
      "nexus-academy",
      "data-structures-algorithms",
      "Data Structures & Algorithms",
      "Rigorous DSA progression with Prof. James Wilson.",
      "Homepage-listed class — gateway to technical interviews and systems thinking.",
      IMG_EDU5,
      "Education",
      870,
      4.79,
      39
    ),
    P(
      map,
      "nexus-academy",
      "machine-learning-fundamentals",
      "Machine Learning Fundamentals",
      "ML pillars and practice with Dr. Maya Patel.",
      "Featured “Popular” class; site news references Dr. Patel leading ML/AI tracks.",
      IMG_EDU3,
      "Education",
      920,
      4.85,
      43
    ),
    P(
      map,
      "nexus-academy",
      "web-development-design",
      "Web Development & Design",
      "Full-stack-aware web curriculum with Prof. Alex Rivera.",
      "Homepage class; news notes Rivera’s web dev offerings.",
      IMG_EDU2,
      "Education",
      910,
      4.8,
      40
    ),
    P(
      map,
      "nexus-academy",
      "database-systems",
      "Database Systems",
      "Modeling, SQL, and integrity with Dr. Emily Foster.",
      "Directly from the public class grid on nexus-academy/.",
      IMG_EDU5,
      "Education",
      780,
      4.74,
      34
    ),
    P(
      map,
      "nexus-academy",
      "software-engineering",
      "Software Engineering",
      "Process, design, and delivery with Prof. David Kim.",
      "Homepage-listed capstone-oriented engineering class.",
      IMG_EDU4,
      "Education",
      850,
      4.77,
      37
    ),
  ];
  return rows.map((row) => ({
    ...row,
    listing_details: LISTING_DETAILS_BY_SLUG[row.slug] ?? null,
  }));
}
