/**
 * صفحة الرئيسية
 */
function Home() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          مرحباً بك في نظام إدارة المتجر
        </h2>
        <p className="text-gray-600">
          نظام متكامل لإدارة متجر المواد الغذائية مع نظام نقاط البيع وإدارة المخزون.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📦 إدارة المنتجات
          </h3>
          <p className="text-gray-600 text-sm">
            إدارة المنتجات والأقسام والمخزون
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            💰 شاشة المبيعات
          </h3>
          <p className="text-gray-600 text-sm">
            نظام نقاط البيع للبيع السريع
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📊 التقارير
          </h3>
          <p className="text-gray-600 text-sm">
            تقارير شاملة عن المبيعات والأرباح
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;
