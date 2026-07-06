import { useState } from "react";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPause,
  faSpinner,
  faKeyboard,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

function SuspendCartModal({
  isOpen,
  onClose,
  onConfirm,
  items,
  total,
  discount,
  discountType,
}) {
  const { t, language } = useI18n();
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      // إعداد البيانات لإرسالها للسيرفر
      // نقوم بإرسال هيكلية المنتجات الكاملة المحفوظة بالسلة للمحافظة على البيانات 100% دون نقص
      const payload = {
        items: items,
        total: total,
        discount: discount,
        discount_type: discountType,
        note: note.trim() || null,
      };

      const response = await api.post("/suspended-sales", payload);
      const suspendedSale = response.data.data;

      toast.success(
        `${t("saleSuspended") || "تم تعليق الفاتورة بنجاح"} | ID: ${suspendedSale.suspend_id}`
      );

      // تشغيل تنبيه الاستجابة وإتمام تعليق السلة
      onConfirm(suspendedSale);
      setNote("");
      onClose();
    } catch (err) {
      console.error("Error suspending sale:", err);
      toast.error(
        err.response?.data?.message ||
          t("failedToSuspend") ||
          "تعذر تعليق الفاتورة حالياً"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <form
          onSubmit={handleSubmit}
          className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full border-2 border-amber-500 overflow-hidden transition-all duration-300"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 flex items-center space-x-3 rtl:space-x-reverse text-white">
            <span className="text-2xl">⏸️</span>
            <div>
              <h3 className="text-lg font-bold">
                {t("suspendSale") || "تعليق الفاتورة الحالية"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {t("suspendSaleDesc") || "حفظ سلة المشتريات لاستعادتها لاحقاً للعميل"}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            {/* ملخص السلة */}
            <div className="p-4 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl flex justify-between items-center text-amber-800 dark:text-amber-300 font-semibold text-sm">
              <span>
                {t("itemsToSuspend") || "عدد المنتجات للتعليق"}: {items.length}
              </span>
              <span className="text-lg font-black font-mono">
                {total.toFixed(2)} {t("sar") || "ر.س"}
              </span>
            </div>

            {/* حقل الملاحظة أو اسم العميل */}
            <div className="space-y-2">
              <label className="label flex items-center space-x-1.5 rtl:space-x-reverse text-gray-700 dark:text-gray-300 font-bold">
                <FontAwesomeIcon icon={faKeyboard} className="text-gray-400" />
                <span>{t("suspendNoteLabel") || "ملاحظة أو اسم العميل للتعليق (اختياري):"}</span>
              </label>
              <input
                type="text"
                maxLength="100"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("suspendPlaceholder") || "مثال: زبون السيارة، طاولة 5، ذو القميص الأزرق"}
                disabled={isSubmitting}
                autoFocus
                className="input"
              />
              <span className="text-[10px] text-gray-400 block mt-1">
                {t("suspendNoteHelp") || "تساعدك هذه الملاحظة على تمييز الفاتورة بسرعة بين الفواتير المعلقة الأخرى في الطابور."}
              </span>
            </div>

            {/* الأزرار */}
            <div className="flex space-x-3 rtl:space-x-reverse border-t border-gray-200 dark:border-gray-700 pt-4">
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0}
                className="flex-1 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 font-bold transition-all shadow-md flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                {isSubmitting ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faPause} />
                )}
                <span>{t("suspend") || "تعليق السلة"}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="py-3 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SuspendCartModal;
