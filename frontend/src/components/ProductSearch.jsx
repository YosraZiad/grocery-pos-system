import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

function ProductSearch({ onSelectProduct }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

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
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        placeholder="ابحث بالاسم أو الباركود..."
        className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        autoFocus
      />

      {/* نتائج البحث */}
      {showResults && searchQuery.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">جاري البحث...</div>
          ) : searchResults?.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {searchResults.map((product) => (
                <li
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        {product.category?.name} | {product.sale_price} ر.س | الكمية: {product.quantity}
                      </div>
                      {product.barcode && (
                        <div className="text-xs text-gray-400">باركود: {product.barcode}</div>
                      )}
                    </div>
                    {product.quantity <= product.min_stock_alert && (
                      <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-50 rounded">
                        منخفض
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">لا توجد نتائج</div>
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
