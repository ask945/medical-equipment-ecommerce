import { Link } from 'react-router-dom';
import { Package, ChevronRight, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { orders } from '../data/mockData';

export default function MyOrdersPage() {
  return (
    <div className="container-main animate-fade-in py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">My Orders</h1>
      <p className="text-sm text-text-secondary mb-8">{orders.length} orders</p>

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
                    <p className="text-sm font-semibold text-text-primary">{order.id}</p>
                    <p className="text-xs text-text-secondary">Placed on {order.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <ChevronRight size={16} className="text-text-secondary group-hover:text-primary transition-colors" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {order.items.slice(0, 3).map((item, i) => (
                    <img key={i} src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border-2 border-white" />
                  ))}
                </div>
                <p className="text-sm text-text-secondary flex-1">
                  {order.items.map((i) => i.name).join(', ')}
                </p>
                <p className="text-lg font-bold text-text-primary">${order.total.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
