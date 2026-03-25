import { useState, useEffect } from 'react';
import AddressBook from '../components/AddressBook';
import { Link, useNavigate } from 'react-router-dom';
import { User, MapPin, Package, Heart, Settings, LogOut, ChevronRight, Edit3, Plus, Trash2, Shield, Loader2, LayoutDashboard } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { getOrders } from '../services/orderService';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/formatUtils';

const tabs = [
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'addresses', label: 'My Addresses', icon: MapPin },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, signOut, updateProfile } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { items: wishlistItems, removeItem } = useWishlist();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Address form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    street: '',
    city: '',
    state: '',
    zip: '',
    isDefault: false,
  });
  const [orderAddresses, setOrderAddresses] = useState([]);

  useEffect(() => {
    if ((activeTab === 'orders' || activeTab === 'addresses') && user?.uid) {
      setOrdersLoading(true);
      getOrders(user.uid)
        .then((fetchedOrders) => {
          setOrders(fetchedOrders);
          
          // Extract unique addresses from orders that aren't already in user.addresses
          const savedAddresses = user.addresses || [];
          const extracted = [];
          
          fetchedOrders.forEach(order => {
            if (order.shippingAddress) {
              const addr = order.shippingAddress;
              const street = addr.streetAddress || addr.street;
              const city = addr.city;
              const zip = addr.zipCode || addr.zip;
              
              if (!street || !city) return;

              const isDuplicate = extracted.some(a => a.street === street && a.city === city) ||
                                 savedAddresses.some(a => a.street === street && a.city === city);
              
              if (!isDuplicate) {
                extracted.push({
                  id: `order_${order.id}`,
                  label: addr.institution || addr.companyName || 'Past Order',
                  street: street,
                  city: city,
                  state: addr.state,
                  zip: zip,
                  isFromOrder: true
                });
              }
            }
          });
          setOrderAddresses(extracted);
        })
        .catch((err) => console.error('Error fetching orders:', err))
        .finally(() => setOrdersLoading(false));
    }
  }, [activeTab, user]);

  if (!user) {
    navigate('/signin');
    return null;
  }

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const handleEditClick = () => {
    setEditForm({ name: user.name || '', phone: user.phone || '' });
    setIsEditing(true);
    setError('');
  };

  const handleSaveProfile = async () => {
    if (!editForm.name.trim()) {
      setError('Name is required');
      return;
    }
    setIsSaving(true);
    setError('');
    
    const result = await updateProfile({ name: editForm.name, phone: editForm.phone });
    
    setIsSaving(false);
    if (result.success) {
      setIsEditing(false);
    } else {
      setError(result.error || 'Failed to update profile');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
  };

  const handleSaveAddress = async () => {
    if (!addressForm.street.trim() || !addressForm.city.trim() || !addressForm.state.trim() || !addressForm.zip.trim()) {
      setAddressError('Please fill in all required address fields.');
      return;
    }
    setIsSavingAddress(true);
    setAddressError('');
    try {
      const newAddress = {
        ...addressForm,
        id: `addr_${Date.now()}`,
      };
      let updatedAddresses = [...(user.addresses || [])];
      if (newAddress.isDefault) {
        updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
      }
      updatedAddresses.push(newAddress);
      const result = await updateProfile({ addresses: updatedAddresses });
      if (result.success) {
        setShowAddressForm(false);
        setAddressForm({ label: 'Home', street: '', city: '', state: '', zip: '', isDefault: false });
      } else {
        setAddressError(result.error || 'Failed to save address');
      }
    } catch (err) {
      setAddressError('Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const updatedAddresses = (user.addresses || []).filter(a => a.id !== addressId);
    await updateProfile({ addresses: updatedAddresses });
  };

  const handleToggleDefault = async (addressId) => {
    const updatedAddresses = (user.addresses || []).map(a => ({
      ...a,
      isDefault: a.id === addressId ? !a.isDefault : false,
    }));
    await updateProfile({ addresses: updatedAddresses });
  };

  const handleSaveOrderAddress = async (orderAddr, makeDefault = false) => {
    const newAddress = {
      id: `addr_${Date.now()}`,
      label: orderAddr.label || 'Saved',
      street: orderAddr.street,
      city: orderAddr.city,
      state: orderAddr.state,
      zip: orderAddr.zip,
      isDefault: makeDefault,
    };
    let updatedAddresses = [...(user.addresses || [])];
    if (makeDefault) {
      updatedAddresses = updatedAddresses.map(a => ({ ...a, isDefault: false }));
    }
    updatedAddresses.push(newAddress);
    const result = await updateProfile({ addresses: updatedAddresses });
    if (result.success) {
      // Remove from orderAddresses since it's now saved
      setOrderAddresses(prev => prev.filter(a => a.id !== orderAddr.id));
    }
  };

  return (
    <div className="container-main animate-fade-in py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-8">My Account</h1>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-sm ring-2 ring-primary/20 shrink-0">
              {(user?.name || user?.email || 'U').split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
              <p className="text-xs text-text-secondary truncate">{user.email}</p>
            </div>
          </div>
          <nav className="space-y-1">
            {(user?.role === 'admin' || user?.role === 'Admin') && (
              <Link
                to="/admin"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-primary bg-primary-light hover:bg-primary/10 transition-colors mb-2"
              >
                <LayoutDashboard size={16} />
                Admin Dashboard
              </Link>
            )}
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-50 hover:text-text-primary'
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
                {!isEditing ? (
                  <Button variant="secondary" size="sm" icon={Edit3} onClick={handleEditClick}>Edit Profile</Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="bg-gray-100 text-text-secondary hover:bg-gray-200" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                    <Button variant="primary" size="sm" onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg border border-red-100">{error}</div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Full Name</label>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={(e) => setEditForm(prev => ({...prev, name: e.target.value}))}
                      className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  ) : (
                    <p className="text-sm text-text-primary mt-1">{user.name}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Email</label>
                  <p className="text-sm text-text-primary mt-1 opacity-70">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Phone</label>
                  {isEditing ? (
                    <input 
                      type="tel" 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm(prev => ({...prev, phone: e.target.value}))}
                      className="w-full mt-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  ) : (
                    <p className="text-sm text-text-primary mt-1">{user.phone || '—'}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Member Since</label>
                  <p className="text-sm text-text-primary mt-1">{user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}</p>
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
                {!showAddressForm && (
                  <Button variant="secondary" size="sm" icon={Plus} onClick={() => { setShowAddressForm(true); setAddressError(''); }}>Add Address</Button>
                )}
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <div className="bg-white rounded-xl border border-border p-6">
                  <h3 className="text-sm font-bold text-text-primary mb-4">New Address</h3>
                  {addressError && (
                    <div className="mb-4 bg-red-50 text-danger text-sm px-4 py-2.5 rounded-lg border border-red-100">{addressError}</div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Label</label>
                      <input
                        type="text"
                        value={addressForm.label}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="e.g., Home, Office"
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-text-secondary mb-1">Street Address *</label>
                      <input
                        type="text"
                        value={addressForm.street}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, street: e.target.value }))}
                        placeholder="123 Main St"
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">City *</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="San Francisco"
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">State *</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, state: e.target.value }))}
                        placeholder="California"
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1">ZIP Code *</label>
                      <input
                        type="text"
                        value={addressForm.zip}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, zip: e.target.value }))}
                        placeholder="94102"
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <label htmlFor="isDefault" className="text-sm text-text-secondary cursor-pointer">Set as default address</label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-5">
                    <Button variant="primary" size="sm" onClick={handleSaveAddress} disabled={isSavingAddress}>
                      {isSavingAddress ? <Loader2 size={16} className="animate-spin" /> : 'Save Address'}
                    </Button>
                    <Button variant="secondary" size="sm" className="bg-gray-100 text-text-secondary hover:bg-gray-200" onClick={() => { setShowAddressForm(false); setAddressError(''); }}>Cancel</Button>
                  </div>
                </div>
              )}

              {(user.addresses || []).length === 0 && orderAddresses.length === 0 && !showAddressForm ? (
                <div className="text-center py-12 bg-white rounded-xl border border-border">
                  <MapPin size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-text-secondary">No saved addresses yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Saved User Addresses */}
                  {(user.addresses || []).map((addr) => (
                    <div key={addr.id} className={`bg-white rounded-xl border p-5 flex items-start justify-between ${addr.isDefault ? 'border-primary/40 ring-1 ring-primary/10' : 'border-border'}`}>
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleDefault(addr.id)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            addr.isDefault
                              ? 'text-primary bg-primary/10 hover:bg-primary/20'
                              : 'text-text-secondary bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {addr.isDefault ? 'Default' : 'Set Default'}
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors cursor-pointer"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}

                  {/* Addresses from Orders */}
                  {orderAddresses.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 pt-4 pb-2">
                        <Package size={14} className="text-text-secondary" />
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">From Your Order History</h3>
                      </div>
                      {orderAddresses.map((addr) => (
                        <div key={addr.id} className="bg-white rounded-xl border border-border p-5 flex items-start justify-between">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                              <MapPin size={18} className="text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-text-primary">{addr.label}</p>
                              </div>
                              <p className="text-sm text-text-secondary mt-1">{addr.street}</p>
                              <p className="text-sm text-text-secondary">{addr.city}, {addr.state} {addr.zip}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleSaveOrderAddress(addr, true)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-secondary bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              Set Default
                            </button>
                            <button
                              onClick={() => handleSaveOrderAddress(addr, false)}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary">Recent Orders</h2>
              {ordersLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-border">
                  <Package size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-text-secondary">No orders yet.</p>
                </div>
              ) : (
                <>
                  {orders.slice(0, 3).map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="block bg-white rounded-xl border border-border p-5 hover:shadow-sm hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">OrderId: {order.id}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{order.date} • {(order.items || []).length} item(s)</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold text-text-primary">{formatCurrency(order.total || 0)}</p>
                          <StatusBadge status={order.status} />
                          <ChevronRight size={16} className="text-text-secondary group-hover:text-primary" />
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Button variant="secondary" href="/orders" className="w-full">View All Orders</Button>
                </>
              )}
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
                        <p className="text-sm font-bold text-primary mt-1">{formatCurrency(product.price)}</p>
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
