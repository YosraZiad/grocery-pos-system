import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../services/api';

function Categories() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const queryClient = useQueryClient();
  const { t } = useI18n();

  // جلب الأقسام
  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data.data;
    },
  });

  // إضافة قسم
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/categories', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setShowModal(false);
      setName('');
      setDescription('');
      toast.success(t('categoryCreatedSuccessfully') || 'Category created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || t('errorCreatingCategory') || 'Error creating category';
      toast.error(message);
    },
  });

  // تحديث قسم
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setShowModal(false);
      setEditingId(null);
      setName('');
      setDescription('');
      toast.success(t('categoryUpdatedSuccessfully') || 'Category updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || t('errorUpdatingCategory') || 'Error updating category';
      toast.error(message);
    },
  });

  // حذف قسم
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      toast.success(t('categoryDeletedSuccessfully') || 'Category deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || t('errorDeletingCategory') || 'Error deleting category';
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = { name, description };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description || '');
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const category = data?.find(cat => cat.id === id);
    const hasProducts = category?.products_count > 0;
    
    if (hasProducts) {
      toast.error(
        t('cannotDeleteCategoryWithProducts') || 
        `Cannot delete category. It has ${category.products_count} product(s). Please remove products first.`,
        { duration: 5000 }
      );
      return;
    }
    
    // فتح modal التأكيد
    setCategoryToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;
    
    toast.promise(
      new Promise((resolve, reject) => {
        deleteMutation.mutate(categoryToDelete, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
      {
        loading: t('deletingCategory') || 'Deleting category...',
        success: t('categoryDeletedSuccessfully') || 'Category deleted successfully',
        error: (err) => err.response?.data?.message || t('errorDeletingCategory') || 'Error deleting category',
      }
    );
    
    setShowDeleteModal(false);
    setCategoryToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setName('');
    setDescription('');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('manageCategories')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {data?.length || 0} {t('categories').toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2 rtl:space-x-reverse"
        >
          <span>+</span>
          <span>{t('addCategory')}</span>
        </button>
      </div>

      {/* Categories Grid */}
      {data && data.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((category) => (
            <div key={category.id} className="card group hover:shadow-xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors duration-200"
                    title={t('edit')}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                    title={t('delete')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {category.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {category.description || '-'}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {t('productsCount')}
                </span>
                <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
                  {category.products_count || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-600 dark:text-gray-400">{t('noCategories')}</p>
      </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? t('editCategory') : t('addCategory')}
            </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">
                  {t('categoryName')} *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input"
                  placeholder={t('categoryName')}
                />
              </div>
              <div>
                <label className="label">
                  {t('description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="input resize-none"
                  placeholder={t('description')}
                />
              </div>
              <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary disabled:opacity-50"
                >
                  {editingId ? t('update') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t('confirmDelete') || 'Confirm Delete'}
        message={t('confirmDeleteCategory') || 'Are you sure you want to delete this category?'}
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel') || 'Cancel'}
        type="danger"
      />
    </div>
  );
}

export default Categories;
