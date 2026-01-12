import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

function ProductSearch({ onSelectProduct }) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef(null);
  const barcodeBuffer = useRef('');
  const barcodeTimeout = useRef(null);

  // بحث المنتجات
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['products', 'search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await api.get(`/products/search?q=${searchQuery}`);
      return response.data.data || [];
    },
    enabled: searchQuery.length >= 2,
  });

  const handleSelect = (product) => {
    onSelectProduct(product);
    setSearchQuery('');
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-4">
        <svg
          className="h-6 w-6 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowResults(true);
          // إعادة تعيين buffer عند الكتابة اليدوية
          if (e.target.value.length < 8) {
            barcodeBuffer.current = '';
          }
        }}
        onFocus={() => setShowResults(true)}
        placeholder={t('searchPlaceholder')}
        className="w-full px-4 py-4 pl-12 rtl:pl-4 rtl:pr-12 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
        autoFocus
      />

      {/* نتائج البحث */}
      {showResults && searchQuery.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {t('loading')}
            </div>
          ) : searchResults?.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map((product) => (
                <li
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white text-lg">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {product.category?.name} | {product.sale_price} ر.س | {t('quantity')}: {product.quantity}
                      </div>
                      {product.barcode && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {t('barcode')}: {product.barcode}
                        </div>
                      )}
                    </div>
                    {product.quantity <= product.min_stock_alert && (
                      <span className="px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-full">
                        {t('lowStock')}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {t('noResultsFound')}
            </div>
          )}
        </div>
      )}

      {/* إغلاق النتائج عند النقر خارجها */}
      {showResults && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}

export default ProductSearch;
