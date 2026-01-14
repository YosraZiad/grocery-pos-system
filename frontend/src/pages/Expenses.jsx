import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../services/api';

function Expenses() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteExpenseModal, setShowDeleteExpenseModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [expenseFormData, setExpenseFormData] = useState({
    category_id: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
  });

  // جلب المصروفات
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses', categoryFilter, fromDate, toDate, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.append('category_id', categoryFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      if (search) params.append('search', search);
      const response = await api.get(`/expenses?${params.toString()}`);
      return response.data;
    },
  });

  // جلب أقسام المصروفات
  const { data: categoriesData } = useQuery({
    queryKey: ['expense-categories'],
    queryFn: async () => {
      const response = await api.get('/expense-categories');
      return response.data;
    },
  });

  // جلب ملخص المصروفات
  const { data: summaryData } = useQuery({
    queryKey: ['expenses-summary', fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const response = await api.get(`/expenses/summary?${params.toString()}`);
      return response.data;
    },
    enabled: showSummary,
  });

  // إضافة مصروف
  const createExpenseMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/expenses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenses-summary']);
      setShowExpenseModal(false);
      setExpenseFormData({
        category_id: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setEditingExpense(null);
      toast.success(t('expenseCreatedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // تحديث مصروف
  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/expenses/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenses-summary']);
      setShowExpenseModal(false);
      setExpenseFormData({
        category_id: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      setEditingExpense(null);
      toast.success(t('expenseUpdatedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // حذف مصروف
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/expenses/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expenses']);
      queryClient.invalidateQueries(['expenses-summary']);
      toast.success(t('expenseDeletedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // إضافة قسم
  const createCategoryMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/expense-categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-categories']);
      setShowCategoryModal(false);
      setCategoryFormData({ name: '', description: '' });
      setEditingCategory(null);
      toast.success(t('categoryCreatedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // تحديث قسم
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/expense-categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-categories']);
      setShowCategoryModal(false);
      setCategoryFormData({ name: '', description: '' });
      setEditingCategory(null);
      toast.success(t('categoryUpdatedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // حذف قسم
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/expense-categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['expense-categories']);
      toast.success(t('categoryDeletedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data: expenseFormData });
    } else {
      createExpenseMutation.mutate(expenseFormData);
    }
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryFormData });
    } else {
      createCategoryMutation.mutate(categoryFormData);
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseFormData({
      category_id: expense.category_id,
      amount: expense.amount,
      description: expense.description || '',
      date: expense.date,
    });
    setShowExpenseModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
    });
    setShowCategoryModal(true);
  };

  const handleDeleteExpense = (id) => {
    setExpenseToDelete(id);
    setShowDeleteExpenseModal(true);
  };

  const handleDeleteCategory = (id) => {
    setCategoryToDelete(id);
    setShowDeleteCategoryModal(true);
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

  const expenses = expensesData?.data || [];
  const categories = categoriesData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('expensesManagement')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageExpenses')}
          </p>
        </div>
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="btn-secondary"
          >
            {showSummary ? t('hideSummary') : t('showSummary')}
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="btn-secondary"
          >
            {t('manageCategories')}
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="btn-primary"
          >
            {t('addExpense')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {showSummary && summaryData?.data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
              {t('totalExpenses')}
            </h3>
            <p className="text-2xl font-bold text-red-900 dark:text-red-200">
              {formatCurrency(summaryData.data.total_expenses || 0)}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
              {t('expensesCount')}
            </h3>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
              {summaryData.data.expenses_count || 0}
            </p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">
              {t('averageExpense')}
            </h3>
            <p className="text-2xl font-bold text-green-900 dark:text-green-200">
              {formatCurrency(summaryData.data.average_expense || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">{t('category')}</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((category) => (
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
          <div>
            <label className="label">{t('search')}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchExpenses')}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setCategoryFilter('');
                setFromDate('');
                setToDate('');
                setSearch('');
              }}
              className="btn-secondary w-full"
            >
              {t('clearFilters')}
            </button>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('date')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('category')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('description')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('amount')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('user')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">💰</div>
                      <p className="text-lg">{t('noExpensesFound')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(expense.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {expense.category?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {expense.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {formatCurrency(expense.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {expense.user?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                          title={t('edit')}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          title={t('delete')}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {expensesData?.links && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t('showing')} {expensesData.from} {t('to')} {expensesData.to} {t('of')} {expensesData.total} {t('results')}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingExpense ? t('editExpense') : t('addExpense')}
              </h3>
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                  setExpenseFormData({
                    category_id: '',
                    amount: 0,
                    description: '',
                    date: new Date().toISOString().split('T')[0],
                  });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="label">{t('category')} *</label>
                <select
                  value={expenseFormData.category_id}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, category_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">{t('selectCategory')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">{t('amount')} *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expenseFormData.amount}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) || 0 })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">{t('date')} *</label>
                <input
                  type="date"
                  value={expenseFormData.date}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">{t('description')}</label>
                <textarea
                  value={expenseFormData.description}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    setExpenseFormData({
                      category_id: '',
                      amount: 0,
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                    });
                  }}
                  className="btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                  className="btn-primary"
                >
                  {(createExpenseMutation.isPending || updateExpenseMutation.isPending) ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCategory ? t('editCategory') : t('addCategory')}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                  setCategoryFormData({ name: '', description: '' });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{t('categories')}</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{category.name}</p>
                      {category.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {category.expenses_count || 0} {t('expenses')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                        title={t('edit')}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        title={t('delete')}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="label">{t('categoryName')} *</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">{t('description')}</label>
                <textarea
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                    setCategoryFormData({ name: '', description: '' });
                  }}
                  className="btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                  className="btn-primary"
                >
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) ? t('loading') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showDeleteExpenseModal}
        onClose={() => {
          setShowDeleteExpenseModal(false);
          setExpenseToDelete(null);
        }}
        onConfirm={() => {
          if (expenseToDelete) {
            deleteExpenseMutation.mutate(expenseToDelete);
          }
          setShowDeleteExpenseModal(false);
          setExpenseToDelete(null);
        }}
        title={t('confirmAction')}
        message={t('confirmDeleteExpense')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
      />

      <ConfirmationModal
        isOpen={showDeleteCategoryModal}
        onClose={() => {
          setShowDeleteCategoryModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={() => {
          if (categoryToDelete) {
            deleteCategoryMutation.mutate(categoryToDelete);
          }
          setShowDeleteCategoryModal(false);
          setCategoryToDelete(null);
        }}
        title={t('confirmAction')}
        message={t('confirmDeleteCategory')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
      />
    </div>
  );
}

export default Expenses;
