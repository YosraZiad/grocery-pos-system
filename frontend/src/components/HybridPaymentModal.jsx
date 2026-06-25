import { useState, useEffect, useRef } from "react";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faMoneyBillWave,
  faCircleNotch,
  faWifi,
  faTrash,
  faPlus,
  faLock,
  faCheckCircle,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

// نغمات الصوت عبر Web Audio API
const playSound = (type) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (type === "success") {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      osc1.type = "sine";
      osc2.type = "sine";
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      osc1.frequency.setValueAtTime(1500, audioCtx.currentTime);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.08);
      setTimeout(() => {
        osc2.frequency.setValueAtTime(2000, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.18);
      }, 80);
    } else if (type === "error") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }
  } catch (e) {
    console.error("Audio Context beep failed:", e);
  }
};

function HybridPaymentModal({ isOpen, onClose, onConfirm, totalDue }) {
  const { t } = useI18n();
  
  // المدفوعات المضافة حالياً
  const [payments, setPayments] = useState([]);
  
  // مدخلات الكاش والبطاقة
  const [cashInput, setCashInput] = useState("");
  const [cardInput, setCardInput] = useState("");
  
  // حالة الماكينة الشبكية لدفعات البطاقة
  const [isTerminalActive, setIsTerminalActive] = useState(false);
  const [terminalStatus, setTerminalStatus] = useState("idle"); // idle, connecting, waiting_for_card, processing, approved, declined, timeout
  const [errorMessage, setErrorMessage] = useState("");
  
  const pollingIntervalRef = useRef(null);

  // حساب المبالغ
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = totalDue - totalPaid;
  const changeAmount = Math.max(0, totalPaid - totalDue);

  // تهيئة المدخلات عند فتح المودال
  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setCashInput("");
      setCardInput(totalDue.toFixed(2));
      setIsTerminalActive(false);
      setTerminalStatus("idle");
      setErrorMessage("");
    }
    return () => {
      stopPolling();
    };
  }, [isOpen, totalDue]);

  // تحديث مدخل الكارت تلقائياً ليعكس المتبقي طالما لم يتم إدخال قيمة يدوية مغايرة
  useEffect(() => {
    if (remaining > 0) {
      setCardInput(remaining.toFixed(2));
    } else {
      setCardInput("");
    }
  }, [remaining]);

  // إيقاف إغلاق النافذة بزر Escape أثناء معالجة البطاقة
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (!isTerminalActive) {
          handleClose();
        } else {
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isTerminalActive]);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // إضافة مبلغ نقدي
  const handleAddCash = () => {
    const amount = parseFloat(cashInput);
    if (isNaN(amount) || amount <= 0) return;

    setPayments((prev) => [...prev, { method: "cash", amount }]);
    setCashInput("");
  };

  // أزرار الكاش السريعة
  const handleQuickCash = (value) => {
    setCashInput((prev) => {
      const current = parseFloat(prev) || 0;
      return (current + value).toString();
    });
  };

  // بدء عملية سحب الكارت متكاملة مع الماكينة الشبكية
  const handleChargeCard = async () => {
    const amount = parseFloat(cardInput);
    if (isNaN(amount) || amount <= 0) return;

    setIsTerminalActive(true);
    setTerminalStatus("connecting");
    setErrorMessage("");

    try {
      // 1. إرسال قيمة البطاقة للماكينة
      await api.post("/terminal/charge", { amount });
      setTerminalStatus("waiting_for_card");

      // 2. بدء الفحص الدوري كل 1 ثانية
      pollingIntervalRef.current = setInterval(() => checkTerminalStatus(amount), 1000);
    } catch (err) {
      console.error("Failed to connect terminal:", err);
      setErrorMessage("تعذر الاتصال بماكينة الدفع. يرجى التحقق من الشبكة.");
      setTerminalStatus("timeout");
      setIsTerminalActive(false);
      playSound("error");
    }
  };

  // فحص حالة السيرفر أثناء السحب
  const checkTerminalStatus = async (chargeAmount) => {
    try {
      const response = await api.get("/terminal/status");
      const { status: serverStatus } = response.data;

      setTerminalStatus(serverStatus);

      if (serverStatus === "approved") {
        stopPolling();
        playSound("success");
        setPayments((prev) => [...prev, { method: "card", amount: chargeAmount }]);
        setIsTerminalActive(false);
        setTerminalStatus("idle");
      } else if (serverStatus === "declined") {
        stopPolling();
        playSound("error");
        setErrorMessage("تم رفض العملية من البنك (الرصيد غير كافٍ).");
        setIsTerminalActive(false);
      } else if (serverStatus === "timeout") {
        stopPolling();
        playSound("error");
        setErrorMessage("انتهت مهلة إدخال الكارت في الماكينة الشبكية.");
        setIsTerminalActive(false);
      }
    } catch (err) {
      console.error("Error polling terminal status:", err);
    }
  };

  // حذف دفعة مضافة
  const handleDeletePayment = (index) => {
    if (isTerminalActive) return;
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  // إغلاق المودال وتصفير الماكينة بالخلفية
  const handleClose = async () => {
    if (isTerminalActive) return;
    stopPolling();
    try {
      await api.post("/terminal/reset");
    } catch (e) {}
    onClose();
  };

  // حفظ الفاتورة وإرسال البيانات للـ Cart
  const handleCompleteSale = () => {
    if (remaining > 0 || isTerminalActive) return;
    onConfirm(totalPaid, changeAmount, payments);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-primary-500 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex justify-between items-center text-white">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <span className="text-2xl">💰</span>
              <div>
                <h3 className="text-xl font-bold">الدفع المختلط (المقسم) | Split Payment</h3>
                <p className="text-xs opacity-90 mt-0.5">تقسيم قيمة الفاتورة على عدة طرق دفع مختلفة</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            
            {/* مؤشرات المبالغ */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                <span className="text-xs text-gray-500 font-bold block mb-1">المبلغ المطلوب</span>
                <span className="text-xl font-black text-gray-900 dark:text-white font-mono">{totalDue.toFixed(2)} ر.س</span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                <span className="text-xs text-gray-500 font-bold block mb-1">تم دفعه</span>
                <span className="text-xl font-black text-green-600 dark:text-green-400 font-mono">{totalPaid.toFixed(2)} ر.س</span>
              </div>

              {remaining > 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 text-center animate-pulse">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block mb-1">المتبقي المطلوب</span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{remaining.toFixed(2)} ر.س</span>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-2xl border border-green-200 dark:border-green-900/30 text-center">
                  <span className="text-xs text-green-600 dark:text-green-400 font-bold block mb-1">
                    {changeAmount > 0 ? "المتبقي للعميل" : "حالة الدفع"}
                  </span>
                  <span className="text-xl font-black text-green-600 dark:text-green-400 font-mono">
                    {changeAmount > 0 ? `${changeAmount.toFixed(2)} ر.س` : "مدفوع بالكامل"}
                  </span>
                </div>
              )}
            </div>

            {/* صفحة المدخلات مقسمة لبطاقتين: كاش وبطاقة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* بطاقة الدفع النقدي */}
              <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2 rtl:space-x-reverse">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                  <span>💵 الدفع النقدي (Cash)</span>
                </h4>
                
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="المبلغ نقداً"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    disabled={isTerminalActive || remaining <= 0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCash();
                    }}
                    className="flex-1 input"
                  />
                  <button
                    onClick={handleAddCash}
                    disabled={isTerminalActive || remaining <= 0 || !cashInput}
                    className="btn-primary py-2 px-4 flex items-center space-x-1 rtl:space-x-reverse"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>إضافة</span>
                  </button>
                </div>

                {/* أزرار سريعة للفئات */}
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {[10, 50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={isTerminalActive || remaining <= 0}
                      onClick={() => handleQuickCash(val)}
                      className="py-1.5 px-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* بطاقة الدفع بالبطاقة والشبكة */}
              <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2 rtl:space-x-reverse">
                  <FontAwesomeIcon icon={faCreditCard} className="text-blue-500" />
                  <span>💳 الدفع بالبطاقة (Card)</span>
                </h4>
                
                <div className="space-y-3">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="المبلغ بالبطاقة"
                      value={cardInput}
                      onChange={(e) => setCardInput(e.target.value)}
                      disabled={isTerminalActive || remaining <= 0}
                      className="flex-1 input font-mono font-bold"
                    />
                    <button
                      onClick={handleChargeCard}
                      disabled={isTerminalActive || remaining <= 0 || !cardInput || parseFloat(cardInput) <= 0}
                      className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 flex items-center space-x-1.5 rtl:space-x-reverse"
                    >
                      <FontAwesomeIcon icon={faWifi} className="rotate-90" />
                      <span>سحب</span>
                    </button>
                  </div>

                  {/* شاشة اتصال للشبكة */}
                  {isTerminalActive && (
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-xl text-center space-y-2 animate-pulse">
                      <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse text-indigo-700 dark:text-indigo-400 font-bold text-xs">
                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-sm" />
                        <span>
                          {terminalStatus === "connecting" && "جاري الاتصال بالماكينة..."}
                          {terminalStatus === "waiting_for_card" && "يرجى تمرير البطاقة على الماكينة..."}
                          {terminalStatus === "processing" && "جاري التحقق من البنك..."}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-medium">
                        المبلغ المرسل: {parseFloat(cardInput).toFixed(2)} ر.س
                      </span>
                    </div>
                  )}

                  {/* رسائل الخطأ للبطاقة */}
                  {errorMessage && !isTerminalActive && (
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-xs flex items-center space-x-2 rtl:space-x-reverse font-semibold">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* قائمة الدفعات المضافة */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">المدفوعات المضافة:</h4>
              
              {payments.length === 0 ? (
                <div className="p-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 text-xs font-semibold">
                  لا توجد دفعات مضافة حتى الآن. يرجى إضافة مبالغ نقدية أو تمرير الكارت لتسوية الحساب.
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/20 max-h-[160px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">وسيلة الدفع</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">المبلغ</th>
                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase w-16">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                            {p.method === "cash" ? "💵 نقدي (Cash)" : "💳 بطاقة (Card)"}
                          </td>
                          <td className="px-4 py-2 text-xs font-black text-gray-900 dark:text-white font-mono text-left">
                            {p.amount.toFixed(2)} ر.س
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(idx)}
                              disabled={isTerminalActive}
                              className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                              title="حذف هذه الدفعة"
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
            </div>

            {/* أزرار الحفظ والإغلاق */}
            <div className="flex space-x-3 rtl:space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={remaining > 0 || isTerminalActive}
                className="flex-1 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-all shadow-md flex items-center justify-center space-x-2 rtl:space-x-reverse"
              >
                <FontAwesomeIcon icon={faCheckCircle} />
                <span>إتمام المعاملة وحفظ الفاتورة</span>
              </button>
              
              <button
                type="button"
                onClick={handleClose}
                disabled={isTerminalActive}
                className="py-3.5 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {t("cancel") || "إلغاء"}
              </button>
            </div>

            {isTerminalActive && (
              <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center flex items-center justify-center space-x-1.5 rtl:space-x-reverse">
                <FontAwesomeIcon icon={faLock} />
                <span>🔒 النظام مغلق مالياً لحين اكتمال عملية التحقق من البطاقة الشبكية</span>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default HybridPaymentModal;
