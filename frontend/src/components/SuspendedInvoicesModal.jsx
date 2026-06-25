import { useState, useEffect } from "react";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFolderOpen,
  faPlay,
  faTrash,
  faClock,
  faExclamationTriangle,
  faSpinner,
  faSync,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

function SuspendedInvoicesModal({
  isOpen,
  onClose,
  onRestore,
  onDeleteSuccess,
  currentCartItemCount,
}) {
  const { t } = useI18n();
  const [suspendedSales, setSuspendedSales] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // لحفظ المعاملة النشطة لاستعادتها إذا تطلب الأمر تأكيد إفراغ السلة
  const [confirmTarget, setConfirmTarget] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuspendedSales();
      setConfirmTarget(null);
    }
  }, [isOpen]);

  const fetchSuspendedSales = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/suspended-sales");
      setSuspendedSales(response.data.data || []);
    } catch (err) {
      console.error("Error fetching suspended sales:", err);
      toast.error("تعذر تحميل قائمة الفواتير المعلقة");
    } finally {
      setIsLoading(false);
    }
  };

  // حذف فاتورة معلقة نهائياً
  const handleDelete = async (id) => {
    if (isProcessing) return;
    if (!window.confirm("هل أنت متأكد من رغبتك في حذف هذه الفاتورة المعلقة نهائياً؟")) return;

    setIsProcessing(true);
    try {
      await api.delete(`/suspended-sales/${id}`);
      setSuspendedSales((prev) => prev.filter((sale) => sale.id !== id));
      if (onDeleteSuccess) onDeleteSuccess();
      toast.success("تم حذف الفاتورة المعلقة بنجاح");
    } catch (err) {
      console.error("Error deleting suspended sale:", err);
      toast.error("تعذر حذف الفاتورة المعلقة");
    } finally {
      setIsProcessing(false);
    }
  };

  // استعادة الفاتورة المعلقة
  const handleResume = async (sale) => {
    if (isProcessing) return;

    // إذا كانت السلة الحالية تحتوي على منتجات، يجب التحذير قبل الاستعادة
    if (currentCartItemCount > 0) {
      setConfirmTarget(sale);
      return;
    }

    executeResume(sale);
  };

  const executeResume = async (sale) => {
    setIsProcessing(true);
    try {
      // 1. حذفها من السيرفر لأنها أصبحت نشطة بالسلة
      await api.delete(`/suspended-sales/${sale.id}`);
      
      // 2. تحديث السلة والخصومات في واجهة المحاسب
      onRestore(sale);
      
      toast.success(`تمت استعادة الفاتورة المعلقة ${sale.suspend_id} بنجاح`);
      onClose();
    } catch (err) {
      console.error("Error resuming sale:", err);
      toast.error("حدث خطأ أثناء استعادة الفاتورة");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={() => {
          if (!isProcessing) onClose();
        }}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-primary-500 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <span className="text-2xl">📂</span>
              <div>
                <h3 className="text-lg font-bold">
                  {t("suspendedSales") || "قائمة الفواتير المعلقة والانتظار"}
                </h3>
                <p className="text-xs opacity-90 mt-0.5">
                  استرجاع أو إدارة الفواتير المعلقة مؤقتاً لتخفيف الازدحام
                </p>
              </div>
            </div>
            
            <button
              onClick={fetchSuspendedSales}
              disabled={isLoading || isProcessing}
              className="p-2 hover:bg-white/10 rounded-full text-white/95 hover:text-white transition-all active:scale-95"
              title="تحديث القائمة"
            >
              <FontAwesomeIcon icon={faSync} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            
            {/* واجهة تحذير تأكيد إفراغ السلة الحالية */}
            {confirmTarget && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-500/40 rounded-2xl space-y-3 animate-fade-in">
                <div className="flex items-start space-x-2.5 rtl:space-x-reverse text-amber-800 dark:text-amber-300">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-xl mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">تأكيد استبدال سلة المشتريات الحالية!</h4>
                    <p className="text-xs mt-1 leading-relaxed">
                      السلة الحالية تحتوي على <strong>{currentCartItemCount} منتجات</strong>. عند استعادة الفاتورة المعلقة ({confirmTarget.suspend_id})، سيتم **إفراغ المنتجات الحالية بالكامل** واستبدالها بالمنتجات المعلقة. هل تريد الاستمرار؟
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 rtl:space-x-reverse justify-end">
                  <button
                    onClick={() => {
                      executeResume(confirmTarget);
                      setConfirmTarget(null);
                    }}
                    className="py-1.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all"
                  >
                    نعم، أفرغ واسترجع المعلقة
                  </button>
                  <button
                    onClick={() => setConfirmTarget(null)}
                    className="py-1.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition-all"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            )}

            {/* محتوى الجدول والتحميل */}
            {isLoading ? (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-primary-500" />
                <p className="text-xs font-semibold mt-3">جاري تحميل الفواتير المعلقة...</p>
              </div>
            ) : suspendedSales.length === 0 ? (
              <div className="py-16 text-center text-gray-400 dark:text-gray-500 space-y-3">
                <FontAwesomeIcon icon={faFolderOpen} className="text-5xl opacity-40" />
                <p className="text-sm font-semibold">لا توجد أي فواتير معلقة حالياً.</p>
                <p className="text-xs text-gray-400/80">عند تعليق فواتير العملاء ستظهر هنا لمتابعتها لاحقاً.</p>
              </div>
            ) : (
              <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/10 max-h-[300px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-right rtl">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">معرف التعليق</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase">العميل / الملاحظة</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase text-center">المنتجات</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase text-left">الإجمالي</th>
                      <th className="px-4 py-2.5 text-xs font-bold text-gray-500 uppercase text-center w-24">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {suspendedSales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-bold text-primary-600 dark:text-primary-400 font-mono">
                          {sale.suspend_id}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {sale.note || <span className="text-gray-400 italic">بدون ملاحظة</span>}
                        </td>
                        <td className="px-4 py-3 text-xs font-bold text-gray-700 dark:text-gray-300 text-center">
                          {sale.items?.length || 0}
                        </td>
                        <td className="px-4 py-3 text-xs font-black text-gray-900 dark:text-white font-mono text-left">
                          {parseFloat(sale.total).toFixed(2)} ر.س
                        </td>
                        <td className="px-4 py-3 text-center flex justify-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleResume(sale)}
                            disabled={isProcessing}
                            className="p-1.5 bg-green-50 hover:bg-green-100 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center space-x-1 rtl:space-x-reverse"
                            title="استعادة الفاتورة"
                          >
                            <FontAwesomeIcon icon={faPlay} className="text-[10px]" />
                            <span>استعادة</span>
                          </button>
                          <button
                            onClick={() => handleDelete(sale.id)}
                            disabled={isProcessing}
                            className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-500 dark:text-red-400 rounded-lg text-xs transition-all active:scale-95 disabled:opacity-50"
                            title="حذف نهائي"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* الأزرار السفلية */}
            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="py-2.5 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all text-sm"
              >
                {t("close") || "إغلاق"}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default SuspendedInvoicesModal;
