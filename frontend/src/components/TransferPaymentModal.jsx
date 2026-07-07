import { useState, useEffect } from "react";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBuildingColumns, faXmark } from "@fortawesome/free-solid-svg-icons";
import CustomerSelector from "./CustomerSelector";

function TransferPaymentModal({ isOpen, onClose, onConfirm, totalDue }) {
  const { t, language } = useI18n();
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
          <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-855 border-b border-gray-200 dark:border-gray-750">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faBuildingColumns} className="text-blue-600 text-xl" />
              <div className="flex flex-col text-start leading-tight">
                <span>{t("transferPayment")}</span>
                <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                  {language === "ar" ? "تأكيد عملية التحويل البنكي وتحديد العميل" : "Confirm bank transfer and assign customer"}
                </span>
              </div>
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* إجمالي الفاتورة المطلوب */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">
                {t("totalRequired")}:
              </span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {totalDue.toFixed(2)} {t("sar") || "ر.س"}
              </span>
            </div>

            {/* اختيار العميل */}
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              defaultCustomerName={t("defaultTransferCustomer") || "العميل الافتراضي - تحويل"}
            />

            {/* أزرار الإجراءات */}
            <div className="flex space-x-3 rtl:space-x-reverse pt-2">
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                {t("confirmPayment")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 bg-gray-150 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default TransferPaymentModal;
