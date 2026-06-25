import { useState, useRef, useEffect } from "react";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";
import toast from "react-hot-toast";

const BARCODE_PREFIX = "EMP-";
const BARCODE_LENGTH = 10;

function AdminAuthModal({ isOpen, onClose, onSuccess, itemName, itemTotal }) {
  const { t } = useI18n();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const isBarcode = identifier.trim().toUpperCase().startsWith(BARCODE_PREFIX);

  useEffect(() => {
    if (isOpen) {
      setIdentifier("");
      setPassword("");
      setError("");
      // التركيز التلقائي على الحقل بمجرد فتح النافذة
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError("Please enter admin credentials");
      return;
    }

    if (!isBarcode && !password) {
      setError("Password is required for manual login");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/verify-admin", {
        identifier: trimmedIdentifier,
        password: isBarcode ? undefined : password,
      });

      if (response.data?.success) {
        toast.success(t("adminAuthorized") || "تم تفويض العملية بنجاح من المدير");
        onSuccess(response.data.admin);
        onClose();
      } else {
        setError("Unauthorized admin credentials");
      }
    } catch (err) {
      console.error("Admin verification error:", err);
      const errMsg = err.response?.data?.message || "فشل التحقق من صلاحيات المدير";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleIdentifierChange = (val) => {
    setIdentifier(val);
    setError("");

    // إذا كان باركود بطول 10، نرسل الطلب تلقائياً للسرعة الفائقة
    const trimmed = val.trim();
    if (
      trimmed.toUpperCase().startsWith(BARCODE_PREFIX) &&
      trimmed.length === BARCODE_LENGTH
    ) {
      // إرسال تلقائي
      setTimeout(() => {
        // نمرر القيمة مباشرة لتفادي تأخر تحديث الـ State
        api.post("/auth/verify-admin", {
          identifier: trimmed,
        })
        .then((response) => {
          if (response.data?.success) {
            toast.success(t("adminAuthorized") || "تم تفويض العملية بنجاح من المدير");
            onSuccess(response.data.admin);
            onClose();
          } else {
            setError("Unauthorized admin credentials");
          }
        })
        .catch((err) => {
          const errMsg = err.response?.data?.message || "فشل التحقق من صلاحيات المدير";
          setError(errMsg);
        });
      }, 50);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto modal">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border-2 border-red-500 overflow-hidden transition-all duration-300">
          
          {/* Header - Red Danger warning */}
          <div className="bg-red-600 px-6 py-4 flex items-center space-x-3 rtl:space-x-reverse text-white">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-lg font-bold">
                {t("adminAuthRequired") || "تصريح المدير مطلوب | Admin Authorization"}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {t("adminAuthDesc") || "High value deletion requires manager credentials"}
              </p>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* معلومات المنتج المراد حذفه */}
            <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-xl space-y-1">
              <div className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">
                {t("itemToDelete") || "المنتج المطلوب حذفه"}
              </div>
              <div className="text-lg font-extrabold text-gray-900 dark:text-white">
                {itemName}
              </div>
              <div className="text-sm font-semibold text-red-700 dark:text-red-300">
                {t("totalValue") || "القيمة الإجمالية"}: {itemTotal?.toFixed(2)} ر.س
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm rounded-lg font-medium">
                {error}
              </div>
            )}

            <div className="space-y-3.5">
              <div>
                <label htmlFor="adminId" className="label text-sm font-semibold">
                  Admin Username / Email / Barcode
                </label>
                <input
                  ref={inputRef}
                  id="adminId"
                  type="text"
                  autoComplete="username"
                  required
                  placeholder="Scan Card or enter Admin username"
                  value={identifier}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  className="input w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>

              {!isBarcode && (
                <div className="transition-all duration-300">
                  <label htmlFor="adminPass" className="label text-sm font-semibold">
                    Admin Password
                  </label>
                  <input
                    id="adminPass"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="Enter Admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input w-full px-4 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-end space-x-3 rtl:space-x-reverse border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold transition-colors duration-200"
                disabled={loading}
              >
                {t("cancel") || "إلغاء"}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-bold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (t("verifying") || "جاري التحقق...") : (t("authorize") || "تفويض الإجراء")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminAuthModal;
