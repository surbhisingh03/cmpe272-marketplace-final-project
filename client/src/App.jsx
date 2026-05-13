import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ExploreMarketplace from "./pages/ExploreMarketplace.jsx";
import ActivityPage from "./pages/ActivityPage.jsx";
import Leaderboards from "./pages/Leaderboards.jsx";
import SearchPage from "./pages/Search.jsx";
import CompanyDetail, { MarketplaceStorefrontPage } from "./pages/CompanyDetail.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import MarketplaceListingDetail from "./pages/MarketplaceListingDetail.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import DashboardLayout from "./layouts/DashboardLayout.jsx";
import DashboardHome from "./pages/dashboard/Home.jsx";
import DashboardCompanies from "./pages/dashboard/Companies.jsx";
import DashboardFavorites from "./pages/dashboard/Favorites.jsx";
import DashboardReviews from "./pages/dashboard/Reviews.jsx";
import DashboardAnalytics from "./pages/dashboard/Analytics.jsx";
import DashboardTopProducts from "./pages/dashboard/TopProducts.jsx";
import DashboardSettings from "./pages/dashboard/Settings.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminGuard from "./components/admin/AdminGuard.jsx";
import AdminMarketplaceLayout from "./layouts/AdminMarketplaceLayout.jsx";
import AdminMarketplaceHome from "./pages/admin/marketplace/AdminMarketplaceHome.jsx";
import AdminListingsPage from "./pages/admin/marketplace/AdminListingsPage.jsx";
import AdminUsersPage from "./pages/admin/marketplace/AdminUsersPage.jsx";
import AdminVisitsPage from "./pages/admin/marketplace/AdminVisitsPage.jsx";
import AdminActivityPage from "./pages/admin/marketplace/AdminActivityPage.jsx";
import AdminReviewsAdminPage from "./pages/admin/marketplace/AdminReviewsAdminPage.jsx";
import AdminRankingsPage from "./pages/admin/marketplace/AdminRankingsPage.jsx";
import AdminPartnersPage from "./pages/admin/marketplace/AdminPartnersPage.jsx";
import AdminSettingsPage from "./pages/admin/marketplace/AdminSettingsPage.jsx";
import MarketplaceReviews from "./pages/MarketplaceReviews.jsx";
import MarketplaceChatbot from "./components/MarketplaceChatbot.jsx";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/leaderboards" element={<Leaderboards />} />
        <Route path="/marketplace/explore" element={<ExploreMarketplace />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/marketplace/listing/:slug" element={<MarketplaceListingDetail />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/marketplace/storefront/:journeySlug" element={<MarketplaceStorefrontPage />} />
        <Route path="/marketplace/companies/:slug" element={<CompanyDetail />} />
        <Route path="/marketplace/products/:id" element={<ProductDetail />} />
        <Route path="/reviews" element={<MarketplaceReviews />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<DashboardHome />} />
          <Route path="companies" element={<DashboardCompanies />} />
          <Route path="favorites" element={<DashboardFavorites />} />
          <Route path="reviews" element={<DashboardReviews />} />
          <Route path="analytics" element={<DashboardAnalytics />} />
          <Route path="top-products" element={<DashboardTopProducts />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <AdminGuard>
              <AdminMarketplaceLayout />
            </AdminGuard>
          }
        >
          <Route index element={<AdminMarketplaceHome />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="visits" element={<AdminVisitsPage />} />
          <Route path="activity" element={<AdminActivityPage />} />
          <Route path="reviews" element={<AdminReviewsAdminPage />} />
          <Route path="listings" element={<AdminListingsPage />} />
          <Route path="rankings" element={<AdminRankingsPage />} />
          <Route path="partners" element={<AdminPartnersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <MarketplaceChatbot />
    </>
  );
}
