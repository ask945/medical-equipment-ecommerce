import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCw,
  DollarSign,
  Calendar,
  Pause,
  Play,
  SkipForward,
  Edit3,
  Truck,
  Plus,
  Shield,
  Clock,
  CheckCircle,
  Package,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { PublicHeader } from '../components/Header';
import Footer from '../components/Footer';
import KPICard from '../components/KPICard';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import { getProducts } from '../services/productService';

export default function RecurringSupplyPage() {
  const [subs, setSubs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const prods = await getProducts();
        setProducts(prods);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const selected = subs.find((s) => s.id === selectedId);
  const activeSubs = subs.filter((s) => s.status === 'active').length;
  const monthlySpend = subs
    .filter((s) => s.status === 'active')
    .reduce((s, sub) => s + sub.price * sub.quantity, 0);
  const nextDelivery =
    subs
      .filter((s) => s.status === 'active')
      .sort((a, b) => a.nextDelivery.localeCompare(b.nextDelivery))[0]
      ?.nextDelivery || '—';

  const toggleStatus = (id) => {
    setSubs((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === 'active' ? 'paused' : 'active' }
          : s
      )
    );
  };

  // Suggest products the user can add to auto-refill
  const suggestedProducts = products.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary to-[#0e47c1] text-white py-12">
        <div className="container-main">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw size={20} className="text-white/80" />
                <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
                  Auto-Refills
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Never Run Out of Your Essentials
              </h1>
              <p className="text-white/70 max-w-xl">
                Set up automatic deliveries for your health supplies. Save up to
                15%, skip or cancel anytime, and enjoy free shipping on every
                refill.
              </p>
            </div>
            <div className="hidden lg:flex gap-6">
              {[
                { icon: Shield, label: 'Save up to 15%' },
                { icon: Clock, label: 'Skip anytime' },
                { icon: Truck, label: 'Free delivery' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <item.icon size={16} className="text-white/60" />
                  <span className="text-sm text-white/80">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <div className="container-main -mt-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <KPICard
            icon={RefreshCw}
            label="Active Refills"
            value={activeSubs}
            color="success"
          />
          <KPICard
            icon={Calendar}
            label="Next Delivery"
            value={nextDelivery}
            color="primary"
          />
          <KPICard
            icon={DollarSign}
            label="Monthly Spend"
            value={`$${monthlySpend.toFixed(2)}`}
            color="warning"
          />
        </div>
      </div>

      <div className="container-main pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Subscription List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-text-primary">
                Your Auto-Refills
              </h2>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                href="/products"
              >
                Add New
              </Button>
            </div>

            {subs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-border">
                <RefreshCw size={40} className="mx-auto text-gray-300 mb-3" />
                <p className="text-sm text-text-secondary">No auto-refills set up yet. Browse products to add your first refill.</p>
                <Button variant="primary" size="sm" href="/products" className="mt-4">Browse Products</Button>
              </div>
            ) : (
              subs.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedId(sub.id)}
                  className={`bg-white rounded-xl border-2 p-5 flex gap-4 cursor-pointer transition-all hover:shadow-sm ${
                    selectedId === sub.id
                      ? 'border-primary shadow-sm'
                      : 'border-border'
                  }`}
                >
                  <img
                    src={sub.image}
                    alt={sub.name}
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {sub.name}
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          {sub.frequency} • Qty: {sub.quantity}
                        </p>
                      </div>
                      <StatusBadge status={sub.status} />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-text-primary">
                          ${sub.price}/unit
                        </p>
                        <span className="text-[10px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full font-bold">
                          SAVE 15%
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-text-secondary">
                        <Truck size={12} />
                        <span>Next: {sub.nextDelivery}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* How it works */}
            <div className="bg-white rounded-xl border border-border p-6 mt-6">
              <h3 className="text-lg font-bold text-text-primary mb-4">
                How Auto-Refills Work
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  {
                    step: '1',
                    icon: Package,
                    title: 'Choose Products',
                    desc: 'Pick your health supplies and select a delivery schedule',
                  },
                  {
                    step: '2',
                    icon: RefreshCw,
                    title: 'We Auto-Ship',
                    desc: 'Your order is prepared and shipped on your chosen schedule',
                  },
                  {
                    step: '3',
                    icon: CheckCircle,
                    title: 'Stay in Control',
                    desc: 'Skip, pause, or cancel anytime — no commitments',
                  },
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-3">
                      <item.icon size={20} className="text-primary" />
                    </div>
                    <p className="text-sm font-semibold text-text-primary mb-1">
                      {item.title}
                    </p>
                    <p className="text-xs text-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Add-ons */}
            {suggestedProducts.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-text-primary mb-4">
                  Add to Your Refills
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {suggestedProducts.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl border border-border p-4 hover:shadow-sm transition-shadow"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-28 object-cover rounded-lg mb-3"
                      />
                      <p className="text-sm font-semibold text-text-primary line-clamp-1">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold text-primary mt-1">
                        ${product.price}
                      </p>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        className="w-full mt-3"
                      >
                        Add to Refill
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-border p-5 sticky top-24">
              <h3 className="text-lg font-bold text-text-primary mb-4">
                Manage Refill
              </h3>
              {selected ? (
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {selected.name}
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      ${selected.price} × {selected.quantity} = $
                      {(selected.price * selected.quantity).toFixed(2)}/
                      {selected.frequency.toLowerCase()}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant={
                        selected.status === 'active' ? 'secondary' : 'primary'
                      }
                      size="md"
                      icon={selected.status === 'active' ? Pause : Play}
                      className="w-full"
                      onClick={() => toggleStatus(selected.id)}
                    >
                      {selected.status === 'active'
                        ? 'Pause Refill'
                        : 'Resume Refill'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      icon={SkipForward}
                      className="w-full"
                    >
                      Skip Next Delivery
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      icon={Edit3}
                      className="w-full"
                    >
                      Change Quantity
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full mt-2"
                    >
                      Cancel Refill
                    </Button>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      Upcoming Deliveries
                    </h4>
                    <div className="space-y-2.5">
                      {['Mar 5, 2026', 'Apr 5, 2026', 'May 5, 2026'].map(
                        (date, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-sm"
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${
                                i === 0 ? 'bg-primary' : 'bg-gray-300'
                              }`}
                            />
                            <span
                              className={
                                i === 0
                                  ? 'text-primary font-medium'
                                  : 'text-text-secondary'
                              }
                            >
                              {date}
                            </span>
                            {i === 0 && (
                              <span className="text-[10px] bg-primary-light text-primary px-1.5 py-0.5 rounded-full font-medium ml-auto">
                                Next
                              </span>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-text-secondary">
                  Select a refill to manage it.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
