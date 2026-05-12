import MarketingFooter from "./MarketingFooter.jsx";
import MarketingNav from "./MarketingNav.jsx";

/** Same shell as the home page: light canvas, marketing nav + footer */
export default function PublicShell({ children }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827] antialiased">
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
