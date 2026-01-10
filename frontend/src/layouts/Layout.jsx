import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Layout أساسي للتطبيق
 * يحتوي على الهيكل الأساسي للصفحات
 */
function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🛒 Grocery POS
              </h1>
            </div>
            <nav className="flex items-center space-x-4">
              <span className="text-gray-600">
                {user?.name}
              </span>
              {user?.roles && user.roles.length > 0 && (
                <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                  {user.roles[0].name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                تسجيل الخروج
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            © 2024 Grocery POS System. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
