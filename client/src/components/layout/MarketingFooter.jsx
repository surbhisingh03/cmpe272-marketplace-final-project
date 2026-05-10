import { Link } from "react-router-dom";
import { MARKETPLACE_FOOTER_LINKS } from "../../constants/marketing.js";

export default function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-md">
            <div className="font-display text-xl font-semibold text-[#111827]">
              FusionHub Marketplace
            </div>
            <p className="mt-3 text-sm leading-relaxed text-[#6B7280]">
              One account. Four companies. Complete marketplace experience.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {MARKETPLACE_FOOTER_LINKS.map((l) => (
              <Link
                key={`${l.label}-${l.to}`}
                to={l.to}
                className="text-sm font-medium text-[#6B7280] transition hover:text-[#7C3AED]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-12 border-t border-slate-100 pt-8 text-center text-xs text-[#9CA3AF]">
          © {new Date().getFullYear()} FusionHub Marketplace. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
