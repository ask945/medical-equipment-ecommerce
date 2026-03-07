import { useAuth } from './context/AuthContext';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { PublicHeader } from './components/Header';
import ScrollToTop from './components/ScrollToTop';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import SignInPage from './pages/SignInPage';
import WishlistPage from './pages/WishlistPage';
import MyOrdersPage from './pages/MyOrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/admin/AdminPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminAddProductPage from './pages/admin/AdminAddProductPage';
import AdminEditProductPage from './pages/admin/AdminEditProductPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminBrandsPage from './pages/admin/AdminBrandsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';

const dashboardRoutes = [
  '/invoices',
  '/admin',
  '/admin/orders',
  '/admin/products',
  '/admin/products/add',
  '/admin/users',
  '/admin/brands',
  '/admin/categories',
  '/admin/coupons',
  '/admin/banners',
  '/admin/announcements'
];

function AppLayout() {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;
  }

  // Check if current path starts with /admin/products/edit/
  const isDashboard = dashboardRoutes.some(path => location.pathname === path) ||
    location.pathname.startsWith('/admin/products/edit/');

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {!isDashboard && <PublicHeader />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />}>
            <Route index element={<div />} /> {/* Root handled by AdminPage's internal logic */}
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/add" element={<AdminAddProductPage />} />
            <Route path="products/edit/:id" element={<AdminEditProductPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="banners" element={<AdminBannersPage />} />
            <Route path="announcements" element={<AdminAnnouncementsPage />} />
          </Route>
        </Routes>
      </main>
      {!isDashboard && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WishlistProvider>
          <AppLayout />
        </WishlistProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
