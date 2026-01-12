import { useState } from 'react';
import { useI18n } from '../context/I18nContext';

function DiscountModal({ isOpen, onClose, onApply, currentDiscount = 0, currentDiscountType = 'fixed' }) {
  const { t } = useI18n();
  const [discount, setDiscount] = useState(currentDiscount);
  const [discountType, setDiscountType] = useState(currentDiscountType);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply(discount, discountType);
    onClose();
  };

  const handleReset = () => {
    setDiscount(0);
    setDiscountType('fixed');
    onApply(0, 'fixed');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('addDiscount')}
            </h3>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-4">
            <div>
              <label className="label">{t('discountType')}</label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="input w-full"
              >
                <option value="fixed">{t('fixed')} (ر.س)</option>
                <option value="percentage">{t('percentage')} (%)</option>
              </select>
            </div>

            <div>
              <label className="label">
                {discountType === 'percentage' ? t('discountPercentage') : t('discountAmount')}
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                max={discountType === 'percentage' ? 100 : undefined}
                step={discountType === 'percentage' ? 1 : 0.01}
                placeholder={discountType === 'percentage' ? '0-100' : '0.00'}
                className="input w-full"
              />
            </div>

            {discount > 0 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {discountType === 'percentage' 
                    ? `${t('discount')}: ${discount}%`
                    : `${t('discount')}: ${discount.toFixed(2)} ر.س`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {t('cancel')}
            </button>
            {currentDiscount > 0 && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200"
              >
                {t('removeDiscount')}
              </button>
            )}
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              {t('apply')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DiscountModal;
