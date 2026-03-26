import { useState, useEffect } from 'react';
import {
  CreditCard,
  FileText,
  Building2,
  Truck,
  Zap,
  Crown,
  Lock,
  Check,
  CheckCircle2,
  Tag,
  X,
  Loader2,
  MapPin,
  Plus,
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import StepIndicator from '../components/StepIndicator';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatUtils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { createOrder, getOrders, validateStock } from '../services/orderService';
import { collection, query, where, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

const steps = ['Shipping', 'Payment', 'Review', 'Confirmation'];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { cartItems, subtotal, clearCart } = useCart();
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const [orderAddresses, setOrderAddresses] = useState([]);

  const savedAddresses = user?.addresses || [];
  const allAddresses = [...savedAddresses, ...orderAddresses];
  const isServiceOnly = cartItems.length > 0 && cartItems.every(item => item.category === 'Services' || String(item.id).startsWith('service-'));

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });

  // Fetch order history addresses
  useEffect(() => {
    if (user?.uid) {
      getOrders(user.uid).then((orders) => {
        const saved = user.addresses || [];
        const extracted = [];
        orders.forEach(order => {
          if (order.shippingAddress) {
            const addr = order.shippingAddress;
            const street = addr.streetAddress || addr.street;
            const city = addr.city;
            const zip = addr.zipCode || addr.zip;
            if (!street || !city) return;
            const isDuplicate = extracted.some(a => a.street === street && a.city === city) ||
                               saved.some(a => a.street === street && a.city === city);
            if (!isDuplicate) {
              extracted.push({
                id: `order_${order.id}`,
                label: addr.institution || addr.companyName || 'Past Order',
                street, city, state: addr.state, zip,
                isFromOrder: true,
              });
            }
          }
        });
        setOrderAddresses(extracted);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const names = (user.name || '').split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';

      const addresses = user.addresses || [];
      const defaultAddress = addresses.find(a => a.isDefault) || addresses[0] || {};

      setSelectedAddressId(defaultAddress.id || (addresses.length === 0 ? 'new' : null));

      setFormData({
        firstName: firstName || '',
        lastName: lastName || '',
        institution: defaultAddress.institution || '',
        streetAddress: defaultAddress.street || '',
        city: defaultAddress.city || '',
        state: defaultAddress.state || '',
        zipCode: defaultAddress.zip || '',
        phone: user.phone || defaultAddress.phone || '',
      });
    }
  }, [user]);

  const handleSelectAddress = (addr) => {
    if (addr === 'new') {
      setSelectedAddressId('new');
      const names = (user?.name || '').split(' ');
      setFormData({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        institution: '',
        streetAddress: '',
        city: '',
        state: '',
        zipCode: '',
        phone: user?.phone || '',
      });
    } else {
      setSelectedAddressId(addr.id);
      const names = (user?.name || '').split(' ');
      setFormData({
        firstName: names[0] || '',
        lastName: names.slice(1).join(' ') || '',
        institution: addr.institution || '',
        streetAddress: addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        zipCode: addr.zip || '',
        phone: user?.phone || addr.phone || '',
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const shippingCost = isServiceOnly ? 0 : (shippingMethod === 'express' ? 500 : shippingMethod === 'white-glove' ? 2000 : 0);
  const tax = (subtotal - couponDiscount) * 0.085;
  const total = subtotal - couponDiscount + shippingCost + tax;

  // Coupon validation & application
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const couponsRef = collection(db, 'coupons');
      const q = query(couponsRef, where('code', '==', couponCode.trim().toUpperCase()));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setCouponError('Invalid coupon code.');
        setCouponLoading(false);
        return;
      }

      const couponDoc = snapshot.docs[0];
      const coupon = { id: couponDoc.id, ...couponDoc.data() };

      // Check if active
      if (!coupon.isActive) {
        setCouponError('This coupon is no longer active.');
        setCouponLoading(false);
        return;
      }

      // Check expiry
      if (coupon.endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endDate = new Date(coupon.endDate);
        if (endDate < today) {
          setCouponError('This coupon has expired.');
          setCouponLoading(false);
          return;
        }
      }

      // Check usage limit
      if (coupon.maxUses > 0 && (coupon.usedCount || 0) >= coupon.maxUses) {
        setCouponError('This coupon has reached its usage limit.');
        setCouponLoading(false);
        return;
      }

      // Check minimum order amount
      if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
        setCouponError(`Minimum order of ${formatCurrency(coupon.minOrderAmount)} required.`);
        setCouponLoading(false);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount > 0) {
          discount = Math.min(discount, coupon.maxDiscountAmount);
        }
      } else {
        discount = coupon.discountValue;
      }

      discount = Math.min(discount, subtotal); // Can't discount more than subtotal

      setAppliedCoupon(coupon);
      setCouponDiscount(discount);
      toast.success(`Coupon applied! You save ${formatCurrency(discount)}`);
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Failed to validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.streetAddress || !formData.city) {
      toast.error('Please fill in all required shipping fields');
      return;
    }

    if (formData.phone && formData.phone.length !== 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate stock availability before placing order
      const stockCheck = await validateStock(cartItems);
      if (!stockCheck.valid) {
        const msgs = stockCheck.outOfStock.map(
          item => `${item.name}: only ${item.available} left (you requested ${item.requested})`
        );
        toast.error(`Some items are out of stock:\n${msgs.join('\n')}`, { autoClose: 5000 });
        setIsSubmitting(false);
        return;
      }

      const orderData = {
        userId: user ? user.uid : 'guest',
        userName: user?.name || `${formData.firstName} ${formData.lastName}`.trim() || 'Guest Customer',
        userEmail: user?.email || formData.email || '',
        userPhone: user?.phone || formData.phone || '',
        userType: user?.isInstitutional ? 'Institutional' : 'Individual',
        items: cartItems,
        subtotal,
        couponCode: appliedCoupon?.code || null,
        couponDiscount,
        shippingCost,
        tax,
        total,
        shippingMethod,
        paymentMethod,
        shippingAddress: formData,
        status: 'Placed',
      };

      const newOrderId = await createOrder(orderData);

      // Increment coupon usedCount if a coupon was applied
      if (appliedCoupon?.id) {
        try {
          const couponRef = doc(db, 'coupons', appliedCoupon.id);
          await updateDoc(couponRef, { usedCount: increment(1) });
        } catch (err) {
          console.warn('Failed to update coupon usage count:', err);
        }
      }

      // Save address to user profile if logged in and not already saved
      if (user && formData.streetAddress) {
        const addresses = user.addresses || [];
        const addressExists = addresses.some(a => 
          a.street === formData.streetAddress && 
          a.city === formData.city && 
          a.zip === formData.zipCode
        );

        if (!addressExists) {
          const newAddress = {
            id: `addr_${Date.now()}`,
            label: formData.companyName ? 'Work' : 'Home',
            street: formData.streetAddress,
            city: formData.city,
            state: formData.state,
            zip: formData.zipCode,
            isDefault: addresses.length === 0,
          };
          
          await updateProfile({
            addresses: [...addresses, newAddress]
          });
        }
      }

      setOrderDetails({ id: newOrderId, total });
      clearCart();
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const shippingMethods = [
    { id: 'standard', label: 'Standard Shipping', desc: '5-7 business days', price: 'FREE', icon: Truck },
    { id: 'express', label: 'Express Shipping', desc: '2-3 business days', price: formatCurrency(500), icon: Zap },
    { id: 'white-glove', label: 'White Glove Delivery', desc: 'Installation included', price: formatCurrency(2000), icon: Crown },
  ];

  const paymentMethods = [
    { id: 'credit-card', label: 'Credit Card', icon: CreditCard },
    { id: 'purchase-order', label: 'Purchase Order', icon: FileText },
    { id: 'wire-transfer', label: 'Wire Transfer', icon: Building2 },
  ];

  return (
    <div className="container-main animate-fade-in pb-12">
      <Breadcrumbs items={[{ label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />

      <h1 className="text-2xl font-bold text-text-primary text-center mb-8">
        Secure Checkout
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
              <Truck size={20} className="text-primary" />
              Shipping Address
            </h2>

            {/* Address Cards — saved + order history */}
            {allAddresses.length > 0 && (
              <div className="space-y-3 mb-6">
                {/* Sort: default first, then saved, then order history */}
                {[...allAddresses].sort((a, b) => {
                  if (b.isDefault) return 1;
                  if (a.isDefault) return -1;
                  if (a.isFromOrder && !b.isFromOrder) return 1;
                  if (!a.isFromOrder && b.isFromOrder) return -1;
                  return 0;
                }).map((addr) => (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectAddress(addr)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      selectedAddressId === addr.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin size={14} className="text-primary shrink-0" />
                      <span className="text-sm font-semibold text-text-primary">{addr.label || 'Address'}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-bold">DEFAULT</span>
                      )}
                      {addr.isFromOrder && (
                        <span className="text-[10px] bg-gray-100 text-text-secondary px-1.5 py-0.5 rounded-full font-bold">ORDER HISTORY</span>
                      )}
                      {selectedAddressId === addr.id && (
                        <Check size={14} className="text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed pl-[22px]">
                      {addr.street}, {addr.city}, {addr.state} {addr.zip}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleSelectAddress('new')}
                  className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed transition-all ${
                    selectedAddressId === 'new'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-gray-300'
                  }`}
                >
                  <Plus size={16} className="text-primary" />
                  <span className="text-sm font-semibold text-primary">New Address</span>
                </button>
              </div>
            )}

            {/* Address Form — only shown when "New Address" is selected or no addresses at all */}
            {(selectedAddressId === 'new' || allAddresses.length === 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'First Name', placeholder: 'John', name: 'firstName' },
                  { label: 'Last Name', placeholder: 'Doe', name: 'lastName' },
                  { label: 'Institution / Company', placeholder: 'City General Hospital', full: true, name: 'institution' },
                  { label: 'Street Address', placeholder: '123 Medical Center Dr', full: true, name: 'streetAddress' },
                  { label: 'City', placeholder: 'San Francisco', name: 'city' },
                  { label: 'State', placeholder: 'California', name: 'state' },
                  { label: 'ZIP Code', placeholder: '94102', name: 'zipCode' },
                  { label: 'Phone', placeholder: '(555) 123-4567', name: 'phone' },
                ].map((field, i) => (
                  <div key={i} className={field.full ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-text-primary mb-1.5">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleInputChange}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipping Method — hidden for service-only orders */}
          {!isServiceOnly && (
            <div className="bg-white rounded-xl border border-border p-6">
              <h2 className="text-lg font-bold text-text-primary mb-5">Shipping Method</h2>
              <div className="space-y-3">
                {shippingMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${shippingMethod === method.id
                        ? 'border-primary bg-primary-light'
                        : 'border-border hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      value={method.id}
                      checked={shippingMethod === method.id}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="accent-primary"
                    />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${shippingMethod === method.id ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
                      }`}>
                      <method.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-text-primary">{method.label}</p>
                      <p className="text-xs text-text-secondary">{method.desc}</p>
                    </div>
                    <span className={`text-sm font-bold ${method.price === 'FREE' ? 'text-green-600' : 'text-text-primary'}`}>
                      {method.price}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Payment will be processed by payment gateway */}
          <div className="bg-white rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={20} className="text-primary" />
              <h2 className="text-lg font-bold text-text-primary">Payment</h2>
            </div>
            <p className="text-sm text-text-secondary">
              You will be securely redirected to our payment gateway to complete your purchase. We accept Visa, Mastercard, AMEX, FSA, and HSA cards.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            icon={Lock}
            onClick={handleCheckout}
            disabled={isSubmitting || cartItems.length === 0}
          >
            {isSubmitting ? 'Processing...' : `Complete Order — ${formatCurrency(total)}`}
          </Button>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border p-6 sticky top-24">
            <h3 className="text-lg font-bold text-text-primary mb-5">Order Summary</h3>
            <div className="space-y-4 mb-5">
              {cartItems.length === 0 ? (
                <p className="text-sm text-text-secondary text-center py-4">No items in cart</p>
              ) : (
                cartItems.map((item) => {
                  const isService = item.category === 'Services' || (item.id && String(item.id).startsWith('service-'));
                  return (
                    <div key={item.id} className="flex items-center gap-3">
                      {!isService && (
                        item.image ? (
                          <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                            <Package size={20} className="text-text-secondary" />
                          </div>
                        )
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                        <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  );
                })
              )}
            </div>
            {/* Coupon Code Input */}
            <div className="border-t border-border pt-4 mb-4">
              <label className="text-sm font-semibold text-text-primary flex items-center gap-1.5 mb-2">
                <Tag size={14} className="text-primary" />
                Have a Coupon?
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                  <div>
                    <span className="text-sm font-bold text-green-700 font-mono">{appliedCoupon.code}</span>
                    <span className="text-xs text-green-600 ml-2">(-{formatCurrency(couponDiscount)})</span>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-green-500 hover:text-red-500 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono uppercase"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading}
                      className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {couponLoading ? <Loader2 size={14} className="animate-spin" /> : 'Apply'}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-danger mt-1.5">{couponError}</p>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="font-medium">Coupon Discount</span>
                  <span className="font-semibold">-{formatCurrency(couponDiscount)}</span>
                </div>
              )}
              {!isServiceOnly && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Shipping</span>
                  <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                    {shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Tax (8.5%)</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"></div>
          <div className="relative bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Order Confirmed!</h2>
            <p className="text-text-secondary mb-1">Thank you for your purchase.</p>
            <p className="text-sm font-medium text-text-primary mb-8">
              Order ID: <span className="text-primary">{orderDetails?.id}</span>
            </p>
            
            <div className="space-y-3">
              <Button 
                variant="primary" 
                className="w-full justify-center" 
                href={user ? '/orders' : '/'}
                size="lg"
              >
                Go to My Orders
              </Button>
              <Button 
                variant="secondary" 
                className="w-full justify-center" 
                href="/products"
                size="lg"
              >
                Browse More Products
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
