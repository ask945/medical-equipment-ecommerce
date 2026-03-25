import { useAuth } from './context/AuthContext';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';
import { CartProvider } from './context/CartContext';
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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
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
import AdminCategoryReportPage from './pages/admin/AdminCategoryReportPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminBannersPage from './pages/admin/AdminBannersPage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import AdminOrderDetailPage from './pages/admin/AdminOrderDetailPage';
import AdminInquiriesPage from './pages/admin/AdminInquiriesPage';
import AdminQuotesPage from './pages/admin/AdminQuotesPage';
import WhatsAppButton from './components/WhatsAppButton';
import BlogPage from './pages/BlogPage';
import BlogDetailPage from './pages/BlogDetailPage';
import AdminBlogsPage from './pages/admin/AdminBlogsPage';
import AdminBlogDetailEditor from './pages/admin/AdminBlogDetailEditor';
import ServicesPage from './pages/ServicesPage';
import { DataProvider } from './context/DataContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  '/admin/inquiries',
  '/admin/quotes',
  '/admin/blog',
  '/admin/blog/add',
  // '/admin/banners',
  // '/admin/announcements'
];

function AppLayout() {
  const location = useLocation();
  const { loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div></div>;
  }

  // Check if current path is a sub-route of admin sections that have dynamic IDs
  const isDashboard = dashboardRoutes.some(path => location.pathname === path) ||
    location.pathname.startsWith('/admin/products/edit/') ||
    location.pathname.startsWith('/admin/blog/edit/') ||
    location.pathname.startsWith('/admin/orders/');

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
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogDetailPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/orders" element={<MyOrdersPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />}>
            <Route index element={<div />} /> {/* Root handled by AdminPage's internal logic */}
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/add" element={<AdminAddProductPage />} />
            <Route path="products/edit/:id" element={<AdminEditProductPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="brands" element={<AdminBrandsPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="categories/report" element={<AdminCategoryReportPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="inquiries" element={<AdminInquiriesPage />} />
            <Route path="quotes" element={<AdminQuotesPage />} />
            <Route path="blog" element={<AdminBlogsPage />} />
            <Route path="blog/add" element={<AdminBlogDetailEditor />} />
            <Route path="blog/edit/:id" element={<AdminBlogDetailEditor />} />
            {/* <Route path="banners" element={<AdminBannersPage />} /> */}
            {/* <Route path="announcements" element={<AdminAnnouncementsPage />} /> */}
          </Route>
        </Routes>
      </main>
      {!isDashboard && <Footer />}
      {!isDashboard && <WhatsAppButton />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        closeOnClick
        draggable
        pauseOnHover
        pauseOnFocusLoss={false}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <WishlistProvider>
            <CartProvider>
              <AppLayout />
            </CartProvider>
          </WishlistProvider>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
