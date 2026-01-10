# 🛒 Grocery Store POS & Inventory System

نظام متكامل لإدارة متجر مواد غذائية (سوبرماركت / بقالة كبيرة) مع نظام نقاط البيع (POS) وإدارة المخزون.

## 📋 نظرة عامة

هذا المشروع عبارة عن نظام شامل لإدارة متجر مواد غذائية يتضمن:
- ✅ نظام نقاط البيع (POS) للبيع السريع
- ✅ إدارة كاملة للمخزون
- ✅ متابعة تواريخ الصلاحية
- ✅ حساب الأرباح والخسائر الحقيقية (On-The-Fly)
- ✅ نظام Multi-Tenant للتوسع المستقبلي
- ✅ تقارير احترافية شاملة

## 🏗️ بنية المشروع

```
grocery-pos-system/
├── backend/          # Laravel API
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── ...
├── frontend/         # React Application
│   ├── src/
│   ├── public/
│   └── ...
└── README.md         # هذا الملف
```

## 🛠️ التقنيات المستخدمة

### Backend
- **Laravel 12** - REST API Framework
- **MySQL** - قاعدة البيانات
- **Laravel Sanctum** - Authentication
- **Spatie Permissions** - Roles & Permissions
- **Multi-Tenant Architecture** - Single Database + tenant_id

### Frontend
- **React 19** - واجهة المستخدم
- **Vite** - Build Tool
- **React Router** - Routing
- **React Query** - Data Fetching
- **Axios** - HTTP Client
- **Context API** - State Management (بدل Zustand/Redux)

## 🚀 البدء السريع

### المتطلبات
- PHP >= 8.2
- Composer
- MySQL >= 8.0
- Node.js >= 18

### التثبيت

1. استنساخ المشروع:
```bash
git clone https://github.com/yourusername/grocery-pos-system.git
cd grocery-pos-system
```

2. إعداد Backend:
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate

# تحديث إعدادات قاعدة البيانات في .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=grocery_pos
# DB_USERNAME=root
# DB_PASSWORD=

php artisan migrate:fresh --seed
php artisan serve
```

Backend سيعمل على: `http://localhost:8000`

3. إعداد Frontend:
```bash
cd frontend
npm install
cp .env.example .env
# أو أنشئ ملف .env وأضف:
# VITE_API_URL=http://localhost:8000/api
npm run dev
```

Frontend سيعمل على: `http://localhost:5173`

## 📚 الوثائق

الوثائق الكاملة موجودة في:
- **[PROJECT_PLAN_15_DAYS.md](./backend/doc/PROJECT_PLAN_15_DAYS.md)** - خطة العمل التفصيلية
- **[TECHNICAL_DETAILS.md](./backend/doc/TECHNICAL_DETAILS.md)** - التفاصيل التقنية
- **[TESTING_GUIDE.md](./backend/TESTING_GUIDE.md)** - دليل الاختبار

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

## 👥 الحسابات التجريبية

بعد تشغيل Seeders:
- **مدير**: `admin@example.com` / `password`
- **كاشير**: `cashier@example.com` / `password`

## 📅 حالة المشروع

- ✅ **اليوم 1**: إعداد المشروع والبنية الأساسية
- ✅ **اليوم 2**: نظام المصادقة والصلاحيات
- ⏳ **اليوم 3-15**: قيد التطوير...

## 🧪 الاختبار

راجع [TESTING_GUIDE.md](./backend/TESTING_GUIDE.md) للتفاصيل الكاملة.

## 🤝 المساهمة

1. Fork المشروع
2. إنشاء Branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للـ Branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## 📝 الترخيص

هذا المشروع مفتوح المصدر ومتاح للاستخدام الحر.

## 📞 الدعم

لأي استفسارات أو مشاكل:
- افتح Issue في GitHub
- راجع الوثائق في مجلد `backend/doc/`

---

**تم التطوير بواسطة:** [Your Name]  
**التاريخ:** 2026  
**الإصدار:** 1.0.0
