import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  FileText,
  Minus,
  Plus,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Download,
  Loader2,
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { getProductById } from '../services/productService';
import { useData } from '../context/DataContext';
import { formatCurrency } from '../utils/formatUtils';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { getReviewsByProduct, canUserReview, addReview } from '../services/reviewService';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { products: allProducts } = useData();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState(0);
  const { cartItems, addToCart, removeFromCart, updateQuantity: updateCartQty } = useCart();
  const navigate = useNavigate();
  const { toggleItem, isWishlisted } = useWishlist();
  const { user } = useAuth();
  
  const [reviews, setReviews] = useState([]);
  const [canReview, setCanReview] = useState({ canReview: false });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  
  const wishlisted = product ? isWishlisted(product.id) : false;
  const relatedProducts = product ? allProducts.filter(p => p.id !== product.id).slice(0, 4) : [];

  // Derive cart state for this product
  const cartItem = product ? cartItems.find(item => item.id === product.id) : null;
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        category: product.category,
        stock: product.stock
      }, quantity);
      toast.success(`${product.name} added to cart!`);
    }
  };

  const handleCartIncrement = () => {
    if (product) {
      updateCartQty(product.id, (current) => current + 1);
    }
  };

  const handleCartDecrement = () => {
    if (product && cartQty <= 1) {
      removeFromCart(product.id);
      toast.info(`${product.name} removed from cart`);
    } else if (product) {
      updateCartQty(product.id, (current) => current - 1);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [prod, productReviews] = await Promise.all([
          getProductById(id, { checkVisibility: true }),
          getReviewsByProduct(id)
        ]);
        
        setProduct(prod);
        setReviews(productReviews);
        
        if (prod) {
          if (user) {
            const eligibility = await canUserReview(user.uid, id);
            setCanReview(eligibility);
          }
        }
      } catch (err) {
        console.error('Error fetching product details:', err);
      } finally {
        setLoading(false);
      }
    }
    setLoading(true);
    setSelectedImage(0);
    setQuantity(1);
    setActiveTab('description');
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-main py-20 text-center">
        <p className="text-lg font-medium text-text-primary mb-2">Product not found</p>
        <Button variant="primary" href="/products">Browse Products</Button>
      </div>
    );
  }

  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const tabs = ['description', 'specifications', 'reviews', 'documentation'];

  return (
    <div className="container-main animate-fade-in pb-12">
      <Breadcrumbs
        items={[
          { label: 'Products', href: '/products' },
          { label: product.category, href: '/products' },
          { label: product.name },
        ]}
      />

      {/* Product Section */}
      <div className="grid lg:grid-cols-2 gap-10 mb-12">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <img
              src={images[selectedImage]}
              alt={product.name}
              className="w-full h-[450px] object-cover"
            />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === i
                  ? 'border-primary shadow-md'
                  : 'border-border hover:border-gray-300'
                  }`}
              >
                <img src={img} alt="" className="w-full h-20 object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {product.badge && (
              <span className="px-2.5 py-0.5 bg-primary-light text-primary text-xs font-semibold rounded-md">
                {product.badge}
              </span>
            )}
            <span className="text-xs text-text-secondary uppercase tracking-wide">
              {product.category}
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-3">
            {product.name}
          </h1>

          {/* Rating — only show when there are real reviews */}
          {Number(product.reviews) > 0 ? (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.floor(product.rating || 0)
                        ? 'text-warning fill-warning'
                        : 'text-gray-200 fill-gray-200'
                    }
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-text-primary">{product.rating}</span>
              <span className="text-sm text-text-secondary">({product.reviews} reviews)</span>
            </div>
          ) : (
            <p className="text-sm text-text-secondary mb-4">No ratings yet</p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-text-primary">
              {formatCurrency(product.price || 0)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-text-secondary line-through">
                  {formatCurrency(product.originalPrice)}
                </span>
                <span className="px-2 py-0.5 bg-success-light text-green-700 text-xs font-semibold rounded">
                  Save {formatCurrency(product.originalPrice - product.price)}
                </span>
              </>
            )}
          </div>

          <p className="text-text-secondary leading-relaxed mb-6">{product.description}</p>

          {/* Quantity & Actions */}
          <div className="space-y-4 mb-8">
            <div className="flex gap-3">
              {cartQty > 0 ? (
                <div className="flex items-center bg-primary rounded-lg overflow-hidden flex-none w-32 h-11">
                  <button
                    onClick={handleCartDecrement}
                    className="px-3 h-full hover:bg-black/10 transition-colors cursor-pointer text-white"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="flex-1 text-sm font-bold text-white text-center">
                    {cartQty}
                  </span>
                  <button
                    onClick={handleCartIncrement}
                    className="px-3 h-full hover:bg-black/10 transition-colors cursor-pointer text-white"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="lg"
                  icon={ShoppingCart}
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!product.stock || product.stock <= 0}
                >
                  Add to Cart
                </Button>
              )}
              <Button variant="secondary" size="lg" icon={FileText} onClick={() => navigate('/contact?subject=Request%20Quote')}>
                Request Quote
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => toggleItem(product)}
                className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${wishlisted ? 'text-danger' : 'text-text-secondary hover:text-primary'
                  }`}
              >
                <Heart size={16} className={wishlisted ? 'fill-danger text-danger' : ''} /> {wishlisted ? 'In Wishlist' : 'Wishlist'}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                    .then(() => toast.success('Product link copied to clipboard!'))
                    .catch(() => toast.error('Failed to copy link'));
                }}
                className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors cursor-pointer"
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'Orders over ₹500' },
              { icon: Shield, label: '2-Year Warranty', sub: 'Full coverage' },
              { icon: RotateCcw, label: '30-Day Returns', sub: 'Hassle-free' },
            ].map((feat, i) => (
              <div key={i} className="text-center">
                <feat.icon size={20} className="mx-auto mb-1.5 text-primary" />
                <p className="text-xs font-semibold text-text-primary">{feat.label}</p>
                <p className="text-[10px] text-text-secondary">{feat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-border overflow-hidden mb-12">
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-medium capitalize transition-colors relative ${activeTab === tab
                ? 'text-primary'
                : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'description' && (
            <div className="prose max-w-none text-text-secondary leading-relaxed">
              <p className="mb-4">{product.description}</p>
              <p>
                This premium medical device is designed for professional healthcare
                environments. Built with the highest quality materials and rigorous
                testing standards, it ensures reliable performance in critical clinical
                settings. Meets all regulatory requirements including FDA 510(k), CE
                marking, and ISO 13485 certification.
              </p>
            </div>
          )}
          {activeTab === 'specifications' && product.specs && (
            <table className="w-full">
              <tbody>
                {Object.entries(product.specs).map(([key, val], i) => (
                  <tr
                    key={key}
                    className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-text-primary w-1/3">
                      {key}
                    </td>
                    <td className="px-4 py-3 text-sm text-text-secondary">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Review Submission Form */}
              {!canReview.canReview && canReview.reason && (
                <div className="p-4 bg-gray-50 rounded-xl border border-border mb-4">
                  <p className="text-sm text-text-secondary font-medium">
                    {canReview.reason === 'ALREADY_REVIEWED' && 'You have already reviewed this product.'}
                    {canReview.reason === 'NOT_DELIVERED' && 'You can review this product only after it has been delivered to you.'}
                  </p>
                </div>
              )}
              {canReview.canReview && (
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10">
                  <h4 className="text-lg font-bold text-text-primary mb-1">Write a Review</h4>
                  <p className="text-sm text-text-secondary mb-6">Share your experience with this product.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            onClick={() => setReviewForm({ ...reviewForm, rating: num })}
                            className="transition-transform active:scale-95"
                          >
                            <Star
                              size={24}
                              className={num <= reviewForm.rating ? 'text-warning fill-warning' : 'text-gray-300'}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-text-primary mb-2">Comment</label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                        placeholder="What did you think of the product?"
                        className="w-full h-32 p-4 bg-white border border-border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none resize-none text-sm transition-all"
                      />
                    </div>
                    
                    <Button
                      variant="primary"
                      loading={submittingReview}
                      onClick={async () => {
                        if (!reviewForm.comment.trim()) return toast.error("Please add a comment");
                        setSubmittingReview(true);
                        try {
                          await addReview({
                            productId: id,
                            userId: user.uid,
                            userName: user.name,
                            rating: reviewForm.rating,
                            comment: reviewForm.comment
                          });
                          toast.success("Review submitted!");
                          setCanReview({ canReview: false });
                          // Refresh reviews
                          const updatedReviews = await getReviewsByProduct(id);
                          setReviews(updatedReviews);
                          // Refresh product data for stats
                          const updatedProd = await getProductById(id);
                          setProduct(updatedProd);
                        } catch (err) {
                          toast.error("Failed to submit review");
                        } finally {
                          setSubmittingReview(false);
                        }
                      }}
                    >
                      Submit Review
                    </Button>
                  </div>
                </div>
              )}

              {/* Review List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-text-secondary font-medium">No reviews yet. Be the first to rate!</p>
                  </div>
                ) : (
                  reviews.map((review, i) => (
                    <div key={i} className="p-6 bg-white border border-border rounded-xl hover:shadow-sm transition-all">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-black uppercase tracking-tighter">
                          {review.userName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-text-primary">{review.userName}</span>
                            <span className="px-2 py-0.5 bg-success/10 text-success text-[10px] font-black uppercase rounded">Verified Purchase</span>
                          </div>
                          <p className="text-[11px] text-text-secondary font-medium">
                            {review.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="flex ml-auto gap-1">
                          {[...Array(5)].map((_, j) => (
                            <Star key={j} size={14} className={j < review.rating ? 'text-warning fill-warning' : 'text-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="text-[14px] text-text-secondary leading-relaxed font-medium">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === 'documentation' && (
            <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed">
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
              <p className="mt-3">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
              <p className="mt-3">Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
