import { useState, useEffect, useRef } from 'react';
import { Star, X } from 'lucide-react';
import Button from './Button';
import { brands } from '../data/mockData';

export default function FilterSidebar({ onFilterChange }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);

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

  const categories = ['Diabetes Care', 'Respiratory & CPAP', 'Heart & BP Monitors', 'Mobility & Recovery'];

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
        <h3 className="font-semibold text-text-primary">Filters</h3>
        <button
          onClick={resetAll}
          className="text-xs text-primary hover:underline font-medium"
        >
          Reset All
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Category</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Price Range</h4>
        <input
          type="range"
          min="0"
          max="1000"
          step="25"
          value={priceRange[1]}
          onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-text-secondary mt-1">
          <span>$0</span>
          <span>${priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Brand</h4>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => toggleBrand(brand)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
              />
              <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                {brand}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="text-sm font-semibold text-text-primary mb-3">Minimum Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(rating)}
              className={`flex items-center gap-1.5 w-full px-2 py-1.5 rounded text-sm transition-colors ${
                minRating === rating ? 'bg-primary-light text-primary' : 'text-text-secondary hover:bg-gray-50'
              }`}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < rating ? 'text-warning fill-warning' : 'text-gray-200 fill-gray-200'}
                  />
                ))}
              </div>
              <span>& Up</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
