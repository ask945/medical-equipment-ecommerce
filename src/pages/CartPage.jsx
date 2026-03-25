import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Package } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatUtils';

export default function CartPage() {
  const { cartItems: items, updateQuantity: contextUpdateQty, removeFromCart, subtotal, loading } = useCart();

  const updateQuantity = (id, delta) => {
    const item = items.find(i => i.id === id);
    if (item && item.quantity + delta < 1) {
      removeFromCart(id);
    } else {
      contextUpdateQty(id, (current) => Math.max(1, current + delta));
    }
  };

  const removeItem = (id) => {
    removeFromCart(id);
  };
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
              {(() => {
                const isService = item.category === 'Services' || (item.id && String(item.id).startsWith('service-'));
                if (isService) return null;
                
                return (
                  <Link to={`/product/${item.id}`} className="shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-gray-50 rounded-lg flex items-center justify-center">
                        <Package size={32} className="text-text-secondary" />
                      </div>
                    )}
                  </Link>
                );
              })()}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs text-primary font-medium uppercase">
                      {item.category}
                    </span>
                    <Link
                      to={item.category === 'Services' ? '/services' : `/product/${item.id}`}
                      className="block text-sm font-semibold text-text-primary hover:text-primary mt-0.5"
                    >
                      {item.name}
                    </Link>
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger-light transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center border border-border rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 py-1.5 text-sm font-semibold border-x border-border">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-2 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <p className="text-lg font-bold text-text-primary">
                    {formatCurrency(item.price * item.quantity)}
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
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Shipping</span>
                <span className={`font-medium ${shipping === 0 ? 'text-green-600' : ''}`}>
                  {shipping === 0 ? 'FREE' : formatCurrency(shipping)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Tax (8.5%)</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>
            </div>


            <div className="mt-5 pt-5 border-t border-border">
              <div className="flex justify-between mb-5">
                <span className="text-lg font-bold text-text-primary">Total</span>
                <span className="text-lg font-bold text-text-primary">
                  {formatCurrency(total)}
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
