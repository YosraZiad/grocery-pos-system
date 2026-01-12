import { useI18n } from '../context/I18nContext';

function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'warning' }) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const typeStyles = {
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700',
    danger: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
    info: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  };

  const buttonStyles = {
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700',
    info: 'bg-blue-600 hover:bg-blue-700',
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
        <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full border-2 ${typeStyles[type]}`}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title || t('confirmAction')}
            </h3>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            <p className="text-gray-600 dark:text-gray-400">
              {message || t('areYouSure')}
            </p>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 rtl:space-x-reverse">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {cancelText || t('cancel')}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-white rounded-lg transition-colors duration-200 ${buttonStyles[type]}`}
            >
              {confirmText || t('confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
