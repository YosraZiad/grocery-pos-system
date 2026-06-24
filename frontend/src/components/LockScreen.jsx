import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faUnlock,
  faBackspace,
  faDoorOpen,
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";

function LockScreen({ onUnlock }) {
  const { user, logout } = useAuth();
  const { t, language } = useI18n();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const pinLength = 4;

  const handleKeyPress = (num) => {
    if (loading || error) return;
    if (pin.length < pinLength) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === pinLength) {
        verifyPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (loading || error) return;
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    if (loading || error) return;
    setPin("");
  };

  const verifyPin = async (enteredPin) => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.post("/auth/verify-pin", { pin: enteredPin });
      if (response.data.success) {
        // Success feedback
        toast.success(t("welcomeBack") || "مرحباً بعودتك!");
        onUnlock();
      }
    } catch (err) {
      setError(true);
      setPin("");
      toast.error(t("invalidPin") || "رمز PIN غير صحيح");
      // Reset error after animation completes (500ms)
      setTimeout(() => {
        setError(false);
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading || error) return;
      if (e.key >= "0" && e.key <= "9") {
        handleKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape" || e.key === "Delete") {
        handleClear();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, loading, error]);

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : "U";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 dark:bg-slate-950/90 backdrop-blur-2xl transition-all duration-500">
      {/* Background abstract colorful glowing circles for premium aesthetics */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }}></div>

      <div 
        className={`w-full max-w-md p-8 mx-4 rounded-3xl bg-white/5 dark:bg-gray-900/40 border border-white/10 shadow-2xl backdrop-blur-md transform transition-all duration-300 flex flex-col items-center select-none ${
          error ? "animate-shake border-red-500/40 shadow-red-500/5" : ""
        }`}
      >
        {/* User Info / Avatar */}
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-primary-500/20">
            {getInitials(user?.name)}
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shadow border-2 border-slate-950">
            <FontAwesomeIcon icon={faLock} className="text-xs" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-1">
          {user?.name || "Cashier"}
        </h2>
        <p className="text-gray-400 text-sm mb-6 text-center max-w-xs">
          {t("enterPinToUnlock")}
        </p>

        {/* PIN Indicators */}
        <div className="flex justify-center space-x-4 rtl:space-x-reverse mb-8">
          {[...Array(pinLength)].map((_, index) => {
            const isActive = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  error
                    ? "border-red-500 bg-red-500 shadow-lg shadow-red-500/50 scale-110"
                    : isActive
                    ? "border-primary-500 bg-primary-500 shadow-lg shadow-primary-500/50 scale-110"
                    : "border-gray-500 dark:border-gray-600 bg-transparent"
                }`}
              />
            );
          })}
        </div>

        {/* PIN Keypad Grid */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-xs mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num.toString())}
              disabled={loading}
              className="h-16 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/5 text-white text-2xl font-semibold flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all duration-150 focus:outline-none"
            >
              {num}
            </button>
          ))}
          
          {/* Action Left (Clear / C) */}
          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="h-16 rounded-2xl bg-transparent text-gray-400 text-lg font-medium flex items-center justify-center hover:text-white active:scale-95 transition-all duration-150 focus:outline-none"
          >
            C
          </button>
          
          {/* Zero (0) */}
          <button
            type="button"
            onClick={() => handleKeyPress("0")}
            disabled={loading}
            className="h-16 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/5 text-white text-2xl font-semibold flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all duration-150 focus:outline-none"
          >
            0
          </button>

          {/* Action Right (Backspace) */}
          <button
            type="button"
            onClick={handleBackspace}
            disabled={loading}
            className="h-16 rounded-2xl bg-transparent text-gray-400 text-xl flex items-center justify-center hover:text-white active:scale-95 transition-all duration-150 focus:outline-none"
          >
            <FontAwesomeIcon icon={faBackspace} />
          </button>
        </div>

        {/* Switch cashier / Logout button */}
        <button
          type="button"
          onClick={logout}
          className="flex items-center space-x-2 rtl:space-x-reverse px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-200 border border-red-500/20"
        >
          <FontAwesomeIcon icon={faDoorOpen} />
          <span>{t("logout")}</span>
        </button>
      </div>

      {/* Shake Animation CSS Inline Injection */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); }
          20%, 40%, 60%, 80% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default LockScreen;
