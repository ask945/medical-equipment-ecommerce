import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Headphones,
  Truck,
  RefreshCw,
  Star,
  Quote,
  Stethoscope,
  UserCheck,
  Loader2,
} from 'lucide-react';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { getReviews } from '../services/reviewService';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const [prods, cats, revs] = await Promise.all([
          getProducts(),
          getCategories(),
          getReviews(),
        ]);
        setProducts(prods);
        setCategories(cats);
        setReviews(revs);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredReviews = reviewFilter === 'all'
    ? reviews
    : reviews.filter((r) => r.type === reviewFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Hero Section — lighter, welcoming gradient */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(19,91,236,0.08),transparent_60%)]" />
        <div className="container-main relative py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm font-medium mb-6 border border-primary/15 text-primary">
                <Shield size={14} />
                FDA Cleared &amp; Clinically Validated
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-6 text-text-primary">
                Your Health,
                <span className="block text-primary">Delivered to Your Door</span>
              </h1>
              <p className="text-lg text-text-secondary max-w-xl mb-8 leading-relaxed">
                Shop diabetes monitors, CPAP machines, blood pressure cuffs,
                and everyday health essentials — all from trusted brands, with
                free shipping and hassle-free returns.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" size="lg" iconRight={ArrowRight} href="/products">
                  Shop Now
                </Button>
              </div>
              {/* Mini trust badges under CTA */}
              <div className="flex items-center gap-5 mt-8 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5"><Shield size={14} className="text-primary" /> FDA Cleared</span>
                <span className="flex items-center gap-1.5"><Truck size={14} className="text-primary" /> Free Shipping</span>
                <span className="flex items-center gap-1.5"><RefreshCw size={14} className="text-primary" /> 30-Day Returns</span>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border">
                <img
                  src="/hero-banner.png"
                  alt="Person checking health vitals at home"
                  className="w-full h-[480px] object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-4 -left-4 bg-white text-text-primary rounded-xl p-4 shadow-xl animate-slide-up border border-border">
                <p className="text-2xl font-bold text-primary">500K+</p>
                <p className="text-xs text-text-secondary">Happy Customers</p>
              </div>
              <div className="absolute -top-3 -right-3 bg-white text-text-primary rounded-xl p-3 shadow-lg animate-slide-up border border-border">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} size={12} className="text-warning fill-warning" />)}
                </div>
                <p className="text-xs text-text-secondary mt-0.5">4.8 avg rating</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-white border-b border-border">
        <div className="container-main py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'FDA Cleared', sub: 'Clinically validated' },
              { icon: Truck, label: 'Free Shipping', sub: 'On orders over $35' },
              { icon: Headphones, label: 'Expert Support', sub: 'Licensed specialists' },
              { icon: RefreshCw, label: 'Easy Returns', sub: '30-day hassle-free' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="w-11 h-11 rounded-lg bg-primary-light flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                  <item.icon size={20} className="text-primary group-hover:text-white transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      {categories.length > 0 && (
        <section className="container-main py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Shop by Category</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Find everything you need for your health — from daily monitoring to long-term care
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.slice(0, 3).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${encodeURIComponent(cat.label || cat.name)}`}
                className="group relative rounded-xl overflow-hidden h-56 shadow-sm hover:shadow-xl transition-all duration-300"
              >
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt=""
                    onError={(e) => { e.target.style.display = 'none'; }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-light to-blue-50 group-hover:scale-110 transition-transform duration-700"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10 transition-opacity group-hover:opacity-90" />
                <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end">
                  <h3 className="text-white font-semibold text-lg">{cat.label || cat.name}</h3>
                  <p className="text-white/80 text-sm mt-1">{cat.count || 0} Products</p>
                </div>
              </Link>
            ))}
            <Link to="/products" className="group rounded-xl overflow-hidden h-56 border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all duration-300 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <ArrowRight className="text-primary" size={24} />
              </div>
              <h3 className="text-primary font-semibold text-lg">View All Categories</h3>
              <p className="text-primary/70 text-sm mt-1">Explore our entire catalog</p>
            </Link>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {products.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-main">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-text-primary mb-2">Popular Products</h2>
                <p className="text-text-secondary">Top-rated by customers like you</p>
              </div>
              <Button variant="secondary" href="/products" iconRight={ArrowRight}>
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews Section — Patient & Doctor Reviews */}
      {reviews.length > 0 && (
        <section className="container-main py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Trusted by Patients &amp; Doctors</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Real reviews from real people — healthcare professionals and patients who depend on our products every day
            </p>
            <div className="flex items-center justify-center gap-2 mt-6">
              {[
                { label: 'All Reviews', value: 'all' },
                { label: 'Patient Reviews', value: 'patient', icon: UserCheck },
                { label: 'Doctor Reviews', value: 'doctor', icon: Stethoscope },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setReviewFilter(tab.value)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${reviewFilter === tab.value
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-gray-100 text-text-secondary hover:bg-gray-200'
                    }`}
                >
                  {tab.icon && <tab.icon size={14} />}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl border border-border p-6 hover:shadow-md transition-shadow relative"
              >
                <Quote size={24} className="text-primary/15 absolute top-4 right-4" />
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-border"
                  />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{review.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${review.type === 'doctor'
                        ? 'bg-blue-50 text-blue-600'
                        : 'bg-green-50 text-green-600'
                        }`}>
                        {review.type === 'doctor' ? '🩺 Doctor' : '💚 Patient'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-text-secondary mb-2">{review.role}</p>
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className={i < review.rating ? 'text-warning fill-warning' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{review.text}</p>
                <p className="text-[11px] text-gray-400 mt-3">{review.date}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Subscribe & Save Banner */}
      <section className="container-main py-16">
        <div className="relative bg-gradient-to-r from-primary to-[#0e47c1] rounded-2xl overflow-hidden p-10 lg:p-14">
          <div className="absolute right-0 top-0 w-1/3 h-full opacity-10">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <circle cx="100" cy="100" r="80" fill="white" />
              <circle cx="100" cy="100" r="50" fill="none" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <div className="relative max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw size={20} className="text-white/80" />
              <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
                Never Run Out
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Subscribe &amp; Save up to 15%
            </h2>
            <p className="text-white/80 text-lg mb-8 leading-relaxed">
              Buy High Quality CGM sensors, test strips, CPAP
              filters, and other supplies. Free delivery on your schedule —
              skip or cancel anytime.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variant="white" size="lg" icon={Truck} href="/products">
                Browse Products
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
