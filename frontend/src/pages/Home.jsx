import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';

/**
 * صفحة الرئيسية - Dashboard حديث واحترافي
 */
function Home() {
  const { t } = useI18n();

  // جلب إحصائيات المخزون
  const { data: inventoryStats } = useQuery({
    queryKey: ['inventory', 'stats'],
    queryFn: async () => {
      const response = await api.get('/inventory/stats');
      return response.data.data;
    },
  });

  // جلب عدد المنتجات
  const { data: productsData } = useQuery({
    queryKey: ['products', 'count'],
    queryFn: async () => {
      const response = await api.get('/products?per_page=1');
      return response.data;
    },
  });

  // جلب مبيعات اليوم
  const today = new Date().toISOString().split('T')[0];
  const { data: todaySales } = useQuery({
    queryKey: ['sales', 'today', today],
    queryFn: async () => {
      const response = await api.get(`/sales?from=${today}&to=${today}`);
      return response.data;
    },
  });

  const features = [
    {
      icon: '📦',
      title: t('productManagement'),
      description: t('productManagementDesc'),
      link: '/products',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: '💰',
      title: t('salesScreen'),
      description: t('salesScreenDesc'),
      link: '/sales',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: '📊',
      title: t('reports'),
      description: t('reportsDesc'),
      link: '#',
      color: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white border-0 shadow-xl">
        <div className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('welcome')}
          </h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto">
            {t('welcomeDesc')}
        </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Link
            key={index}
            to={feature.link}
            className="group"
          >
            <div className="card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full">
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
                {feature.title}
          </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
              <div className="mt-4 flex items-center text-primary-600 dark:text-primary-400 font-medium text-sm group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform duration-200">
                {t('home')} →
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link to="/products" className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('totalProducts')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {productsData?.total || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
              📦
            </div>
          </div>
        </Link>

        <Link to="/sales" className="card bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('todaySales')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todaySales?.total || 0}
          </p>
        </div>
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-2xl">
              💰
            </div>
          </div>
        </Link>

        <Link to="/inventory" className="card bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('lowStock')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inventoryStats?.low_stock_count || 0}
          </p>
        </div>
            <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center text-2xl">
              ⚠️
            </div>
          </div>
        </Link>

        <Link to="/inventory" className="card bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('expiringSoon')}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {inventoryStats?.expiring_soon_count || 0}
          </p>
        </div>
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center text-2xl">
              ⏰
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Home;
