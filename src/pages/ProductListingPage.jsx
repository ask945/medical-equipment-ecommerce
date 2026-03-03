import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import FilterSidebar from '../components/FilterSidebar';
import ProductCard from '../components/ProductCard';
import { getProducts } from '../services/productService';

const PRODUCTS_PER_PAGE = 6;

export default function ProductListingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  const [sidebarFilters, setSidebarFilters] = useState({
    categories: [],
    priceRange: [0, 1000],
    brands: [],
    minRating: 0,
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products;

    const activeCategories = [...sidebarFilters.categories];
    if (categoryFilter && activeCategories.length === 0) {
      activeCategories.push(categoryFilter);
    }

    if (activeCategories.length > 0) {
      result = result.filter((p) => activeCategories.includes(p.category));
    }

    result = result.filter(
      (p) => p.price >= sidebarFilters.priceRange[0] && p.price <= sidebarFilters.priceRange[1]
    );

    if (sidebarFilters.brands.length > 0) {
      result = result.filter((p) =>
        sidebarFilters.brands.some((brand) => p.name.includes(brand))
      );
    }

    if (sidebarFilters.minRating > 0) {
      result = result.filter((p) => p.rating >= sidebarFilters.minRating);
    }

    return result;
  }, [products, categoryFilter, sidebarFilters]);

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

  const breadcrumbItems = categoryFilter
    ? [{ label: 'Products', href: '/products' }, { label: categoryFilter }]
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
            {categoryFilter || 'Medical Equipment'}
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

      <div className="flex gap-6 pb-12">
        {/* Sidebar */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-64 shrink-0`}>
          <FilterSidebar onFilterChange={handleFilterChange} />
        </div>

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
