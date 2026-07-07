import { useState, useEffect, useRef } from "react";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faCircleNotch,
  faWifi,
  faCircleCheck,
  faCircleXmark,
  faClock,
  faXmark,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import CustomerSelector from "./CustomerSelector";

// حالات الاتصال بالماكينة
const STATES = {
  CONNECTING: "CONNECTING",
  WAITING_FOR_CARD: "WAITING_FOR_CARD",
  PROCESSING: "PROCESSING",
  APPROVED: "APPROVED",
  DECLINED: "DECLINED",
  TIMEOUT: "TIMEOUT",
};

function CardPaymentModal({ isOpen, onClose, onConfirm, totalDue }) {
  const { t, language } = useI18n();
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [currentState, setCurrentState] = useState(STATES.CONNECTING);
  const [errorMessage, setErrorMessage] = useState("");
  const pollingIntervalRef = useRef(null);
  const isConfirmingRef = useRef(false);

  // بدء الدفع والاتصال بالماكينة عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      isConfirmingRef.current = false;
      setErrorMessage("");
      setSelectedCustomer(null);
      startPaymentProcess();
    }
    return () => {
      stopPolling();
    };
  }, [isOpen]);

  // إيقاف إغلاق النافذة بزر Escape في الحالات الحساسة
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        // يسمح بالإغلاق فقط في حالتي الرفض أو انتهاء المهلة
        if (currentState === STATES.DECLINED || currentState === STATES.TIMEOUT) {
          handleClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, currentState]);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const startPaymentProcess = async () => {
    stopPolling();
    setCurrentState(STATES.CONNECTING);
    setErrorMessage("");

    try {
      // 1. إرسال المبلغ المطلوب سحبه للسيرفر
      await api.post("/terminal/charge", { amount: totalDue });
      setCurrentState(STATES.WAITING_FOR_CARD);

      // 2. بدء الفحص الدوري لحالة العملية كل 1 ثانية
      pollingIntervalRef.current = setInterval(checkTerminalStatus, 1000);
    } catch (err) {
      console.error("Failed to connect to card terminal:", err);
      setErrorMessage(t("terminalConnectionFailed") || (language === "ar" ? "تعذر الاتصال بالماكينة الشبكية. يرجى التأكد من تشغيل الخدمة." : "Could not connect to the network terminal. Please make sure the service is running."));
      setCurrentState(STATES.TIMEOUT);
    }
  };

  const checkTerminalStatus = async () => {
    try {
      const response = await api.get("/terminal/status");
      const { status: serverStatus } = response.data;

      switch (serverStatus) {
        case "waiting_for_card":
          setCurrentState(STATES.WAITING_FOR_CARD);
          break;
        case "processing":
          setCurrentState(STATES.PROCESSING);
          break;
        case "approved":
          stopPolling();
          setCurrentState(STATES.APPROVED);
          // تجنب تنفيذ التأكيد أكثر من مرة
          if (!isConfirmingRef.current) {
            isConfirmingRef.current = true;
            // إعطاء فرصة 1.5 ثانية للعميل لرؤية علامة النجاح ثم إكمال الفاتورة
            setTimeout(() => {
              onConfirm(null, null, null, selectedCustomer ? selectedCustomer.id : null);
              handleClose();
            }, 1500);
          }
          break;
        case "declined":
          stopPolling();
          setCurrentState(STATES.DECLINED);
          break;
        case "timeout":
          stopPolling();
          setCurrentState(STATES.TIMEOUT);
          break;
        default:
          // في حال تم تصفير الماكينة أو أي حالة أخرى غير متوقعة
          break;
      }
    } catch (err) {
      console.error("Error polling terminal status:", err);
      // لا نوقف الفحص فوراً عند حدوث خطأ شبكة عابر، بل نستمر في المحاولة
    }
  };

  const handleClose = async () => {
    stopPolling();
    try {
      // تصفير حالة الماكينة في الخلفية عند إغلاق النافذة
      await api.post("/terminal/reset");
    } catch (err) {
      console.error("Failed to reset terminal:", err);
    }
    onClose();
  };

  if (!isOpen) return null;

  // هل نمنع إغلاق المودال والتراجع؟
  const isLocked = [
    STATES.CONNECTING,
    STATES.WAITING_FOR_CARD,
    STATES.PROCESSING,
    STATES.APPROVED,
  ].includes(currentState);

  // تفاصيل التنسيقات والألوان حسب حالة الماكينة
  const stateConfig = {
    [STATES.CONNECTING]: {
      bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30",
      text: "text-blue-700 dark:text-blue-400",
      icon: faWifi,
      pulse: true,
      spin: false,
      title: t("connectingTerminal") || "جاري الاتصال بالماكينة...",
      desc: t("connectingTerminalDesc") || "يرجى الانتظار لحين تهيئة جهاز الدفع الشبكي",
    },
    [STATES.WAITING_FOR_CARD]: {
      bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30",
      text: "text-amber-700 dark:text-amber-400",
      icon: faCreditCard,
      pulse: true,
      spin: false,
      title: t("waitingForCard") || "يرجى تمرير أو إدخال البطاقة",
      desc: language === "ar" ? `المبلغ المرسل للجهاز: ${totalDue.toFixed(2)} ر.س` : `Amount sent to terminal: ${totalDue.toFixed(2)} SAR`,
    },
    [STATES.PROCESSING]: {
      bg: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30",
      text: "text-indigo-700 dark:text-indigo-400",
      icon: faCircleNotch,
      pulse: false,
      spin: true,
      title: t("processingTransaction") || "جاري التحقق من العملية...",
      desc: t("processingTransactionDesc") || "يرجى عدم إيقاف تشغيل الماكينة أو فصل الشبكة",
    },
    [STATES.APPROVED]: {
      bg: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30",
      text: "text-green-700 dark:text-green-400",
      icon: faCircleCheck,
      pulse: false,
      spin: false,
      title: t("transactionApproved") || "تمت العملية بنجاح | Approved",
      desc: "Authorization Code: Auth-" + Math.floor(100000 + Math.random() * 900000),
    },
    [STATES.DECLINED]: {
      bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30",
      text: "text-red-700 dark:text-red-400",
      icon: faCircleXmark,
      pulse: false,
      spin: false,
      title: t("transactionDeclined") || "العملية مرفوضة | Declined",
      desc: t("transactionDeclinedDesc") || "الرصيد غير كافٍ أو تم رفض البطاقة من المصدر",
    },
    [STATES.TIMEOUT]: {
      bg: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30",
      text: "text-red-700 dark:text-red-400",
      icon: faClock,
      pulse: false,
      spin: false,
      title: t("transactionTimeout") || "انتهت مهلة الاتصال | Timeout",
      desc: t("transactionTimeoutDesc") || "لم يتم تمرير البطاقة في الوقت المحدد أو حدث خطأ اتصال",
    },
  };

  const config = stateConfig[currentState];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={() => {
          if (!isLocked) handleClose();
        }}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border-2 border-primary-500 overflow-hidden transition-all duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-750">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faCreditCard} className="text-primary-500 text-xl" />
              <div className="flex flex-col text-start leading-tight">
                <span>{t("cardPayment")}</span>
                <span className="text-[10px] text-gray-500 font-medium mt-0.5">
                  {t("terminalIntegration")}
                </span>
              </div>
            </h3>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLocked}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-750 transition-all disabled:opacity-30"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 flex flex-col items-center text-center">
            
            {/* إجمالي المبلغ المطلوب سحبه */}
            <div className="w-full p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-xl flex justify-between items-center">
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                {t("amountToCharge")}
              </span>
              <span className="text-2xl font-black text-primary-600 dark:text-primary-400">
                {totalDue.toFixed(2)} {t("sar") || "ر.س"}
              </span>
            </div>

            {/* اختيار العميل */}
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
              defaultCustomerName={t("defaultCardCustomer") || "العميل الافتراضي - شبكة"}
            />

            {/* أيقونة وحالة الاتصال */}
            <div className={`w-full p-6 rounded-2xl border-2 flex flex-col items-center justify-center space-y-4 transition-all duration-300 ${config.bg}`}>
              <div className={`text-5xl ${config.text} ${config.spin ? "animate-spin" : ""} ${config.pulse ? "animate-pulse" : ""}`}>
                <FontAwesomeIcon icon={config.icon} />
              </div>
              <div className="space-y-1">
                <h4 className={`text-lg font-extrabold ${config.text}`}>
                  {config.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {errorMessage || config.desc}
                </p>
              </div>
            </div>

            {/* أزرار الرجوع والمحاولة مجدداً */}
            {!isLocked && (
              <div className="w-full flex space-x-3 rtl:space-x-reverse border-t border-gray-200 dark:border-gray-700 pt-4">
                {(currentState === STATES.DECLINED || currentState === STATES.TIMEOUT) && (
                  <button
                    type="button"
                    onClick={startPaymentProcess}
                    className="flex-1 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                  >
                    <FontAwesomeIcon icon={faRotateRight} />
                    <span>{t("reconnectTerminal") || "إعادة الاتصال بالماكينة"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-all"
                >
                  {t("backToCart")}
                </button>
              </div>
            )}
            
            {isLocked && (
              <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                🔒 {t("financialProtectionActive") || "الحماية المالية نشطة. لا يمكنك إغلاق النافذة أثناء الاتصال بالبنك."}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardPaymentModal;
