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

## 🛠️ التقنيات المستخدمة

### Backend
- **Laravel 10+** - REST API
- **MySQL** - قاعدة البيانات
- **Laravel Sanctum** - Authentication
- **Spatie Permissions** - Roles & Permissions
- **DomPDF** - طباعة التقارير (PDF Export)

### Frontend
- **React 18+** - واجهة المستخدم
- **Vite** - Build Tool
- **React Router** - Routing
- **Context API** - State Management (بدل Zustand/Redux) ✅
- **React Query** - Data Fetching
- **Recharts** - Charts & Visualizations
- **React Hook Form** - Form Management

### Architecture
- **Multi-Tenant** - Single Database + tenant_id
- **Global Scope** - على جميع Models ⚠️ مهم جدًا
- **RESTful API** - Backend API
- **JWT Authentication** - API Tokens

## 📁 ملفات المشروع

### 📄 الوثائق
1. **[PROJECT_PLAN_15_DAYS.md](./PROJECT_PLAN_15_DAYS.md)** - خطة العمل التفصيلية لمدة 15 يوم
2. **[TECHNICAL_DETAILS.md](./TECHNICAL_DETAILS.md)** - التفاصيل التقنية (Database Schema, API Endpoints)
3. **[CODE_TEMPLATES.md](./CODE_TEMPLATES.md)** - قوالب الكود الجاهزة
4. **[DAILY_CHECKLIST.md](./DAILY_CHECKLIST.md)** - قائمة التحقق اليومية

## 🚀 البدء السريع

### المتطلبات
- PHP >= 8.1
- Composer
- Node.js >= 18
- MySQL >= 8.0
- Git

### تثبيت Backend

```bash
# إنشاء مشروع Laravel
composer create-project laravel/laravel grocery-pos-backend
cd grocery-pos-backend

# تثبيت الحزم المطلوبة
composer require laravel/sanctum
composer require spatie/laravel-permission
composer require barryvdh/laravel-dompdf

# إعداد قاعدة البيانات
# تحديث ملف .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=grocery_pos
DB_USERNAME=root
DB_PASSWORD=

# تشغيل Migrations
php artisan migrate

# تشغيل Seeders
php artisan db:seed

# تشغيل الخادم
php artisan serve
```

### تثبيت Frontend

```bash
# إنشاء مشروع React
npm create vite@latest grocery-pos-frontend -- --template react
cd grocery-pos-frontend

# تثبيت الحزم المطلوبة
npm install
npm install axios react-router-dom react-hook-form @tanstack/react-query recharts react-hot-toast

# ❌ لا Zustand ولا Redux - Context API فقط

# إعداد Environment Variables
# إنشاء ملف .env
VITE_API_URL=http://localhost:8000/api

# تشغيل التطبيق
npm run dev
```

## 📅 خطة العمل (15 يوم)

### الأسبوع الأول (الأيام 1-7)
- **اليوم 1**: إعداد المشروع والبنية الأساسية + BaseModel مع Global Scope
- **اليوم 2**: نظام المصادقة والصلاحيات
- **اليوم 3**: إدارة الأقسام والمنتجات
- **اليوم 4**: Inventory Transactions + شاشة المبيعات - الجزء الأول
- **اليوم 5**: شاشة المبيعات - الجزء الثاني (HTML Invoice)
- **اليوم 6**: إدارة المخزون
- **اليوم 7**: المرتجعات

### الأسبوع الثاني (الأيام 8-14)
- **اليوم 8**: الموردون
- **اليوم 9**: المصروفات
- **اليوم 10**: الأرباح والخسائر (On-The-Fly)
- **اليوم 11**: التقارير - الجزء الأول
- **اليوم 12**: التقارير - الجزء الثاني (PDF Export فقط)
- **اليوم 13**: الإعدادات
- **اليوم 14**: Dashboard وتحسينات UX

### الأسبوع الثالث (اليوم 15)
- **اليوم 15**: الاختبارات النهائية والتحسينات

للتفاصيل الكاملة، راجع [PROJECT_PLAN_15_DAYS.md](./PROJECT_PLAN_15_DAYS.md)

## 🧩 المكونات الرئيسية

### 1. نظام تسجيل الدخول
- تسجيل دخول/خروج
- صلاحيات (مدير، كاشير)
- Multi-tenant support
- Context API للمصادقة

### 2. شاشة المبيعات (POS)
- قراءة الباركود
- البحث السريع
- إدارة السلة
- الخصومات
- طرق الدفع (كاش، بطاقة، تحويل)
- طباعة الفواتير (HTML)

### 3. إدارة المنتجات
- CRUD للمنتجات
- الأقسام
- الباركود
- أسعار الشراء والبيع
- تواريخ الصلاحية
- تنبيهات المخزون

