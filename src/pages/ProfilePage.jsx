import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Heart, Settings, LogOut, ChevronRight, Edit3, Plus, Trash2, Shield } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { orders } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'addresses', label: 'My Addresses', icon: MapPin },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, signOut } = useAuth();
  const { items: wishlistItems, removeItem } = useWishlist();
  const navigate = useNavigate();

  if (!user) {
    navigate('/signin');
    return null;
  }

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="container-main animate-fade-in py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-8">My Account</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
            <div>
              <p className="text-sm font-semibold text-text-primary">{user.name}</p>
              <p className="text-xs text-text-secondary">{user.email}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:bg-red-50 hover:text-danger transition-colors mt-4"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-text-primary">Personal Information</h2>
                <Button variant="secondary" size="sm" icon={Edit3}>Edit Profile</Button>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Full Name</label>
                  <p className="text-sm text-text-primary mt-1">{user.name}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</label>
                  <p className="text-sm text-text-primary mt-1">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Phone</label>
                  <p className="text-sm text-text-primary mt-1">{user.phone}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Member Since</label>
                  <p className="text-sm text-text-primary mt-1">January 2025</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                  <Shield size={14} className="text-success" />
                  <span>Your account is secured with password protection</span>
                </div>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-text-primary">Saved Addresses</h2>
                <Button variant="secondary" size="sm" icon={Plus}>Add Address</Button>
              </div>
              {user.addresses.map((addr) => (
                <div key={addr.id} className="bg-white rounded-xl border border-border p-5 flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                      <MapPin size={18} className="text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{addr.label}</p>
                        {addr.isDefault && <span className="text-[10px] bg-primary-light text-primary px-1.5 py-0.5 rounded-full font-bold">DEFAULT</span>}
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{addr.street}</p>
                      <p className="text-sm text-text-secondary">{addr.city}, {addr.state} {addr.zip}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-light transition-colors"><Edit3 size={14} /></button>
                    <button className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary">Recent Orders</h2>
              {orders.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="block bg-white rounded-xl border border-border p-5 hover:shadow-sm hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{order.id}</p>
                      <p className="text-xs text-text-secondary mt-0.5">{order.date} • {order.items.length} item(s)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-bold text-text-primary">${order.total.toFixed(2)}</p>
                      <StatusBadge status={order.status} />
                      <ChevronRight size={16} className="text-text-secondary group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              ))}
              <Button variant="secondary" href="/orders" className="w-full">View All Orders</Button>
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div>
              <h2 className="text-lg font-bold text-text-primary mb-4">My Wishlist ({wishlistItems.length})</h2>
              {wishlistItems.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-border">
                  <Heart size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-text-secondary">No items in your wishlist yet.</p>
                  <Button variant="primary" size="sm" href="/products" className="mt-4">Browse Products</Button>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {wishlistItems.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl border border-border p-4 flex gap-4">
                      <img src={product.image} alt={product.name} className="w-16 h-16 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${product.id}`} className="text-sm font-semibold text-text-primary hover:text-primary line-clamp-1">{product.name}</Link>
                        <p className="text-sm font-bold text-primary mt-1">${product.price}</p>
                      </div>
                      <button onClick={() => removeItem(product.id)} className="p-2 self-start rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
