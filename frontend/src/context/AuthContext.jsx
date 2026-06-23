/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import LockScreen from "../components/LockScreen";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocked, setIsLocked] = useState(() => {
    return localStorage.getItem("pos_session_locked") === "true";
  });

  // التحقق من المستخدم عند تحميل التطبيق
  useEffect(() => {
    checkAuth();
  }, []);

  // تعقب النشاط العالمي لقفل الجلسة عند الخمول (120 ثانية)
  useEffect(() => {
    if (!isAuthenticated || isLocked) return;

    let timeoutId;
    const inactivityLimit = 120000; // دقيقتين = 120,000 مللي ثانية

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lockSession();
      }, inactivityLimit);
    };

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [isAuthenticated, isLocked]);

  const lockSession = () => {
    setIsLocked(true);
    localStorage.setItem("pos_session_locked", "true");
  };

  const unlockSession = () => {
    setIsLocked(false);
    localStorage.setItem("pos_session_locked", "false");
  };

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      setUser(response.data.user);
      setIsAuthenticated(true);

      // حفظ tenant_id
      if (response.data.user.tenant_id) {
        localStorage.setItem("tenant_id", response.data.user.tenant_id);
      }
    } catch {
      // Token غير صالح
      localStorage.removeItem("token");
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("pos_session_locked");
      setUser(null);
      setIsAuthenticated(false);
      setIsLocked(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifierOrPayload, legacyPassword) => {
    const payload =
      typeof identifierOrPayload === "object" && identifierOrPayload !== null
        ? identifierOrPayload
        : {
            identifier: identifierOrPayload,
            password: legacyPassword,
          };

    try {
      const response = await api.post("/auth/login", {
        identifier: payload.identifier,
        password: payload.password,
        login_method: payload.loginMethod,
      });

      const { token, user, tenant_id, login_method, login_at_server } =
        response.data;

      // حفظ token و tenant_id
      localStorage.setItem("token", token);
      if (tenant_id) {
        localStorage.setItem("tenant_id", tenant_id);
      }

      setUser(user);
      setIsAuthenticated(true);
      setIsLocked(false);
      localStorage.removeItem("pos_session_locked");

      return {
        success: true,
        loginMethod: login_method,
        loginAtServer: login_at_server,
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "فشل تسجيل الدخول",
        status: error.response?.status,
        attemptsRemaining: error.response?.data?.attempts_remaining,
        lockedUntil: error.response?.data?.locked_until,
        retryAfterSeconds: error.response?.data?.retry_after_seconds,
      };
    }
  };

  const register = async (
    name,
    email,
    password,
    passwordConfirmation,
    tenantId,
  ) => {
    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        tenant_id: tenantId,
      });

      const { token, user, tenant_id } = response.data;

      // حفظ token و tenant_id
      localStorage.setItem("token", token);
      if (tenant_id) {
        localStorage.setItem("tenant_id", tenant_id);
      }

      setUser(user);
      setIsAuthenticated(true);
      setIsLocked(false);
      localStorage.removeItem("pos_session_locked");

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "فشل التسجيل",
        errors: error.response?.data?.errors || {},
      };
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // مسح البيانات المحلية حتى لو فشل الطلب
      localStorage.removeItem("token");
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("pos_session_locked");
      setUser(null);
      setIsAuthenticated(false);
      setIsLocked(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    isLocked,
    lockSession,
    unlockSession,
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isAuthenticated && isLocked && (
        <LockScreen onUnlock={unlockSession} />
      )}
    </AuthContext.Provider>
  );
};
