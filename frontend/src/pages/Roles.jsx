import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../services/api';

function Roles() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    permissions: [],
  });

  // جلب الرول
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      try {
        const response = await api.get('/roles');
        console.log('Roles API Response:', response.data);
        // معالجة البيانات بشكل صحيح
        if (response.data?.data) {
          return Array.isArray(response.data.data) ? response.data.data : [];
        }
        if (Array.isArray(response.data)) {
          return response.data;
        }
        return [];
      } catch (error) {
        console.error('Error fetching roles:', error);
        toast.error(t('errorLoadingRoles') || 'Error loading roles');
        return [];
      }
    },
  });

  // جلب الصلاحيات
  const { data: permissionsData, isLoading: permissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      try {
        const response = await api.get('/permissions');
        console.log('Permissions API Response:', response.data);
        // معالجة البيانات بشكل صحيح
        if (response.data?.data) {
          return typeof response.data.data === 'object' ? response.data.data : {};
        }
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          return response.data;
        }
        return {};
      } catch (error) {
        console.error('Error fetching permissions:', error);
        // معالجة أخطاء الصلاحيات بشكل خاص
        if (error.response?.status === 403) {
          toast.error(t('noPermissionToViewPermissions') || 'You do not have permission to view permissions. Please contact your administrator.');
        } else {
          toast.error(t('errorLoadingPermissions') || 'Error loading permissions');
        }
        throw error; // إعادة رمي الخطأ لـ react-query
      }
    },
  });

  // إضافة رول
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/roles', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setShowModal(false);
      setFormData({ name: '', permissions: [] });
      setEditingRole(null);
      toast.success(t('roleCreatedSuccessfully') || 'Role created successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) ||
        t('errorCreatingRole') || 'Error creating role';
      toast.error(message);
    },
  });

  // تحديث رول
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/roles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      setShowModal(false);
      setFormData({ name: '', permissions: [] });
      setEditingRole(null);
      toast.success(t('roleUpdatedSuccessfully') || 'Role updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) ||
        t('errorUpdatingRole') || 'Error updating role';
      toast.error(message);
    },
  });

  // حذف رول
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/roles/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      toast.success(t('roleDeletedSuccessfully') || 'Role deleted successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || t('errorDeletingRole') || 'Error deleting role';
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      name: formData.name,
      permissions: formData.permissions.map(p => typeof p === 'object' ? p.id : p),
    };
    
    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      permissions: role.permissions?.map(p => p.id) || [],
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setRoleToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!roleToDelete) return;
    
    toast.promise(
      new Promise((resolve, reject) => {
        deleteMutation.mutate(roleToDelete, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
      {
        loading: t('deletingRole') || 'Deleting role...',
        success: t('roleDeletedSuccessfully') || 'Role deleted successfully',
        error: (err) => err.response?.data?.message || t('errorDeletingRole') || 'Error deleting role',
      }
    );
    
    setShowDeleteModal(false);
    setRoleToDelete(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({ name: '', permissions: [] });
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const isLoading = rolesLoading || permissionsLoading;
  const roles = Array.isArray(rolesData) ? rolesData : [];
  const permissions = permissionsData && typeof permissionsData === 'object' && !Array.isArray(permissionsData) ? permissionsData : {};

  // Debug: عرض البيانات في console
  useEffect(() => {
    if (!isLoading) {
      console.log('Roles Data:', roles);
      console.log('Permissions Data:', permissions);
      console.log('Roles Count:', roles.length);
      console.log('Permissions Groups:', Object.keys(permissions).length);
    }
  }, [roles, permissions, isLoading]);

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

  if (rolesError || permissionsError) {
    return (
      <div className="card">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('errorLoadingData') || 'Error loading data'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {rolesError?.message || permissionsError?.message || 'Please try again later'}
          </p>
          <button
            onClick={() => {
              queryClient.invalidateQueries(['roles']);
              queryClient.invalidateQueries(['permissions']);
            }}
            className="btn-primary"
          >
            {t('retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('rolesAndPermissions')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('manageRolesAndPermissions')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2 rtl:space-x-reverse"
        >
          <span>+</span>
          <span>{t('addRole')}</span>
        </button>
      </div>

      {/* Roles List - Table View */}
      {roles.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('noRolesFound') || 'No roles found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('createFirstRole') || 'Create your first role to get started'}
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              {t('addRole')}
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('roleName') || 'Role Name'}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('permissions') || 'Permissions'}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('usersCount') || 'Users Count'}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('createdAt') || 'Created At'}
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('actions') || 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg ${
                          role.name === 'admin' 
                            ? 'bg-gradient-to-br from-purple-500 to-purple-700' 
                            : role.name === 'cashier'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                            : 'bg-gradient-to-br from-gray-500 to-gray-700'
                        }`}>
                          {role.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                            {role.name}
                          </div>
                          {['admin', 'cashier'].includes(role.name) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                              {t('systemRole') || 'System Role'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2 max-w-md">
                          {role.permissions && Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                            <>
                              {role.permissions.slice(0, 5).map((permission, idx) => (
                                <span
                                  key={permission.id || permission.name || idx}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                                  title={typeof permission === 'object' ? permission.name : permission}
                                >
                                  {typeof permission === 'object' ? permission.name : permission}
                                </span>
                              ))}
                              {role.permissions.length > 5 && (
                                <button
                                  onClick={() => {
                                    setSelectedRole(role);
                                    setShowPermissionsModal(true);
                                  }}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                >
                                  +{role.permissions.length - 5} {t('more')}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                              {t('noPermissions') || 'No permissions'}
                            </span>
                          )}
                        </div>
                        {role.permissions && Array.isArray(role.permissions) && role.permissions.length > 0 && (
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('totalPermissions') || 'Total'}: <span className="font-semibold">{role.permissions.length}</span> {t('permissions')}
                            </div>
                            {role.permissions.length > 5 && (
                              <button
                                onClick={() => {
                                  setSelectedRole(role);
                                  setShowPermissionsModal(true);
                                }}
                                className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-medium"
                              >
                                {t('viewAll') || 'View All'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {role.users_count || 0} {t('users') || 'users'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {role.created_at 
                          ? new Date(role.created_at).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => handleEdit(role)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                          title={t('edit')}
                        >
                          <span className="mr-1 rtl:ml-1">✏️</span>
                          {t('edit')}
                        </button>
                        {!['admin', 'cashier'].includes(role.name) && (
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title={t('delete')}
                          >
                            <span className="mr-1 rtl:ml-1">🗑️</span>
                            {t('delete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Overview Section */}
      {Object.keys(permissions).length > 0 ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('availablePermissions') || 'Available Permissions'}
            </h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Object.values(permissions).reduce((total, group) => total + (Array.isArray(group) ? group.length : 0), 0)} {t('permissions') || 'permissions'}
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(permissions).map(([group, groupPermissions]) => (
              <div key={group} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 capitalize flex items-center">
                  <span className="w-2 h-2 bg-primary-500 rounded-full mr-2 rtl:ml-2"></span>
                  {group} ({Array.isArray(groupPermissions) ? groupPermissions.length : 0})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Array.isArray(groupPermissions) && groupPermissions.length > 0 ? (
                    groupPermissions.map((permission) => (
                      <div
                        key={permission.id || permission}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                      >
                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full mr-2 rtl:ml-2 flex-shrink-0"></span>
                        <span className="truncate">{typeof permission === 'object' ? permission.name : permission}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      {t('noPermissions') || 'No permissions'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('noPermissionsFound') || 'No permissions found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('permissionsWillAppearHere') || 'Permissions will appear here once they are loaded'}
            </p>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRole ? t('editRole') : t('addRole')}
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
                <label className="label">{t('roleName')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                  disabled={editingRole && ['admin', 'cashier'].includes(editingRole.name)}
                />
              </div>
              <div>
                <label className="label mb-3 block">{t('permissions')} *</label>
                <div className="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
                  {Object.entries(permissions).map(([group, groupPermissions]) => (
                    <div key={group} className="space-y-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                        {group}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {groupPermissions.map((permission) => (
                          <label
                            key={permission.id}
                            className="flex items-center space-x-2 rtl:space-x-reverse p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {permission.name}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
          setRoleToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t('confirmDelete') || 'Confirm Delete'}
        message={t('confirmDeleteRole') || 'Are you sure you want to delete this role?'}
        confirmText={t('delete') || 'Delete'}
        cancelText={t('cancel') || 'Cancel'}
        type="danger"
      />

      {/* Permissions Details Modal */}
      {showPermissionsModal && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('permissions')} - {selectedRole.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedRole.permissions?.length || 0} {t('permissions')}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedRole(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              {selectedRole.permissions && Array.isArray(selectedRole.permissions) && selectedRole.permissions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedRole.permissions.map((permission, idx) => (
                    <div
                      key={permission.id || permission.name || idx}
                      className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="w-2 h-2 bg-primary-500 rounded-full mr-3 rtl:ml-3 flex-shrink-0"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {typeof permission === 'object' ? permission.name : permission}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">
                    {t('noPermissions') || 'No permissions'}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedRole(null);
                }}
                className="btn-secondary"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Roles;
