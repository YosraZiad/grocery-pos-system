import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBolt,
  faDatabase,
  faBarcode,
  faLock,
  faUnlock,
  faTerminal,
  faHistory,
  faCheckCircle,
  faExclamationCircle,
  faArrowLeft,
  faCircleCheck,
  faLanguage,
  faClock,
} from "@fortawesome/free-solid-svg-icons";

// Local translation dictionary for self-containment
const locales = {
  en: {
    title: "Fast Login Test Panel",
    subtitle: "Verify Epic 1 - Authentication & Shift (User Story 1.1)",
    resetDb: "Reset Test Database",
    resetting: "Resetting...",
    resetSuccess: "Database reset to test states successfully!",
    resetFail: "Database reset failed.",
    performanceLimit: "Limit: < 3 seconds",
    performanceTime: "Response Time",
    barcodeTitle: "Emulated Barcode Scanner",
    barcodePlaceholder: "Type or scan barcode (e.g. EMP-100002)",
    barcodeHelper: "Auto-submits barcodes starting with 'EMP-'",
    testCases: "Test Scenarios",
    username: "Username",
    barcode: "Barcode",
    password: "Password",
    status: "Status",
    actions: "Actions",
    loginSuccessBtn: "Login (Correct Pwd)",
    loginFailBtn: "Login (Wrong Pwd)",
    loginBarcodeBtn: "Barcode Login",
    consoleTitle: "API Response Console & Tracer",
    consolePlaceholder: "Click any action above to trace response...",
    speedPassed: "PASSED (< 3s limit)",
    speedFailed: "FAILED (>= 3s limit)",
    backToLogin: "Back to Login Screen",
    attemptsLeft: "Attempts left",
    lockedUntil: "Locked until",
    activeUser: "Active Cashier",
    barcodeUser: "Barcode-only Cashier",
    twoFailsUser: "Two Fails (Next fail locks)",
    lockedUser: "Locked Cashier",
    expiredLockUser: "Expired Lock Cashier",
    adminUser: "Admin (Verify Role)",
  },
  ar: {
    title: "لوحة اختبار تسجيل الدخول السريع",
    subtitle: "التحقق من الملحمة 1 - الهوية والمناوبات (قصة المستخدم 1.1)",
    resetDb: "إعادة تعيين قاعدة بيانات الاختبار",
    resetting: "جاري إعادة التعيين...",
    resetSuccess: "تمت إعادة تعيين قاعدة البيانات لحالات الاختبار بنجاح!",
    resetFail: "فشلت إعادة تعيين قاعدة البيانات.",
    performanceLimit: "الحد الأقصى: < 3 ثوانٍ",
    performanceTime: "وقت الاستجابة",
    barcodeTitle: "محاكي قارئ الباركود",
    barcodePlaceholder: "اكتب أو امسح الباركود (مثال: EMP-100002)",
    barcodeHelper: "يتم الإرسال التلقائي للباركود الذي يبدأ بـ 'EMP-'",
    testCases: "سيناريوهات الاختبار",
    username: "اسم المستخدم",
    barcode: "الباركود",
    password: "كلمة المرور",
    status: "الحالة المتوقعة",
    actions: "العمليات",
    loginSuccessBtn: "دخول (كلمة مرور صحيحة)",
    loginFailBtn: "دخول (كلمة مرور خاطئة)",
    loginBarcodeBtn: "دخول بالباركود",
    consoleTitle: "لوحة تتبع طلبات الـ API",
    consolePlaceholder: "اضغط على أي عملية في الأعلى لتتبع الاستجابة...",
    speedPassed: "ناجح (أقل من 3 ثوانٍ)",
    speedFailed: "فاشل (أكثر من 3 ثوانٍ)",
    backToLogin: "العودة لصفحة تسجيل الدخول الرئيسية",
    attemptsLeft: "المحاولات المتبقية",
    lockedUntil: "مغلق حتى",
    activeUser: "كاشير نشط",
    barcodeUser: "كاشير بالباركود فقط",
    twoFailsUser: "محاولتان فاشلتان (الفشل التالي يقفل الحساب)",
    lockedUser: "كاشير مقفل حسابه",
    expiredLockUser: "كاشير انتهى قفل حسابه",
    adminUser: "مدير النظام (التحقق من الدور)",
  },
};