### 4. إدارة المخزون
- Inventory Transactions (قبل Sales)
- عرض الكميات
- تنبيهات النفاد
- تنبيهات الصلاحية
- سجل الحركة

### 5. المرتجعات
- إرجاع من زبون
- إرجاع لمورّد
- تحديث المخزون تلقائيًا
- Inventory Transaction تلقائي

### 6. الأرباح والخسائر
- حساب تلقائي للأرباح (On-The-Fly)
- تقارير يومية/شهرية
- حسب منتج/قسم
- ❌ لا table للأرباح (حساب مباشر)

### 7. المصروفات
- إدارة المصروفات
- أقسام المصروفات
- تقارير المصروفات

### 8. الموردون
- إدارة الموردين
- فواتير الشراء
- متابعة الديون
- Inventory Transaction عند الشراء

### 9. التقارير
- أفضل المنتجات مبيعًا
- المنتجات الضعيفة
- مبيعات حسب الوقت
- خسائر الصلاحية
- Export PDF ✅
- ❌ Excel Export لاحقًا
- ❌ Monthly Comparison لاحقًا

### 10. الإعدادات
- إعدادات المتجر
- الشعار
- العملة
- إعدادات الطابعة
- النسخ الاحتياطي

## 🔐 الأمان

- ✅ JWT Authentication
- ✅ Role-based Permissions
- ✅ Multi-tenant Isolation
- ✅ **Global Scope على جميع Models** ⚠️
- ✅ Input Validation
- ✅ SQL Injection Protection
- ✅ XSS Protection
- ✅ CSRF Protection

## 📊 Database Schema

النظام يستخدم MySQL مع Multi-tenant architecture (Single DB + tenant_id).

**ملاحظات مهمة:**
- ✅ Inventory Transactions قبل Sales
- ❌ لا profit_loss_reports table (حساب On-The-Fly)

للتفاصيل الكاملة، راجع [TECHNICAL_DETAILS.md](./TECHNICAL_DETAILS.md)

## 🔌 API Endpoints

جميع APIs تتبع RESTful conventions وتستخدم JWT للـ authentication.

**ملاحظات:**
- Invoice HTML بدل PDF معقد
- Profit/Loss On-The-Fly

للتفاصيل الكاملة، راجع [TECHNICAL_DETAILS.md](./TECHNICAL_DETAILS.md)

## 💻 قوالب الكود

للحصول على قوالب جاهزة للاستخدام، راجع [CODE_TEMPLATES.md](./CODE_TEMPLATES.md)

**ملاحظات:**
- BaseModel مع Global Scope
- Context API بدل Zustand/Redux
- HTML Invoice
- Inventory Transactions

## ✅ قائمة التحقق

للتأكد من إكمال جميع المهام، استخدم [DAILY_CHECKLIST.md](./DAILY_CHECKLIST.md)

## 🧪 الاختبارات

### Backend Tests
```bash
php artisan test
```

### Frontend Tests
```bash
npm run test
```

## 📦 Deployment

### Backend
1. تحديث `.env` للإنتاج
2. `php artisan config:cache`
3. `php artisan route:cache`
4. `php artisan migrate --force`
5. إعداد Queue Workers
6. إعداد Cron Jobs

### Frontend
1. `npm run build`
2. رفع ملفات `dist/` للخادم
3. إعداد Nginx/Apache

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
- راجع الوثائق في الملفات المرفقة

## 🎯 خارطة الطريق المستقبلية

- [ ] تطبيق Mobile (React Native)
- [ ] نظام العملاء والولاء
- [ ] تكامل مع أنظمة الدفع الإلكتروني
- [ ] تقارير متقدمة مع AI
- [ ] نظام الجرد التلقائي
- [ ] تكامل مع الموردين (API)
- [ ] Excel Export
- [ ] Monthly Comparison Reports

---

## ⚠️ ملاحظات مهمة

### التعديلات المطبقة:
1. ✅ **Context API** بدل Zustand/Redux
2. ✅ **Inventory Transactions** قبل Sales (يوم 4)
3. ✅ **Profit/Loss On-The-Fly** (لا table)
4. ✅ **HTML Invoice** بدل PDF معقد
5. ✅ **PDF Export فقط** (Excel لاحقًا)
6. ✅ **Global Scope** على جميع Models
7. ✅ **Monthly Comparison لاحقًا**

---

**تم التطوير بواسطة:** [Your Name]  
**التاريخ:** 2024  
**الإصدار:** 1.0.0

---

## 📚 مصادر إضافية

- [Laravel Documentation](https://laravel.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [React Query Documentation](https://tanstack.com/query)

---

**Happy Coding! 🚀**
