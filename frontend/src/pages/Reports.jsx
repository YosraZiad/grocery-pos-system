import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

function Reports() {
  const { t } = useI18n();
  const [reportType, setReportType] = useState('bestSelling'); // bestSelling, worstSelling, salesByTime, expiredLosses, inventory, financial
  const [period, setPeriod] = useState('monthly'); // daily, monthly
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const [fromDate, setFromDate] = useState(startOfMonth.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(now.toISOString().split('T')[0]);

  // جلب أفضل المنتجات مبيعًا
  const { data: bestSellingData, isLoading: bestSellingLoading } = useQuery({
    queryKey: ['reports-best-selling', period],
    queryFn: async () => {
      const response = await api.get(`/reports/best-selling?period=${period}`);
      return response.data;
    },
    enabled: reportType === 'bestSelling',
  });

  // جلب المنتجات الضعيفة
  const { data: worstSellingData, isLoading: worstSellingLoading } = useQuery({
    queryKey: ['reports-worst-selling', period],
    queryFn: async () => {
      const response = await api.get(`/reports/worst-selling?period=${period}`);
      return response.data;
    },
    enabled: reportType === 'worstSelling',
  });

  // جلب مبيعات حسب الوقت
  const { data: salesByTimeData, isLoading: salesByTimeLoading } = useQuery({
    queryKey: ['reports-sales-by-time', date],
    queryFn: async () => {
      const response = await api.get(`/reports/sales-by-time?date=${date}`);
      return response.data;
    },
    enabled: reportType === 'salesByTime',
  });

  // جلب خسائر الصلاحية
  const { data: expiredLossesData, isLoading: expiredLossesLoading } = useQuery({
    queryKey: ['reports-expired-losses', fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/reports/expired-losses?${params.toString()}`);
      return response.data;
    },
    enabled: reportType === 'expiredLosses',
  });

  // جلب تقارير المخزون
  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ['reports-inventory', fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/reports/inventory?${params.toString()}`);
      return response.data;
    },
    enabled: reportType === 'inventory',
  });

  // جلب التقارير المالية
  const { data: financialData, isLoading: financialLoading } = useQuery({
    queryKey: ['reports-financial', fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/reports/financial?${params.toString()}`);
      return response.data;
    },
    enabled: reportType === 'financial',
  });

  // تصدير PDF
  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams();
      params.append('type', reportType);
      
      if (reportType === 'bestSelling' || reportType === 'worstSelling') {
        params.append('period', period);
      } else if (reportType === 'salesByTime') {
        params.append('date', date);
      } else if (reportType === 'expiredLosses' || reportType === 'inventory' || reportType === 'financial') {
        if (fromDate) params.append('from', fromDate);
        if (toDate) params.append('to', toDate);
      }

      const response = await api.get(`/reports/export/pdf?${params.toString()}`, {
        responseType: 'blob',
      });

      // إنشاء رابط تحميل
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(t('exportError') || 'Error exporting PDF');
    }
  };

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

  const isLoading = bestSellingLoading || worstSellingLoading || salesByTimeLoading || expiredLossesLoading || inventoryLoading || financialLoading;

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
          {t('reports')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('reportsDescription')}
        </p>
      </div>

      {/* Report Type Selector */}
      <div className="card">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setReportType('bestSelling')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'bestSelling'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('bestSellingProducts')}
          </button>
          <button
            onClick={() => setReportType('worstSelling')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'worstSelling'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('worstSellingProducts')}
          </button>
          <button
            onClick={() => setReportType('salesByTime')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'salesByTime'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('salesByTime')}
          </button>
          <button
            onClick={() => setReportType('expiredLosses')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'expiredLosses'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('expiredLosses')}
          </button>
          <button
            onClick={() => setReportType('inventory')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'inventory'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('inventoryReports')}
          </button>
          <button
            onClick={() => setReportType('financial')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              reportType === 'financial'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {t('financialReports')}
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={handleExportPDF}
            className="btn-primary flex items-center space-x-2 rtl:space-x-reverse"
          >
            <span>📄</span>
            <span>{t('exportPDF')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      {(reportType === 'bestSelling' || reportType === 'worstSelling') && (
        <div className="card">
          <div>
            <label className="label">{t('period')}</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input"
            >
              <option value="daily">{t('daily')}</option>
              <option value="monthly">{t('monthly')}</option>
            </select>
          </div>
        </div>
      )}

      {reportType === 'salesByTime' && (
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

      {(reportType === 'expiredLosses' || reportType === 'inventory' || reportType === 'financial') && (
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

      {/* Best Selling Products */}
      {reportType === 'bestSelling' && bestSellingData?.data && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('bestSellingProducts')} ({t(period)})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('productName')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('category')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('quantitySold')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('totalSales')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('salesCount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {bestSellingData.data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('noDataFound')}
                    </td>
                  </tr>
                ) : (
                  bestSellingData.data.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.category_name || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.total_quantity || 0}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.total_sales || 0)}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.sales_count || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Worst Selling Products */}
      {reportType === 'worstSelling' && worstSellingData?.data && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('worstSellingProducts')} ({t(period)})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('productName')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('category')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('quantitySold')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('totalSales')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('salesCount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {worstSellingData.data.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('noDataFound')}
                    </td>
                  </tr>
                ) : (
                  worstSellingData.data.map((product, index) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{index + 1}</td>
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.category_name || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.total_quantity || 0}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.total_sales || 0)}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.sales_count || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales By Time */}
      {reportType === 'salesByTime' && salesByTimeData?.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                {t('totalSales')}
              </h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {formatCurrency(salesByTimeData.data.total_sales || 0)}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
                {t('salesCount')}
              </h3>
              <p className="text-2xl font-bold text-green-900 dark:text-green-200">
                {salesByTimeData.data.sales_count || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
              <h3 className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">
                {t('averageSale')}
              </h3>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
                {formatCurrency(salesByTimeData.data.average_sale || 0)}
              </p>
            </div>
          </div>

          {salesByTimeData.data.hourly_sales && salesByTimeData.data.hourly_sales.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('hourlySales')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('hour')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('salesCount')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('totalSales')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {salesByTimeData.data.hourly_sales.map((item) => (
                      <tr key={item.hour} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{item.hour}:00</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{item.sales_count || 0}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total_sales || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expired Losses */}
      {reportType === 'expiredLosses' && expiredLossesData?.data && (
        <div className="space-y-6">
          <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <h3 className="text-lg font-bold text-red-900 dark:text-red-200 mb-2">
              {t('totalLoss')}
            </h3>
            <p className="text-3xl font-bold text-red-900 dark:text-red-200">
              {formatCurrency(expiredLossesData.data.total_loss || 0)}
            </p>
            <p className="text-sm text-red-800 dark:text-red-300 mt-2">
              {t('expiredProductsCount')}: {expiredLossesData.data.expired_products_count || 0}
            </p>
          </div>

          {expiredLossesData.data.products && expiredLossesData.data.products.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('expiredProducts')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('productName')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('category')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('quantity')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('purchasePrice')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('expiryDate')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('daysExpired')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('loss')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {expiredLossesData.data.products.map((product) => (
                      <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{product.product_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.category_name || '-'}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.quantity || 0}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatCurrency(product.purchase_price || 0)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{formatDate(product.expiry_date)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{product.days_expired || 0} {t('days')}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400">{formatCurrency(product.loss || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inventory Reports */}
      {reportType === 'inventory' && inventoryData?.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                {t('totalProducts')}
              </h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {inventoryData.data.total_products || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                {t('lowStock')}
              </h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                {inventoryData.data.low_stock_products || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                {t('expiringSoon')}
              </h3>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">
                {inventoryData.data.expiring_soon_products || 0}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                {t('expired')}
              </h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                {inventoryData.data.expired_products || 0}
              </p>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('inventoryDetails')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalInventoryValue')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(inventoryData.data.total_inventory_value || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('inventoryIn')}</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  +{inventoryData.data.inventory_in || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('inventoryOut')}</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                  -{inventoryData.data.inventory_out || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('netInventoryChange')}</p>
                <p className={`text-lg font-semibold ${
                  (inventoryData.data.net_inventory_change || 0) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {inventoryData.data.net_inventory_change >= 0 ? '+' : ''}{inventoryData.data.net_inventory_change || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Reports */}
      {reportType === 'financial' && financialData?.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                {t('totalSales')}
              </h3>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                {formatCurrency(financialData.data.sales?.total || 0)}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {financialData.data.sales?.count || 0} {t('sales')}
              </p>
            </div>
            <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
                {t('totalExpenses')}
              </h3>
              <p className="text-2xl font-bold text-red-900 dark:text-red-200">
                {formatCurrency(financialData.data.expenses?.total || 0)}
              </p>
              <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                {financialData.data.expenses?.count || 0} {t('expenses')}
              </p>
            </div>
            <div className={`card bg-gradient-to-br ${
              (financialData.data.net_profit || 0) >= 0
                ? 'from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800'
                : 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800'
            }`}>
              <h3 className={`text-sm font-medium mb-1 ${
                (financialData.data.net_profit || 0) >= 0
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300'
              }`}>
                {t('netProfit')}
              </h3>
              <p className={`text-2xl font-bold ${
                (financialData.data.net_profit || 0) >= 0
                  ? 'text-green-900 dark:text-green-200'
                  : 'text-red-900 dark:text-red-200'
              }`}>
                {formatCurrency(financialData.data.net_profit || 0)}
              </p>
            </div>
          </div>
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('financialDetails')}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('costOfGoods')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(financialData.data.cost_of_goods || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('grossProfit')}</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(financialData.data.gross_profit || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('returns')}</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(financialData.data.returns?.total || 0)}
                </p>
              </div>
            </div>
          </div>
          {financialData.data.sales_by_payment_method && financialData.data.sales_by_payment_method.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {t('salesByPaymentMethod')}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('paymentMethod')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('salesCount')}</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{t('totalSales')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {financialData.data.sales_by_payment_method.map((item) => (
                      <tr key={item.payment_method} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{t(item.payment_method)}</td>
                        <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{item.count || 0}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(item.total || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reports;
