import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

function Settings() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('store'); // store, printer
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
      alert(t('settingsUpdatedSuccessfully'));
    },
    onError: (error) => {
      alert(error.response?.data?.message || t('error'));
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
      alert(t('logoUploadedSuccessfully'));
    },
    onError: (error) => {
      alert(error.response?.data?.message || t('error'));
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
    </div>
  );
}

export default Settings;
