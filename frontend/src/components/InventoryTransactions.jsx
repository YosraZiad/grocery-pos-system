import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

function InventoryTransactions({ productId = null }) {
  const { t } = useI18n();
  const [typeFilter, setTypeFilter] = useState('');
  const [referenceTypeFilter, setReferenceTypeFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // جلب سجل الحركة
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'transactions', productId, typeFilter, referenceTypeFilter, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (productId) params.append('product_id', productId);
      if (typeFilter) params.append('type', typeFilter);
      if (referenceTypeFilter) params.append('reference_type', referenceTypeFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/inventory/transactions?${params.toString()}`);
      return response.data;
    },
  });

  const getTypeBadge = (type) => {
    const badges = {
      in: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      out: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      return: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    };
    return badges[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
  };

  const getTypeLabel = (type) => {
    const labels = {
      in: t('in'),
      out: t('out'),
      return: t('return'),
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('allTypes')}</option>
            <option value="in">{t('in')}</option>
            <option value="out">{t('out')}</option>
            <option value="return">{t('return')}</option>
          </select>
          <select
            value={referenceTypeFilter}
            onChange={(e) => setReferenceTypeFilter(e.target.value)}
            className="input"
          >
            <option value="">{t('allReferences')}</option>
            <option value="Sale">{t('sale')}</option>
            <option value="Purchase">{t('purchase')}</option>
            <option value="Return">{t('return')}</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="input"
            placeholder={t('fromDate')}
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="input"
            placeholder={t('toDate')}
          />
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('type')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('quantity')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('reference')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('notes')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data?.data?.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {new Date(transaction.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.product?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeBadge(transaction.type)}`}>
                      {getTypeLabel(transaction.type)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                    transaction.type === 'in' 
                      ? 'text-green-600 dark:text-green-400' 
                      : transaction.type === 'out'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {transaction.reference_type} #{transaction.reference_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {transaction.notes || '-'}
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
                {t('showing')} {data.from} {t('to')} {data.to} {t('of')} {data.total} {t('transactions')}
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
    </div>
  );
}

export default InventoryTransactions;
