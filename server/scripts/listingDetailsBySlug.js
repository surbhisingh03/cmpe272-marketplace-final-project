/**
 * Structured listing metadata for marketplace detail pages (price block + detail grid).
 * `kind` drives section title: coffee → Product details, academy → Course details, else → Listing details.
 */

/** @typedef {{ kind: 'coffee'|'creative'|'travel'|'academy', pricePrimary: string|null, priceSecondary: string|null, rows: { label: string, value: string }[] }} ListingDetails */

/** @type {Record<string, ListingDetails>} */
export const LISTING_DETAILS_BY_SLUG = {
  /* Bean & Brew — coffee */
  "morning-sunrise-blend": {
    kind: "coffee",
    pricePrimary: "$16.99",
    priceSecondary: "12oz bag",
    rows: [
      { label: "Origin", value: "Latin America blend" },
      { label: "Roast", value: "Medium" },
      { label: "Size", value: "12oz" },
      { label: "Flavor Notes", value: "Citrus, caramel, milk chocolate" },
      { label: "Type", value: "Whole Bean Coffee" },
    ],
  },
  "midnight-espresso": {
    kind: "coffee",
    pricePrimary: "$17.99",
    priceSecondary: "12oz bag",
    rows: [
      { label: "Origin", value: "Brazil & Colombia" },
      { label: "Roast", value: "Dark" },
      { label: "Size", value: "12oz" },
      { label: "Flavor Notes", value: "Dark chocolate, molasses" },
      { label: "Type", value: "Whole Bean Coffee" },
    ],
  },
  "velvet-reserve": {
    kind: "coffee",
    pricePrimary: "$18.99",
    priceSecondary: "12oz bag",
    rows: [
      { label: "Origin", value: "Signature blend" },
      { label: "Roast", value: "Dark" },
      { label: "Size", value: "12oz" },
      { label: "Flavor Notes", value: "Smoky, cocoa, long finish" },
      { label: "Type", value: "Whole Bean Coffee" },
    ],
  },
  "ethiopian-yirgacheffe": {
    kind: "coffee",
    pricePrimary: "$19.99",
    priceSecondary: "12oz bag",
    rows: [
      { label: "Origin", value: "Ethiopia" },
      { label: "Roast", value: "Medium" },
      { label: "Size", value: "12oz" },
      { label: "Flavor Notes", value: "Blueberry, jasmine, citrus" },
      { label: "Type", value: "Whole Bean Coffee" },
    ],
  },
  "colombian-supremo": {
    kind: "coffee",
    pricePrimary: "$17.99",
    priceSecondary: "12oz bag",
    rows: [
      { label: "Origin", value: "Colombia" },
      { label: "Roast", value: "Medium" },
      { label: "Size", value: "12oz" },
      { label: "Flavor Notes", value: "Brown sugar, clean finish" },
      { label: "Type", value: "Whole Bean Coffee" },
    ],
  },
  "sumatra-mandheling": {
    kind: "coffee",
    pricePrimary: "$18.99",
    priceSecondary: "12oz bag",
    rows: [
      { label: "Origin", value: "Sumatra, Indonesia" },
      { label: "Roast", value: "Dark" },
      { label: "Size", value: "12oz" },
      { label: "Flavor Notes", value: "Earth, dark chocolate" },
      { label: "Type", value: "Whole Bean Coffee" },
    ],
  },
  "costa-rican-tarrazu": {
    kind: "coffee",
    pricePrimary: "$19.99",
    priceSecondary: "12oz bag",
    rows: [
      { label: "Origin", value: "Costa Rica · Tarrazú" },
      { label: "Roast", value: "Medium" },
      { label: "Size", value: "12oz" },
      { label: "Flavor Notes", value: "Honey, citrus sparkle" },
      { label: "Type", value: "Whole Bean Coffee" },
    ],
  },
  "artisan-ceramic-mug": {
    kind: "coffee",
    pricePrimary: "$24.99",
    priceSecondary: "12oz mug",
    rows: [
      { label: "Origin", value: "—" },
      { label: "Roast", value: "—" },
      { label: "Size", value: "12oz capacity" },
      { label: "Flavor Notes", value: "—" },
      { label: "Type", value: "Ceramic drinkware" },
    ],
  },
  "precision-burr-grinder": {
    kind: "coffee",
    pricePrimary: "$89.99",
    priceSecondary: "Conical burr",
    rows: [
      { label: "Origin", value: "—" },
      { label: "Roast", value: "—" },
      { label: "Size", value: "40 grind settings" },
      { label: "Flavor Notes", value: "—" },
      { label: "Type", value: "Electric burr grinder" },
    ],
  },
  "pour-over-kit": {
    kind: "coffee",
    pricePrimary: "$129.99",
    priceSecondary: "Full kit",
    rows: [
      { label: "Origin", value: "—" },
      { label: "Roast", value: "—" },
      { label: "Size", value: "Multi-piece set" },
      { label: "Flavor Notes", value: "—" },
      { label: "Type", value: "Pour-over brewing set" },
    ],
  },
  "subscribe-and-save-program": {
    kind: "coffee",
    pricePrimary: "15% off",
    priceSecondary: "Every delivery",
    rows: [
      { label: "Origin", value: "Rotating & subscriber picks" },
      { label: "Roast", value: "Your choice" },
      { label: "Size", value: "12oz default" },
      { label: "Flavor Notes", value: "Varies by selection" },
      { label: "Type", value: "Coffee subscription" },
    ],
  },

  /* Krativerse — creative */
  "creative-treatment-pack-resonance": {
    kind: "creative",
    pricePrimary: "Custom quote",
    priceSecondary: "After questionnaire",
    rows: [
      { label: "Starting price", value: "Project-based" },
      { label: "Deliverables", value: "Script outline, shot list, visual direction, production plan" },
      { label: "Turnaround time", value: "5–10 business days (typical)" },
      { label: "Service type", value: "Creative consultation" },
    ],
  },
  "video-commercial-spot-production": {
    kind: "creative",
    pricePrimary: "From $8,500",
    priceSecondary: "Commercial tier",
    rows: [
      { label: "Starting price", value: "From $8,500" },
      { label: "Deliverables", value: "Master spot, cutdowns as scoped" },
      { label: "Turnaround time", value: "4–8 weeks" },
      { label: "Service type", value: "Video production" },
    ],
  },
  "video-documentary-story-production": {
    kind: "creative",
    pricePrimary: "From $12,000",
    priceSecondary: "Long-form",
    rows: [
      { label: "Starting price", value: "From $12,000" },
      { label: "Deliverables", value: "Long-form film, chapters, archival as agreed" },
      { label: "Turnaround time", value: "8–16 weeks" },
      { label: "Service type", value: "Documentary & story" },
    ],
  },
  "video-corporate-communications": {
    kind: "creative",
    pricePrimary: "From $6,500",
    priceSecondary: "Corporate",
    rows: [
      { label: "Starting price", value: "From $6,500" },
      { label: "Deliverables", value: "Brand film, explainers, internal cuts" },
      { label: "Turnaround time", value: "3–6 weeks" },
      { label: "Service type", value: "Corporate video" },
    ],
  },
  "photography-brand-editorial": {
    kind: "creative",
    pricePrimary: "From $2,800",
    priceSecondary: "Half / full day",
    rows: [
      { label: "Starting price", value: "From $2,800" },
      { label: "Deliverables", value: "Edited selects, color, web & print license" },
      { label: "Turnaround time", value: "7–14 days" },
      { label: "Service type", value: "Brand & editorial photography" },
    ],
  },
  "photography-events-coverage": {
    kind: "creative",
    pricePrimary: "From $1,900",
    priceSecondary: "Event coverage",
    rows: [
      { label: "Starting price", value: "From $1,900" },
      { label: "Deliverables", value: "Event gallery, social selects" },
      { label: "Turnaround time", value: "3–7 days" },
      { label: "Service type", value: "Live event photography" },
    ],
  },
  "branding-identity-design-studio": {
    kind: "creative",
    pricePrimary: "From $4,500",
    priceSecondary: "Identity system",
    rows: [
      { label: "Starting price", value: "From $4,500" },
      { label: "Deliverables", value: "Logo system, palette, type, usage guide" },
      { label: "Turnaround time", value: "4–8 weeks" },
      { label: "Service type", value: "Creative branding" },
    ],
  },
  "branding-motion-graphics-suite": {
    kind: "creative",
    pricePrimary: "From $3,200",
    priceSecondary: "Motion package",
    rows: [
      { label: "Starting price", value: "From $3,200" },
      { label: "Deliverables", value: "Logo sting, UI promos, social cutdowns" },
      { label: "Turnaround time", value: "2–5 weeks" },
      { label: "Service type", value: "Motion graphics" },
    ],
  },
  "starter-package-video-social": {
    kind: "creative",
    pricePrimary: "From $5,000",
    priceSecondary: "Starter tier",
    rows: [
      { label: "Starting price", value: "From $5,000" },
      { label: "Deliverables", value: "1× 60s video, 2 cuts (16:9 + 9:16), 1-day shoot, script, 2 revisions" },
      { label: "Turnaround time", value: "3–5 weeks" },
      { label: "Service type", value: "Creative package" },
    ],
  },
  "growth-package-hero-social": {
    kind: "creative",
    pricePrimary: "From $15,000",
    priceSecondary: "Growth tier",
    rows: [
      { label: "Starting price", value: "From $15,000" },
      { label: "Deliverables", value: "1 hero + 3 social cuts, 4 formats, 2-day shoot, storyboard, b-roll" },
      { label: "Turnaround time", value: "5–8 weeks" },
      { label: "Service type", value: "Creative package" },
    ],
  },
  "scale-package-campaign-suite": {
    kind: "creative",
    pricePrimary: "From $40,000",
    priceSecondary: "Campaign suite",
    rows: [
      { label: "Starting price", value: "From $40,000" },
      { label: "Deliverables", value: "3–5 videos, all platform formats, 3–5 day shoot, producer" },
      { label: "Turnaround time", value: "8–14 weeks" },
      { label: "Service type", value: "Creative package" },
    ],
  },

  /* Seaside Travels */
  "beach-holiday-package": {
    kind: "travel",
    pricePrimary: "From ₹44,999",
    priceSecondary: "Per person",
    rows: [
      { label: "Starting price", value: "From ₹44,999 pp (season dependent)" },
      { label: "Duration", value: "5–7 nights (typical)" },
      { label: "Destination", value: "Coastal resorts (curated)" },
      { label: "Package type", value: "Beach holiday" },
    ],
  },
  "mountain-adventure-tour": {
    kind: "travel",
    pricePrimary: "From ₹38,499",
    priceSecondary: "Per person",
    rows: [
      { label: "Starting price", value: "From ₹38,499 pp" },
      { label: "Duration", value: "6–9 nights" },
      { label: "Destination", value: "Mountain regions" },
      { label: "Package type", value: "Adventure tour" },
    ],
  },
  "honeymoon-escape-package": {
    kind: "travel",
    pricePrimary: "From ₹59,999",
    priceSecondary: "Per couple",
    rows: [
      { label: "Starting price", value: "From ₹59,999 per couple" },
      { label: "Duration", value: "5–8 nights" },
      { label: "Destination", value: "Romantic destinations" },
      { label: "Package type", value: "Honeymoon" },
    ],
  },
  "family-vacation-package": {
    kind: "travel",
    pricePrimary: "Custom quote",
    priceSecondary: "Family pricing",
    rows: [
      { label: "Starting price", value: "Based on family size & destination" },
      { label: "Duration", value: "Flexible" },
      { label: "Destination", value: "Family-friendly regions" },
      { label: "Package type", value: "Family vacation" },
    ],
  },
  "luxury-cruise-journey": {
    kind: "travel",
    pricePrimary: "From ₹89,999",
    priceSecondary: "Per person",
    rows: [
      { label: "Starting price", value: "From ₹89,999 pp" },
      { label: "Duration", value: "Cruise-length" },
      { label: "Destination", value: "Premium cruise routes" },
      { label: "Package type", value: "Luxury cruise" },
    ],
  },
  "city-explorer-tour": {
    kind: "travel",
    pricePrimary: "From ₹34,999",
    priceSecondary: "Per person",
    rows: [
      { label: "Starting price", value: "From ₹34,999 pp" },
      { label: "Duration", value: "3–5 nights" },
      { label: "Destination", value: "Major cities" },
      { label: "Package type", value: "City tour" },
    ],
  },
  "wildlife-safari-experience": {
    kind: "travel",
    pricePrimary: "From ₹41,999",
    priceSecondary: "Per person",
    rows: [
      { label: "Starting price", value: "From ₹41,999 pp" },
      { label: "Duration", value: "4–7 nights" },
      { label: "Destination", value: "National parks & reserves" },
      { label: "Package type", value: "Safari" },
    ],
  },
  "cultural-heritage-trip": {
    kind: "travel",
    pricePrimary: "From ₹36,499",
    priceSecondary: "Per person",
    rows: [
      { label: "Starting price", value: "From ₹36,499 pp" },
      { label: "Duration", value: "5–8 nights" },
      { label: "Destination", value: "Heritage circuits" },
      { label: "Package type", value: "Cultural trip" },
    ],
  },
  "flight-booking-service": {
    kind: "travel",
    pricePrimary: "Fee + fare",
    priceSecondary: "Route-based",
    rows: [
      { label: "Starting price", value: "Service fee + airline fare" },
      { label: "Duration", value: "Trip-dependent" },
      { label: "Destination", value: "Domestic & international" },
      { label: "Package type", value: "Flight booking" },
    ],
  },
  "hotel-reservation-service": {
    kind: "travel",
    pricePrimary: "Varies",
    priceSecondary: "By stay",
    rows: [
      { label: "Starting price", value: "Depends on city, dates, room class" },
      { label: "Duration", value: "Nightly" },
      { label: "Destination", value: "Verified hotels worldwide" },
      { label: "Package type", value: "Hotel reservation" },
    ],
  },

  /* Nexus Academy */
  "introduction-to-computer-science": {
    kind: "academy",
    pricePrimary: "$149",
    priceSecondary: "Per course",
    rows: [
      { label: "Price", value: "$149" },
      { label: "Duration", value: "8 weeks (self-paced options)" },
      { label: "Level", value: "Beginner" },
      { label: "Format", value: "Online + assignments" },
      { label: "Certificate", value: "Certificate of completion" },
    ],
  },
  "data-structures-algorithms": {
    kind: "academy",
    pricePrimary: "$199",
    priceSecondary: "Per course",
    rows: [
      { label: "Price", value: "$199" },
      { label: "Duration", value: "10 weeks" },
      { label: "Level", value: "Intermediate" },
      { label: "Format", value: "Online + problem sets" },
      { label: "Certificate", value: "Certificate of completion" },
    ],
  },
  "machine-learning-fundamentals": {
    kind: "academy",
    pricePrimary: "$249",
    priceSecondary: "Per course",
    rows: [
      { label: "Price", value: "$249" },
      { label: "Duration", value: "10 weeks" },
      { label: "Level", value: "Intermediate" },
      { label: "Format", value: "Online + labs" },
      { label: "Certificate", value: "Certificate of completion" },
    ],
  },
  "web-development-design": {
    kind: "academy",
    pricePrimary: "$179",
    priceSecondary: "Per course",
    rows: [
      { label: "Price", value: "$179" },
      { label: "Duration", value: "9 weeks" },
      { label: "Level", value: "Beginner–intermediate" },
      { label: "Format", value: "Online + projects" },
      { label: "Certificate", value: "Certificate of completion" },
    ],
  },
  "database-systems": {
    kind: "academy",
    pricePrimary: "$189",
    priceSecondary: "Per course",
    rows: [
      { label: "Price", value: "$189" },
      { label: "Duration", value: "8 weeks" },
      { label: "Level", value: "Intermediate" },
      { label: "Format", value: "Online + SQL labs" },
      { label: "Certificate", value: "Certificate of completion" },
    ],
  },
  "software-engineering": {
    kind: "academy",
    pricePrimary: "$219",
    priceSecondary: "Per course",
    rows: [
      { label: "Price", value: "$219" },
      { label: "Duration", value: "10 weeks" },
      { label: "Level", value: "Intermediate" },
      { label: "Format", value: "Online + team project" },
      { label: "Certificate", value: "Certificate of completion" },
    ],
  },
};
