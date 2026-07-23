import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, loading, hasPermission, user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  const isAdmin = user?.roles?.some((role) => role.name === 'admin');
  const isBlockedRouteForAdmin = isAdmin && (location.pathname === '/sales' || location.pathname === '/sales-list');

  const isAuthorized = (!requiredPermission || hasPermission(requiredPermission)) && !isBlockedRouteForAdmin;

  useEffect(() => {
    if (isAuthenticated && !loading && !isAuthorized) {
      toast.error(t('accessDenied') || 'غير مسموح لك بالوصول إلى هذه الصفحة');
    }
  }, [isAuthenticated, loading, isAuthorized, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
