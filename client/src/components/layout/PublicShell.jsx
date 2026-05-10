import Navbar from "./Navbar.jsx";
import Footer from "./Footer.jsx";
import { useCatalog } from "../../context/CatalogContext.jsx";

export default function PublicShell({ children }) {
  const { companies, searchProducts } = useCatalog();
  return (
    <div className="min-h-screen bg-hub-bg dark:bg-hub-bg">
      <Navbar onSearchCompanies={companies} products={searchProducts} />
      {children}
      <Footer />
    </div>
  );
}
