import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import api from '../services/api';

function Profile() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { user, checkAuth } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile'); // profile, password, pin, shifts
  const [shiftsPage, setShiftsPage] = useState(1);
  const [viewingShift, setViewingShift] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [pinData, setPinData] = useState({
    pin: '',
    pin_confirmation: '',
  });

  // تحديث الـ PIN
  const updatePinMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/auth/pin', { pin: data.pin });
      return response.data;
    },
    onSuccess: () => {
      setPinData({
        pin: '',
        pin_confirmation: '',
      });
      toast.success(t('pinUpdatedSuccessfully') || 'PIN updated successfully');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) ||
        t('errorUpdatingPin') || 'Error updating PIN';
      toast.error(message);
    },
  });

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinData.pin.length !== 4) {
      toast.error(t('pinMin') || 'PIN must be exactly 4 digits');
      return;
    }
    if (pinData.pin !== pinData.pin_confirmation) {
      toast.error(t('pinsDoNotMatch') || 'PINs do not match');
      return;
    }
    updatePinMutation.mutate(pinData);
  };

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

  const { data: shiftsData, isLoading: isShiftsLoading } = useQuery({
    queryKey: ['my-shifts', shiftsPage],
    queryFn: async () => {
      const response = await api.get(`/shifts?page=${shiftsPage}`);
      return response.data;
    },
    enabled: activeTab === 'shifts',
  });

  const shifts = shiftsData?.data || [];
  const shiftsTotalPages = shiftsData?.last_page || 1;

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
          <button
            onClick={() => setActiveTab('pin')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'pin'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('fastPinSecurity') || 'Fast PIN'}
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'shifts'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('shiftsHistory') || 'Shifts History'}
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

      {/* Change PIN Tab */}
      {activeTab === 'pin' && (
        <form onSubmit={handlePinSubmit} className="card space-y-4">
          <div>
            <label className="label">{t('newPin') || 'New PIN'} *</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinData.pin}
              onChange={(e) => setPinData({ ...pinData, pin: e.target.value.replace(/\D/g, '') })}
              className="input text-center tracking-widest text-2xl font-bold dark:bg-gray-800 dark:text-white"
              placeholder="••••"
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('pinMin') || 'PIN must be exactly 4 digits'}
            </p>
          </div>
          <div>
            <label className="label">{t('confirmPin') || 'Confirm PIN'} *</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pinData.pin_confirmation}
              onChange={(e) => setPinData({ ...pinData, pin_confirmation: e.target.value.replace(/\D/g, '') })}
              className="input text-center tracking-widest text-2xl font-bold dark:bg-gray-800 dark:text-white"
              placeholder="••••"
              required
            />
          </div>
          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-4">
            <button
              type="submit"
              disabled={updatePinMutation.isPending}
              className="btn-primary"
            >
              {updatePinMutation.isPending ? t('loading') : t('save') || 'Save'}
            </button>
          </div>
        </form>
      )}

      {/* Shifts History Tab */}
      {activeTab === 'shifts' && (
        <div className="card space-y-4">
          <h4 className="text-base font-bold text-gray-900 dark:text-white pb-2 border-b border-gray-150 dark:border-gray-700">
            {t('shiftsHistory') || 'سجل الورديات الشخصية'}
          </h4>

          {isShiftsLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'جاري جلب سجل شفتاتك...' : 'Fetching your shifts history...'}
              </p>
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-2 block">📁</span>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'لا يوجد سجل ورديات مسجل.' : 'No shifts records found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-gray-750 dark:text-gray-300 text-xs">
                <thead>
                  <tr className="border-b border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-bold uppercase">
                    <th className="py-3 px-4 text-start">{t('shiftNumber') || 'رقم الوردية'}</th>
                    <th className="py-3 px-4 text-start">{t('device') || 'الجهاز'}</th>
                    <th className="py-3 px-4 text-center">{language === 'ar' ? 'الافتتاحية' : 'Opening'}</th>
                    <th className="py-3 px-4 text-center">{language === 'ar' ? 'الفعلي' : 'Actual'}</th>
                    <th className="py-3 px-4 text-center">{language === 'ar' ? 'المتوقع' : 'Expected'}</th>
                    <th className="py-3 px-4 text-center">{t('difference') || 'الفارق'}</th>
                    <th className="py-3 px-4 text-center">{t('status') || 'الحالة'}</th>
                    <th className="py-3 px-4 text-center">{t('openedAt') || 'تاريخ الفتح'}</th>
                    <th className="py-3 px-4 text-center">{language === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
                  {shifts.map((shift) => {
                    const actualCash = parseFloat(shift.actual_cash ?? 0);
                    const actualCard = parseFloat(shift.actual_card ?? 0);
                    const expectedCash = parseFloat(shift.expected_cash ?? 0);
                    const expectedCard = parseFloat(shift.expected_card ?? 0);
                    const difference = parseFloat(shift.difference ?? 0);
                    const isClosed = shift.status === 'closed';

                    return (
                      <tr key={shift.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-950 dark:text-white">{shift.shift_number}</td>
                        <td className="py-3 px-4 font-semibold">{shift.device_number || '-'}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{parseFloat(shift.opening_float).toFixed(2)}</td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {isClosed ? (actualCash + actualCard).toFixed(2) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {isClosed ? (expectedCash + expectedCard).toFixed(2) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          {isClosed ? (
                            <span className={difference < -0.01 ? 'text-red-500' : difference > 0.01 ? 'text-amber-500' : 'text-green-500'}>
                              {difference > 0.01 ? '+' : ''}{difference.toFixed(2)}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isClosed ? (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-bold text-[9px] uppercase border border-gray-250 dark:border-gray-605">
                              {language === 'ar' ? 'مغلقة' : 'Closed'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-full font-bold text-[9px] uppercase border border-green-200 dark:border-green-900/30 animate-pulse">
                              {language === 'ar' ? 'نشطة' : 'Active'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-gray-500">
                          {new Date(shift.opened_at).toLocaleString(language === 'ar' ? 'ar-SA' : 'en-US', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {isClosed ? (
                              <>
                                <a
                                  href={`/shifts/${shift.id}/z-report`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary-600 hover:text-primary-700 font-bold"
                                >
                                  {t('viewZReport') || 'Z-Report'}
                                </a>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => setViewingShift(shift)}
                                  className="text-gray-650 hover:text-gray-850 dark:text-gray-350 dark:hover:text-gray-200 font-bold hover:underline"
                                >
                                  {language === 'ar' ? 'عرض' : 'View'}
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => navigate('/sales')}
                                  className="text-primary-600 hover:text-primary-700 font-bold bg-primary-50 dark:bg-primary-950/20 px-2 py-0.5 rounded-lg border border-primary-200 dark:border-primary-900/30 transition-all text-[10px]"
                                >
                                  {language === 'ar' ? 'دخول الوردية' : 'Access Shift'}
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                  onClick={() => setViewingShift(shift)}
                                  className="text-gray-650 hover:text-gray-850 dark:text-gray-355 dark:hover:text-gray-200 font-bold hover:underline"
                                >
                                  {language === 'ar' ? 'عرض' : 'View'}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {shiftsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-150 dark:border-gray-700">
                  <span className="text-gray-500 text-[10px] font-bold">
                    {language === 'ar' ? `صفحة ${shiftsPage} من ${shiftsTotalPages}` : `Page ${shiftsPage} of ${shiftsTotalPages}`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={shiftsPage <= 1}
                      onClick={() => setShiftsPage((p) => Math.max(1, p - 1))}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
                    >
                      {language === 'ar' ? 'السابق' : 'Prev'}
                    </button>
                    <button
                      disabled={shiftsPage >= shiftsTotalPages}
                      onClick={() => setShiftsPage((p) => Math.min(shiftsTotalPages, p + 1))}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40"
                    >
                      {language === 'ar' ? 'التالي' : 'Next'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {viewingShift && (
        <div className="fixed inset-0 z-50 overflow-y-auto modal">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setViewingShift(null)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-primary-500 overflow-hidden transition-all duration-300">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-750">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{language === "ar" ? `تفاصيل الوردية: ${viewingShift.shift_number}` : `Shift Details: ${viewingShift.shift_number}`}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setViewingShift(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-primary-600 dark:text-primary-400 pb-1 border-b border-gray-100 dark:border-gray-700">
                      {language === "ar" ? "المعلومات العامة" : "General Info"}
                    </h4>
                    <div className="space-y-2 text-xs text-start rtl:text-right">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "الكاشير / الموظف:" : "Cashier:"}</span>
                        <span className="font-bold text-gray-850 dark:text-gray-200">{viewingShift.user?.name || `User #${viewingShift.user_id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "رقم الجهاز:" : "Device Number:"}</span>
                        <span className="font-bold text-gray-850 dark:text-gray-200">{viewingShift.device_number || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "الحالة:" : "Status:"}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          viewingShift.status === "open" 
                            ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {viewingShift.status === "open" ? (language === "ar" ? "نشطة" : "Active") : (language === "ar" ? "مغلقة" : "Closed")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "تاريخ الفتح:" : "Opened At:"}</span>
                        <span className="font-mono text-gray-850 dark:text-gray-200">
                          {new Date(viewingShift.opened_at).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                        </span>
                      </div>
                      {viewingShift.closed_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{language === "ar" ? "تاريخ الإغلاق:" : "Closed At:"}</span>
                          <span className="font-mono text-gray-850 dark:text-gray-200">
                            {new Date(viewingShift.closed_at).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-primary-600 dark:text-primary-400 pb-1 border-b border-gray-100 dark:border-gray-700">
                      {language === "ar" ? "التسوية المالية" : "Financial Reconciliation"}
                    </h4>
                    <div className="space-y-2 text-xs text-start rtl:text-right">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "العهدة الافتتاحية:" : "Opening Float:"}</span>
                        <span className="font-mono font-bold">{parseFloat(viewingShift.opening_float).toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "الكاش الفعلي:" : "Actual Cash:"}</span>
                        <span className="font-mono font-bold text-gray-850 dark:text-gray-250">
                          {viewingShift.status === "closed" ? `${parseFloat(viewingShift.actual_cash || 0).toFixed(2)} ر.س` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "الشبكة الفعلي:" : "Actual Card:"}</span>
                        <span className="font-mono font-bold text-gray-850 dark:text-gray-250">
                          {viewingShift.status === "closed" ? `${parseFloat(viewingShift.actual_card || 0).toFixed(2)} ر.س` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 font-bold">
                        <span className="text-gray-700 dark:text-gray-300">{language === "ar" ? "إجمالي الفعلي:" : "Total Actual:"}</span>
                        <span className="font-mono">
                          {viewingShift.status === "closed" ? `${(parseFloat(viewingShift.actual_cash || 0) + parseFloat(viewingShift.actual_card || 0)).toFixed(2)} ر.س` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-700 dark:text-gray-300">{language === "ar" ? "إجمالي المتوقع:" : "Total Expected:"}</span>
                        <span className="font-mono">
                          {viewingShift.status === "closed" ? `${(parseFloat(viewingShift.expected_cash || 0) + parseFloat(viewingShift.expected_card || 0)).toFixed(2)} ر.س` : "-"}
                        </span>
                      </div>
                      {viewingShift.status === "closed" && (
                        <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 font-black">
                          <span className="text-gray-900 dark:text-white">{language === "ar" ? "الفارق:" : "Difference:"}</span>
                          <span className={`font-mono ${
                            parseFloat(viewingShift.difference || 0) < -0.01 
                              ? "text-red-500" 
                              : parseFloat(viewingShift.difference || 0) > 0.01 
                              ? "text-amber-500" 
                              : "text-green-500"
                          }`}>
                            {parseFloat(viewingShift.difference || 0) > 0.01 ? "+" : ""}
                            {parseFloat(viewingShift.difference || 0).toFixed(2)} ر.س
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {viewingShift.justification_notes && (
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-start rtl:text-right">
                    <span className="text-xs text-gray-500 font-bold block">{language === "ar" ? "تبرير الفوارق / الملاحظات:" : "Justification Notes:"}</span>
                    <p className="text-xs text-gray-750 dark:text-gray-300 leading-relaxed font-semibold italic">"{viewingShift.justification_notes}"</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end p-5 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-750 gap-3">
                {viewingShift.status === "closed" && (
                  <button
                    onClick={() => {
                      const id = viewingShift.id;
                      setViewingShift(null);
                      window.open(`/shifts/${id}/z-report`, '_blank');
                    }}
                    className="btn btn-primary text-xs font-bold"
                  >
                    {language === "ar" ? "طباعة Z-Report" : "Print Z-Report"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingShift(null)}
                  className="btn btn-secondary text-xs font-bold"
                >
                  {language === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
