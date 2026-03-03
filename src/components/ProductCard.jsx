import { Star, ShoppingCart, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { useWishlist } from '../context/WishlistContext';

export default function ProductCard({ product }) {
  const { toggleItem, isWishlisted } = useWishlist();
  const wishlisted = isWishlisted(product.id);

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
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-danger text-white text-sm font-semibold rounded-md">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Wishlist button */}
      <button
        onClick={() => toggleItem(product)}
        className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all z-10 ${
          wishlisted
            ? 'bg-danger text-white'
            : 'bg-white/90 text-text-secondary hover:text-danger hover:bg-white'
        }`}
      >
        <Heart size={14} className={wishlisted ? 'fill-white' : ''} />
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

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={13}
                className={
                  i < Math.floor(product.rating)
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

        {/* Price + Action */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-lg font-bold text-text-primary">
              ${product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-text-secondary line-through ml-1.5">
                ${product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={ShoppingCart}
            disabled={!product.inStock}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