const TEST_ACCOUNTS = [
  {
    key: "active",
    nameKey: "activeUser",
    identifier: "fast_active",
    barcode: "EMP-100001",
    password: "password",
    expected: "تسجيل دخول ناجح (200) بالاسم وكلمة المرور.",
    color: "emerald",
  },
  {
    key: "barcode",
    nameKey: "barcodeUser",
    identifier: "fast_barcode",
    barcode: "EMP-100002",
    password: "password",
    expected: "تسجيل دخول ناجح (200) بالباركود مباشرة بدون كلمة مرور.",
    color: "blue",
  },
  {
    key: "twofails",
    nameKey: "twoFailsUser",
    identifier: "fast_twofails",
    barcode: "EMP-100003",
    password: "password",
    expected: "لديه محاولتان فاشلتان. المحاولة الخاطئة التالية تقفله مباشرة (423).",
    color: "amber",
  },
  {
    key: "locked",
    nameKey: "lockedUser",
    identifier: "fast_locked",
    barcode: "EMP-100004",
    password: "password",
    expected: "مغلق حاليًا. أي محاولة ترجع كود (423) مع عداد تنازلي.",
    color: "red",
  },
  {
    key: "expired",
    nameKey: "expiredLockUser",
    identifier: "fast_expired",
    barcode: "EMP-100005",
    password: "password",
    expected: "انتهت فترة القفل. يسمح بالدخول ويصفر العداد تلقائيًا.",
    color: "violet",
  },
  {
    key: "admin",
    nameKey: "adminUser",
    identifier: "fast_admin",
    barcode: "EMP-100006",
    password: "password",
    expected: "تسجيل دخول ناجح (200) مع صلاحية أدمن والتحقق من الاستجابة.",
    color: "indigo",
  },
];

