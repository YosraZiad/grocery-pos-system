import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useTheme } from '../context/ThemeContext';

/**
 * Layout حديث واحترافي مع Navigation محسّن
 */
function Layout() {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [salesMenuOpen, setSalesMenuOpen] = useState(false);
  const [managementMenuOpen, setManagementMenuOpen] = useState(false);
  const [reportsMenuOpen, setReportsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // إغلاق القوائم المنسدلة عند تغيير الصفحة
  useEffect(() => {
    setSalesMenuOpen(false);
    setManagementMenuOpen(false);
    setReportsMenuOpen(false);
  }, [location.pathname]);

  // Navigation Groups
  const navigationGroups = {
    main: [
      { path: '/', label: t('home'), icon: '🏠' },
      { path: '/categories', label: t('categories'), icon: '📁' },
      { path: '/products', label: t('products'), icon: '📦' },
    ],
    sales: [
      { path: '/sales', label: t('sales'), icon: '💰' },
      { path: '/sales-list', label: t('salesList'), icon: '📋' },
    ],
    management: [
      { path: '/inventory', label: t('inventory'), icon: '📊' },
      { path: '/returns', label: t('returnsManagement'), icon: '🔄' },
      { path: '/suppliers', label: t('suppliersManagement'), icon: '👥' },
      { path: '/purchase-invoices', label: t('purchaseInvoices'), icon: '📄' },
      { path: '/expenses', label: t('expensesManagement'), icon: '💸' },
    ],
    reports: [
      { path: '/profit-loss', label: t('profitLoss'), icon: '📈' },
      { path: '/reports', label: t('reports'), icon: '📊' },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">🛒</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Grocery POS
              </h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 rtl:space-x-reverse">
              {/* Main Links */}
              {navigationGroups.main.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 rtl:space-x-reverse ${
                    isActive(item.path)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}

              {/* Sales Dropdown */}
              <div className="relative group">
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 rtl:space-x-reverse ${
                    isActive('/sales') || isActive('/sales-list')
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onMouseEnter={() => setSalesMenuOpen(true)}
                  onMouseLeave={() => setSalesMenuOpen(false)}
                >
                  <span>💰</span>
                  <span>{t('sales')}</span>
                  <span>▼</span>
                </button>
                {salesMenuOpen && (
                  <div
                    className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    onMouseEnter={() => setSalesMenuOpen(true)}
                    onMouseLeave={() => setSalesMenuOpen(false)}
                  >
                    {navigationGroups.sales.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setSalesMenuOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="mr-2 rtl:ml-2">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Management Dropdown */}
              <div className="relative group">
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 rtl:space-x-reverse ${
                    navigationGroups.management.some(item => isActive(item.path))
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onMouseEnter={() => setManagementMenuOpen(true)}
                  onMouseLeave={() => setManagementMenuOpen(false)}
                >
                  <span>⚙️</span>
                  <span>{t('management')}</span>
                  <span>▼</span>
                </button>
                {managementMenuOpen && (
                  <div
                    className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    onMouseEnter={() => setManagementMenuOpen(true)}
                    onMouseLeave={() => setManagementMenuOpen(false)}
                  >
                    {navigationGroups.management.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setManagementMenuOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="mr-2 rtl:ml-2">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Reports Dropdown */}
              <div className="relative group">
                <button
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 rtl:space-x-reverse ${
                    navigationGroups.reports.some(item => isActive(item.path))
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  onMouseEnter={() => setReportsMenuOpen(true)}
                  onMouseLeave={() => setReportsMenuOpen(false)}
                >
                  <span>📊</span>
                  <span>{t('reports')}</span>
                  <span>▼</span>
                </button>
                {reportsMenuOpen && (
                  <div
                    className="absolute top-full left-0 rtl:left-auto rtl:right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    onMouseEnter={() => setReportsMenuOpen(true)}
                    onMouseLeave={() => setReportsMenuOpen(false)}
                  >
                    {navigationGroups.reports.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setReportsMenuOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="mr-2 rtl:ml-2">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Settings */}
              <Link
                to="/settings"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 rtl:space-x-reverse ${
                  isActive('/settings')
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span>⚙️</span>
                <span>{t('settings')}</span>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span className="text-2xl">☰</span>
            </button>

            {/* User Actions */}
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
              >
                {language === 'en' ? '🇸🇦' : '🇬🇧'}
              </button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              {/* User Info - Compact */}
              <div className="hidden md:flex items-center space-x-2 rtl:space-x-reverse">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="px-4 py-3 space-y-1">
              {navigationGroups.main.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2 rtl:ml-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {t('sales')}
                </p>
                {navigationGroups.sales.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-2 rtl:ml-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {t('management')}
                </p>
                {navigationGroups.management.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-2 rtl:ml-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {t('reports')}
                </p>
                {navigationGroups.reports.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                      isActive(item.path)
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-2 rtl:ml-2">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>

              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive('/settings')
                    ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-2 rtl:ml-2">⚙️</span>
                {t('settings')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('copyright')}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
