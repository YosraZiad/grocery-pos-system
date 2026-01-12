import { useI18n } from '../context/I18nContext';

function PaymentMethod({ value, onChange, disabled = false }) {
  const { t } = useI18n();

  const paymentMethods = [
    { value: 'cash', label: t('cash'), icon: '💵' },
    { value: 'card', label: t('card'), icon: '💳' },
    { value: 'transfer', label: t('transfer'), icon: '🏦' },
  ];

  return (
    <div>
      <label className="label mb-3">{t('paymentMethod')}</label>
      <div className="grid grid-cols-3 gap-3">
        {paymentMethods.map((method) => (
          <button
            key={method.value}
            onClick={() => !disabled && onChange(method.value)}
            disabled={disabled}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              value === method.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-2xl mb-2">{method.icon}</div>
            <div className={`text-sm font-medium ${
              value === method.value
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-700 dark:text-gray-300'
            }`}>
              {method.label}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default PaymentMethod;
