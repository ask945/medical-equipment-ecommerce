import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Loader2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatUtils';
import { getOrders } from '../services/orderService';

export default function MyOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        if (user?.uid) {
          const data = await getOrders(user.uid);
          if (mounted) setOrders(data);
        } else {
          if (mounted) setOrders([]);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        if (mounted) setError('Failed to load orders. Please try again later.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchOrders();
    return () => { mounted = false; };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-main animate-fade-in py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">My Orders</h1>
      <p className="text-sm text-text-secondary mb-8">{orders.length} orders</p>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 animate-fade-in">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium text-text-primary mb-2">No orders yet</p>
          <p className="text-sm text-text-secondary">Start shopping to see your orders here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block bg-white rounded-xl border border-border p-5 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                    <Package size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">OrderId: {order.id}</p>
                    <p className="text-xs text-text-secondary">
                      Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : (order.date || 'Unknown')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <ChevronRight size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {(() => {
                    const displayableItems = (order.items || []).filter(i => i.image && i.category !== 'Services');
                    if (displayableItems.length > 0) {
                      return displayableItems.slice(0, 3).map((item, i) => (
                        <img key={i} src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border-2 border-white" />
                      ));
                    }
                    return (
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-white">
                        <Package size={16} className="text-text-secondary" />
                      </div>
                    );
                  })()}
                </div>
                <p className="text-sm text-text-secondary flex-1 truncate">
                  {(order.items || []).map((i) => i.name).join(', ')}
                </p>
              </div>
              {/* Bill Breakdown */}
              {(() => {
                const computedSubtotal = order.subtotal || (order.items || []).reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
                const discount = order.couponDiscount || 0;
                const isServiceOnlyOrder = (order.items || []).every(i => i.category === 'Services' || String(i.id).startsWith('service-'));
                const shipping = order.shippingCost || 0;
                const tax = order.tax || ((computedSubtotal - discount) * 0.085);
                return (
                  <div className="mt-3 pt-3 border-t border-border/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                    <span>Subtotal: <span className="font-semibold text-text-primary">{formatCurrency(computedSubtotal)}</span></span>
                    {discount > 0 && (
                      <span>Discount: <span className="font-semibold text-green-600">-{formatCurrency(discount)}</span></span>
                    )}
                    {!isServiceOnlyOrder && (
                      <span>Shipping: <span className="font-semibold text-text-primary">{shipping > 0 ? formatCurrency(shipping) : 'Free'}</span></span>
                    )}
                    <span>Tax: <span className="font-semibold text-text-primary">{formatCurrency(tax)}</span></span>
                    <span className="ml-auto text-sm">Total: <span className="font-bold text-primary text-base">{formatCurrency(order.total || 0)}</span></span>
                  </div>
                );
              })()}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
