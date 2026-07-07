import { useState, useEffect, useRef } from "react";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBillWave, faCoins, faSpinner, faXmark, faPlug } from "@fortawesome/free-solid-svg-icons";

function CashRefundModal({ isOpen, onClose, onConfirm, refundTotal, isProcessing }) {
  const { t, language } = useI18n();
  const [cashAmount, setCashAmount] = useState("");
  const inputRef = useRef(null);

  // Set default values when modal opens
  useEffect(() => {
    if (isOpen) {
      setCashAmount(refundTotal.toFixed(2));
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, refundTotal]);

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

  const parsedCash = parseFloat(cashAmount) || 0;
  const isAmountValid = parsedCash >= refundTotal;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isProcessing) return;
    onConfirm(parsedCash);
  };

  const handleExactAmount = () => {
    setCashAmount(refundTotal.toFixed(2));
    inputRef.current?.focus();
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
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full border-2 border-emerald-500 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-855 border-b border-gray-200 dark:border-gray-750">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faMoneyBillWave} className="text-emerald-600 text-xl" />
              <div className="flex flex-col text-start leading-tight">
                <span>{language === "ar" ? "تسوية المرتجع النقدي" : "Cash Refund Settlement"}</span>
                <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                  {language === "ar" ? "تأكيد تسليم المبلغ النقدي المرتجع للعميل وفتح درج النقدية" : "Confirm returned cash amount handed to customer and open drawer"}
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
            {/* إشعار فتح درج النقدية */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/30 rounded-2xl flex items-center gap-3">
              <span className="text-xl text-emerald-600">
                <FontAwesomeIcon icon={faPlug} />
              </span>
              <div>
                <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                  {language === "ar" ? "محاكاة فتح درج النقدية تلقائياً" : "Automatic Cash Drawer Opening"}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {language === "ar" ? "تم فتح درج النقدية تلقائياً لرد المبالغ للعميل." : "Cash drawer opened automatically to hand out refund."}
                </p>
              </div>
            </div>

            {/* إجمالي المبلع المسترد المطلوب */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-150 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-bold text-sm">
                {language === "ar" ? "صافي المبلغ المسترد للعميل:" : "Net Refund Amount:"}
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {refundTotal.toFixed(2)} {t("sar") || "ر.س"}
              </span>
            </div>

            {/* حقل إدخال المبلغ المسلم */}
            <div className="space-y-2">
              <label htmlFor="cashPaidInput" className="label text-xs font-bold text-gray-700 dark:text-gray-300">
                {language === "ar" ? "المبلغ النقدي المسلم للعميل فعلياً" : "Actual Cash Handed to Customer"} ({t("sar") || "ر.س"})
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:left-auto rtl:right-0 rtl:pr-3">
                  <span className="text-gray-500 dark:text-gray-400 font-bold text-sm">SAR</span>
                </div>
                <input
                  ref={inputRef}
                  id="cashPaidInput"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full px-4 py-4 pl-14 rtl:pl-4 rtl:pr-14 text-2xl font-black border-2 border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
              {!isAmountValid && (
                <p className="text-[10px] text-red-500 font-bold">
                  {language === "ar" ? "المبلغ المسلم يجب أن يساوي أو يتجاوز قيمة الاسترجاع الصافية." : "Handed cash must be equal to or greater than net refund amount."}
                </p>
              )}
            </div>

            {/* خيارات سريعة */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExactAmount}
                className="flex-1 py-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs transition-all border border-emerald-200 dark:border-emerald-900/30 flex items-center justify-center gap-1.5"
              >
                <FontAwesomeIcon icon={faCoins} />
                <span>{language === "ar" ? "المبلغ بالضبط" : "Exact Amount"}</span>
              </button>
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
                disabled={!isAmountValid || isProcessing}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isProcessing ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faMoneyBillWave} />
                )}
                <span>{language === "ar" ? "تأكيد إرجاع النقدية" : "Confirm Cash Refund"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CashRefundModal;
