import { useEffect } from "react";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchangeAlt, faUser, faPhone, faSpinner } from "@fortawesome/free-solid-svg-icons";

function VoucherRefundModal({ isOpen, onClose, onConfirm, refundTotal, selectedCustomer, isProcessing }) {
  const { t, language } = useI18n();

  // Escape key handler to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isProcessing) return;
    onConfirm();
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
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full border-2 border-indigo-500 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-5 flex items-center space-x-3 rtl:space-x-reverse text-white">
            <span className="text-2xl">
              <FontAwesomeIcon icon={faExchangeAlt} />
            </span>
            <div>
              <h3 className="text-lg font-bold">
                {language === "ar" ? "إصدار سند الاستبدال (كوبون)" : "Issue Replacement Voucher"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {language === "ar" ? "توليد كوبون استبدال بقيمة المرتجع لصالح العميل" : "Generate replacement coupon voucher code with return value"}
              </p>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* توضيح العملية */}
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900 rounded-2xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-400">
                {language === "ar" ? "شرح آلية رصيد الاستبدال:" : "Voucher System Explanation:"}
              </h4>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                {language === "ar" 
                  ? "سيقوم النظام بإنشاء سند استبدال بقيمة المرتجعات الصافية. يمكن للعميل استخدام كود السند كخصم عند شراء منتجات بديلة من واجهة الكاشير (عبر إدخاله أو مسحه بالباركود)."
                  : "The system will generate a replacement voucher code with the net return value. The customer can use this code for discount on their next purchase in the sales screen (by typing or scanning the barcode)."}
              </p>
            </div>

            {/* تفاصيل العميل المستفيد */}
            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-150 dark:border-gray-700 space-y-2.5">
              <span className="text-xs text-gray-400 block font-bold">
                {language === "ar" ? "العميل المرتبط بالسند:" : "Customer Associated with Voucher:"}
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                <span>{selectedCustomer ? selectedCustomer.name : (language === "ar" ? "سيتولد عميل ارجاع مؤقت للفاتورة" : "Temporary return customer will be created")}</span>
              </div>
              {selectedCustomer?.phone && (
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                  <FontAwesomeIcon icon={faPhone} />
                  <span>{selectedCustomer.phone}</span>
                </div>
              )}
            </div>

            {/* إجمالي المبلع المطلوب */}
            <div className="flex justify-between items-center p-4 bg-indigo-50/50 dark:bg-indigo-950/10 rounded-2xl border border-indigo-200/40 dark:border-indigo-900/40">
              <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">
                {language === "ar" ? "قيمة كوبون الاستبدال الصافي:" : "Voucher Coupon Value:"}
              </span>
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {refundTotal.toFixed(2)} {t("sar") || "ر.س"}
              </span>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all text-xs"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5"
              >
                {isProcessing ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faExchangeAlt} />
                )}
                <span>{language === "ar" ? "تأكيد وإصدار الكوبون" : "Confirm & Issue Voucher"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default VoucherRefundModal;
