import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Shield,
  Headphones,
  Truck,
  RefreshCw,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { useData } from '../context/DataContext';

export default function HomePage() {
  const { products: dataProducts, categories: dataCategories, blogs, productsLoading, categoriesLoading, blogsLoading } = useData();
  const [activeFaq, setActiveFaq] = useState(0);

  // Compute categories with product counts
  const normalize = (str) => (str || '').toLowerCase().replace(/\s+/g, '-');
  const categories = dataCategories.map(cat => {
    const count = dataProducts.filter(p => {
      const prodCatId = (p.categoryId || p.category || p.type || '');
      const prodCatName = normalize(p.category || p.type || '');
      return (
        cat.id === prodCatId ||
        normalize(cat.label || '') === prodCatName ||
        normalize(cat.label || '') === normalize(prodCatId) ||
        normalize(cat.id || '') === prodCatName ||
        normalize(cat.id || '') === normalize(prodCatId)
      );
    }).length;
    return { ...cat, count };
  });
  const products = dataProducts;
  const loading = productsLoading || categoriesLoading || blogsLoading;

  const faqs = [
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-5 business days. We also offer express shipping options that deliver within 1-2 business days across India."
    },
    {
      question: "Are your products FDA cleared?",
      answer: "Yes, all our medical equipment, including glucose monitors and CPAP machines, are clinically validated for accuracy and safety."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Absolutely! You have full control over your subscriptions. You can skip a delivery, change the frequency, or cancel entirely from your account dashboard."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day hassle-free return policy for unused and unopened products. If you receive a defective item, we'll provide a full replacement or refund immediately."
    }
  ];

  // Handle hash scroll
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [window.location.hash]);

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
                Clinically Validated &amp; Trusted
              </span>
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-6 text-text-primary">
                Complete Diabetes Care
                <span className="block text-primary">Delivered at Home</span>
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
            </div>
            <div className="hidden lg:block relative">
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border">
                <img
                  src="/hero-banner.png"
                  alt="Person checking health vitals at home"
                  className="w-full h-[480px] object-cover"
                />
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
              { icon: Shield, label: 'Quality Certified', sub: 'Clinically validated' },
              { icon: Truck, label: 'Free Shipping', sub: 'On orders over ₹500' },
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

      {/* FAQ Section */}
      <section id="faqs" className="bg-gray-50 py-16 border-y border-border">
        <div className="container-main max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-3">Frequently Asked Questions</h2>
            <p className="text-text-secondary">Everything you need to know about our products and services</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-md"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? -1 : index)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50/50"
                >
                  <span className="font-semibold text-text-primary">{faq.question}</span>
                  <div className={`transition-transform duration-300 ${activeFaq === index ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} className="text-primary" />
                  </div>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${activeFaq === index ? 'max-h-96' : 'max-h-0'
                    }`}
                >
                  <div className="p-6 pt-2 text-text-secondary border-t border-border/40 bg-gray-50/50 leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="bg-white py-16">
        <div className="container-main">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">Health & Wellness Blog</h2>
              <p className="text-text-secondary">Expert tips and latest medical news</p>
            </div>
            <Button variant="secondary" href="/blog" iconRight={ArrowRight}>
              View All Posts
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.slice(0, 3).map((blog) => (
              <Link
                key={blog.id}
                to={`/blog/${blog.id}`}
                className="group bg-white rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={blog.image || blog.imageUrl || blog.coverImage}
                    alt={blog.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs text-text-secondary mb-2">
                    {blog.createdAt instanceof Date
                      ? blog.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : (blog.createdAt?.toDate
                        ? blog.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '')}
                  </p>
                  <h3 className="text-lg font-bold text-text-primary mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {blog.excerpt || blog.summary || blog.description}
                  </p>
                  <span className="text-primary font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read Article <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

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
              Get 15% offer on Subscriptions.
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
