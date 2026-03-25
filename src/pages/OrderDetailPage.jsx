import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Package, Truck, MapPin, Copy, CheckCircle, Clock, ArrowLeft, Loader2, RefreshCcw } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { formatCurrency } from '../utils/formatUtils';
import { getOrderById } from '../services/orderService';
import { useCart } from '../context/CartContext';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handleRepeatOrder = () => {
    if (!order || !order.items) return;
    
    // Add each item to cart
    order.items.forEach(item => {
      // Re-map fields if necessary (Order items usually have id/productId, name, price, image)
      const product = {
        id: item.id || item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        category: item.category || ((item.id || item.productId) && String(item.id || item.productId).startsWith('service-') ? 'Services' : 'Product'),
        stock: 100 // Default for repeatable items
      };
      addToCart(product, item.quantity);
    });
    
    // Redirect to cart
    navigate('/cart');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-main py-20 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg font-medium text-text-primary mb-2">Order not found</p>
        <Button variant="primary" href="/orders">Back to My Orders</Button>
      </div>
    );
  }

  const status = (order.status || '').toLowerCase();
  const steps = [
    { label: 'Placed', done: true },
    { label: 'Processing', done: ['processing', 'approved', 'packed', 'shipped', 'delivered'].includes(status) },
    { label: 'Shipped', done: ['shipped', 'delivered'].includes(status) },
    { label: 'Delivered', done: status === 'delivered' },
  ];

  return (
    <div className="container-main animate-fade-in py-8">
      <Breadcrumbs items={[{ label: 'My Orders', href: '/orders' }, { label: order.id }]} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">OrderId: {order.id}</h1>
          <p className="text-sm text-text-secondary mt-1">
            Placed on {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : (order.date || 'Unknown')}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.label} className="flex-1 flex flex-col items-center relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${step.done ? 'bg-success text-white' : 'bg-gray-100 text-text-secondary'
                }`}>
                {step.done ? <CheckCircle size={16} /> : i + 1}
              </div>
              <p className={`text-xs mt-2 font-medium ${step.done ? 'text-success' : 'text-text-secondary'}`}>{step.label}</p>
              {i < steps.length - 1 && (
                <div className={`absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 ${steps[i + 1].done ? 'bg-success' : 'bg-gray-200'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-5">
          <h3 className="font-semibold text-text-primary mb-4">Items Ordered</h3>
          <div className="space-y-4">
            {(order.items || []).map((item, i) => {
              const isService = item.category === 'Services' || String(item.id || '').startsWith('service-');
              return (
                <div key={i} className="flex gap-4 items-center">
                  {!isService && (
                    item.image ? (
                      <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <Package size={20} className="text-text-secondary" />
                      </div>
                    )
                  )}
                  <div className="flex-1 min-w-0">
                    <Link to={isService ? `/services` : `/product/${item.id || item.productId}`} className="text-sm font-semibold text-text-primary hover:text-primary transition-colors">{item.name}</Link>
                    <p className="text-xs text-text-secondary mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-text-primary">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              );
            })}
          </div>
          {(() => {
            const computedSubtotal = order.subtotal || (order.items || []).reduce((s, i) => s + (i.price * (i.quantity || 1)), 0);
            const discount = order.couponDiscount || 0;
            const isServiceOnlyOrder = (order.items || []).every(i => i.category === 'Services' || String(i.id).startsWith('service-'));
            const shipping = order.shippingCost || 0;
            const tax = order.tax || ((computedSubtotal - discount) * 0.085);
            return (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Subtotal</span>
                  <span className="font-medium text-text-primary">{formatCurrency(computedSubtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Coupon{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                    <span className="font-medium text-green-600">-{formatCurrency(discount)}</span>
                  </div>
                )}
                {!isServiceOnlyOrder && (
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Shipping</span>
                    <span className="font-medium text-text-primary">{shipping > 0 ? formatCurrency(shipping) : 'Free'}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Tax (8.5%)</span>
                  <span className="font-medium text-text-primary">{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-sm font-semibold text-text-primary">Total</span>
                  <span className="text-lg font-bold text-primary">{formatCurrency(order.total || 0)}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-primary" />
              <h3 className="font-semibold text-text-primary text-sm">Shipping Address</h3>
            </div>
            <div className="text-sm text-text-secondary leading-relaxed">
              {typeof order.shippingAddress === 'object' ? (
                <>
                  <p className="font-semibold text-text-primary">
                    {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                  </p>
                  {order.shippingAddress.institution && <p>{order.shippingAddress.institution}</p>}
                  <p>{order.shippingAddress.streetAddress}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
                  <p className="mt-1">Phone: {order.shippingAddress.phone}</p>
                </>
              ) : (
                <p>{order.shippingAddress}</p>
              )}
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={16} className="text-primary" />
              <h3 className="font-semibold text-text-primary text-sm">Tracking Info</h3>
            </div>
            {order.trackingNumber ? (
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-50 px-2 py-1 rounded font-mono text-text-primary">{order.trackingNumber}</code>
                <button className="p-1 text-text-secondary hover:text-primary"><Copy size={14} /></button>
              </div>
            ) : (
              <p className="text-sm text-text-secondary">Tracking info will be available once shipped.</p>
            )}
            {order.estimatedDelivery && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-text-secondary">
                <Clock size={12} />
                <span>Estimated delivery: {order.estimatedDelivery}</span>
              </div>
            )}
            {order.deliveredDate && (
              <div className="flex items-center gap-1.5 mt-3 text-xs text-success">
                <CheckCircle size={12} />
                <span>Delivered on {order.deliveredDate}</span>
              </div>
            )}
          </div>

          <Button 
            variant="primary" 
            size="md" 
            icon={RefreshCcw} 
            onClick={handleRepeatOrder} 
            className="w-full"
          >
            Repeat this Order
          </Button>

          <Button variant="secondary" size="md" icon={ArrowLeft} href="/orders" className="w-full">
            Back to My Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
