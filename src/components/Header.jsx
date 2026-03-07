import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Heart,
  ChevronDown,
  LogOut,
  Package,
  LayoutDashboard,
} from 'lucide-react';
import Button from './Button';
import { navLinks } from '../data/mockData';
import { getCategories } from '../services/categoryService';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

export function PublicHeader({ cartCount = 0 }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const dropdownRef = useRef(null);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { count: wishlistCount } = useWishlist();

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      {/* Top bar */}
      <div className="bg-primary text-white text-xs py-1.5">
        <div className="container-main flex justify-between items-center">
          <span>✨ Free shipping on orders over $35 • Easy 30-day returns</span>
          <div className="flex items-center gap-4">
            <a href="tel:+91-9818267167" className="hover:underline">+91 9818267167</a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container-main">
        <div className="flex items-center justify-between h-16 gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-text-primary">
              Bluecare<span className="text-primary">Pharma</span>
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.hasDropdown) {
                return (
                  <div key={link.label} className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${dropdownOpen ? 'text-primary bg-primary-light' : 'text-text-secondary hover:text-primary hover:bg-gray-50'
                        }`}
                    >
                      {link.label}
                      <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-border rounded-xl shadow-lg py-2 animate-fade-in z-50">
                        {categories.map((cat) => (
                          <Link
                            key={cat.id}
                            to={`/products?category=${encodeURIComponent(cat.label || cat.name)}`}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-gray-50 transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt=""
                                onError={(e) => { e.target.style.display = 'none'; }}
                                className="w-8 h-8 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary font-bold text-xs">
                                <Box size={24} />
                              </div>
                            )}
                            <span className="font-medium">{cat.label || cat.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={link.path + link.label}
                  to={link.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname === link.path
                    ? 'text-primary bg-primary-light'
                    : 'text-text-secondary hover:text-primary hover:bg-gray-50'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/wishlist"
              className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-gray-50 transition-colors relative hidden sm:flex"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-gray-50 transition-colors relative"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth: Sign In button or User menu */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs ring-2 ring-primary/20">
                    {(user?.name || user?.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-text-primary hidden sm:block">
                    {(user?.name || user?.email || 'User').split(' ')[0]}
                  </span>
                  <ChevronDown size={14} className={`text-text-secondary transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-border rounded-xl shadow-lg py-2 animate-fade-in z-50">
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-primary font-bold hover:bg-primary-light transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard size={16} /> Admin Dashboard
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User size={16} /> My Account
                    </Link>
                    <Link
                      to="/orders"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Package size={16} /> My Orders
                    </Link>
                    <Link
                      to="/wishlist"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-primary hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Heart size={16} /> Wishlist
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button variant="primary" size="sm" icon={User} href="/signin">
                Sign In
              </Button>
            )}

            <button
              className="lg:hidden p-2 rounded-lg text-text-secondary hover:text-primary"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-white animate-fade-in">
          <div className="container-main py-4 space-y-1">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="block px-4 py-2.5 rounded-lg text-sm font-bold text-primary hover:bg-primary-light"
                onClick={() => setMobileOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
            {navLinks.filter((l) => !l.hasDropdown).map((link) => (
              <Link
                key={link.path + link.label}
                to={link.path}
                className="block px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-primary hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="px-4 py-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">Categories</div>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.label || cat.name)}`}
                className="block px-6 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-primary hover:bg-gray-50"
                onClick={() => setMobileOpen(false)}
              >
                {cat.label || cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

export function DashboardHeader({ title = 'My Account', breadcrumbs = [] }) {
  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="container-main">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <span className="text-xl font-bold text-text-primary">
                Bluecare<span className="text-primary">Pharma</span>
              </span>
            </Link>
            <span className="text-border">|</span>
            <span className="text-sm font-medium text-text-secondary">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="w-8 h-8 bg-primary-light rounded-full flex items-center justify-center">
                <User size={16} className="text-primary" />
              </div>
              <span className="text-sm font-medium hidden sm:block">My Account</span>
              <ChevronDown size={14} className="text-text-secondary" />
            </div>
          </div>
        </div>
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 pb-3 text-sm text-text-secondary">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-primary">{crumb.label}</Link>
                ) : (
                  <span className="text-text-primary font-medium">{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
