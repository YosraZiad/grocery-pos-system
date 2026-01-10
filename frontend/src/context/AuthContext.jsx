import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // التحقق من المستخدم عند تحميل التطبيق
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
      
      // حفظ tenant_id
      if (response.data.user.tenant_id) {
        localStorage.setItem('tenant_id', response.data.user.tenant_id);
      }
    } catch (error) {
      // Token غير صالح
      localStorage.removeItem('token');
      localStorage.removeItem('tenant_id');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const { token, user, tenant_id } = response.data;

      // حفظ token و tenant_id
      localStorage.setItem('token', token);
      if (tenant_id) {
        localStorage.setItem('tenant_id', tenant_id);
      }

      setUser(user);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'فشل تسجيل الدخول',
      };
    }
  };

  const register = async (name, email, password, passwordConfirmation, tenantId) => {
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        tenant_id: tenantId,
      });

      const { token, user, tenant_id } = response.data;

      // حفظ token و tenant_id
      localStorage.setItem('token', token);
      if (tenant_id) {
        localStorage.setItem('tenant_id', tenant_id);
      }

      setUser(user);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'فشل التسجيل',
        errors: error.response?.data?.errors || {},
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // مسح البيانات المحلية حتى لو فشل الطلب
      localStorage.removeItem('token');
      localStorage.removeItem('tenant_id');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
