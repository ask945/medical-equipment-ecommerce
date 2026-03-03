import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, Tag, ArrowRight, ShoppingBag } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { cartItems as initialItems } from '../data/mockData';

export default function CartPage() {
  const [items, setItems] = useState(initialItems);
  const [promoCode, setPromoCode] = useState('');

  const updateQuantity = (id, delta) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = subtotal > 500 ? 0 : 49.99;
  const tax = subtotal * 0.085;
  const total = subtotal + shipping + tax;

  if (items.length === 0) {
    return (
      <div className="container-main py-20 text-center animate-fade-in">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={32} className="text-text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-3">Your cart is empty</h2>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          Browse our selection of medical equipment and add items to your cart.
        </p>
        <Button variant="primary" size="lg" href="/products" iconRight={ArrowRight}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="container-main animate-fade-in pb-12">
      <Breadcrumbs items={[{ label: 'Shopping Cart' }]} />

      <h1 className="text-2xl font-bold text-text-primary mb-6">
        Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-border p-5 flex gap-5 hover:shadow-sm transition-shadow"
            >
              <Link to={`/product/${item.id}`} className="shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs text-primary font-medium uppercase">
                      {item.category}
                    </span>
                    <Link
                      to={`/product/${item.id}`}
                      className="block text-sm font-semibold text-text-primary hover:text-primary mt-0.5"
                    >
                      {item.name}
                    </Link>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger-light transition-colors shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-2 hover:bg-gray-50 transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 py-1.5 text-sm font-semibold border-x border-border">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-2 hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    ${(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <div className="text-right">
            <Button variant="secondary" href="/products" size="sm">
              Continue Shopping
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-border p-6 sticky top-24">
            <h3 className="text-lg font-bold text-text-primary mb-5">Order Summary</h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-medium">${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                  {shipping === 0 ? 'FREE' : `$${shipping}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tax (8.5%)</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
            </div>

            {/* Promo Code */}
            <div className="mt-5 pt-5 border-t border-border">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promo code"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <Button variant="secondary" size="sm">
                  Apply
                </Button>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-border">
              <div className="flex justify-between mb-5">
                <span className="text-lg font-bold text-text-primary">Total</span>
                <span className="text-lg font-bold text-text-primary">
                  ${total.toFixed(2)}
                </span>
              </div>
              <Button variant="primary" size="lg" className="w-full" href="/checkout" iconRight={ArrowRight}>
                Proceed to Checkout
              </Button>
            </div>

            <p className="text-xs text-text-secondary text-center mt-4">
              🔒 Secure checkout with 256-bit SSL encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
