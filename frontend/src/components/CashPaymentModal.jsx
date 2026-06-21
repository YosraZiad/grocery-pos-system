import { useState, useEffect, useRef } from "react";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBillWave, faCoins } from "@fortawesome/free-solid-svg-icons";

// الأوراق النقدية السعودية الشائعة
const SAR_DENOMINATIONS = [5, 10, 50, 100, 200, 500];

function CashPaymentModal({ isOpen, onClose, onConfirm, totalDue }) {
  const { t } = useI18n();
  const [receivedAmount, setReceivedAmount] = useState("");
  const inputRef = useRef(null);

  // إعادة تعيين القيمة عند فتح المودال والتركيز التلقائي
  useEffect(() => {
    if (isOpen) {
      setReceivedAmount("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // مستمع لإغلاق المودال عبر زر Escape
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

  const parsedReceived = parseFloat(receivedAmount) || 0;
  const changeDue = parsedReceived - totalDue;
  const isAmountSufficient = parsedReceived >= totalDue;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!isAmountSufficient) return;
    onConfirm(parsedReceived, changeDue);
    onClose();
  };

  const handleDenominationClick = (denom) => {
    setReceivedAmount(denom.toString());
    inputRef.current?.focus();
  };

  const handleExactAmount = () => {
    setReceivedAmount(totalDue.toFixed(2));
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Card */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full border-2 border-green-500 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 flex items-center space-x-3 rtl:space-x-reverse text-white">
            <span className="text-2xl">
              <FontAwesomeIcon icon={faMoneyBillWave} />
            </span>
            <div>
              <h3 className="text-lg font-bold">
                {t("cashPayment") || "الدفع النقدي | Cash Payment"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {t("enterReceivedDesc") || "أدخل المبلغ المستلم من العميل لحساب المتبقي"}
              </p>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* إجمالي الفاتورة المطلوب */}
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-700">
              <span className="text-gray-600 dark:text-gray-400 font-semibold">
                {t("totalRequired") || "الإجمالي المطلوب"}:
              </span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {totalDue.toFixed(2)} ر.س
              </span>
            </div>

            {/* حقل إدخال المبلغ المستلم */}
            <div className="space-y-2">
              <label htmlFor="receivedInput" className="label text-sm font-bold text-gray-700 dark:text-gray-300">
                {t("amountReceived") || "المبلغ المستلم"} (ر.س)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:left-auto rtl:right-0 rtl:pr-3">
                  <span className="text-gray-500 dark:text-gray-400 font-bold text-lg">SAR</span>
                </div>
                <input
                  ref={inputRef}
                  id="receivedInput"
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  className="w-full px-4 py-4 pl-14 rtl:pl-4 rtl:pr-14 text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* أزرار الفئات السريعة */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t("quickSelect") || "خيارات سريعة"}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={handleExactAmount}
                  className="col-span-2 py-3 bg-primary-100 hover:bg-primary-200 dark:bg-primary-950/40 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-xl font-bold text-sm transition-all border border-primary-200 dark:border-primary-800"
                >
                  💵 {t("exactAmount") || "المبلغ بالضبط"}
                </button>
                {SAR_DENOMINATIONS.map((denom) => (
                  <button
                    key={denom}
                    type="button"
                    onClick={() => handleDenominationClick(denom)}
                    className="py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-sm transition-all border border-gray-200 dark:border-gray-600"
                  >
                    {denom} ر.س
                  </button>
                ))}
              </div>
            </div>

            {/* حساب الباقي وعرضه بخط ضخم جداً */}
            <div className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center space-y-1 ${
              isAmountSufficient 
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30" 
                : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30"
            }`}>
              <div className={`text-xs font-bold uppercase tracking-wider ${
                isAmountSufficient ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}>
                {isAmountSufficient ? (t("changeDue") || "المبلغ المتبقي للعميل (الباقي)") : (t("insufficientAmount") || "المبلغ غير كافٍ")}
              </div>
              <div className={`text-5xl font-black ${
                isAmountSufficient ? "text-green-600 dark:text-green-400 animate-pulse" : "text-red-600 dark:text-red-400"
              }`}>
                {isAmountSufficient ? changeDue.toFixed(2) : (totalDue - parsedReceived).toFixed(2)}
                <span className="text-xl font-bold ml-1.5 rtl:mr-1.5">ر.س</span>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="pt-3 flex justify-end space-x-3 rtl:space-x-reverse border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold transition-all duration-200"
              >
                {t("cancel") || "إلغاء"}
              </button>
              <button
                type="submit"
                disabled={!isAmountSufficient}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 font-bold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 rtl:space-x-reverse"
              >
                <span>
                  <FontAwesomeIcon icon={faCoins} />
                </span>
                <span>{t("confirmPayment") || "تأكيد الدفع وإتمام الفاتورة"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CashPaymentModal;
