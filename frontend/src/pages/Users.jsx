import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../services/api';

function Users() {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
  });

  // جلب المستخدمين
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      const response = await api.get(`/users?${params.toString()}`);
      return response.data;
    },
  });

  // جلب الرول
  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data.data;
    },
  });

  // إضافة مستخدم
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/users', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      setEditingUser(null);
      toast.success(t('userCreatedSuccessfully') || 'User created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) ||
        t('errorCreatingUser') || 'Error creating user';
      toast.error(message);
    },
  });

  // تحديث مستخدم
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', role: 'cashier' });
      setEditingUser(null);
      toast.success(t('userUpdatedSuccessfully') || 'User updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) ||
        t('errorUpdatingUser') || 'Error updating user';
      toast.error(message);
    },
  });

  // حذف مستخدم
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/users/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success(t('userDeletedSuccessfully') || 'User deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || t('errorDeletingUser') || 'Error deleting user';
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!submitData.password) {
      delete submitData.password;
    }
    
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.roles?.[0]?.name || 'cashier',
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setUserToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    
    toast.promise(
      new Promise((resolve, reject) => {
        deleteMutation.mutate(userToDelete, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
      {
        loading: t('deletingUser') || 'Deleting user...',
        success: t('userDeletedSuccessfully') || 'User deleted successfully',
        error: (err) => err.response?.data?.message || t('errorDeletingUser') || 'Error deleting user',
      }
    );
    
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'cashier' });
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

  const users = usersData?.data || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('usersManagement')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageUsersAndRoles')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2 rtl:space-x-reverse"
        >
          <span>+</span>
          <span>{t('addUser')}</span>
        </button>
      </div>

      {/* Search */}
      <div className="card">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('searchUsers')}
          className="input"
        />
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('name')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('email')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('role')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('createdAt')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">👥</div>
                      <p className="text-lg">{t('noUsersFound')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold mr-3 rtl:mr-0 rtl:ml-3">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        user.roles?.[0]?.name === 'admin'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      }`}>
                        {user.roles?.[0]?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                          title={t('edit')}
                        >
                          ✏️
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                            title={t('delete')}
                          >
                            🗑️
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingUser ? t('editUser') : t('addUser')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('name')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">{t('email')} *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">
                  {t('password')} {editingUser ? `(${t('leaveEmptyToKeepCurrent')})` : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  required={!editingUser}
                  minLength={8}
                />
              </div>
              <div>
                <label className="label">{t('role')} *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input"
                  required
                >
                  {rolesData?.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
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
                  className="btn-primary"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? t('loading') : t('save')}
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
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t('confirmDelete') || 'Confirm Delete'}
        message={t('confirmDeleteUser') || 'Are you sure you want to delete this user?'}
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel') || 'Cancel'}
        type="danger"
      />
    </div>
  );
}

export default Users;
