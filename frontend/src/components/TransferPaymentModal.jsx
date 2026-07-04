import { useState, useEffect } from "react";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuildingColumns } from "@fortawesome/free-solid-svg-icons";
import CustomerSelector from "./CustomerSelector";

function TransferPaymentModal({ isOpen, onClose, onConfirm, totalDue }) {
  const { t } = useI18n();
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // إعادة التعيين عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      setSelectedCustomer(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    onConfirm(null, null, null, selectedCustomer?.id || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border-2 border-blue-500 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex items-center space-x-3 rtl:space-x-reverse text-white">
            <span className="text-2xl">
              <FontAwesomeIcon icon={faBuildingColumns} />
            </span>
            <div>
              <h3 className="text-lg font-bold">
                {t("transferPayment") || "الدفع بتحويل بنكي | Bank Transfer"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                تأكيد عملية التحويل البنكي وتحديد العميل
              </p>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* إجمالي الفاتورة المطلوب */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">
                الإجمالي المطلوب:
              </span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {totalDue.toFixed(2)} ر.س
              </span>
            </div>

            {/* اختيار العميل */}
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              defaultCustomerName="العميل الافتراضي - تحويل"
            />

            {/* أزرار الإجراءات */}
            <div className="flex space-x-3 rtl:space-x-reverse pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                تأكيد الدفع وإصدار الفاتورة
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all"
              >
                {t("cancel") || "إلغاء"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TransferPaymentModal;
