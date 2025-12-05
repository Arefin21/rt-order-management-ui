'use client';

import { useState, useEffect, useRef } from 'react';
import { ProductWithStock } from '@/lib/types';
import { productService } from '@/lib/products';

interface ProductAutocompleteProps {
  onSelect: (product: ProductWithStock) => void;
  disabled?: boolean;
}

export default function ProductAutocomplete({ onSelect, disabled }: ProductAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchProducts();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setProducts([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const results = await productService.searchProducts(query);
      setProducts(results);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('Search error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (product: ProductWithStock) => {
    setQuery('');
    setProducts([]);
    setShowSuggestions(false);
    onSelect(product);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < products.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0 && products[selectedIndex]) {
      e.preventDefault();
      handleSelect(products[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (products.length > 0) setShowSuggestions(true);
        }}
        onBlur={() => {
          // Delay to allow click event to fire
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        disabled={disabled}
        placeholder="Search by product name, barcode, or SKU..."
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      
      {loading && (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {showSuggestions && products.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {products.map((product, index) => (
            <div
              key={product.id}
              onClick={() => handleSelect(product)}
              className={`px-4 py-3 cursor-pointer hover:bg-indigo-50 ${
                index === selectedIndex ? 'bg-indigo-50' : ''
              } ${
                index === 0 ? 'rounded-t-md' : ''
              } ${
                index === products.length - 1 ? 'rounded-b-md' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">Barcode: {product.barcode}</p>
                  {product.stock && (
                    <>
                      <p className="text-xs text-gray-500">SKU: {product.stock.sku}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {product.total_available_quantity || product.stock.quantity}
                      </p>
                    </>
                  )}
                </div>
                {product.stock && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-indigo-600">
                      ${parseFloat(product.stock.sale_price).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showSuggestions && products.length === 0 && query.length >= 2 && !loading && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
          <p className="text-sm text-gray-500">No products found</p>
        </div>
      )}
    </div>
  );
}

