import { useState, useEffect, useRef } from 'react';
import { Star, X } from 'lucide-react';
import Button from './Button';
import { getBrands } from '../services/brandService';
import { getCategories } from '../services/categoryService'; // Use static import instead

export default function FilterSidebar({ onFilterChange, onClose, initialCategory }) {
  const [selectedCategories, setSelectedCategories] = useState(initialCategory ? [initialCategory] : []);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  // Sync with initialCategory if it changes from outside (e.g. Header nav)
  useEffect(() => {
    if (initialCategory && categories.length > 0) {
      // initialCategory comes as a label from the URL — resolve it to the category ID
      const match = categories.find(
        c => c.label === initialCategory || c.id === initialCategory
      );
      setSelectedCategories(match ? [match.id] : [initialCategory]);
    } else if (initialCategory) {
      setSelectedCategories([initialCategory]);
    } else {
      setSelectedCategories([]);
    }
  }, [initialCategory, categories]);

  useEffect(() => {
    // Fetch brands
    getBrands()
      .then((data) => {
        // Assume data is array of objects { id, name, ... }
        const brandMapped = data.map((b) => ({
          id: b.id,
          label: b.name || b.label || b.id
        }));
        setBrands(brandMapped);
      })
      .catch((err) => console.error('Error fetching brands:', err));

    // Fetch categories
    getCategories()
      .then((data) => {
        // Assume data is array of objects { id, label, ... }
        const catMapped = data.map(c => ({
          id: c.id,
          label: c.label || c.name || c.id
        }));
        setCategories(catMapped);
      })
      .catch((err) => console.error('Error fetching categories:', err));
  }, []);

  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  useEffect(() => {
    if (onFilterChangeRef.current) {
      onFilterChangeRef.current({
        categories: selectedCategories, // These are now IDs
        priceRange,
        brands: selectedBrands, // These are now IDs
        minRating,
      });
    }
  }, [selectedCategories, priceRange, selectedBrands, minRating]);

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const toggleBrand = (brandId) => {
    setSelectedBrands((prev) =>
      prev.includes(brandId) ? prev.filter((id) => id !== brandId) : [...prev, brandId]
    );
  };

  const resetAll = () => {
    setSelectedCategories([]);
    setPriceRange([0, 100000]);
    setSelectedBrands([]);
    setMinRating(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-text-primary">Filters</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors cursor-pointer"
          >
            Reset
          </button>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
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
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-colors cursor-pointer"
                />
                <span className="text-sm text-text-secondary group-hover:text-primary transition-colors">
                  {cat.label}
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
            defaultValue={priceRange[0]}
            onBlur={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
            className="w-full px-2 py-1 border border-border rounded-md text-sm"
            min="0"
          />
          <span className="text-text-secondary">-</span>
          <input
            type="number"
            defaultValue={priceRange[1]}
            onBlur={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 0])}
            onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
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
                key={brand.id}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(brand.id)}
                  onChange={() => toggleBrand(brand.id)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary transition-colors cursor-pointer"
                />
                <span className="text-sm text-text-secondary group-hover:text-primary transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                  {brand.label}
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
                onChange={() => {}}
                onClick={() => setMinRating(minRating === rating ? 0 : rating)}
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
    </div>
  );
}
