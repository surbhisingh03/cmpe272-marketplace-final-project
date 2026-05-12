import { Link } from "react-router-dom";

const BENEFIT_LINES = [
  "Browse listings, reviews, and rankings across every partner storefront.",
  "Track visits and favorites with one sign-in—no juggling multiple accounts.",
  "Pick up your marketplace journey on any device, anytime.",
];

const COMPANY_PILLS = ["Nexus Academy", "Travel Agency", "Kavya's site", "Krativerse"];

const panelGrad = "linear-gradient(135deg, #1a0533 0%, #0f1a4e 100%)";

export default function AuthSplitLayout({ activeTab, children }) {
  const tabBase = "pb-3 text-[15px] transition-colors";
  const tabActive = `${tabBase} border-b-2 border-[#7c3aed] font-bold text-[#7c3aed]`;
  const tabInactive = `${tabBase} border-b-2 border-transparent font-medium text-[#9ca3af] hover:text-slate-600`;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:min-h-[calc(100svh-54px)] lg:flex-row">
      {/* Left — hidden on mobile */}
      <aside
        className="relative hidden w-full flex-col overflow-hidden lg:flex lg:min-h-[calc(100svh-54px)] lg:w-[38%] lg:max-w-none lg:shrink-0"
        style={{ background: panelGrad, padding: "48px 36px" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 220,
            height: 220,
            background: "rgba(167,139,250,0.15)",
            filter: "blur(50px)",
            top: "-30px",
            right: "-40px",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 160,
            height: 160,
            background: "rgba(96,165,250,0.1)",
            filter: "blur(35px)",
            bottom: "-20px",
            left: "-30px",
          }}
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <h1
            className="whitespace-pre-line font-display text-white"
            style={{ fontWeight: 800, fontSize: "clamp(1.85rem, 3.2vw, 2.35rem)", lineHeight: 1.15 }}
          >
            One account,{"\n"}every company.
          </h1>

          <ul className="mt-10 list-none space-y-5 p-0">
            {BENEFIT_LINES.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-snug text-white/90">
                <span className="shrink-0 font-semibold" style={{ color: "#a78bfa" }}>
                  ✦
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap gap-2 pt-12">
            {COMPANY_PILLS.map((name) => (
              <span
                key={name}
                className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </aside>

      {/* Right */}
      <main
        className="flex w-full flex-1 flex-col bg-white lg:min-h-[calc(100svh-54px)] lg:w-[62%] lg:shrink-0"
        style={{ padding: "48px 40px" }}
      >
        <div className="mb-8 flex gap-10 border-b border-neutral-100">
          <Link to="/login" className={activeTab === "signin" ? tabActive : tabInactive}>
            Sign in
          </Link>
          <Link to="/signup" className={activeTab === "signup" ? tabActive : tabInactive}>
            Create account
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
