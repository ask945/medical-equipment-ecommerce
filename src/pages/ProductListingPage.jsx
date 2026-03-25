import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import { useData } from '../context/DataContext';

const PRODUCTS_PER_PAGE = 6;

export default function ProductListingPage() {
  const { products, categories, productsLoading, categoriesLoading } = useData();
  const loading = productsLoading || categoriesLoading;
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  const [sidebarFilters, setSidebarFilters] = useState({
    categories: [],
    priceRange: [0, 100000],
    brands: [],
    minRating: 0,
  });

  const filteredProducts = useMemo(() => {
    let result = products;

    const activeCategories = [...sidebarFilters.categories];

    // Compare by ID (Firestore doc id) or by normalized name for backward compat
    const normalize = (str) => (str || '').toLowerCase().replace(/\s+/g, '-');

    if (activeCategories.length > 0) {
      result = result.filter((p) => {
        const prodCatId = (p.categoryId || p.category || p.type || '');
        const prodCatName = normalize(p.category || p.type || '');
        return activeCategories.some(cat => 
          cat === prodCatId || 
          normalize(cat) === prodCatName ||
          normalize(cat) === normalize(prodCatId)
        );
      });
    }

    result = result.filter(
      (p) => p.price >= sidebarFilters.priceRange[0] && p.price <= sidebarFilters.priceRange[1]
    );

    if (sidebarFilters.brands.length > 0) {
      result = result.filter((p) => {
        const prodBrand = normalize(p.brand);
        return sidebarFilters.brands.some(b => normalize(b) === prodBrand);
      });
    }

    if (sidebarFilters.minRating > 0) {
      result = result.filter((p) => Number(p.rating) > 0 && Number(p.rating) >= sidebarFilters.minRating);
    }

    // Sorting
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'rating': {
          const aR = Number(a.rating) || 0;
          const bR = Number(b.rating) || 0;
          // Unrated products go last
          if (aR === 0 && bR > 0) return 1;
          if (bR === 0 && aR > 0) return -1;
          return bR - aR;
        }
        case 'newest':
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0) || b.id.localeCompare(a.id);
        case 'featured':
        default:
          return 0; // Maintain original order
      }
    });

    return result;
  }, [products, categoryFilter, sidebarFilters, sortBy]);

  // Pagination computed values
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedProducts = filteredProducts.slice(
    (safePage - 1) * PRODUCTS_PER_PAGE,
    safePage * PRODUCTS_PER_PAGE
  );

  // Reset to page 1 when filters change
  const handleFilterChange = useCallback((filters) => {
    setSidebarFilters(filters);
    setCurrentPage(1);
  }, []);

  // Resolve friendly name for display - prioritize sidebar selection
  const activeCategoryId = sidebarFilters.categories.length > 0 ? sidebarFilters.categories[0] : null;
  const categoryLabel = activeCategoryId
    ? (categories.find(c => c.id === activeCategoryId)?.label ||
       categories.find(c => c.id === activeCategoryId)?.name ||
       activeCategoryId)
    : null;

  const breadcrumbItems = categoryLabel
    ? [{ label: 'Products', href: '/products' }, { label: categoryLabel }]
    : [{ label: 'Products' }];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container-main animate-fade-in">
      <Breadcrumbs items={breadcrumbItems} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {categoryLabel || 'Medical Equipment'}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Showing {pagedProducts.length} of {filteredProducts.length} products
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-white border border-border rounded-lg text-sm font-medium text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6 pb-12 relative">
        {/* Mobile Overlay Backdrop */}
        {showFilters && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-[60] animate-fade-in"
            onClick={() => setShowFilters(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-[70] lg:z-10
          w-[280px] lg:w-64 bg-white lg:bg-transparent
          transform transition-transform duration-300 ease-in-out
          ${showFilters ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          lg:block shrink-0
          p-6 lg:p-0 border-r lg:border-r-0 border-border lg:border-none
          overflow-y-auto custom-scrollbar
        `}>
          <FilterSidebar 
            initialCategory={categoryFilter}
            onFilterChange={handleFilterChange} 
            onClose={() => setShowFilters(false)}
          />
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {pagedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {pagedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-text-secondary">
              <p className="text-lg font-medium mb-2">No products found</p>
              <p className="text-sm">Try adjusting your filters or search criteria.</p>
            </div>
          )}

          {/* Dynamic Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    page === safePage
                      ? 'bg-primary text-white'
                      : 'bg-white border border-border text-text-secondary hover:border-primary hover:text-primary'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-10 h-10 rounded-lg flex items-center justify-center bg-white border border-border text-text-secondary hover:border-primary hover:text-primary transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
