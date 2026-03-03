import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import { useWishlist } from '../context/WishlistContext';

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();

  return (
    <div className="container-main animate-fade-in py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-2">My Wishlist</h1>
      <p className="text-sm text-text-secondary mb-8">{items.length} items saved</p>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-lg font-medium text-text-primary mb-2">Your wishlist is empty</p>
          <p className="text-sm text-text-secondary mb-6">Browse products and tap the heart icon to save your favorites.</p>
          <Button variant="primary" href="/products">Browse Products</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-shadow group">
              <Link to={`/product/${product.id}`} className="block relative h-48 overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {product.badge && (
                  <span className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">{product.badge}</span>
                )}
              </Link>
              <div className="p-4">
                <Link to={`/product/${product.id}`} className="text-sm font-semibold text-text-primary hover:text-primary transition-colors line-clamp-2">{product.name}</Link>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-lg font-bold text-primary">${product.price}</p>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => removeItem(product.id)}
                      className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-colors"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-primary-light transition-colors" title="Add to cart">
                      <ShoppingCart size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
