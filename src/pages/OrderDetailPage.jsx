import { useParams, Link } from 'react-router-dom';
import { Package, Truck, MapPin, Copy, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { orders } from '../data/mockData';

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="container-main py-20 text-center">
        <Package size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-lg font-medium text-text-primary mb-2">Order not found</p>
        <Button variant="primary" href="/orders">Back to My Orders</Button>
      </div>
    );
  }

  const steps = [
    { label: 'Placed', done: true },
    { label: 'Processing', done: ['processing', 'shipped', 'delivered'].includes(order.status) },
    { label: 'Shipped', done: ['shipped', 'delivered'].includes(order.status) },
    { label: 'Delivered', done: order.status === 'delivered' },
  ];

  return (
    <div className="container-main animate-fade-in py-8">
      <Breadcrumbs items={[{ label: 'My Orders', href: '/orders' }, { label: order.id }]} />

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{order.id}</h1>
          <p className="text-sm text-text-secondary mt-1">Placed on {order.date}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Progress Tracker */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.label} className="flex-1 flex flex-col items-center relative">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold z-10 ${
                step.done ? 'bg-success text-white' : 'bg-gray-100 text-text-secondary'
              }`}>
                {step.done ? <CheckCircle size={16} /> : i + 1}
              </div>
              <p className={`text-xs mt-2 font-medium ${step.done ? 'text-success' : 'text-text-secondary'}`}>{step.label}</p>
              {i < steps.length - 1 && (
                <div className={`absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 ${
                  steps[i + 1].done ? 'bg-success' : 'bg-gray-200'
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
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-4 items-center">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.productId}`} className="text-sm font-semibold text-text-primary hover:text-primary transition-colors">{item.name}</Link>
                  <p className="text-xs text-text-secondary mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-bold text-text-primary">${(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between">
            <span className="text-sm font-semibold text-text-primary">Order Total</span>
            <span className="text-lg font-bold text-primary">${order.total.toFixed(2)}</span>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-border p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className="text-primary" />
              <h3 className="font-semibold text-text-primary text-sm">Shipping Address</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{order.shippingAddress}</p>
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

          <Button variant="secondary" size="md" icon={ArrowLeft} href="/orders" className="w-full">
            Back to My Orders
          </Button>
        </div>
      </div>
    </div>
  );
}
