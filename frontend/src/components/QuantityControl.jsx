import { useI18n } from '../context/I18nContext';

function QuantityControl({ value, onChange, min = 1, max, disabled = false }) {
  const { t } = useI18n();

  const handleDecrease = () => {
    if (value > min && !disabled) {
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max && !disabled) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value) || min;
    if (newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  return (
    <div className="flex items-center space-x-2 rtl:space-x-reverse border border-gray-300 dark:border-gray-600 rounded-lg">
      <button
        onClick={handleDecrease}
        disabled={disabled || value <= min}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors duration-200 text-gray-600 dark:text-gray-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('decrease')}
      >
        −
      </button>
      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        disabled={disabled}
        className="w-16 text-center border-0 bg-transparent text-gray-900 dark:text-white focus:outline-none focus:ring-0 disabled:opacity-50"
      />
      <button
        onClick={handleIncrease}
        disabled={disabled || value >= max}
        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors duration-200 text-gray-600 dark:text-gray-400 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('increase')}
      >
        +
      </button>
    </div>
  );
}

export default QuantityControl;
