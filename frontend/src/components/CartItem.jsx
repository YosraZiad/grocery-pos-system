import { useI18n } from "../context/I18nContext";
import QuantityControl from "./QuantityControl";
import Tooltip from "./Tooltip";

function CartItem({ item, onUpdateQuantity, onRemove }) {
  const { t } = useI18n();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      onRemove();
    } else {
      onUpdateQuantity(newQuantity);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 dark:text-white text-base">
          {item.product.name}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {item.product.category?.name} | {item.price} ر.س
        </div>
      </div>
      <div className="flex items-center space-x-4 rtl:space-x-reverse">
        {/* تحكم في الكمية */}
        <QuantityControl
          value={item.quantity}
          onChange={handleQuantityChange}
          min={1}
          max={item.product.quantity + item.quantity}
        />

        {/* الإجمالي */}
        <div className="w-24 text-right rtl:text-left">
          <div className="font-bold text-gray-900 dark:text-white text-lg">
            {(item.price * item.quantity).toFixed(2)} ر.س
          </div>
        </div>

        {/* زر الحذف */}
        <Tooltip label={t("delete")}>
          <button
            onClick={onRemove}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors duration-200"
            aria-label={t("delete")}
          >
            🗑️
          </button>
        </Tooltip>
      </div>
    </div>
  );
}

export default CartItem;
