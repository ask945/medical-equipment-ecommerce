import { Star, ShoppingCart, Heart, Trash2, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { formatCurrency } from '../utils/formatUtils';

export default function ProductCard({ product, isWishlistPage = false }) {
  const { toggleItem, isWishlisted, removeItem } = useWishlist();
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
  const wishlisted = isWishlisted(product.id);

  const cartItem = cartItems.find(item => item.id === product.id);
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    if (isWishlistPage) {
      removeItem(product.id);
    }
    toast.success(`${product.name} added to cart!`);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, (current) => current + 1);
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQty <= 1) {
      removeFromCart(product.id);
    } else {
      updateQuantity(product.id, (current) => current - 1);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col relative">
      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary text-white text-xs font-semibold rounded-md shadow-sm">
            {product.badge}
          </span>
        )}
        {(!product.stock || product.stock <= 0) && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-danger text-white text-sm font-semibold rounded-md">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Wishlist/Delete button */}
      <button
        onClick={() => toggleItem(product)}
        title={isWishlistPage ? "Remove from wishlist" : wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all z-10 cursor-pointer ${
          isWishlistPage 
            ? 'bg-red-50 text-danger hover:bg-danger hover:text-white' 
            : wishlisted
              ? 'bg-danger text-white'
              : 'bg-white/90 text-text-secondary hover:text-danger hover:bg-white'
          }`}
      >
        {isWishlistPage ? (
          <Trash2 size={14} />
        ) : (
          <Heart size={14} className={wishlisted ? 'fill-white' : ''} />
        )}
      </button>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <span className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
          {product.category}
        </span>
        <Link
          to={`/product/${product.id}`}
          className="text-sm font-semibold text-text-primary hover:text-primary transition-colors line-clamp-2 mb-2"
        >
          {product.name}
        </Link>

        {/* Rating — only show when there are real reviews */}
        {Number(product.reviews) > 0 ? (
          <div className="flex items-center gap-1.5 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={
                    i < Math.floor(product.rating || 0)
                      ? 'text-warning fill-warning'
                      : 'text-gray-200 fill-gray-200'
                  }
                />
              ))}
            </div>
            <span className="text-xs text-text-secondary">
              {product.rating} ({product.reviews})
            </span>
          </div>
        ) : (
          <div className="mb-3" />
        )}

        {/* Price + Action */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-lg font-bold text-text-primary">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-text-secondary line-through ml-1.5">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          {cartQty > 0 ? (
            <div className="flex items-center border-2 border-primary rounded-lg overflow-hidden" onClick={(e) => e.preventDefault()}>
              <button
                onClick={handleDecrement}
                className="px-2 py-1.5 hover:bg-primary-light transition-colors cursor-pointer text-primary"
              >
                <Minus size={14} />
              </button>
              <span className="px-3 py-1.5 text-xs font-bold text-primary border-x-2 border-primary min-w-[32px] text-center">
                {cartQty}
              </span>
              <button
                onClick={handleIncrement}
                className="px-2 py-1.5 hover:bg-primary-light transition-colors cursor-pointer text-primary"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              icon={ShoppingCart}
              disabled={!product.stock || product.stock <= 0}
              onClick={handleAddToCart}
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
