import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../context/I18nContext";
import { useTheme } from "../context/ThemeContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faBox,
  faCartShopping,
  faChartColumn,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faDoorOpen,
  faFileInvoice,
  faGear,
  faHouse,
  faKey,
  faListCheck,
  faMoon,
  faMoneyBill,
  faMoneyBillTransfer,
  faRightLeft,
  faSun,
  faUser,
  faUserShield,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import Tooltip from "../components/Tooltip";

/**
 * Layout حديث واحترافي بمخطط جانبي قابل للطي (Collapsible Sidebar Layout)
 */
function Layout() {
  const { user, logout, lockSession, hasPermission } = useAuth();
  const { t, language, toggleLanguage } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("pos_sidebar_collapsed") === "true";
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  // حفظ واسترجاع حالة انكماش القائمة الجانبية
  const toggleSidebar = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("pos_sidebar_collapsed", String(next));
      return next;
    });
  };

  // إغلاق القوائم عند تغيير المسار
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // إغلاق قائمة المستخدم عند الضغط في الخارج
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest(".user-menu-container")) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  // المجموعات البرمجية وقنوات التنقل مفلترة بالصلاحيات
  const navigationGroups = {
    main: [
      { path: "/", label: t("home"), icon: faHouse },
      ...(hasPermission("view products") ? [{ path: "/products", label: t("products"), icon: faBox }] : []),
    ],
    sales: [
      ...(hasPermission("create sales") ? [{ path: "/sales", label: t("sales"), icon: faMoneyBill }] : []),
      ...(hasPermission("view sales") ? [{ path: "/sales-list", label: t("salesList"), icon: faListCheck }] : []),
      ...(hasPermission("create returns") ? [{ path: "/sales-returns", label: t("salesReturns") || "مرتجع المبيعات", icon: faRightLeft }] : []),
    ],
    management: [
      ...(hasPermission("view sales") ? [{ path: "/customers", label: t("customersManagement") || "إدارة العملاء", icon: faUsers }] : []),
      ...(hasPermission("view inventory") ? [{ path: "/inventory", label: t("inventory"), icon: faChartColumn }] : []),
      ...(hasPermission("view returns") ? [{ path: "/returns", label: t("returnsManagement"), icon: faRightLeft }] : []),
      ...(hasPermission("view suppliers") ? [{ path: "/suppliers", label: t("suppliersManagement"), icon: faUsers }] : []),
      ...(hasPermission("view purchases") ? [{ path: "/purchase-invoices", label: t("purchaseInvoices"), icon: faFileInvoice }] : []),
      ...(hasPermission("view expenses") ? [{ path: "/expenses", label: t("expensesManagement"), icon: faMoneyBillTransfer }] : []),
    ],
    reports: [
      ...(hasPermission("view reports") ? [
        { path: "/profit-loss", label: t("profitLoss"), icon: faChartColumn },
        { path: "/reports", label: t("reports"), icon: faChartColumn },
      ] : []),
    ],
    admin: [
      ...(hasPermission("view users") ? [{ path: "/users", label: t("usersManagement"), icon: faUsers }] : []),
      ...(hasPermission("view roles") ? [{ path: "/roles", label: t("rolesAndPermissions"), icon: faKey }] : []),
    ],
  };

  const renderSidebarLinks = (isMobile = false) => {
    const showLabels = !isCollapsed || isMobile;

    return (
      <div className="space-y-6 py-4">
        {Object.entries(navigationGroups).map(([groupKey, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={groupKey} className="space-y-1 px-3">
              {showLabels ? (
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
                  {t(groupKey)}
                </p>
              ) : (
                <div className="border-b border-gray-200 dark:border-gray-700/50 my-3 mx-2" />
              )}

              {items.map((item) => {
                const linkContent = (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center rounded-xl transition-all duration-200 ${
                      showLabels ? "px-4 py-2.5 space-x-3 rtl:space-x-reverse" : "p-3 justify-center"
                    } ${
                      isActive(item.path)
                        ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <FontAwesomeIcon icon={item.icon} className={showLabels ? "text-base" : "text-xl"} />
                    {showLabels && <span className="font-medium text-sm">{item.label}</span>}
                  </Link>
                );

                return showLabels ? (
                  linkContent
                ) : (
                  <Tooltip key={item.path} label={item.label} position="top">
                    {linkContent}
                  </Tooltip>
                );
              })}
            </div>
          );
        })}

        {/* زر الإعدادات أسفل قائمة الخيارات */}
        {hasPermission("view settings") && (
          <div className="px-3 pt-4 border-t border-gray-200 dark:border-gray-700/50">
            {(() => {
              const settingsLink = (
                <Link
                  to="/settings"
                  className={`flex items-center rounded-xl transition-all duration-200 ${
                    showLabels ? "px-4 py-2.5 space-x-3 rtl:space-x-reverse" : "p-3 justify-center"
                  } ${
                    isActive("/settings")
                      ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/20"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <FontAwesomeIcon icon={faGear} className={showLabels ? "text-base" : "text-xl"} />
                  {showLabels && <span className="font-medium text-sm">{t("settings")}</span>}
                </Link>
              );

              return showLabels ? (
                settingsLink
              ) : (
                <Tooltip label={t("settings")} position="top">
                  {settingsLink}
                </Tooltip>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  const drawerClasses = language === "en"
    ? `left-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`
    : `right-0 ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`;

  return (
    <div className="min-h-screen flex flex-row bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-x-hidden">
      
      {/* 1. الشريط الجانبي المكتبي (Desktop Collapsible Sidebar) */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-gray-800 border-e border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        } h-screen sticky top-0 z-30`}
      >
        {/* هيدر الشريط الجانبي */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700/50">
          <div className="flex items-center space-x-3 rtl:space-x-reverse truncate">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <FontAwesomeIcon icon={faCartShopping} className="text-white text-xl" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {t("appName")}
              </span>
            )}
          </div>
        </div>

        {/* محتوى الروابط والتبويبات */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {renderSidebarLinks()}
        </div>

        {/* زر الطي والفتح أسفل الشريط الجانبي */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700/50 flex justify-center">
          <button
            onClick={toggleSidebar}
            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600/50 text-gray-600 dark:text-gray-300 flex items-center justify-center transition-colors duration-200"
            title={isCollapsed ? t("expand") || "Expand" : t("collapse") || "Collapse"}
          >
            <FontAwesomeIcon
              icon={
                isCollapsed
                  ? language === "en"
                    ? faChevronRight
                    : faChevronLeft
                  : language === "en"
                    ? faChevronLeft
                    : faChevronRight
              }
            />
          </button>
        </div>
      </aside>

      {/* 2. شاشة التنقل الجانبية للهواتف (Mobile Sliding Drawer) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300"
        />
      )}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 w-64 bg-white dark:bg-gray-800 z-50 shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col ${drawerClasses}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faCartShopping} className="text-white text-xl" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {t("appName")}
            </span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="rtl:rotate-180" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {renderSidebarLinks(true)}
        </div>
      </aside>

      {/* 3. حاوي المحتوى الرئيسي (Main Content Wrapper) */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* شريط الإجراءات العلوي (Top Navbar) */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 sticky top-0 z-40 transition-colors duration-200 shadow-sm">
          {/* الجانب الأيمن (أو الأيسر LTR): زر القائمة للهاتف واسم المتجر */}
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FontAwesomeIcon icon={faBars} className="text-xl" />
            </button>
            <div>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-lg">
                {user?.tenant?.name || t("appName")}
              </span>
            </div>
          </div>

          {/* الجانب الأيسر (أو الأيمن LTR): أدوات اللغة والمظهر وقفل الجلسة والبروفايل */}
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            {/* زر تبديل اللغة */}
            <Tooltip label={language === "en" ? t("switchToArabic") : t("switchToEnglish")} position="bottom">
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-lg"
                aria-label="Language Toggle"
              >
                {language === "en" ? "🇸🇦" : "🇬🇧"}
              </button>
            </Tooltip>

            {/* زر تبديل المظهر */}
            <Tooltip label={theme === "light" ? t("darkMode") : t("lightMode")} position="bottom">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Theme Toggle"
              >
                <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} className="text-lg" />
              </button>
            </Tooltip>

            {/* زر قفل المحطة يدوياً */}
            <Tooltip label={t("lockSession")} position="bottom">
              <button
                onClick={lockSession}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Lock Session"
              >
                <FontAwesomeIcon icon={faUserShield} className="text-lg" />
              </button>
            </Tooltip>

            {/* قائمة البروفايل والدخول */}
            <div className="user-menu-container relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white text-sm font-semibold hover:from-primary-600 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none"
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </button>

              {userMenuOpen && (
                <div className="absolute top-full start-auto end-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.name || t("user")}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faUser} className="me-3 rtl:me-0 rtl:ml-3" />
                      <span>{t("profile")}</span>
                    </Link>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-start"
                    >
                      <FontAwesomeIcon icon={faDoorOpen} className="me-3 rtl:me-0 rtl:ml-3" />
                      <span>{t("logout")}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* عرض المحتوى للمسار الحالي */}
        <main className={`flex-1 ${location.pathname === "/sales" ? "p-4 overflow-hidden flex flex-col min-h-0" : "p-6 lg:p-8 overflow-y-auto"}`}>
          <div className={location.pathname === "/sales" ? "w-full h-full flex flex-col flex-1 min-h-0" : "max-w-7xl mx-auto w-full"}>
            <Outlet />
          </div>
        </main>

        {/* الفوتر */}
        {location.pathname !== "/sales" && (
          <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 transition-colors duration-200">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              {t("copyright")}
            </p>
          </footer>
        )}
      </div>
      
    </div>
  );
}

export default Layout;
