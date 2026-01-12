import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

function Returns() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'customer',
    sale_id: '',
    product_id: '',
    quantity: 1,
    reason: '',
    amount: 0,
    auto_approve: false,
  });

  // جلب المرتجعات
  const { data: returnsData, isLoading } = useQuery({
    queryKey: ['returns', typeFilter, statusFilter, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);

      const response = await api.get(`/returns?${params.toString()}`);
      return response.data;
    },
  });

  // جلب المبيعات (للـ customer returns)
  const { data: salesData } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await api.get('/sales?per_page=100');
      return response.data;
    },
    enabled: formData.type === 'customer',
  });

  // جلب المنتجات
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products?per_page=100');
      return response.data;
    },
  });

  // إضافة مرتجع
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/returns', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['returns']);
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['products']);
      setShowModal(false);
      setFormData({
        type: 'customer',
        sale_id: '',
        product_id: '',
        quantity: 1,
        reason: '',
        amount: 0,
        auto_approve: false,
      });
      alert(t('returnCreatedSuccessfully'));
    },
    onError: (error) => {
      alert(error.response?.data?.message || t('error'));
    },
  });

  // تحديث حالة المرتجع
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const response = await api.put(`/returns/${id}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['returns']);
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['products']);
      alert(t('returnUpdatedSuccessfully'));
    },
    onError: (error) => {
      alert(error.response?.data?.message || t('error'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateStatus = (id, status) => {
    if (window.confirm(t(`confirm${status.charAt(0).toUpperCase() + status.slice(1)}Return`))) {
      updateStatusMutation.mutate({ id, status });
    }
  };

  const handleProductChange = (productId) => {
    const product = productsData?.data?.find((p) => p.id === parseInt(productId));
    setFormData({
      ...formData,
      product_id: productId,
      amount: product ? product.sale_price * formData.quantity : 0,
    });
  };

  const handleQuantityChange = (quantity) => {
    const product = productsData?.data?.find((p) => p.id === parseInt(formData.product_id));
    setFormData({
      ...formData,
      quantity: parseInt(quantity) || 1,
      amount: product ? product.sale_price * (parseInt(quantity) || 1) : 0,
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toFixed(2)} ر.س`;
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
    };
    return badges[status] || badges.pending;
  };

  const getTypeBadge = (type) => {
    return type === 'customer'
      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
  };

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

  const returns = returnsData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('returnsManagement')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageReturns')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          {t('addReturn')}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">{t('type')}</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allTypes')}</option>
              <option value="customer">{t('customerReturn')}</option>
              <option value="supplier">{t('supplierReturn')}</option>
            </select>
          </div>
          <div>
            <label className="label">{t('status')}</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allStatuses')}</option>
              <option value="pending">{t('pending')}</option>
              <option value="approved">{t('approved')}</option>
              <option value="rejected">{t('rejected')}</option>
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
          <div className="flex items-end">
            <button
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
                setFromDate('');
                setToDate('');
              }}
              className="btn-secondary w-full"
            >
              {t('clearFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Returns Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('type')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('quantity')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('amount')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('invoiceNumber')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('reason')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">📦</div>
                      <p className="text-lg">{t('noReturnsFound')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                returns.map((returnItem) => (
                  <tr
                    key={returnItem.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(returnItem.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(returnItem.type)}`}>
                        {t(returnItem.type === 'customer' ? 'customerReturn' : 'supplierReturn')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {returnItem.product?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {returnItem.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(returnItem.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {returnItem.sale?.invoice_number || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {returnItem.reason || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(returnItem.status)}`}>
                        {t(returnItem.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {returnItem.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(returnItem.id, 'approved')}
                              disabled={updateStatusMutation.isPending}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 disabled:opacity-50"
                              title={t('approve')}
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(returnItem.id, 'rejected')}
                              disabled={updateStatusMutation.isPending}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                              title={t('reject')}
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {returnsData?.links && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('showing')} {returnsData.from} {t('to')} {returnsData.to} {t('of')} {returnsData.total} {t('results')}
            </div>
          </div>
        )}
      </div>

      {/* Add Return Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('addReturn')}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    type: 'customer',
                    sale_id: '',
                    product_id: '',
                    quantity: 1,
                    reason: '',
                    amount: 0,
                    auto_approve: false,
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('type')}</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, sale_id: '' })}
                  className="input"
                  required
                >
                  <option value="customer">{t('customerReturn')}</option>
                  <option value="supplier">{t('supplierReturn')}</option>
                </select>
              </div>

              {formData.type === 'customer' && (
                <div>
                  <label className="label">{t('invoiceNumber')}</label>
                  <select
                    value={formData.sale_id}
                    onChange={(e) => setFormData({ ...formData, sale_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">{t('selectInvoice')}</option>
                    {salesData?.data?.map((sale) => (
                      <option key={sale.id} value={sale.id}>
                        {sale.invoice_number} - {formatDate(sale.created_at)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">{t('product')}</label>
                <select
                  value={formData.product_id}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">{t('selectProduct')}</option>
                  {productsData?.data?.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.quantity} {t('available')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">{t('quantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="label">{t('reason')}</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto_approve"
                  checked={formData.auto_approve}
                  onChange={(e) => setFormData({ ...formData, auto_approve: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="auto_approve" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('autoApprove')}
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      type: 'customer',
                      sale_id: '',
                      product_id: '',
                      quantity: 1,
                      reason: '',
                      amount: 0,
                      auto_approve: false,
                    });
                  }}
                  className="btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? t('loading') : t('add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Returns;
