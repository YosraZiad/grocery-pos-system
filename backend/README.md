# 🛒 Grocery Store POS & Inventory System - Backend

نظام متكامل لإدارة متجر مواد غذائية (سوبرماركت / بقالة كبيرة) مع نظام نقاط البيع (POS) وإدارة المخزون.

## 📋 نظرة عامة

هذا المشروع عبارة عن Backend API مبني بـ Laravel لنظام إدارة متجر مواد غذائية يتضمن:
- ✅ نظام نقاط البيع (POS) للبيع السريع
- ✅ إدارة كاملة للمخزون
- ✅ متابعة تواريخ الصلاحية
- ✅ حساب الأرباح والخسائر الحقيقية (On-The-Fly)
- ✅ نظام Multi-Tenant للتوسع المستقبلي
- ✅ تقارير احترافية شاملة

## 🛠️ التقنيات المستخدمة

- **Laravel 12** - REST API Framework
- **MySQL** - قاعدة البيانات
- **Laravel Sanctum** - Authentication
- **Spatie Permissions** - Roles & Permissions
- **Multi-Tenant Architecture** - Single Database + tenant_id

## 📁 بنية المشروع

```
grocery-pos-backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── AuthController.php
│   │   └── Middleware/
│   │       └── TenantMiddleware.php
│   └── Models/
│       ├── BaseModel.php
│       ├── Tenant.php
│       └── User.php
├── database/
│   ├── migrations/
│   └── seeders/
├── doc/
│   ├── PROJECT_PLAN_15_DAYS.md
│   ├── TECHNICAL_DETAILS.md
│   ├── CODE_TEMPLATES.md
│   └── DAY1_SUMMARY.md
└── routes/
    └── api.php
```

## 🚀 البدء السريع

### المتطلبات
- PHP >= 8.2
- Composer
- MySQL >= 8.0
- Node.js >= 18 (لـ Frontend assets)

### التثبيت

1. استنساخ المشروع:
```bash
git clone https://github.com/yourusername/grocery-pos-backend.git
cd grocery-pos-backend
```

2. تثبيت الحزم:
```bash
composer install
```

3. إعداد البيئة:
```bash
cp .env.example .env
php artisan key:generate
```

4. إعداد قاعدة البيانات:
تحديث ملف `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=grocery_pos
DB_USERNAME=root
DB_PASSWORD=
```

5. تشغيل Migrations و Seeders:
```bash
php artisan migrate:fresh --seed
```

6. تشغيل الخادم:
```bash
php artisan serve
```

API سيعمل على: `http://localhost:8000`

## 📚 الوثائق

الوثائق الكاملة موجودة في مجلد `doc/`:
- **[PROJECT_PLAN_15_DAYS.md](./doc/PROJECT_PLAN_15_DAYS.md)** - خطة العمل التفصيلية
- **[TECHNICAL_DETAILS.md](./doc/TECHNICAL_DETAILS.md)** - التفاصيل التقنية
- **[CODE_TEMPLATES.md](./doc/CODE_TEMPLATES.md)** - قوالب الكود
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - دليل الاختبار

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

## 🏗️ Architecture

### Multi-Tenant
- Single Database مع `tenant_id` في كل جدول
- Global Scope على جميع Models
- TenantMiddleware للتحقق من tenant_id

### Authentication
- Laravel Sanctum للـ API tokens
- Spatie Permissions للـ Roles & Permissions

## 📅 حالة المشروع

- ✅ **اليوم 1**: إعداد المشروع والبنية الأساسية
- ✅ **اليوم 2**: نظام المصادقة والصلاحيات
- ⏳ **اليوم 3-15**: قيد التطوير...

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
- راجع الوثائق في مجلد `doc/`

---

**تم التطوير بواسطة:** [Your Name]  
**التاريخ:** 2026  
**الإصدار:** 1.0.0
