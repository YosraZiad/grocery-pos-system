import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

/**
 * صفحة الرئيسية - Dashboard حديث واحترافي
 */
function Home() {
  const { t } = useI18n();
  const [period, setPeriod] = useState('today'); // today, week, month, year

  // جلب إحصائيات Dashboard
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats', period],
    queryFn: async () => {
      const response = await api.get(`/dashboard/stats?period=${period}`);
      return response.data.data;
    },
  });

  const stats = dashboardData || {};
  const sales = stats.sales || {};
  const expenses = stats.expenses || {};
  const alerts = stats.alerts || {};

  // Quick Actions
  const quickActions = [
    {
      icon: '💰',
      title: t('newSale'),
      link: '/sales',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: '📦',
      title: t('addProduct'),
      link: '/products',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: '📥',
      title: t('purchaseInvoice'),
      link: '/purchase-invoices',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: '📊',
      title: t('reports'),
      link: '/reports',
      color: 'from-orange-500 to-orange-600',
    },
  ];

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
      {/* Header with Period Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('dashboard')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboardDesc')}
          </p>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {['today', 'week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t(p)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Sales */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('sales')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(Number(sales.total) || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {sales.count || 0} {t('transactions')}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">
              💰
            </div>
          </div>
        </div>

        {/* Profit */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('profit')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(Number(stats.profit) || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('grossProfit')}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
              📈
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('expenses')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(Number(expenses.total) || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {expenses.count || 0} {t('expenses')}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-2xl">
              💸
            </div>
          </div>
        </div>

        {/* Items Sold */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('itemsSold')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.items_sold || 0}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('units')}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">
              📦
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Panel */}
      {(alerts.low_stock > 0 || alerts.expired > 0 || alerts.expiring_soon > 0 || alerts.pending_returns > 0) && (
        <div className="card bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="mr-2 rtl:ml-2">⚠️</span>
            {t('alerts')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {alerts.low_stock > 0 && (
              <Link
                to="/inventory?filter=low_stock"
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('lowStock')}
                </span>
                <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {alerts.low_stock}
                </span>
              </Link>
            )}
            {alerts.expired > 0 && (
              <Link
                to="/inventory?filter=expired"
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('expired')}
                </span>
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {alerts.expired}
                </span>
              </Link>
            )}
            {alerts.expiring_soon > 0 && (
              <Link
                to="/inventory?filter=expiring_soon"
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('expiringSoon')}
                </span>
                <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  {alerts.expiring_soon}
                </span>
              </Link>
            )}
            {alerts.pending_returns > 0 && (
              <Link
                to="/returns?status=pending"
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('pendingReturns')}
                </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {alerts.pending_returns}
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions & Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('quickActions')}
            </h3>
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="flex items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center text-xl mr-3 rtl:ml-3 group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {action.title}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Daily Sales Chart */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('dailySales')} ({t('last7Days')})
            </h3>
            {stats.daily_sales && stats.daily_sales.length > 0 ? (
              <div className="space-y-2">
                {stats.daily_sales.map((day, index) => {
                  const dayTotal = Number(day.total) || 0;
                  const maxTotal = Math.max(...stats.daily_sales.map(d => Number(d.total) || 0));
                  const percentage = maxTotal > 0 ? (dayTotal / maxTotal) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className="w-20 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(day.date).toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric' })}
                      </div>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full flex items-center justify-end pr-2"
                          style={{
                            width: `${percentage}%`,
                          }}
                        >
                          <span className="text-xs font-medium text-white">
                            {dayTotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="w-20 text-sm font-medium text-gray-900 dark:text-white text-left rtl:text-right">
                        {day.count || 0} {t('sales')}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {t('noData')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('topProducts')} ({t('last7Days')})
          </h3>
          {stats.top_products && stats.top_products.length > 0 ? (
            <div className="space-y-3">
              {stats.top_products.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.total_quantity || 0} {t('units')} - {(Number(product.total_revenue) || 0).toFixed(2)} {t('currency')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {t('noData')}
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('paymentMethods')}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                  💵
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('cash')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sales.total > 0 ? ((Number(sales.cash) || 0) / (Number(sales.total) || 1) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {(Number(sales.cash) || 0).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                  💳
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t('card')}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {sales.total > 0 ? ((Number(sales.card) || 0) / (Number(sales.total) || 1) * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {(Number(sales.card) || 0).toFixed(2)}
              </p>
            </div>
            {sales.transfer > 0 && (
              <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center text-white">
                    🏦
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {t('transfer')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {sales.total > 0 ? ((Number(sales.transfer) || 0) / (Number(sales.total) || 1) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(Number(sales.transfer) || 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
