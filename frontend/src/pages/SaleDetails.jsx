import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();

  const { data: sale, isLoading } = useQuery({
    queryKey: ['sale', id],
    queryFn: async () => {
      const response = await api.get(`/sales/${id}`);
      return response.data.data;
    },
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (!sale) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">{t('saleNotFound')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('saleDetails')} - {sale.invoice_number}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {formatDate(sale.created_at)}
          </p>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => navigate('/sales-list')}
            className="btn-secondary"
          >
            ← {t('back')}
          </button>
          <button
            onClick={() => navigate(`/sales/${sale.id}/invoice`)}
            className="btn-primary"
          >
            {t('viewInvoice')}
          </button>
        </div>
      </div>

      {/* Sale Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('saleInformation')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('invoiceNumber')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('date')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{formatDate(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('user')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{sale.user?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('paymentMethod')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">{t(sale.payment_method)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('status')}:</span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${
                  sale.status === 'completed'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}
              >
                {t(sale.status)}
              </span>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('summary')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('subtotal')}:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(sale.items?.reduce((sum, item) => sum + parseFloat(item.subtotal), 0) || 0)}
              </span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>{t('discount')}:</span>
                <span className="font-medium">
                  -{formatCurrency(sale.discount)}
                  {sale.discount_type === 'percentage' && ` (${sale.discount_type})`}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-3">
              <span>{t('total')}:</span>
              <span className="text-primary-600 dark:text-primary-400">
                {formatCurrency(sale.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('items')} ({sale.items?.length || 0})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('quantity')}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('price')}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('subtotal')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sale.items?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.product?.name || '-'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.product?.category?.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {item.quantity}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatCurrency(item.price)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(item.subtotal)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SaleDetails;
