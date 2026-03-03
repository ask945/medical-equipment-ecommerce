import { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';
import Button from './Button';
import { getBrands } from '../services/brandService';
import { getCategories } from '../services/categoryService'; // Use static import instead

export default function FilterSidebar({ onFilterChange }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Fetch brands
    getBrands()
      .then((data) => {
        const brandNames = data.map((b) => (typeof b === 'string' ? b : b.name || b.id));
        setBrands(brandNames);
      })
      .catch((err) => console.error('Error fetching brands:', err));
      
    // Fetch categories
    getCategories()
      .then((data) => {
        const categoryNames = data.map(c => c.label || c.name);
        setCategories(categoryNames);
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  useEffect(() => {
    if (onFilterChangeRef.current) {
      onFilterChangeRef.current({
        categories: selectedCategories,
        priceRange,
        brands: selectedBrands,
        minRating,
      });
    }
  }, [selectedCategories, priceRange, selectedBrands, minRating]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleBrand = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const resetAll = () => {
    setSelectedCategories([]);
    setPriceRange([0, 50000]);
    setSelectedBrands([]);
    setMinRating(0);
  };

  return (
    <aside className="w-full bg-white rounded-lg border border-border p-5 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-text-primary">Filters</h2>
        <button
          onClick={resetAll}
          className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">
            Categories
          </h3>
          <div className="space-y-2">
            {categories.map((cat) => (
              <label
                key={cat}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleCategory(cat)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-colors cursor-pointer"
                />
                <span className="text-sm text-text-secondary group-hover:text-primary transition-colors">
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">
          Price Range
        </h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={priceRange[0]}
            onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
            className="w-full px-2 py-1 border border-border rounded-md text-sm"
            min="0"
          />
          <span className="text-text-secondary">-</span>
          <input
            type="number"
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full px-2 py-1 border border-border rounded-md text-sm"
            min="0"
          />
        </div>
      </div>

      {/* Brands */}
      {brands.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-border">
          <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">
            Brands
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {brands.map((brand) => (
              <label
                key={brand}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand)}
                  onChange={() => toggleBrand(brand)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-colors cursor-pointer"
                />
                <span className="text-sm text-text-secondary group-hover:text-primary transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                  {brand}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Minimum Rating */}
      <div className="space-y-3 pt-4 border-t border-border">
        <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">
          Minimum Rating
        </h3>
        <div className="space-y-2">
          {[4, 3, 2, 1].map((rating) => (
            <label
              key={rating}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
                className="w-4 h-4 text-primary focus:ring-primary transition-colors cursor-pointer border-gray-300"
              />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i < rating
                        ? 'text-warning fill-warning'
                        : 'text-gray-200 fill-gray-200'
                    }
                  />
                ))}
                <span className="text-sm text-text-secondary ml-1">& Up</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
