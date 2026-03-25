import { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Minus, Trash2, User, Package, MapPin, CreditCard, ChevronDown } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { getProducts } from '../../services/productService';
import { createOrder } from '../../services/orderService';
import { ORDER_STATUSES } from '../../utils/adminOrderService';
import { formatCurrency } from '../../utils/formatUtils';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const SERVICES = [
    { id: 'service-mental-health', name: 'Mental Health Consultation', price: 1500, category: 'Services' },
    { id: 'service-diabetes-education', name: 'Diabetes Education Program', price: 1200, category: 'Services' },
    { id: 'service-career-guidance', name: 'Career Guidance (Healthcare)', price: 2000, category: 'Services' },
];

const CreateOrderDrawer = ({ open, onClose, onOrderCreated }) => {
    // Customer
    const [customerMode, setCustomerMode] = useState('existing'); // 'existing' | 'guest'
    const [users, setUsers] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState(null);
    const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });

    // Items
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [orderItems, setOrderItems] = useState([]);

    // Shipping
    const [shippingAddress, setShippingAddress] = useState({
        firstName: '', lastName: '', institution: '', streetAddress: '', city: '', state: '', zipCode: '', phone: ''
    });
    const [shippingMethod, setShippingMethod] = useState('standard');

    // Payment & Status
    const [paymentMethod, setPaymentMethod] = useState('purchase-order');
    const [orderStatus, setOrderStatus] = useState('Placed');
    const [adminNote, setAdminNote] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    // Fetch users and products on open
    useEffect(() => {
        if (!open) return;
        const fetchData = async () => {
            setLoadingData(true);
            try {
                const [usersSnap, prods] = await Promise.all([
                    getDocs(collection(db, 'users')),
                    getProducts({ includeDrafts: true })
                ]);
                setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                setProducts(prods);
            } catch (err) {
                console.error('Failed to load data:', err);
            }
            setLoadingData(false);
        };
        fetchData();
    }, [open]);

    // Pre-fill address when user selected
    useEffect(() => {
        if (selectedUser) {
            const names = (selectedUser.name || '').split(' ');
            const defaultAddr = (selectedUser.addresses || []).find(a => a.isDefault) || (selectedUser.addresses || [])[0];
            setShippingAddress({
                firstName: names[0] || '',
                lastName: names.slice(1).join(' ') || '',
                institution: defaultAddr?.institution || '',
                streetAddress: defaultAddr?.street || '',
                city: defaultAddr?.city || '',
                state: defaultAddr?.state || '',
                zipCode: defaultAddr?.zip || '',
                phone: selectedUser.phone || defaultAddr?.phone || '',
            });
        }
    }, [selectedUser]);

    // Calculations
    const isServiceOnly = orderItems.length > 0 && orderItems.every(i => i.category === 'Services');
    const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const shippingCost = isServiceOnly ? 0 : (shippingMethod === 'express' ? 500 : shippingMethod === 'white-glove' ? 2000 : 0);
    const tax = subtotal * 0.085;
    const total = subtotal + shippingCost + tax;

    // Filtered lists
    const filteredUsers = useMemo(() => {
        if (!userSearch.trim()) return [];
        const q = userSearch.toLowerCase();
        return users.filter(u =>
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q)
        ).slice(0, 5);
    }, [users, userSearch]);

    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return [];
        const q = productSearch.toLowerCase();
        return products.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
        ).slice(0, 6);
    }, [products, productSearch]);

    const addItem = (item) => {
        const existing = orderItems.find(i => i.id === item.id);
        if (existing) {
            setOrderItems(orderItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setOrderItems([...orderItems, { id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image || '', category: item.category || '' }]);
        }
        setProductSearch('');
    };

    const updateQty = (id, delta) => {
        setOrderItems(orderItems.map(i => {
            if (i.id !== id) return i;
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : i;
        }));
    };

    const removeItem = (id) => setOrderItems(orderItems.filter(i => i.id !== id));

    const handleSubmit = async () => {
        if (orderItems.length === 0) return toast.error('Add at least one item');
        if (!shippingAddress.firstName || !shippingAddress.city) return toast.error('Fill in shipping address');

        setSubmitting(true);
        try {
            const userName = customerMode === 'existing' && selectedUser
                ? selectedUser.name
                : guestInfo.name;
            const userEmail = customerMode === 'existing' && selectedUser
                ? selectedUser.email
                : guestInfo.email;

            const orderData = {
                userId: selectedUser?.id || 'guest',
                userName: userName || 'Manual Order',
                userEmail: userEmail || '',
                userPhone: (customerMode === 'existing' ? selectedUser?.phone : guestInfo.phone) || shippingAddress.phone || '',
                userType: selectedUser?.isInstitutional ? 'Institutional' : 'Individual',
                items: orderItems,
                subtotal,
                couponCode: null,
                couponDiscount: 0,
                shippingCost,
                tax,
                total,
                shippingMethod: isServiceOnly ? 'standard' : shippingMethod,
                paymentMethod,
                shippingAddress,
                status: orderStatus,
                adminNote: adminNote || null,
                createdBy: 'admin',
            };

            const orderId = await createOrder(orderData);
            toast.success(`Order #${orderId.substring(0, 8).toUpperCase()} created!`);
            onOrderCreated?.();
            resetForm();
            onClose();
        } catch (err) {
            console.error('Create order error:', err);
            toast.error(`Failed to create order: ${err.message}`);
        }
        setSubmitting(false);
    };

    const resetForm = () => {
        setCustomerMode('existing');
        setSelectedUser(null);
        setUserSearch('');
        setGuestInfo({ name: '', email: '', phone: '' });
        setOrderItems([]);
        setProductSearch('');
        setShippingAddress({ firstName: '', lastName: '', institution: '', streetAddress: '', city: '', state: '', zipCode: '', phone: '' });
        setShippingMethod('standard');
        setPaymentMethod('purchase-order');
        setOrderStatus('Placed');
        setAdminNote('');
    };

    if (!open) return null;

    const sectionTitle = (icon, text) => (
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
            {icon}
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{text}</h3>
        </div>
    );

    const inputClass = "w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-sm text-slate-700 transition-all";

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 z-40"
                        onClick={onClose}
                    />
                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <h2 className="text-lg font-bold text-slate-900">Create Manual Order</h2>
                            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            {loadingData ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="ml-3 text-sm text-slate-500">Loading data...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Section 1: Customer */}
                                    <div>
                                        {sectionTitle(<User className="w-4 h-4 text-blue-500" />, 'Customer')}
                                        <div className="flex gap-2 mb-3">
                                            {['existing', 'guest'].map(mode => (
                                                <button
                                                    key={mode}
                                                    onClick={() => { setCustomerMode(mode); setSelectedUser(null); setUserSearch(''); }}
                                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${customerMode === mode ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                                >
                                                    {mode === 'existing' ? 'Existing User' : 'Guest'}
                                                </button>
                                            ))}
                                        </div>

                                        {customerMode === 'existing' ? (
                                            <div className="relative">
                                                {selectedUser ? (
                                                    <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{selectedUser.name}</p>
                                                            <p className="text-xs text-slate-500">{selectedUser.email}</p>
                                                        </div>
                                                        <button onClick={() => { setSelectedUser(null); setUserSearch(''); }} className="text-slate-400 hover:text-red-500">
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3">
                                                            <Search className="w-4 h-4 text-slate-400" />
                                                            <input
                                                                value={userSearch}
                                                                onChange={(e) => setUserSearch(e.target.value)}
                                                                placeholder="Search by name or email..."
                                                                className="w-full h-10 bg-transparent outline-none text-sm"
                                                            />
                                                        </div>
                                                        {filteredUsers.length > 0 && (
                                                            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                                {filteredUsers.map(u => (
                                                                    <button
                                                                        key={u.id}
                                                                        onClick={() => { setSelectedUser(u); setUserSearch(''); }}
                                                                        className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                                                                    >
                                                                        <p className="font-semibold text-slate-700">{u.name || 'No Name'}</p>
                                                                        <p className="text-xs text-slate-400">{u.email}</p>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                <input value={guestInfo.name} onChange={e => setGuestInfo({ ...guestInfo, name: e.target.value })} placeholder="Full Name" className={inputClass} />
                                                <input value={guestInfo.email} onChange={e => setGuestInfo({ ...guestInfo, email: e.target.value })} placeholder="Email" className={inputClass} />
                                                <input value={guestInfo.phone} onChange={e => setGuestInfo({ ...guestInfo, phone: e.target.value })} placeholder="Phone" className={inputClass} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 2: Items */}
                                    <div>
                                        {sectionTitle(<Package className="w-4 h-4 text-blue-500" />, 'Order Items')}

                                        {/* Product Search */}
                                        <div className="relative mb-3">
                                            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3">
                                                <Search className="w-4 h-4 text-slate-400" />
                                                <input
                                                    value={productSearch}
                                                    onChange={(e) => setProductSearch(e.target.value)}
                                                    placeholder="Search products to add..."
                                                    className="w-full h-10 bg-transparent outline-none text-sm"
                                                />
                                            </div>
                                            {filteredProducts.length > 0 && (
                                                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                                                    {filteredProducts.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => addItem(p)}
                                                            className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />}
                                                                <div>
                                                                    <p className="text-sm font-medium text-slate-700">{p.name}</p>
                                                                    <p className="text-xs text-slate-400">{p.category}</p>
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-800">{formatCurrency(p.price)}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Services */}
                                        <div className="mb-3">
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-2">Quick Add Services</p>
                                            <div className="flex flex-wrap gap-2">
                                                {SERVICES.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => addItem(s)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${orderItems.find(i => i.id === s.id)
                                                            ? 'bg-blue-50 text-blue-600 border-blue-200'
                                                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                            }`}
                                                    >
                                                        <Plus className="w-3 h-3 inline mr-1" />{s.name} ({formatCurrency(s.price)})
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Selected Items */}
                                        {orderItems.length > 0 && (
                                            <div className="space-y-2">
                                                {orderItems.map(item => (
                                                    <div key={item.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {item.image && <img src={item.image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />}
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-slate-700 truncate">{item.name}</p>
                                                                <p className="text-xs text-slate-400">{formatCurrency(item.price)} each</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                                            <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 hover:bg-slate-100">
                                                                <Minus className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                                                            <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center rounded bg-white border border-slate-200 hover:bg-slate-100">
                                                                <Plus className="w-3 h-3" />
                                                            </button>
                                                            <span className="text-sm font-bold text-slate-800 w-20 text-right">{formatCurrency(item.price * item.quantity)}</span>
                                                            <button onClick={() => removeItem(item.id)} className="p-1 text-slate-400 hover:text-red-500">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="text-right text-sm font-bold text-slate-700 pt-1">
                                                    Subtotal: {formatCurrency(subtotal)}
                                                </div>
                                            </div>
                                        )}

                                        {orderItems.length === 0 && (
                                            <p className="text-center text-sm text-slate-400 py-4 bg-slate-50 rounded-lg">No items added yet</p>
                                        )}
                                    </div>

                                    {/* Section 3: Shipping */}
                                    <div>
                                        {sectionTitle(<MapPin className="w-4 h-4 text-blue-500" />, 'Shipping Address')}
                                        <div className="grid grid-cols-2 gap-3">
                                            <input value={shippingAddress.firstName} onChange={e => setShippingAddress({ ...shippingAddress, firstName: e.target.value })} placeholder="First Name *" className={inputClass} />
                                            <input value={shippingAddress.lastName} onChange={e => setShippingAddress({ ...shippingAddress, lastName: e.target.value })} placeholder="Last Name" className={inputClass} />
                                            <input value={shippingAddress.institution} onChange={e => setShippingAddress({ ...shippingAddress, institution: e.target.value })} placeholder="Institution / Company" className={`${inputClass} col-span-2`} />
                                            <input value={shippingAddress.streetAddress} onChange={e => setShippingAddress({ ...shippingAddress, streetAddress: e.target.value })} placeholder="Street Address" className={`${inputClass} col-span-2`} />
                                            <input value={shippingAddress.city} onChange={e => setShippingAddress({ ...shippingAddress, city: e.target.value })} placeholder="City *" className={inputClass} />
                                            <input value={shippingAddress.state} onChange={e => setShippingAddress({ ...shippingAddress, state: e.target.value })} placeholder="State" className={inputClass} />
                                            <input value={shippingAddress.zipCode} onChange={e => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })} placeholder="ZIP Code" className={inputClass} />
                                            <input value={shippingAddress.phone} onChange={e => setShippingAddress({ ...shippingAddress, phone: e.target.value })} placeholder="Phone" className={inputClass} />
                                        </div>

                                        {/* Shipping Method */}
                                        {!isServiceOnly && orderItems.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Shipping Method</p>
                                                <div className="flex gap-2">
                                                    {[
                                                        { value: 'standard', label: 'Standard', sub: 'Free' },
                                                        { value: 'express', label: 'Express', sub: '₹500' },
                                                        { value: 'white-glove', label: 'White Glove', sub: '₹2,000' },
                                                    ].map(m => (
                                                        <button
                                                            key={m.value}
                                                            onClick={() => setShippingMethod(m.value)}
                                                            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold border transition-all text-center ${shippingMethod === m.value
                                                                ? 'bg-blue-50 text-blue-600 border-blue-200'
                                                                : 'bg-slate-50 text-slate-600 border-slate-200'
                                                                }`}
                                                        >
                                                            {m.label}<br /><span className="text-[10px] font-medium">{m.sub}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 4: Payment & Status */}
                                    <div>
                                        {sectionTitle(<CreditCard className="w-4 h-4 text-blue-500" />, 'Payment & Status')}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Payment Method</label>
                                                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={inputClass}>
                                                    <option value="purchase-order">Purchase Order</option>
                                                    <option value="credit-card">Credit Card</option>
                                                    <option value="wire-transfer">Wire Transfer</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Initial Status</label>
                                                <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className={inputClass}>
                                                    {Object.values(ORDER_STATUSES).map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Admin Note (Optional)</label>
                                            <textarea
                                                value={adminNote}
                                                onChange={e => setAdminNote(e.target.value)}
                                                placeholder="Internal note about this order..."
                                                rows={2}
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-700 resize-none"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Sticky Footer — Order Summary */}
                        {!loadingData && (
                            <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
                                <div className="space-y-1 text-sm mb-3">
                                    <div className="flex justify-between text-slate-500">
                                        <span>Subtotal</span><span className="font-semibold text-slate-700">{formatCurrency(subtotal)}</span>
                                    </div>
                                    {!isServiceOnly && shippingCost > 0 && (
                                        <div className="flex justify-between text-slate-500">
                                            <span>Shipping</span><span className="font-semibold text-slate-700">{formatCurrency(shippingCost)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-slate-500">
                                        <span>Tax (8.5%)</span><span className="font-semibold text-slate-700">{formatCurrency(tax)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-900 font-bold text-base pt-1 border-t border-slate-100">
                                        <span>Total</span><span>{formatCurrency(total)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || orderItems.length === 0}
                                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                                    ) : (
                                        'Create Order'
                                    )}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default CreateOrderDrawer;
