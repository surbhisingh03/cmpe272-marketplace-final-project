import { Link } from "react-router-dom";
import { PARTNER_ORIGINAL_WEBSITE_BY_JOURNEY_ID } from "../../lib/marketplaceUserTracking.js";

const FOOTER_GRADIENT = "linear-gradient(135deg, #1a0533 0%, #0f1a4e 100%)";

const quickLinkClass =
  "text-[13px] font-medium text-white no-underline transition-colors hover:text-[#a78bfa]";

const memberLinkClass =
  "block text-[13px] font-medium text-white no-underline transition-colors hover:text-[#a78bfa]";

/** Display labels aligned with marketplace hub partner naming */
const MEMBER_COMPANIES = [
  { journeyId: "nexus-academy", label: "Nexus Academy" },
  { journeyId: "seaside-travels", label: "Travel Agency" },
  { journeyId: "bean-brew", label: "Kavya's Co." },
  { journeyId: "krativerse", label: "Krativerse" },
];

export default function MarketingFooter() {
  return (
    <footer style={{ background: FOOTER_GRADIENT }}>
      <div className="mx-auto max-w-7xl" style={{ padding: "40px 28px 24px" }}>
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-12">
          {/* Brand */}
          <div className="min-w-0">
            <Link to="/" className="inline-flex max-w-full items-center gap-2.5 no-underline">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{
                  background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                  boxShadow: "none",
                }}
              >
                FH
              </div>
              <span className="truncate text-base font-bold leading-none text-white">FusionHub</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              One account. Four companies. Complete marketplace experience.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Quick links</p>
            <nav className="flex flex-col gap-3">
              <Link to="/" className={quickLinkClass}>
                Home
              </Link>
              <Link to="/marketplace/explore" className={quickLinkClass}>
                Browse
              </Link>
              <Link to="/leaderboards" className={quickLinkClass}>
                Top 5
              </Link>
              <Link to="/signup" className={quickLinkClass}>
                Register
              </Link>
            </nav>
          </div>

          {/* Member companies */}
          <div>
            <p className="mb-4 text-[11px] font-bold uppercase tracking-widest text-white/60">Member companies</p>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {MEMBER_COMPANIES.map(({ journeyId, label }) => {
                const href = PARTNER_ORIGINAL_WEBSITE_BY_JOURNEY_ID[journeyId];
                if (!href) return null;
                return (
                  <li key={journeyId} className="list-none">
                    <a href={href} target="_blank" rel="noopener noreferrer" className={memberLinkClass}>
                      {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div
          className="mt-10 border-t pt-6 text-center"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.45)" }}>
            © 2026 ShopVerse · Built for CIS Term Project
          </p>
        </div>
      </div>
    </footer>
  );
}
