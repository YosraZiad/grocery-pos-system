import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../services/api';

function Settings() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('store'); // store, printer, backup
  const [settings, setSettings] = useState({
    store_name: '',
    store_address: '',
    store_phone: '',
    store_email: '',
    currency: 'SAR',
    currency_symbol: 'ر.س',
    receipt_footer: '',
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // جلب الإعدادات
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await api.get('/settings');
      return response.data;
    },
  });

  // تحديث الإعدادات عند جلبها
  useEffect(() => {
    if (settingsData?.data) {
      setSettings({
        store_name: settingsData.data.store_name || '',
        store_address: settingsData.data.store_address || '',
        store_phone: settingsData.data.store_phone || '',
        store_email: settingsData.data.store_email || '',
        currency: settingsData.data.currency || 'SAR',
        currency_symbol: settingsData.data.currency_symbol || 'ر.س',
        receipt_footer: settingsData.data.receipt_footer || '',
      });
      if (settingsData.data.logo) {
        setLogoPreview(settingsData.data.logo);
      }
    }
  }, [settingsData]);

  // تحديث الإعدادات
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post('/settings/bulk-update', { settings: data });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['settings']);
      toast.success(t('settingsUpdatedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // رفع الشعار
  const uploadLogoMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('logo', file);
      const response = await api.post('/settings/upload-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['settings']);
      setLogoPreview(data.data.logo);
      setLogoFile(null);
      toast.success(t('logoUploadedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(settings);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = () => {
    if (logoFile) {
      uploadLogoMutation.mutate(logoFile);
    }
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
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('settings')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('manageSystemSettings')}
        </p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex space-x-2 rtl:space-x-reverse border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'store'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('storeSettings')}
          </button>
          <button
            onClick={() => setActiveTab('printer')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'printer'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('printerSettings')}
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'backup'
                ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {t('backupManagement')}
          </button>
        </div>
      </div>

      {/* Store Settings */}
      {activeTab === 'store' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('storeInformation')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="label">{t('storeName')} *</label>
                <input
                  type="text"
                  value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">{t('storeAddress')}</label>
                <textarea
                  value={settings.store_address}
                  onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                  className="input"
                  rows="3"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('storePhone')}</label>
                  <input
                    type="text"
                    value={settings.store_phone}
                    onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">{t('storeEmail')}</label>
                  <input
                    type="email"
                    value={settings.store_email}
                    onChange={(e) => setSettings({ ...settings, store_email: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('storeLogo')}
            </h3>
            <div className="space-y-4">
              {logoPreview && (
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-32 h-32 object-contain border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
              )}
              <div>
                <label className="label">{t('uploadLogo')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="input"
                />
                {logoFile && (
                  <button
                    type="button"
                    onClick={handleUploadLogo}
                    disabled={uploadLogoMutation.isPending}
                    className="btn-primary mt-2"
                  >
                    {uploadLogoMutation.isPending ? t('uploading') : t('upload')}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('currencySettings')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('currency')}</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="input"
                >
                  <option value="SAR">SAR - ريال سعودي</option>
                  <option value="USD">USD - دولار أمريكي</option>
                  <option value="EUR">EUR - يورو</option>
                  <option value="EGP">EGP - جنيه مصري</option>
                </select>
              </div>
              <div>
                <label className="label">{t('currencySymbol')}</label>
                <input
                  type="text"
                  value={settings.currency_symbol}
                  onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('receiptSettings')}
            </h3>
            <div>
              <label className="label">{t('receiptFooter')}</label>
              <textarea
                value={settings.receipt_footer}
                onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                className="input"
                rows="3"
                placeholder={t('receiptFooterPlaceholder')}
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? t('loading') : t('save')}
            </button>
          </div>
        </form>
      )}

      {/* Printer Settings */}
      {activeTab === 'printer' && (
        <div className="card">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {t('printerSettings')}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">{t('printerName')}</label>
              <input
                type="text"
                value={settings.printer_name || ''}
                onChange={(e) => setSettings({ ...settings, printer_name: e.target.value })}
                className="input"
                placeholder={t('printerNamePlaceholder')}
              />
            </div>
            <div>
              <label className="label">{t('printerType')}</label>
              <select
                value={settings.printer_type || 'thermal'}
                onChange={(e) => setSettings({ ...settings, printer_type: e.target.value })}
                className="input"
              >
                <option value="thermal">{t('thermalPrinter')}</option>
                <option value="inkjet">{t('inkjetPrinter')}</option>
                <option value="laser">{t('laserPrinter')}</option>
              </select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t('printerSettingsNote')}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse">
              <button
                onClick={() => {
                  const printerSettings = {
                    printer_name: settings.printer_name,
                    printer_type: settings.printer_type,
                  };
                  updateMutation.mutate(printerSettings);
                }}
                disabled={updateMutation.isPending}
                className="btn-primary"
              >
                {updateMutation.isPending ? t('loading') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup Management */}
      {activeTab === 'backup' && (
        <BackupManager />
      )}
    </div>
  );
}

// Backup Manager Component
function BackupManager() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // جلب قائمة النسخ الاحتياطية
  const { data: backupsData, isLoading, refetch } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await api.get('/backup/list');
      return response.data;
    },
  });

  // إنشاء نسخة احتياطية
  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/backup/create');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['backups']);
      toast.success(t('backupCreatedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // استرجاع نسخة احتياطية
  const restoreBackupMutation = useMutation({
    mutationFn: async (path) => {
      const response = await api.post(`/backup/restore/1`, { path });
      return response.data;
    },
    onSuccess: () => {
      toast.success(t('backupRestoredSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  // حذف نسخة احتياطية
  const deleteBackupMutation = useMutation({
    mutationFn: async (path) => {
      const response = await api.delete(`/backup/1`, { data: { path } });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['backups']);
      toast.success(t('backupDeletedSuccessfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t('error'));
    },
  });

  const handleCreateBackup = () => {
    setShowCreateConfirm(true);
  };

  const handleRestore = (path) => {
    setSelectedBackupPath(path);
    setShowRestoreConfirm(true);
  };

  const handleDelete = (path) => {
    setSelectedBackupPath(path);
    setShowDeleteConfirm(true);
  };

  const handleDownload = (path) => {
    window.open(`/api/backup/1/download?path=${encodeURIComponent(path)}`, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        {t('backupManagement')}
      </h3>

      {/* Create Backup Button */}
      <div className="mb-6">
        <button
          onClick={handleCreateBackup}
          disabled={createBackupMutation.isPending}
          className="btn-primary"
        >
          {createBackupMutation.isPending ? t('creating') : t('createBackup')}
        </button>
      </div>

      {/* Backups List */}
      <div>
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">
          {t('backupList')}
        </h4>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
          </div>
        ) : backupsData?.data && backupsData.data.length > 0 ? (
          <div className="space-y-3">
            {backupsData.data.map((backup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {backup.date}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(backup.size)} • {backup.age}
                  </p>
                </div>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <button
                    onClick={() => handleDownload(backup.path)}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {t('download')}
                  </button>
                  <button
                    onClick={() => handleRestore(backup.path)}
                    disabled={restoreBackupMutation.isPending}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    {t('restore')}
                  </button>
                  <button
                    onClick={() => handleDelete(backup.path)}
                    disabled={deleteBackupMutation.isPending}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {t('noBackupsFound')}
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={showCreateConfirm}
        onClose={() => setShowCreateConfirm(false)}
        onConfirm={() => {
          createBackupMutation.mutate();
          setShowCreateConfirm(false);
        }}
        title={t('confirmAction')}
        message={t('confirmCreateBackup')}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
        type="info"
      />

      <ConfirmationModal
        isOpen={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false);
          setSelectedBackupPath(null);
        }}
        onConfirm={() => {
          if (selectedBackupPath) {
            restoreBackupMutation.mutate(selectedBackupPath);
          }
          setShowRestoreConfirm(false);
          setSelectedBackupPath(null);
        }}
        title={t('confirmAction')}
        message={t('confirmRestoreBackup')}
        confirmText={t('confirm')}
        cancelText={t('cancel')}
        type="warning"
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setSelectedBackupPath(null);
        }}
        onConfirm={() => {
          if (selectedBackupPath) {
            deleteBackupMutation.mutate(selectedBackupPath);
          }
          setShowDeleteConfirm(false);
          setSelectedBackupPath(null);
        }}
        title={t('confirmAction')}
        message={t('confirmDeleteBackup')}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        type="danger"
      />
    </div>
  );
}

export default Settings;
