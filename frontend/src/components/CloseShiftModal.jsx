import { useState, useEffect } from "react";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faMoneyBillWave,
  faCreditCard,
  faTriangleExclamation,
  faCircleCheck,
  faFileCircleCheck,
  faCalculator,
  faCircleNotch,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

export default function CloseShiftModal({ isOpen, onClose, onShiftClosed, isForceClose = false }) {
  const { t, language } = useI18n();

  // States
  const [step, setStep] = useState(1); // 1: Declare Actuals, 2: Reconcile & Justification
  const [loading, setLoading] = useState(false);
  const [checkingPreconditions, setCheckingPreconditions] = useState(true);
  const [hasSuspendedSales, setHasSuspendedSales] = useState(false);

  // Inputs
  const [actualCash, setActualCash] = useState("");
  const [actualCard, setActualCard] = useState("");
  const [notes, setNotes] = useState("");

  // Reconciliation Data from Backend
  const [reconData, setReconData] = useState(null);

  // Load active shift details & verify suspended sales
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setActualCash("");
      setActualCard("");
      setNotes("");
      setReconData(null);
      verifyPreconditions();
    }
  }, [isOpen]);

  const verifyPreconditions = async () => {
    setCheckingPreconditions(true);
    try {
      const response = await api.get("/shifts/active-reconciliation");
      setReconData(response.data);
      setHasSuspendedSales(response.data.has_suspended_sales);
    } catch (error) {
      console.error("Error loading reconciliation details:", error);
      toast.error(
        language === "ar"
          ? "فشل تحميل تفاصيل الوردية النشطة."
          : "Failed to load active shift details."
      );
      if (!isForceClose) {
        onClose();
      }
    } finally {
      setCheckingPreconditions(false);
    }
  };

  if (!isOpen) return null;

  // Handle "Reconcile" click
  const handleReconcile = () => {
    const cash = parseFloat(actualCash);
    const card = parseFloat(actualCard);

    if (isNaN(cash) || cash < 0 || isNaN(card) || card < 0) {
      toast.error(
        language === "ar"
          ? "يرجى إدخال قيم عددية صحيحة أكبر من أو تساوي الصفر."
          : "Please enter valid numeric values greater than or equal to zero."
      );
      return;
    }

    setStep(2);
  };

  // Submit and Close Shift
  const handleConfirmClose = async () => {
    setLoading(true);
    try {
      const response = await api.post("/shifts/end", {
        actual_cash: parseFloat(actualCash),
        actual_card: parseFloat(actualCard),
        notes: notes.trim(),
      });

      toast.success(
        language === "ar" ? "تم إقفال الوردية بنجاح!" : "Shift ended successfully!"
      );
      onClose();
      
      if (onShiftClosed && response.data?.shift?.id) {
        onShiftClosed(response.data.shift.id);
      }
    } catch (error) {
      console.error("Error ending shift:", error);
      toast.error(
        error.response?.data?.message ||
          (language === "ar" ? "فشل إغلاق الوردية." : "Failed to end shift.")
      );
    } finally {
      setLoading(false);
    }
  };

  // Reconciliation Mathematics
  const expectedCash = reconData ? parseFloat(reconData.expected_cash) : 0;
  const expectedCard = reconData ? parseFloat(reconData.expected_card) : 0;
  const declaredCash = parseFloat(actualCash) || 0;
  const declaredCard = parseFloat(actualCard) || 0;

  const cashDiff = declaredCash - expectedCash;
  const cardDiff = declaredCard - expectedCard;
  const totalDiff = (declaredCash + declaredCard) - (expectedCash + expectedCard);
  const hasDifference = Math.abs(cashDiff) >= 0.01 || Math.abs(cardDiff) >= 0.01;

  // Verification if notes are provided when a difference exists
  const isCloseBtnDisabled = hasDifference && !notes.trim();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity"
        onClick={isForceClose ? null : onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-150 dark:border-gray-750 animate-scaleUp mx-4">
        
        {/* Header (Premium Gradient) */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <FontAwesomeIcon icon={faFileCircleCheck} className="text-xl" />
            <h3 className="text-base font-bold">
              {t("closeShift") || "إغلاق الوردية وتسوية العهدة"}
            </h3>
          </div>
          {!isForceClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {isForceClose && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-lg mt-0.5 flex-shrink-0" />
              <div>
                <h5 className="font-bold text-xs">
                  {t("forceShiftClosing") || "وردية منتهية الصلاحية (إغلاق إجباري)"}
                </h5>
                <p className="text-[10px] leading-relaxed font-semibold mt-1">
                  {t("shiftDurationLimit") || "لقد مر أكثر من 12 ساعة على فتح الوردية النشطة وهي منتهية الصلاحية الآن. يجب إقفال الوردية وتسوية الحساب قبل المتابعة."}
                </p>
              </div>
            </div>
          )}

          {checkingPreconditions ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-3xl text-primary-500" />
              <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {language === "ar" ? "جاري التحقق من حالة الوردية والمبيعات المعلقة..." : "Verifying shift status and suspended sales..."}
              </p>
            </div>
          ) : hasSuspendedSales ? (
            <div className="space-y-4 py-4 text-center">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-955/20 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">
                <FontAwesomeIcon icon={faTriangleExclamation} />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black text-gray-900 dark:text-white">
                  {language === "ar" ? "توجد فواتير معلقة!" : "Suspended Invoices Exist!"}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
                  {t("suspendedInvoicesWarning") || "لا يمكن إغلاق الوردية، يرجى إنهاء أو إلغاء الفواتير المعلقة أولاً قبل المتابعة."}
                </p>
              </div>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="btn btn-secondary px-6 py-2 rounded-xl text-xs font-bold"
                >
                  {language === "ar" ? "العودة للعمل" : "Back to Sales"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Step Title */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse border-b border-gray-100 dark:border-gray-700 pb-3">
                <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center font-bold text-xs">
                  {step}
                </span>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {step === 1 ? t("step1DeclareActuals") : t("step2VerifyReconciliation")}
                </span>
              </div>

              {/* STEP 1: BLIND DECLARATION */}
              {step === 1 && (
                <div className="space-y-5">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
                    {language === "ar" 
                      ? "الدفع الأعمى: يرجى كتابة العهدة النقدية الفعلية بداخل درج الكاشير، ومجموع الإيرادات بماكينات البنك. لن يتم كشف الحساب المتوقع إلا بعد التسوية لضمان النزاهة."
                      : "Blind close: please enter the actual cash float in your drawer and card terminal receipts. Expected totals will only be revealed after reconciliation for audit integrity."}
                  </p>

                  <div className="space-y-4">
                    {/* Actual Cash Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center space-x-1.5 rtl:space-x-reverse">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                        <span>{t("actualCash") || "النقد الفعلي بالدرج"} (Cash) <span className="text-red-500">*</span></span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0.00"
                          value={actualCash}
                          onChange={(e) => setActualCash(e.target.value)}
                          className="input py-3 pl-3 pr-10 text-base font-mono w-full focus:ring-2 focus:ring-primary-500 font-bold"
                        />
                        <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold">ر.س</span>
                      </div>
                    </div>

                    {/* Actual Card Input */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center space-x-1.5 rtl:space-x-reverse">
                        <FontAwesomeIcon icon={faCreditCard} className="text-blue-500" />
                        <span>{t("actualCard") || "شبكة الدفع الفعلية"} (Card) <span className="text-red-500">*</span></span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="0.00"
                          value={actualCard}
                          onChange={(e) => setActualCard(e.target.value)}
                          className="input py-3 pl-3 pr-10 text-base font-mono w-full focus:ring-2 focus:ring-primary-500 font-bold"
                        />
                        <span className="absolute right-3 top-3.5 text-xs text-gray-400 font-bold">ر.س</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 space-x-3 rtl:space-x-reverse">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn btn-secondary px-6 py-2.5 rounded-xl text-xs font-bold"
                    >
                      {language === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReconcile}
                      disabled={actualCash === "" || actualCard === ""}
                      className="btn btn-primary px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faCalculator} />
                      <span>{t("reconcile") || "تسوية ومقارنة"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: RECONCILIATION & JUSTIFICATION */}
              {step === 2 && (
                <div className="space-y-5">
                  {/* Financial Reconciliation Card */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-700 rounded-2xl space-y-4">
                    
                    {/* Expected vs Actual Cash */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-600 dark:text-gray-400">💵 {t("actualCash") || "النقد الفعلي بالدرج"} (كاش):</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {declaredCash.toFixed(2)} / {expectedCash.toFixed(2)} ر.س
                        </span>
                      </div>
                      
                      {/* Detailed Math Breakdown */}
                      <div className="text-[10px] space-y-1 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-150 dark:border-gray-700 pb-1">
                          💵 {language === "ar" ? "معادلة احتساب النقد المتوقع:" : "Expected Cash Equation:"}
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>{language === "ar" ? "العهدة الافتتاحية:" : "Opening Float:"}</span>
                          <span className="font-mono">{parseFloat(reconData?.opening_float || 0).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                          <span>{language === "ar" ? "+ مبيعات النقد (كاش):" : "+ Cash Sales:"}</span>
                          <span className="font-mono">+{parseFloat(reconData?.cash_sales || 0).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between text-red-500 dark:text-red-400 font-semibold">
                          <span>{language === "ar" ? "- مرتجعات النقد (كاش):" : "- Cash Returns:"}</span>
                          <span className="font-mono">-{parseFloat(reconData?.cash_returns || 0).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 border-t border-gray-150 dark:border-gray-700 text-gray-900 dark:text-white">
                          <span>{language === "ar" ? "= الصافي المتوقع (كاش):" : "= Net Expected Cash:"}</span>
                          <span className="font-mono">{expectedCash.toFixed(2)} ر.س</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <span className="text-gray-500">{language === "ar" ? "فارق الكاش المتوقع:" : "Expected cash difference:"}</span>
                        <span className={`font-mono ${cashDiff < 0 ? "text-red-600" : cashDiff > 0 ? "text-amber-600" : "text-green-600"}`}>
                          {cashDiff > 0 ? "+" : ""}{cashDiff.toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-800" />

                    {/* Expected vs Actual Card */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-gray-600 dark:text-gray-400">💳 {t("actualCard") || "شبكة الدفع الفعلية"} (فيزا):</span>
                        <span className="font-mono text-gray-900 dark:text-white">
                          {declaredCard.toFixed(2)} / {expectedCard.toFixed(2)} ر.س
                        </span>
                      </div>

                      {/* Detailed Card Math Breakdown */}
                      <div className="text-[10px] space-y-1 bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="font-bold text-gray-700 dark:text-gray-300 border-b border-gray-150 dark:border-gray-700 pb-1">
                          💳 {language === "ar" ? "معادلة احتساب الشبكة المتوقعة:" : "Expected Card Equation:"}
                        </div>
                        <div className="flex justify-between text-green-600 dark:text-green-400 font-semibold">
                          <span>{language === "ar" ? "+ مبيعات الشبكة (فيزا):" : "+ Card Sales:"}</span>
                          <span className="font-mono">+{parseFloat(reconData?.card_sales || 0).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between text-red-500 dark:text-red-400 font-semibold">
                          <span>{language === "ar" ? "- مرتجعات الشبكة (فيزا):" : "- Card Returns:"}</span>
                          <span className="font-mono">-{parseFloat(reconData?.card_returns || 0).toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 border-t border-gray-150 dark:border-gray-700 text-gray-900 dark:text-white">
                          <span>{language === "ar" ? "= الصافي المتوقع (شبكة):" : "= Net Expected Card:"}</span>
                          <span className="font-mono">{expectedCard.toFixed(2)} ر.س</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] font-semibold">
                        <span className="text-gray-500">{language === "ar" ? "فارق الشبكة المتوقع:" : "Expected card difference:"}</span>
                        <span className={`font-mono ${cardDiff < 0 ? "text-red-600" : cardDiff > 0 ? "text-amber-600" : "text-green-600"}`}>
                          {cardDiff > 0 ? "+" : ""}{cardDiff.toFixed(2)} ر.س
                        </span>
                      </div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-800" />

                    {/* Total Difference & Match status */}
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                        {t("difference") || "إجمالي الفارق:"}
                      </span>
                      <span className={`text-base font-black font-mono ${totalDiff < -0.01 ? "text-red-600" : totalDiff > 0.01 ? "text-amber-600" : "text-green-600"}`}>
                        {totalDiff > 0 ? "+" : ""}{totalDiff.toFixed(2)} ر.س
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center pt-2">
                      {!hasDifference ? (
                        <div className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30 rounded-full text-[10px] font-black uppercase">
                          <FontAwesomeIcon icon={faCircleCheck} />
                          <span>{t("matched") || "متطابق تماماً"}</span>
                        </div>
                      ) : totalDiff < 0 ? (
                        <div className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1 bg-red-50 dark:bg-red-955/25 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded-full text-[10px] font-black uppercase">
                          <FontAwesomeIcon icon={faTriangleExclamation} />
                          <span>{t("shortage") || "عجز مالي بالعهدة"}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1 bg-amber-50 dark:bg-amber-955/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 rounded-full text-[10px] font-black uppercase">
                          <FontAwesomeIcon icon={faTriangleExclamation} />
                          <span>{t("overage") || "زيادة مالية بالعهدة"}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mandatory Justification Area if Difference Exists */}
                  {hasDifference && (
                    <div className="space-y-2 animate-fadeIn">
                      <label className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center space-x-1.5 rtl:space-x-reverse">
                        <FontAwesomeIcon icon={faTriangleExclamation} />
                        <span>{t("justificationNotes") || "تبرير الفروقات / ملاحظات"} <span className="text-red-500">*</span></span>
                      </label>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold leading-relaxed">
                        {language === "ar"
                          ? "تم الكشف عن وجود فارق في العهدة النقدية أو الشبكة. يجب عليك إدخال تبرير رسمي أو توضيح سبب الفارق قبل السماح بإقفال الوردية وإخلاء الطرف."
                          : "A difference in shift totals has been detected. You must enter a formal justification/notes explaining the mismatch before closing your shift."}
                      </p>
                      <textarea
                        required
                        rows="3"
                        placeholder={t("justificationPlaceholder") || "أدخل تبرير الفارق هنا..."}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="textarea w-full text-xs font-semibold focus:ring-2 focus:ring-primary-500 rounded-xl"
                      ></textarea>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => setStep(1)}
                      className="btn btn-secondary px-5 py-2.5 rounded-xl text-xs font-bold"
                    >
                      {language === "ar" ? "تعديل المبالغ" : "Modify Amounts"}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleConfirmClose}
                      disabled={loading || isCloseBtnDisabled}
                      className="btn btn-danger px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 rtl:space-x-reverse disabled:opacity-40 shadow-md shadow-red-500/10 hover:shadow-lg"
                    >
                      {loading ? (
                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                      ) : (
                        <FontAwesomeIcon icon={faPrint} />
                      )}
                      <span>{t("confirmCloseShift") || "تأكيد وإغلاق الوردية"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
