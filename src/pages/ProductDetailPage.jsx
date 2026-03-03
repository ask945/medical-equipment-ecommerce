import { useState } from 'react';
import { useParams } from 'react-router-dom';
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
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import ProductCard from '../components/ProductCard';
import { products } from '../data/mockData';

export default function ProductDetailPage() {
  const { id } = useParams();
  const product = products.find((p) => p.id === parseInt(id)) || products[0];
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState(0);

  const images = [product.image, ...products.slice(1, 4).map((p) => p.image)];
  const relatedProducts = products.filter((p) => p.id !== product.id).slice(0, 4);
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
                className={`rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === i
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

          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={
                    i < Math.floor(product.rating)
                      ? 'text-warning fill-warning'
                      : 'text-gray-200 fill-gray-200'
                  }
                />
              ))}
            </div>
            <span className="text-sm font-medium text-text-primary">{product.rating}</span>
            <span className="text-sm text-text-secondary">({product.reviews} reviews)</span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-text-primary">
              ${product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-lg text-text-secondary line-through">
                  ${product.originalPrice.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 bg-success-light text-green-700 text-xs font-semibold rounded">
                  Save ${(product.originalPrice - product.price).toLocaleString()}
                </span>
              </>
            )}
          </div>

          <p className="text-text-secondary leading-relaxed mb-6">{product.description}</p>

          {/* Quantity & Actions */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-text-primary">Quantity:</span>
              <div className="flex items-center border border-border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="px-5 py-2 text-sm font-semibold border-x border-border min-w-[48px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2.5 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="primary" size="lg" icon={ShoppingCart} className="flex-1">
                Add to Cart
              </Button>
              <Button variant="secondary" size="lg" icon={FileText}>
                Request Quote
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
                <Heart size={16} /> Wishlist
              </button>
              <button className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
                <Share2 size={16} /> Share
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 rounded-xl">
            {[
              { icon: Truck, label: 'Free Shipping', sub: 'Orders over $500' },
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
              className={`px-6 py-3.5 text-sm font-medium capitalize transition-colors relative ${
                activeTab === tab
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
          {activeTab === 'specifications' && (
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
            <div className="space-y-4">
              {[
                { name: 'Dr. Sarah Chen', rating: 5, text: 'Outstanding quality. We\'ve been using this in our clinic for 6 months and it has exceeded expectations.' },
                { name: 'Metro Health Labs', rating: 4, text: 'Great device with reliable performance. Customer support was also excellent during setup.' },
                { name: 'Valley Medical Center', rating: 5, text: 'Best investment we\'ve made this year. The accuracy and build quality are top-notch.' },
              ].map((review, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-primary-light text-primary rounded-full flex items-center justify-center text-sm font-bold">
                      {review.name[0]}
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{review.name}</span>
                    <div className="flex ml-auto">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} size={12} className={j < review.rating ? 'text-warning fill-warning' : 'text-gray-200'} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary">{review.text}</p>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'documentation' && (
            <div className="space-y-3">
              {[
                { name: 'User Manual v3.2', size: '4.2 MB' },
                { name: 'Technical Specifications Sheet', size: '1.8 MB' },
                { name: 'Certification Documents', size: '2.1 MB' },
                { name: 'Maintenance Guide', size: '900 KB' },
              ].map((doc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-text-primary">{doc.name}</p>
                      <p className="text-xs text-text-secondary">PDF • {doc.size}</p>
                    </div>
                  </div>
                  <Download size={16} className="text-text-secondary" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-6">Related Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
