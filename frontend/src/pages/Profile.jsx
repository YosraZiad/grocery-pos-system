import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import api from '../services/api';

function Profile() {
  const { t } = useI18n();
  const { user, checkAuth } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile'); // profile, password
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  // تحديث الملف الشخصي
  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/users/${user.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      checkAuth(); // تحديث بيانات المستخدم
      queryClient.invalidateQueries(['users']);
      toast.success(t('profileUpdatedSuccessfully') || 'Profile updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) ||
        t('errorUpdatingProfile') || 'Error updating profile';
      toast.error(message);
    },
  });

  // تحديث كلمة المرور
  const updatePasswordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put(`/users/${user.id}/password`, data);
      return response.data;
    },
    onSuccess: () => {
      setPasswordData({
        current_password: '',
        password: '',
        password_confirmation: '',
      });
      toast.success(t('passwordUpdatedSuccessfully') || 'Password updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) ||
        t('errorUpdatingPassword') || 'Error updating password';
      toast.error(message);
    },
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordData.password !== passwordData.password_confirmation) {
      toast.error(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }
    updatePasswordMutation.mutate(passwordData);
  };

  const getRoleBadgeColor = (roleName) => {
    if (roleName === 'admin') {
      return 'bg-gradient-to-br from-purple-500 to-purple-700';
    } else if (roleName === 'cashier') {
      return 'bg-gradient-to-br from-blue-500 to-blue-700';
    }
    return 'bg-gradient-to-br from-gray-500 to-gray-700';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('profile') || 'Profile'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('manageYourProfile') || 'Manage your profile information and password'}
        </p>
      </div>

      {/* User Info Card */}
      <div className="card">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ${getRoleBadgeColor(user?.roles?.[0]?.name || 'user')}`}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {user?.name || 'User'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {user?.email || ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {user?.roles?.map((role) => (
                <span
                  key={role.id}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    role.name === 'admin'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                      : role.name === 'cashier'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                  }`}
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>
          <div className="text-right rtl:text-left">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              {t('memberSince') || 'Member since'}
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.created_at 
                ? new Date(user.created_at).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-2 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'profile'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('profileInformation') || 'Profile Information'}
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'password'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('changePassword') || 'Change Password'}
          </button>
        </div>
      </div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="card space-y-4">
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
          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="btn-primary"
            >
              {updateProfileMutation.isPending ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="card space-y-4">
          <div>
            <label className="label">{t('currentPassword') || 'Current Password'} *</label>
            <input
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="label">{t('newPassword') || 'New Password'} *</label>
            <input
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              className="input"
              required
              minLength={8}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('passwordMin') || 'Password must be at least 8 characters'}
            </p>
          </div>
          <div>
            <label className="label">{t('confirmPassword')} *</label>
            <input
              type="password"
              value={passwordData.password_confirmation}
              onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
              className="input"
              required
              minLength={8}
            />
          </div>
          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
            <button
              type="submit"
              disabled={updatePasswordMutation.isPending}
              className="btn-primary"
            >
              {updatePasswordMutation.isPending ? t('loading') : t('updatePassword') || 'Update Password'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;
