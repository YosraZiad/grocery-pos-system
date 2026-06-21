import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";

const BARCODE_PREFIX = "EMP-";
const SCAN_IDLE_MS = 80;
const BARCODE_LENGTH = 10;

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [lockedUntil, setLockedUntil] = useState(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const identifierRef = useRef(null);
  const scanTimerRef = useRef(null);
  const { login } = useAuth();
  const { t, toggleLanguage, language } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const normalizedIdentifier = identifier.trim();
  const isBarcodeInput = normalizedIdentifier
    .toUpperCase()
    .startsWith(BARCODE_PREFIX);

  useEffect(() => {
    identifierRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!lockedUntil) {
      setLockCountdown(0);
      return undefined;
    }

    const updateCountdown = () => {
      const remainingMs = new Date(lockedUntil).getTime() - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setLockCountdown(remainingSeconds);

      if (remainingSeconds === 0) {
        setLockedUntil(null);
        setError("");
        setAttemptsRemaining(null);
      }
    };

    updateCountdown();

    const intervalId = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [lockedUntil]);

  useEffect(() => {
    return () => {
      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
      }
    };
  }, []);

  const submitLogin = async ({ methodOverride, identifierOverride } = {}) => {
    const currentIdentifier = (
      identifierOverride ?? normalizedIdentifier
    ).trim();
    const barcodeFlow =
      methodOverride === "barcode" ||
      currentIdentifier.toUpperCase().startsWith(BARCODE_PREFIX);

    if (loading || lockCountdown > 0) {
      return;
    }

    if (!currentIdentifier) {
      setError("Please enter username/email or scan employee barcode");
      return;
    }

    if (!barcodeFlow && !password) {
      setError("Password is required for username login");
      return;
    }

    setError("");
    setLoading(true);

    const result = await login({
      identifier: currentIdentifier,
      password: barcodeFlow ? undefined : password,
      loginMethod: barcodeFlow ? "barcode" : "username_password",
    });

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message || t("error"));

      if (typeof result.attemptsRemaining === "number") {
        setAttemptsRemaining(result.attemptsRemaining);
      }

      if (result.status === 423 && result.lockedUntil) {
        setLockedUntil(result.lockedUntil);
      }
    }

    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await submitLogin();
  };

  const handleIdentifierChange = (value) => {
    setIdentifier(value);
    setError("");

    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
    }

    const trimmed = value.trim();
    const isBarcode = trimmed.toUpperCase().startsWith(BARCODE_PREFIX);
    if (
      !isBarcode ||
      trimmed.length !== BARCODE_LENGTH ||
      lockCountdown > 0
    ) {
      return;
    }

    scanTimerRef.current = setTimeout(() => {
      submitLogin({ methodOverride: "barcode", identifierOverride: trimmed });
    }, SCAN_IDLE_MS);
  };

  const handleIdentifierKeyDown = async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await submitLogin();
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-6 sm:px-6 sm:py-10 lg:px-8 transition-colors duration-200">
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex space-x-2 rtl:space-x-reverse">
        <button
          onClick={toggleLanguage}
          className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md transition-all duration-200 touch-manipulation"
          title={
            language === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"
          }
        >
          {language === "en" ? "🇸🇦" : "🇬🇧"}
        </button>
        <button
          onClick={toggleTheme}
          className="h-11 w-11 sm:h-10 sm:w-10 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-md transition-all duration-200 touch-manipulation"
          title={theme === "light" ? "Dark Mode" : "Light Mode"}
        >
          <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
        </button>
      </div>

      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        {/* Logo & Title */}
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <FontAwesomeIcon
              icon={faCartShopping}
              className="text-white text-4xl"
            />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t("login")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("or")}{" "}
            <Link
              to="/register"
              className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300 transition-colors duration-200"
            >
              {t("createAccount")}
            </Link>
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {typeof attemptsRemaining === "number" && attemptsRemaining > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 px-4 py-3 rounded-lg text-sm">
                Remaining attempts: {attemptsRemaining}
              </div>
            )}

            {lockCountdown > 0 && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                This account is locked. Try again in {lockCountdown} seconds.
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="identifier" className="label">
                  Username / Email / Employee Barcode
                </label>
                <input
                  ref={identifierRef}
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="text"
                  enterKeyHint={isBarcodeInput ? "go" : "next"}
                  required
                  className="input min-h-12 text-base touch-manipulation"
                  placeholder="e.g. cashier01 or EMP-000245"
                  value={identifier}
                  disabled={loading || lockCountdown > 0}
                  onChange={(e) => handleIdentifierChange(e.target.value)}
                  onKeyDown={handleIdentifierKeyDown}
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Barcode scans starting with EMP- are auto-submitted.
                </p>
              </div>

              {!isBarcodeInput && (
                <div>
                  <label htmlFor="password" className="label">
                    {t("password")}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    inputMode="text"
                    enterKeyHint="go"
                    required={!isBarcodeInput}
                    className="input min-h-12 text-base touch-manipulation"
                    placeholder={t("password")}
                    value={password}
                    disabled={loading || lockCountdown > 0}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || lockCountdown > 0}
                className="w-full btn-primary min-h-12 py-3.5 text-base sm:text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                {loading ? t("processing") : t("loginButton")}
              </button>
            </div>

            {/* Test Accounts */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("testAccounts")}:
              </p>
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <p>
                  <strong className="text-gray-900 dark:text-gray-200">
                    {t("admin")}:
                  </strong>{" "}
                  admin@example.com / password
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-gray-200">
                    {t("cashier")}:
                  </strong>{" "}
                  cashier@example.com / password
                </p>
              </div>
            </div>

            {/* Fast Login Test Panel Link */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center">
              <Link
                to="/fast-login-test"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-500 transition-colors duration-200"
              >
                <span>💡</span>
                <span>Fast Login Test Panel | لوحة اختبار تسجيل الدخول السريع</span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
