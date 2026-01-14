import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import { toast } from 'react-hot-toast';
import api from '../services/api';

function PurchaseInvoices() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [supplierFilter, setSupplierFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [formData, setFormData] = useState({
    supplier_id: '',
    date: new Date().toISOString().split('T')[0],
    paid_amount: 0,
    items: [{ product_id: '', quantity: 1, price: 0 }],
  });

  // جلب فواتير الشراء
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['purchase-invoices', supplierFilter, statusFilter, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (supplierFilter) params.append('supplier_id', supplierFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/purchase-invoices?${params.toString()}`);
      return response.data;
    },
  });

  // جلب الموردين
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data;
    },
  });

  // جلب المنتجات
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products?per_page=100');
      return response.data;
    },
  });

  // إضافة فاتورة شراء
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/purchase-invoices', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchase-invoices']);
      queryClient.invalidateQueries(['inventory']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['suppliers']);
      setShowModal(false);
      setFormData({
        supplier_id: '',
        date: new Date().toISOString().split('T')[0],
        paid_amount: 0,
        items: [{ product_id: '', quantity: 1, price: 0 }],
      });
      toast.success(t('purchaseInvoiceCreatedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // دفع جزء من الدين
  const payMutation = useMutation({
    mutationFn: async ({ id, amount }) => {
      const response = await api.post(`/purchase-invoices/${id}/pay`, { amount });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['purchase-invoices']);
      queryClient.invalidateQueries(['suppliers']);
      setShowPayModal(false);
      setSelectedInvoice(null);
      setPayAmount(0);
      toast.success(t('paymentProcessedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', quantity: 1, price: 0 }],
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // إذا كان المنتج تم اختياره، جلب سعر الشراء
    if (field === 'product_id' && value) {
      const product = productsData?.data?.find((p) => p.id === parseInt(value));
      if (product) {
        newItems[index].price = product.purchase_price;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const handlePay = () => {
    if (payAmount <= 0) {
      toast.error(t('amountMustBeGreaterThanZero'));
      return;
    }
    if (payAmount > selectedInvoice.balance) {
      toast.error(t('amountCannotExceedBalance'));
      return;
    }
    payMutation.mutate({ id: selectedInvoice.id, amount: payAmount });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toFixed(2)} ر.س`;
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

  const invoices = invoicesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('purchaseInvoices')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('managePurchaseInvoices')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          {t('addPurchaseInvoice')}
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">{t('supplier')}</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allSuppliers')}</option>
              {suppliersData?.data?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
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
              <option value="paid">{t('paid')}</option>
              <option value="unpaid">{t('unpaid')}</option>
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
                setSupplierFilter('');
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

      {/* Invoices Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('invoiceNumber')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('supplier')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('total')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('paidAmount')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('balance')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">📄</div>
                      <p className="text-lg">{t('noPurchaseInvoicesFound')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {invoice.invoice_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(invoice.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {invoice.supplier?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(invoice.paid_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold ${
                        invoice.balance > 0 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {formatCurrency(invoice.balance)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {invoice.balance > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(invoice);
                              setPayAmount(0);
                              setShowPayModal(true);
                            }}
                            className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300"
                            title={t('pay')}
                          >
                            💰
                          </button>
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
        {invoicesData?.links && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('showing')} {invoicesData.from} {t('to')} {invoicesData.to} {t('of')} {invoicesData.total} {t('results')}
            </div>
          </div>
        )}
      </div>

      {/* Add Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('addPurchaseInvoice')}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    supplier_id: '',
                    date: new Date().toISOString().split('T')[0],
                    paid_amount: 0,
                    items: [{ product_id: '', quantity: 1, price: 0 }],
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('supplier')} *</label>
                  <select
                    value={formData.supplier_id}
                    onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="">{t('selectSupplier')}</option>
                    {suppliersData?.data?.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('date')} *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">{t('paidAmount')}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.paid_amount}
                  onChange={(e) => setFormData({ ...formData, paid_amount: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">{t('items')}</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="btn-secondary text-sm"
                  >
                    + {t('addItem')}
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <select
                          value={item.product_id}
                          onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                          className="input"
                          required
                        >
                          <option value="">{t('selectProduct')}</option>
                          {productsData?.data?.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="input"
                          placeholder={t('quantity')}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                          className="input"
                          placeholder={t('price')}
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <div className="input bg-gray-50 dark:bg-gray-800">
                          {formatCurrency((item.quantity || 0) * (item.price || 0))}
                        </div>
                      </div>
                      <div className="col-span-1">
                        {formData.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="btn-secondary w-full"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      supplier_id: '',
                      date: new Date().toISOString().split('T')[0],
                      paid_amount: 0,
                      items: [{ product_id: '', quantity: 1, price: 0 }],
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

      {/* Pay Modal */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('payInvoice')}
              </h3>
              <button
                onClick={() => {
                  setShowPayModal(false);
                  setSelectedInvoice(null);
                  setPayAmount(0);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">{t('invoiceNumber')}</label>
                <div className="input bg-gray-50 dark:bg-gray-800">
                  {selectedInvoice.invoice_number}
                </div>
              </div>
              <div>
                <label className="label">{t('remainingBalance')}</label>
                <div className="input bg-gray-50 dark:bg-gray-800">
                  {formatCurrency(selectedInvoice.balance)}
                </div>
              </div>
              <div>
                <label className="label">{t('paymentAmount')} *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedInvoice.balance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="input"
                  required
                />
              </div>
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(false);
                    setSelectedInvoice(null);
                    setPayAmount(0);
                  }}
                  className="btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handlePay}
                  disabled={payMutation.isPending}
                  className="btn-primary"
                >
                  {payMutation.isPending ? t('loading') : t('pay')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseInvoices;