export default function FastLoginTestPanel() {
  const [lang, setLang] = useState("ar");
  const [barcodeVal, setBarcodeVal] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  
  // Console state
  const [apiLog, setApiLog] = useState(null);
  const [apiTime, setApiTime] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [apiPayload, setApiPayload] = useState(null);

  const barcodeInputRef = useRef(null);
  const t = locales[lang];
  const navigate = useNavigate();

  const handleResetDb = async () => {
    setResetLoading(true);
    setResetMessage(null);
    try {
      const startTime = performance.now();
      const res = await api.post("/auth/reset-fast-login");
      const endTime = performance.now();
      
      setResetMessage({ success: true, text: t.resetSuccess });
      
      // Log to console
      setApiLog("POST /api/auth/reset-fast-login");
      setApiTime(Math.round(endTime - startTime));
      setApiStatus(res.status);
      setApiResponse(res.data);
      setApiPayload({});
    } catch (err) {
      setResetMessage({ success: false, text: t.resetFail });
      setApiLog("POST /api/auth/reset-fast-login");
      setApiTime(null);
      setApiStatus(err.response?.status || 500);
      setApiResponse(err.response?.data || { error: err.message });
      setApiPayload({});
    } finally {
      setResetLoading(false);
    }
  };

  const executeLogin = async (identifier, password, method) => {
    const payload = {
      identifier,
      password: method === "barcode" ? undefined : password,
      login_method: method,
    };
    
    setApiLog(`POST /api/auth/login [Method: ${method}]`);
    setApiPayload(payload);
    setApiResponse(null);
    setApiTime(null);
    setApiStatus("Pending...");

    const startTime = performance.now();
    try {
      const res = await api.post("/auth/login", payload);
      const endTime = performance.now();
      
      setApiTime(Math.round(endTime - startTime));
      setApiStatus(res.status);
      setApiResponse(res.data);

      // Save token if successful so we can inspect me endpoint
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.tenant_id) {
          localStorage.setItem("tenant_id", res.data.tenant_id);
        }
      }
    } catch (err) {
      const endTime = performance.now();
      setApiTime(Math.round(endTime - startTime));
      setApiStatus(err.response?.status || 500);
      setApiResponse(err.response?.data || { error: err.message });
    }
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeVal.trim()) return;
    executeLogin(barcodeVal.trim(), null, "barcode");
    setBarcodeVal("");
  };

  const handleBarcodeChange = (val) => {
    setBarcodeVal(val);
    // Auto submit barcode if it starts with EMP- and meets length requirement
    if (val.trim().toUpperCase().startsWith("EMP-") && val.trim().length >= 8) {
      setTimeout(() => {
        executeLogin(val.trim(), null, "barcode");
        setBarcodeVal("");
      }, 100);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 transition-colors duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 p-2 rounded-lg">
              <FontAwesomeIcon icon={faBolt} className="text-xl animate-pulse" />
            </span>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {t.title}
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.subtitle}
          </p>
        </div>
        
        <div className="flex items-center space-x-2 rtl:space-x-reverse self-stretch sm:self-auto">
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="h-11 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2 touch-manipulation"
          >
            <FontAwesomeIcon icon={faLanguage} />
            <span>{lang === "en" ? "العربية" : "English"}</span>
          </button>
          
          <button
            onClick={handleResetDb}
            disabled={resetLoading}
            className="h-11 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white flex items-center gap-2 touch-manipulation"
          >
            <FontAwesomeIcon icon={faDatabase} className={resetLoading ? "animate-spin" : ""} />
            <span>{resetLoading ? t.resetting : t.resetDb}</span>
          </button>
        </div>
      </div>

      {resetMessage && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          resetMessage.success 
            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400" 
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400"
        }`}>
          <FontAwesomeIcon icon={resetMessage.success ? faCheckCircle : faExclamationCircle} className="text-lg" />
          <span className="text-sm font-medium">{resetMessage.text}</span>
        </div>
      )}

      {/* Grid of barcode scanner & fast login details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Barcode Simulator & Back link */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faBarcode} className="text-primary-500" />
              {t.barcodeTitle}
            </h2>
            <form onSubmit={handleBarcodeSubmit} className="space-y-3">
              <input
                ref={barcodeInputRef}
                type="text"
                placeholder={t.barcodePlaceholder}
                value={barcodeVal}
                onChange={(e) => handleBarcodeChange(e.target.value)}
                className="input text-base text-center min-h-12 border-2 border-dashed border-gray-300 dark:border-gray-600 focus:border-primary-500 w-full rounded-lg px-3"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {t.barcodeHelper}
              </p>
              <button
                type="submit"
                className="w-full h-11 bg-gray-100 hover:bg-gray-200 dark:bg-gray-750 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-bold transition-all duration-200 touch-manipulation"
              >
                {t.loginBarcodeBtn}
              </button>
            </form>
          </div>

          <Link
            to="/login"
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors text-sm font-bold shadow-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            {t.backToLogin}
          </Link>
        </div>

        {/* Test Cases Table/Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faHistory} className="text-primary-500" />
            {t.testCases}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEST_ACCOUNTS.map((acc) => {
              return (
                <div
                  key={acc.key}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-750 bg-gray-50 dark:bg-gray-900/50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {t[acc.nameKey]}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300`}>
                        {acc.identifier}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 space-y-1">
                      <p><strong>{t.username}:</strong> {acc.identifier}</p>
                      <p><strong>{t.barcode}:</strong> {acc.barcode}</p>
                      <p><strong>{t.password}:</strong> {acc.password}</p>
                    </div>

                    <div className="text-xs border-t border-gray-205 dark:border-gray-750 pt-2 mt-2 text-gray-650 dark:text-gray-300 italic">
                      {acc.expected}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-205 dark:border-gray-750">
                    <div className="flex gap-2">
                      <button
                        onClick={() => executeLogin(acc.identifier, acc.password, "username_password")}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors touch-manipulation"
                      >
                        {t.loginSuccessBtn}
                      </button>
                      <button
                        onClick={() => executeLogin(acc.identifier, "wrong-password", "username_password")}
                        className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg transition-colors touch-manipulation"
                      >
                        {t.loginFailBtn}
                      </button>
                    </div>
                    <button
                      onClick={() => executeLogin(acc.barcode, null, "barcode")}
                      className="w-full bg-blue-650 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg transition-colors touch-manipulation"
                    >
                      {t.loginBarcodeBtn} ({acc.barcode})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* API Console and tracer */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faTerminal} className="text-primary-500" />
            {t.consoleTitle}
          </h2>
          
          {apiTime !== null && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <FontAwesomeIcon icon={faClock} />
                {t.performanceTime}:
              </span>
              <span className={`text-sm font-bold px-2 py-1 rounded ${
                apiTime < 3000 
                  ? "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-400"
                  : "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-400"
              }`}>
                {apiTime} ms
              </span>
              <span className="text-xs text-gray-400">
                ({apiTime < 3000 ? t.speedPassed : t.speedFailed})
              </span>
            </div>
          )}
        </div>

        {apiLog ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 bg-gray-100 dark:bg-gray-900 p-3 rounded-lg font-mono text-sm">
              <span className="text-primary-600 dark:text-primary-400 font-bold">{apiLog}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                String(apiStatus).startsWith("2") 
                  ? "bg-emerald-500/10 text-emerald-500" 
                  : String(apiStatus).startsWith("423")
                  ? "bg-amber-500/10 text-amber-500"
                  : "bg-rose-500/10 text-rose-500"
              }`}>
                Status: {apiStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Request Payload</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-60 border border-gray-800">
                  {JSON.stringify(apiPayload, null, 2)}
                </pre>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Response Body</p>
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-xl text-xs overflow-x-auto font-mono max-h-60 border border-gray-800">
                  {apiResponse ? JSON.stringify(apiResponse, null, 2) : "Loading..."}
                </pre>
              </div>
            </div>

            {/* Quick validation card */}
            {apiResponse && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                apiStatus === 200 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400"
                  : apiStatus === 423
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-400"
                  : "bg-rose-50 dark:bg-rose-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-400"
              }`}>
                <FontAwesomeIcon 
                  icon={apiStatus === 200 ? faCircleCheck : faExclamationCircle} 
                  className="text-lg mt-0.5" 
                />
                <div className="text-sm">
                  <p className="font-bold">
                    {apiStatus === 200 
                      ? "Success: Cashier Authenticated" 
                      : apiStatus === 423 
                      ? "Lock screen Triggered" 
                      : "Login Rejection"}
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    {apiResponse.message || "No message returned."}
                  </p>
                  {apiResponse.user && (
                    <div className="mt-2 text-xs flex flex-wrap gap-2">
                      <span className="bg-emerald-500/10 px-2 py-0.5 rounded font-mono text-emerald-600">User ID: {apiResponse.user.id}</span>
                      <span className="bg-emerald-500/10 px-2 py-0.5 rounded font-mono text-emerald-600">Role: {apiResponse.user.roles?.[0]?.name}</span>
                      <span className="bg-emerald-500/10 px-2 py-0.5 rounded font-mono text-emerald-600 text-[10px]">Login Time: {apiResponse.login_at_server}</span>
                    </div>
                  )}
                  {apiStatus === 423 && (
                    <div className="mt-2 text-xs flex flex-wrap gap-2">
                      <span className="bg-amber-500/10 px-2 py-0.5 rounded font-mono text-amber-600 text-[10px]">Locked Until: {apiResponse.locked_until}</span>
                      <span className="bg-amber-500/10 px-2 py-0.5 rounded font-mono text-amber-600">Countdown: {apiResponse.retry_after_seconds}s</span>
                    </div>
                  )}
                  {typeof apiResponse.attempts_remaining === "number" && (
                    <div className="mt-2 text-xs">
                      <span className="bg-rose-500/10 px-2 py-0.5 rounded font-mono text-rose-600 dark:text-rose-450">
                        {t.attemptsLeft}: {apiResponse.attempts_remaining}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <FontAwesomeIcon icon={faTerminal} className="text-3xl mb-3 text-gray-300 dark:text-gray-600" />
            <p>{t.consolePlaceholder}</p>
          </div>
        )}
      </div>
    </div>
  );
}
