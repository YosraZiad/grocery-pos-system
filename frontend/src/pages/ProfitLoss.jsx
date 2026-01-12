import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

function ProfitLoss() {
  const { t } = useI18n();
  const [viewType, setViewType] = useState('summary'); // summary, daily, monthly, byProduct, byCategory
  const now = new Date();
  const [date, setDate] = useState(now.toISOString().split('T')[0]);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [fromDate, setFromDate] = useState(startOfMonth.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(now.toISOString().split('T')[0]);
  const [productId, setProductId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // جلب الملخص
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['profit-loss-summary', fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/profit-loss/summary?${params.toString()}`);
      return response.data;
    },
    enabled: viewType === 'summary',
  });

  // جلب الأرباح اليومية
  const { data: dailyData, isLoading: dailyLoading } = useQuery({
    queryKey: ['profit-loss-daily', date],
    queryFn: async () => {
      const response = await api.get(`/profit-loss/daily?date=${date}`);
      return response.data;
    },
    enabled: viewType === 'daily',
  });

  // جلب الأرباح الشهرية
  const { data: monthlyData, isLoading: monthlyLoading } = useQuery({
    queryKey: ['profit-loss-monthly', month, year],
    queryFn: async () => {
      const response = await api.get(`/profit-loss/monthly?month=${month}&year=${year}`);
      return response.data;
    },
    enabled: viewType === 'monthly',
  });

  // جلب الأرباح حسب المنتج
  const { data: byProductData, isLoading: byProductLoading } = useQuery({
    queryKey: ['profit-loss-by-product', productId, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('product_id', productId);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/profit-loss/by-product?${params.toString()}`);
      return response.data;
    },
    enabled: viewType === 'byProduct' && productId !== '',
  });

  // جلب الأرباح حسب القسم
  const { data: byCategoryData, isLoading: byCategoryLoading } = useQuery({
    queryKey: ['profit-loss-by-category', categoryId, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('category_id', categoryId);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/profit-loss/by-category?${params.toString()}`);
      return response.data;
    },
    enabled: viewType === 'byCategory' && categoryId !== '',
  });

  // جلب المنتجات
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products?per_page=100');
      return response.data;
    },
    enabled: viewType === 'byProduct',
  });

  // جلب الأقسام
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data;
    },
    enabled: viewType === 'byCategory',
  });

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toFixed(2)} ر.س`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isLoading = summaryLoading || dailyLoading || monthlyLoading || byProductLoading || byCategoryLoading;

  if (isLoading) {
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
          {t('profitLoss')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('profitLossDescription')}
        </p>
      </div>

      {/* View Type Selector */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewType('summary')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'summary'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('summary')}
          </button>
          <button
            onClick={() => setViewType('daily')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'daily'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('daily')}
          </button>
          <button
            onClick={() => setViewType('monthly')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'monthly'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('monthly')}
          </button>
          <button
            onClick={() => setViewType('byProduct')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'byProduct'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('byProduct')}
          </button>
          <button
            onClick={() => setViewType('byCategory')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewType === 'byCategory'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('byCategory')}
          </button>
        </div>
      </div>

      {/* Filters */}
      {viewType === 'summary' && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">{t('fromDate')}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('toDate')}</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      {viewType === 'daily' && (
        <div className="card">
          <div>
            <label className="label">{t('date')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      )}

      {viewType === 'monthly' && (
        <div className="card">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('month')}</label>
              <select
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="input"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {new Date(2000, m - 1).toLocaleString('ar-SA', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('year')}</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="input"
                min="2020"
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>
      )}

      {viewType === 'byProduct' && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">{t('product')}</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="input"
              >
                <option value="">{t('selectProduct')}</option>
                {productsData?.data?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('fromDate')}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('toDate')}</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      {viewType === 'byCategory' && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">{t('category')}</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input"
              >
                <option value="">{t('selectCategory')}</option>
                {categoriesData?.data?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('fromDate')}</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('toDate')}</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary View */}
      {viewType === 'summary' && summaryData?.data && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                {t('totalSales')}
              </h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {formatCurrency(summaryData.data.sales || 0)}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                {t('costOfGoods')}
              </h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                {formatCurrency(summaryData.data.cost_of_goods || 0)}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                {t('grossProfit')}
              </h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                {formatCurrency(summaryData.data.gross_profit || 0)}
              </p>
            </div>
            <div className={`card bg-gradient-to-br ${
              (summaryData.data.net_profit || 0) >= 0
                ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
            }`}>
              <h3 className="text-sm font-medium mb-1 ${
                (summaryData.data.net_profit || 0) >= 0
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }">
                {t('netProfit')}
              </h3>
              <p className={`text-2xl font-bold ${
                (summaryData.data.net_profit || 0) >= 0
                  ? 'text-green-900 dark:text-green-200'
                  : 'text-red-900 dark:text-red-200'
              }`}>
                {formatCurrency(summaryData.data.net_profit || 0)}
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('details')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('expenses')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(summaryData.data.expenses || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('returns')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(summaryData.data.returns || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('salesCount')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {summaryData.data.statistics?.sales_count || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('expensesCount')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {summaryData.data.statistics?.expenses_count || 0}
                </p>
              </div>
            </div>
          </div>

          {/* By Category */}
          {summaryData.data.by_category && summaryData.data.by_category.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('byCategory')}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('category')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('sales')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('costOfGoods')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('grossProfit')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {summaryData.data.by_category.map((item) => (
                      <tr key={item.category_id}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.category_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.sales || 0)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(item.cost_of_goods || 0)}</td>
                        <td className={`px-4 py-2 text-sm font-semibold ${
                          (item.gross_profit || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {formatCurrency(item.gross_profit || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily View */}
      {viewType === 'daily' && dailyData?.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('sales')}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(dailyData.data.sales || 0)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('grossProfit')}</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(dailyData.data.gross_profit || 0)}
              </p>
            </div>
            <div className={`card ${
              (dailyData.data.net_profit || 0) >= 0
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('netProfit')}</h3>
              <p className={`text-2xl font-bold ${
                (dailyData.data.net_profit || 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(dailyData.data.net_profit || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly View */}
      {viewType === 'monthly' && monthlyData?.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('sales')}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(monthlyData.data.sales || 0)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('grossProfit')}</h3>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(monthlyData.data.gross_profit || 0)}
              </p>
            </div>
            <div className={`card ${
              (monthlyData.data.net_profit || 0) >= 0
                ? 'bg-green-50 dark:bg-green-900/20'
                : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{t('netProfit')}</h3>
              <p className={`text-2xl font-bold ${
                (monthlyData.data.net_profit || 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(monthlyData.data.net_profit || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* By Product View */}
      {viewType === 'byProduct' && byProductData?.data && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {byProductData.data.product?.name}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('quantitySold')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {byProductData.data.quantity_sold || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('sales')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(byProductData.data.sales || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('costOfGoods')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(byProductData.data.cost_of_goods || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('grossProfit')}</p>
              <p className={`text-lg font-semibold ${
                (byProductData.data.gross_profit || 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(byProductData.data.gross_profit || 0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* By Category View */}
      {viewType === 'byCategory' && byCategoryData?.data && (
        <div className="card">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('productsSold')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {byCategoryData.data.products_sold || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('sales')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(byCategoryData.data.sales || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('costOfGoods')}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatCurrency(byCategoryData.data.cost_of_goods || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('grossProfit')}</p>
              <p className={`text-lg font-semibold ${
                (byCategoryData.data.gross_profit || 0) >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(byCategoryData.data.gross_profit || 0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfitLoss;
