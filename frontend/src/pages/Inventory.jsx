import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';
import SearchBar from '../components/SearchBar';
import InventoryTransactions from '../components/InventoryTransactions';

function Inventory() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState('');

  // جلب الإحصائيات
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory', 'stats'],
    queryFn: async () => {
      const response = await api.get('/inventory/stats');
      return response.data.data;
    },
  });

  // جلب المخزون
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', search, categoryFilter, stockStatusFilter, expiryStatusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (stockStatusFilter) params.append('stock_status', stockStatusFilter);
      if (expiryStatusFilter) params.append('expiry_status', expiryStatusFilter);
      const response = await api.get(`/inventory?${params.toString()}`);
      return response.data;
    },
  });

  // جلب الأقسام للفلترة
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    },
  });

  // جلب المنتجات منخفضة المخزون
  const { data: lowStock } = useQuery({
    queryKey: ['inventory', 'low-stock'],
    queryFn: async () => {
      const response = await api.get('/inventory/low-stock');
      return response.data;
    },
  });

  // جلب المنتجات قريبة الانتهاء
  const { data: expiringSoon } = useQuery({
    queryKey: ['inventory', 'expiring-soon'],
    queryFn: async () => {
      const response = await api.get('/inventory/expiring-soon');
      return response.data;
    },
  });

  const getStockStatusBadge = (product) => {
    if (product.stock_status === 'out_of_stock') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          {t('outOfStock')}
        </span>
      );
    } else if (product.stock_status === 'low_stock') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
          {t('lowStock')}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          {t('available')}
        </span>
      );
    }
  };

  const getExpiryStatusBadge = (product) => {
    if (product.expiry_status === 'expired') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
          {t('expired')}
        </span>
      );
    } else if (product.expiry_status === 'expiring_soon') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
          {t('expiringSoon')}
        </span>
      );
    } else if (product.expiry_status === 'valid') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          {t('valid')}
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
          {t('noExpiry')}
        </span>
      );
    }
  };

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('inventoryManagement')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('manageAndMonitor')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('totalProducts')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.total_products || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
              📦
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('lowStock')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.low_stock_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-2xl">
              ⚠️
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('expiringSoon')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.expiring_soon_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">
              ⏰
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('expired')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.expired_count || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-2xl">
              ❌
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(lowStock?.count > 0 || expiringSoon?.count > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alert */}
          {lowStock?.count > 0 && (
            <div className="card bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 rtl:space-x-reverse">
                <span>⚠️</span>
                <span>{t('lowStockAlert')} ({lowStock.count})</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lowStock.data?.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('stock')}: {product.quantity} / {t('min')}: {product.min_stock_alert}
                      </p>
                    </div>
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      -{product.stock_deficit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Soon Alert */}
          {expiringSoon?.count > 0 && (
            <div className="card bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2 rtl:space-x-reverse">
                <span>⏰</span>
                <span>{t('expiringSoonAlert')} ({expiringSoon.count})</span>
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {expiringSoon.data?.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('expires')}: {new Date(product.expiry_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-orange-600 dark:text-orange-400 font-bold">
                      {product.days_until_expiry} {t('days')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={t('searchPlaceholder')}
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('allCategories')}</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('allStockStatus')}</option>
            <option value="low">{t('lowStock')}</option>
            <option value="out">{t('outOfStock')}</option>
            <option value="available">{t('available')}</option>
          </select>
          <select
            value={expiryStatusFilter}
            onChange={(e) => setExpiryStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('allExpiryStatus')}</option>
            <option value="expiring_soon">{t('expiringSoon')}</option>
            <option value="expired">{t('expired')}</option>
            <option value="valid">{t('valid')}</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('productName')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('categories')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('quantity')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('stockStatus')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('expiryDate')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('expiryStatus')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data?.data?.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStockStatusBadge(product)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {product.expiry_date ? new Date(product.expiry_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getExpiryStatusBadge(product)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.links && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {t('showing')} {data.from} {t('to')} {data.to} {t('of')} {data.total} {t('products').toLowerCase()}
              </div>
              <div className="flex space-x-2 rtl:space-x-reverse">
                {data.links.map((link, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (link.url) {
                        window.location.href = link.url;
                      }
                    }}
                    disabled={!link.url}
                    className={`px-3 py-1 text-sm rounded transition-colors duration-200 ${
                      link.active
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    dangerouslySetInnerHTML={{ __html: link.label }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Inventory Transactions Section */}
      <div className="card">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t('inventoryTransactionsHistory')}
        </h3>
        <InventoryTransactions />
      </div>
    </div>
  );
}

export default Inventory;
