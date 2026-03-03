import { useState } from 'react';
import {
  CreditCard,
  FileText,
  Building2,
  Truck,
  Zap,
  Crown,
  Lock,
  Check,
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import StepIndicator from '../components/StepIndicator';
import Button from '../components/Button';
import { cartItems } from '../data/mockData';

const steps = ['Shipping', 'Payment', 'Review', 'Confirmation'];

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  const subtotal = cartItems.reduce((s, item) => s + item.price * item.quantity, 0);
  const shippingCost = shippingMethod === 'express' ? 29.99 : shippingMethod === 'white-glove' ? 149.99 : 0;
  const tax = subtotal * 0.085;
  const total = subtotal + shippingCost + tax;

  const shippingMethods = [
    { id: 'standard', label: 'Standard Shipping', desc: '5-7 business days', price: 'FREE', icon: Truck },
    { id: 'express', label: 'Express Shipping', desc: '2-3 business days', price: '$29.99', icon: Zap },
    { id: 'white-glove', label: 'White Glove Delivery', desc: 'Installation included', price: '$149.99', icon: Crown },
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

      {/* Step indicator — commented out */}
      {/* <StepIndicator steps={steps} currentStep={currentStep} /> */}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
              <Truck size={20} className="text-primary" />
              Shipping Address
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'First Name', placeholder: 'John' },
                { label: 'Last Name', placeholder: 'Doe' },
                { label: 'Institution / Company', placeholder: 'City General Hospital', full: true },
                { label: 'Street Address', placeholder: '123 Medical Center Dr', full: true },
                { label: 'City', placeholder: 'San Francisco' },
                { label: 'State', placeholder: 'California' },
                { label: 'ZIP Code', placeholder: '94102' },
                { label: 'Phone', placeholder: '(555) 123-4567' },
              ].map((field, i) => (
                <div key={i} className={field.full ? 'sm:col-span-2' : ''}>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Method */}
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-5">Shipping Method</h2>
            <div className="space-y-3">
              {shippingMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    shippingMethod === method.id
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
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    shippingMethod === method.id ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary'
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

          {/* Payment Method — commented out: handled by payment gateway provider */}
          {/*
          <div className="bg-white rounded-xl border border-border p-6">
            <h2 className="text-lg font-bold text-text-primary mb-5 flex items-center gap-2">
              <Lock size={20} className="text-primary" />
              Payment Method
            </h2>
            <div className="flex border-b border-border mb-5">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.id}
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    paymentMethod === pm.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  <pm.icon size={16} />
                  {pm.label}
                </button>
              ))}
            </div>
            {paymentMethod === 'credit-card' && ( ... )}
            {paymentMethod === 'purchase-order' && ( ... )}
            {paymentMethod === 'wire-transfer' && ( ... )}
          </div>
          */}

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
            onClick={() => setCurrentStep(Math.min(3, currentStep + 1))}
          >
            Complete Order — ${total.toFixed(2)}
          </Button>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border p-6 sticky top-24">
            <h3 className="text-lg font-bold text-text-primary mb-5">Order Summary</h3>
            <div className="space-y-4 mb-5">
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{item.name}</p>
                    <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold">${(item.price * item.quantity).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600 font-medium' : ''}>
                  {shippingCost === 0 ? 'FREE' : `$${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tax (8.5%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-border text-lg font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
