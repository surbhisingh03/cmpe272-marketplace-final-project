import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-hub-surface/40 py-12">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 md:grid-cols-3 lg:px-6">
        <div>
          <div className="font-display text-lg font-semibold text-white">FusionHub Marketplace</div>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            One identity. Four enterprises. Unified discovery, reviews, and analytics across your
            cross-domain journey.
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Explore
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <Link className="hover:text-white" to="/leaderboards">
                Global leaderboards
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/marketplace/companies/srikavya-enterprise">
                Bean &amp; Brew Co.
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/marketplace/companies/krativerse">
                Krativerse
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/marketplace/companies/travel-agency">
                Seaside Travels
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/marketplace/companies/nexus-academy">
                Nexus Academy
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Systems
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>
              <Link className="hover:text-white" to="/dashboard">
                User command
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/admin">
                Admin observatory
              </Link>
            </li>
            <li>
              <a className="hover:text-white" href="https://srikavyagelli.com/index.php">
                Partner: Bean &amp; Brew
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-6 text-center text-xs text-slate-500 lg:px-6">
        © {new Date().getFullYear()} FusionHub — Cross-domain enterprise marketplace demonstration.
      </div>
    </footer>
  );
}
