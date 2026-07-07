import { useState, useEffect, useRef } from "react";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import toast from "react-hot-toast";
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
  faUser,
  faBuildingColumns,
  faWallet,
  faXmark,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import CustomerSelector from "./CustomerSelector";

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
  const { t, language } = useI18n();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // حقل البحث بفاتورة المرتجع
  const [returnSearchQuery, setReturnSearchQuery] = useState("");
  const [isSearchingReturn, setIsSearchingReturn] = useState(false);
  const [foundReturnBalance, setFoundReturnBalance] = useState(null);
  const [foundVoucherCode, setFoundVoucherCode] = useState(null);

  // المدفوعات المضافة حالياً
  const [payments, setPayments] = useState([]);
  
  // مدخلات الكاش والبطاقة والحساب والتحويل
  const [cashInput, setCashInput] = useState("");
  const [cardInput, setCardInput] = useState("");
  const [transferInput, setTransferInput] = useState("");
  const [accountInput, setAccountInput] = useState("");
  
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
      setSelectedCustomer(null);
      setPayments([]);
      setCashInput("");
      setCardInput(totalDue.toFixed(2));
      setTransferInput(totalDue.toFixed(2));
      setAccountInput("");
      setReturnSearchQuery("");
      setIsSearchingReturn(false);
      setFoundReturnBalance(null);
      setFoundVoucherCode(null);
      setIsTerminalActive(false);
      setTerminalStatus("idle");
      setErrorMessage("");
    }
    return () => {
      stopPolling();
    };
  }, [isOpen, totalDue]);

  // تحديث مدخل الكارت والحساب والتحويل تلقائياً ليعكس المتبقي طالما لم يتم إدخال قيمة يدوية مغايرة
  useEffect(() => {
    if (remaining > 0) {
      setCardInput(remaining.toFixed(2));
      setTransferInput(remaining.toFixed(2));
      if (selectedCustomer && selectedCustomer.balance) {
        const availableDeduction = Math.min(remaining, parseFloat(selectedCustomer.balance));
        setAccountInput(availableDeduction.toFixed(2));
      } else {
        setAccountInput("");
      }
    } else {
      setCardInput("");
      setTransferInput("");
      setAccountInput("");
    }
  }, [remaining, selectedCustomer]);

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

  // البحث عن رصيد فاتورة المرتجع أو رمز السند والتحقق منه
  const handleSearchReturnInvoice = async () => {
    const trimmed = returnSearchQuery.trim();
    if (!trimmed) return;

    setIsSearchingReturn(true);
    setFoundReturnBalance(null);
    setFoundVoucherCode(null);
    try {
      const response = await api.get(`/vouchers/verify-balance?query=${trimmed}`);
      if (response.data?.success && response.data?.data) {
        const voucherData = response.data.data;
        
        // التحقق من عدم إضافة السند مسبقاً في قائمة الدفعات
        const isAlreadyAdded = payments.some(p => p.voucher_code === voucherData.code);
        if (isAlreadyAdded) {
          toast.error(language === "ar" ? "هذا السند مضاف بالفعل في قائمة الدفع." : "This voucher is already added to the payment list.");
          return;
        }

        setFoundReturnBalance(voucherData.amount);
        setFoundVoucherCode(voucherData.code);
        
        // ربط العميل صاحب السند تلقائياً بالدفع الهجين وتحويل قيمة الفاتورة لرصيد حسابه
        setSelectedCustomer({
          id: voucherData.customer_id,
          name: voucherData.customer_name,
          phone: voucherData.customer_phone,
          balance: voucherData.amount // تحويل الفلوس اللي في الفاتورة إلى رصيد حساب العميل
        });

        // تعبئة حقل إدخال مبلغ الحساب تلقائياً بالرصيد المتاح من السند لتسهيل الخصم
        const availableDeduction = Math.min(remaining, voucherData.amount);
        setAccountInput(availableDeduction.toFixed(2));

        toast.success(
          language === "ar"
            ? `تم العثور على رصيد مرتجع بقيمة: ${voucherData.amount.toFixed(2)} ر.س وتحويله إلى رصيد الحساب!`
            : `Found returned balance of: ${voucherData.amount.toFixed(2)} SAR and converted it to Account Balance!`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || (language === "ar" ? "لم يتم العثور على رصيد نشط." : "No active balance found."));
    } finally {
      setIsSearchingReturn(false);
    }
  };

  // إضافة الخصم من رصيد حساب العميل
  const handleAddAccount = () => {
    if (!selectedCustomer) {
      toast.error(t("selectCustomerFirst") || "يرجى اختيار عميل مسجل أولاً.");
      return;
    }
    const amount = parseFloat(accountInput);
    if (isNaN(amount) || amount <= 0) return;

    const maxAllowed = parseFloat(selectedCustomer.balance);
    if (amount > maxAllowed) {
      toast.error(
        language === "ar"
          ? `المبلغ المطلوب خصمه (${amount.toFixed(2)} ر.س) أكبر من رصيد العميل المتاح (${maxAllowed.toFixed(2)} ر.س).`
          : `The requested amount (${amount.toFixed(2)} SAR) exceeds the customer's available balance (${maxAllowed.toFixed(2)} SAR).`
      );
      return;
    }

    setPayments((prev) => [...prev, { method: "account", amount, voucher_code: foundVoucherCode }]);
    setAccountInput("");
    setReturnSearchQuery("");
    setFoundReturnBalance(null);
    setFoundVoucherCode(null);
  };

  // إضافة مبلغ الدفع بتحويل بنكي
  const handleAddTransfer = () => {
    const amount = parseFloat(transferInput);
    if (isNaN(amount) || amount <= 0) return;

    setPayments((prev) => [...prev, { method: "transfer", amount }]);
    setTransferInput("");
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
      setErrorMessage(t("terminalConnectionFailed") || (language === "ar" ? "تعذر الاتصال بماكينة الدفع. يرجى التحقق من الشبكة." : "Could not connect to payment terminal. Please check network."));
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
        setErrorMessage(t("transactionDeclinedDesc") || (language === "ar" ? "تم رفض العملية من البنك (الرصيد غير كافٍ)." : "Transaction declined by bank (insufficient balance)."));
        setIsTerminalActive(false);
      } else if (serverStatus === "timeout") {
        stopPolling();
        playSound("error");
        setErrorMessage(t("transactionTimeoutDesc") || (language === "ar" ? "انتهت مهلة إدخال الكارت في الماكينة الشبكية." : "Transaction timeout. Card was not inserted in terminal."));
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
    onConfirm(totalPaid, changeAmount, payments, selectedCustomer ? selectedCustomer.id : null);
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
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full border-2 border-primary-500 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-750">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faWallet} className="text-primary-500 text-xl" />
              <div className="flex flex-col text-start leading-tight">
                <span>{t("hybridPayment")}</span>
                <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                  {language === "ar" ? "تقسيم قيمة الفاتورة على عدة طرق دفع مختلفة" : "Split the invoice total across multiple payment methods"}
                </span>
              </div>
            </h3>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6">
            
            {/* مؤشرات المبالغ */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                <span className="text-xs text-gray-500 font-bold block mb-1">{t("totalAmount") || (language === "ar" ? "المبلغ المطلوب" : "Total Required")}</span>
                <span className="text-xl font-black text-gray-900 dark:text-white font-mono">{totalDue.toFixed(2)} {t("sar") || "ر.س"}</span>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-center">
                <span className="text-xs text-gray-500 font-bold block mb-1">{t("paidAmount") || (language === "ar" ? "تم دفعه" : "Paid Amount")}</span>
                <span className="text-xl font-black text-green-600 dark:text-green-400 font-mono">{totalPaid.toFixed(2)} {t("sar") || "ر.س"}</span>
              </div>

              {remaining > 0 ? (
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/30 text-center animate-pulse">
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-bold block mb-1">{t("remainingDue") || (language === "ar" ? "المتبقي المطلوب" : "Remaining Due")}</span>
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{remaining.toFixed(2)} {t("sar") || "ر.س"}</span>
                </div>
              ) : (
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-2xl border border-green-200 dark:border-green-900/30 text-center">
                  <span className="text-xs text-green-600 dark:text-green-400 font-bold block mb-1">
                    {changeAmount > 0 ? t("changeDue") : (t("paymentStatus") || "حالة الدفع")}
                  </span>
                  <span className="text-xl font-black text-green-600 dark:text-green-400 font-mono">
                    {changeAmount > 0 ? `${changeAmount.toFixed(2)} ${t("sar") || "ر.س"}` : (t("paidInFull") || "مدفوع بالكامل")}
                  </span>
                </div>
              )}
            </div>

            {/* اختيار العميل */}
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              defaultCustomerName={t("defaultHybridCustomer") || "العميل الافتراضي - دفع مختلط"}
            />

            {/* صفحة المدخلات مقسمة لأربع بطاقات: كاش، بطاقة، تحويل، وحساب عميل */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* بطاقة الدفع النقدي */}
              <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2 rtl:space-x-reverse text-xs">
                  <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                  <span>{t("cashPaymentShort") || (language === "ar" ? "💵 الدفع النقدي (Cash)" : "Cash Payment")}</span>
                </h4>
                
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t("amountCash") || (language === "ar" ? "المبلغ نقداً" : "Cash Amount")}
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    disabled={isTerminalActive || remaining <= 0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddCash();
                    }}
                    className="flex-1 input text-sm"
                  />
                  <button
                    onClick={handleAddCash}
                    disabled={isTerminalActive || remaining <= 0 || !cashInput}
                    className="btn-primary py-2 px-3 flex items-center space-x-1 rtl:space-x-reverse text-sm font-bold"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>{t("add") || "إضافة"}</span>
                  </button>
                </div>

                {/* أزرار سريعة للفئات */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  {[10, 50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={isTerminalActive || remaining <= 0}
                      onClick={() => handleQuickCash(val)}
                      className="py-1 px-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 active:scale-95 transition-all"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* بطاقة الدفع بالبطاقة والشبكة */}
              <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2 rtl:space-x-reverse text-xs">
                  <FontAwesomeIcon icon={faCreditCard} className="text-blue-500" />
                  <span>{t("cardPaymentShort") || (language === "ar" ? "💳 الدفع بالبطاقة (Card)" : "Card Payment")}</span>
                </h4>
                
                <div className="space-y-3">
                  <div className="flex space-x-2 rtl:space-x-reverse">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={t("amountCard") || (language === "ar" ? "المبلغ بالبطاقة" : "Card Amount")}
                      value={cardInput}
                      onChange={(e) => setCardInput(e.target.value)}
                      disabled={isTerminalActive || remaining <= 0}
                      className="flex-1 input font-mono font-bold text-sm"
                    />
                    <button
                      onClick={handleChargeCard}
                      disabled={isTerminalActive || remaining <= 0 || !cardInput || parseFloat(cardInput) <= 0}
                      className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 flex items-center space-x-1.5 rtl:space-x-reverse text-sm font-bold"
                    >
                      <FontAwesomeIcon icon={faWifi} className="rotate-90" />
                      <span>{language === "ar" ? "سحب" : "Charge"}</span>
                    </button>
                  </div>

                  {/* شاشة اتصال للشبكة */}
                  {isTerminalActive && (
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/30 rounded-xl text-center space-y-1 animate-pulse">
                      <div className="flex items-center justify-center space-x-1.5 rtl:space-x-reverse text-indigo-700 dark:text-indigo-400 font-bold text-[10px]">
                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-xs" />
                        <span>
                          {terminalStatus === "connecting" && (t("terminalConnecting") || "جاري الاتصال...")}
                          {terminalStatus === "waiting_for_card" && (t("terminalWaiting") || "تمرير البطاقة...")}
                          {terminalStatus === "processing" && (t("terminalProcessing") || "جاري التحقق...")}
                        </span>
                      </div>
                      <span className="text-[9px] text-gray-500 dark:text-gray-400 block font-medium">
                        {t("amount") || "المبلغ"}: {parseFloat(cardInput).toFixed(2)} {t("sar") || "ر.س"}
                      </span>
                    </div>
                  )}

                  {/* رسائل الخطأ للبطاقة */}
                  {errorMessage && !isTerminalActive && (
                    <div className="p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl text-red-700 dark:text-red-400 text-[10px] flex items-center space-x-1.5 rtl:space-x-reverse font-semibold">
                      <FontAwesomeIcon icon={faExclamationTriangle} />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* بطاقة الدفع بتحويل بنكي (Transfer) */}
              <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2 rtl:space-x-reverse text-xs">
                  <FontAwesomeIcon icon={faBuildingColumns} className="text-cyan-500" />
                  <span>{t("transferPaymentShort") || (language === "ar" ? "🏦 تحويل بنكي (Transfer)" : "Bank Transfer")}</span>
                </h4>
                
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder={t("amountTransfer") || (language === "ar" ? "المبلغ المحول" : "Transfer Amount")}
                    value={transferInput}
                    onChange={(e) => setTransferInput(e.target.value)}
                    disabled={isTerminalActive || remaining <= 0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTransfer();
                    }}
                    className="flex-1 input text-sm font-mono font-bold"
                  />
                  <button
                    onClick={handleAddTransfer}
                    disabled={isTerminalActive || remaining <= 0 || !transferInput || parseFloat(transferInput) <= 0}
                    className="btn-primary bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-3 flex items-center space-x-1 rtl:space-x-reverse text-sm font-bold"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>{t("add") || "إضافة"}</span>
                  </button>
                </div>
              </div>

              {/* بطاقة الخصم من الحساب (Account Balance) */}
              <div className="border border-gray-200 dark:border-gray-700 p-5 rounded-2xl bg-slate-50/50 dark:bg-slate-900/20 space-y-4">
                <h4 className="font-bold text-gray-800 dark:text-gray-200 flex items-center space-x-2 rtl:space-x-reverse text-xs">
                  <FontAwesomeIcon icon={faUser} className="text-amber-500" />
                  <span>{t("accountPaymentShort") || (language === "ar" ? "👤 خصم من الحساب (Account)" : "Account Balance")}</span>
                </h4>
                
                {/* حقل البحث بفاتورة المرتجع / رمز السند */}
                <div className="bg-white dark:bg-gray-800/80 p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 block">
                    {language === "ar" ? "البحث برقم فاتورة المرتجع أو رمز السند:" : "Search by Return Invoice or Voucher Code:"}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="RTN-XXXXXXXX-XXXX / VCH-..."
                      value={returnSearchQuery}
                      onChange={(e) => setReturnSearchQuery(e.target.value)}
                      className="input py-1.5 px-3 text-xs flex-1 font-mono focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleSearchReturnInvoice}
                      disabled={isSearchingReturn || !returnSearchQuery.trim()}
                      className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg disabled:opacity-50 transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
                    >
                      {isSearchingReturn ? (
                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-xs" />
                      ) : (
                        <span>{language === "ar" ? "تحقق" : "Verify"}</span>
                      )}
                    </button>
                  </div>
                  
                  {foundReturnBalance !== null && (
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-750 text-xs space-y-2 border border-gray-150 dark:border-gray-700 animate-fadeIn">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400 font-semibold">Paid Amount (رصيد الاسترجاع):</span>
                        <span className="font-extrabold font-mono text-sm text-amber-600 dark:text-amber-400">
                          {foundReturnBalance.toFixed(2)} ر.س
                        </span>
                      </div>
                      <div className="text-[10px] leading-relaxed font-bold border-t border-gray-200 dark:border-gray-700 pt-1.5 mt-1.5">
                        {Math.abs(foundReturnBalance - totalDue) < 0.01 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 block">
                            ✓ قيمة المرتجع (Paid Amount) موازية تماماً لقيمة الفاتورة المطلوبة.
                          </span>
                        ) : foundReturnBalance < totalDue ? (
                          <span className="text-red-500 dark:text-red-400 block">
                            ⚠ قيمة المرتجع (Paid Amount) أقل من قيمة الفاتورة المطلوبة، لسه محتاج إضافة قيمة ثانية بقيمة: {(totalDue - foundReturnBalance).toFixed(2)} ر.س.
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 block">
                            ✓ قيمة المرتجع (Paid Amount) تغطي الفاتورة بالكامل وتزيد بمقدار {(foundReturnBalance - totalDue).toFixed(2)} ر.س.
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {selectedCustomer ? (
                  <div className="space-y-3 bg-white dark:bg-gray-800/40 p-3 rounded-xl border border-gray-150 dark:border-gray-750">
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-bold">
                      <div>{t("customer")}: <strong className="text-gray-900 dark:text-white">{selectedCustomer.name}</strong></div>
                      <div className="mt-1">{t("customerAvailableBalance") || "رصيد الحساب المتاح"}: <strong className="text-amber-600 dark:text-amber-400 font-mono">{parseFloat(selectedCustomer.balance).toFixed(2)} {t("sar") || "ر.س"}</strong></div>
                    </div>
                    
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={t("amountAccount") || (language === "ar" ? "خصم من الحساب" : "Account Deduct")}
                        value={accountInput}
                        onChange={(e) => setAccountInput(e.target.value)}
                        disabled={isTerminalActive || remaining <= 0 || parseFloat(selectedCustomer.balance) <= 0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddAccount();
                        }}
                        className="flex-1 input text-sm font-bold font-mono"
                      />
                      <button
                        onClick={handleAddAccount}
                        disabled={isTerminalActive || remaining <= 0 || !accountInput || parseFloat(accountInput) <= 0 || parseFloat(accountInput) > parseFloat(selectedCustomer.balance)}
                        className="btn-primary bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 flex items-center space-x-1 rtl:space-x-reverse text-sm font-bold"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        <span>{t("deduct") || "خصم"}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 dark:bg-amber-955/20 border border-dashed border-amber-300 dark:border-amber-900 rounded-xl text-center">
                    <span className="text-xs text-amber-700 dark:text-amber-400 block font-bold mb-1">
                      {t("accountPaymentUnavailable") || "الخصم من الحساب غير متاح"}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 block leading-relaxed font-bold">
                      {t("accountPaymentUnavailableDesc") || "يرجى تحديد أو إضافة عميل أولاً من شاشة السلة."}
                    </span>
                  </div>
                )}
              </div>

            </div>

            {/* قائمة الدفعات المضافة */}
            <div className="space-y-2">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">{t("paymentsAdded") || "المدفوعات المضافة:"}</h4>
              
              {payments.length === 0 ? (
                <div className="p-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 text-xs font-semibold">
                  {t("noPaymentsAdded") || "لا توجد دفعات مضافة حتى الآن. يرجى إضافة مبالغ نقدية أو تمرير الكارت لتسوية الحساب."}
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/20 max-h-[160px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">{t("paymentMethod")}</th>
                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">{t("amount")}</th>
                        <th className="px-4 py-2 text-center text-xs font-bold text-gray-500 uppercase w-16">{t("action") || "إجراء"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {payments.map((p, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                            {p.method === "cash" ? `💵 ${t("cash") || "نقدي"} (Cash)` : 
                             p.method === "card" ? `💳 ${t("card") || "بطاقة"} (Card)` : 
                             p.method === "transfer" ? `🏦 ${t("transfer") || "تحويل بنكي"} (Transfer)` : 
                             p.method === "account" ? `👤 ${t("account") || "خصم من الحساب"}` : "أخرى"}
                          </td>
                          <td className="px-4 py-2 text-xs font-black text-gray-900 dark:text-white font-mono text-left">
                            {p.amount.toFixed(2)} {t("sar") || "ر.س"}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeletePayment(idx)}
                              disabled={isTerminalActive}
                              className="text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                              title={t("deleteThisPayment") || "حذف هذه الدفعة"}
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
                <span>{t("completeTransactionSaveInvoice") || "إتمام المعاملة وحفظ الفاتورة"}</span>
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
              <div className="text-[10px] text-gray-400 dark:text-gray-500 text-center flex items-center justify-center space-x-1.5 rtl:space-x-reverse font-bold">
                <FontAwesomeIcon icon={faLock} />
                <span>🔒 {t("systemLockedTerminal") || "النظام مغلق مالياً لحين اكتمال عملية التحقق من البطاقة الشبكية"}</span>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default HybridPaymentModal;
