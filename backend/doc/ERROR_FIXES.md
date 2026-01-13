# 🔧 إصلاح الأخطاء

## 📋 الأخطاء التي تم إصلاحها

**تاريخ الإصلاح:** 2026-01-12

---

## ❌ الخطأ 1: 403 Forbidden عند تحديث Category

### المشكلة:
```
PUT http://localhost:8000/api/categories/6 403 (Forbidden)
```

### السبب:
- تم تغيير `guard_name` من `sanctum` إلى `web` في `RealisticDataSeeder`
- لكن API routes تستخدم `sanctum` guard
- الأدوار والصلاحيات يجب أن تكون بنفس guard_name الذي يستخدمه API

### الحل:
✅ تم إرجاع `guard_name` إلى `sanctum` في:
- `backend/database/seeders/RealisticDataSeeder.php`
- `backend/database/seeders/RolePermissionSeeder.php`
- `backend/database/seeders/UserSeeder.php`

---

## ❌ الخطأ 2: 500 Internal Server Error في Dashboard Stats

### المشكلة:
```
GET http://localhost:8000/api/dashboard/stats?period=today 500 (Internal Server Error)
```

### السبب:
1. استخدام `low_stock_threshold` بدلاً من `min_stock_alert` في Query
2. مشكلة في `whereBetween` مع `date` field في Expenses
3. عدم إضافة `tenant_id` filter في DB::table queries

### الحل:
✅ تم إصلاح:
1. تغيير `low_stock_threshold` إلى `min_stock_alert` في DashboardController
2. تغيير `whereBetween` إلى `whereDate` في Expenses query
3. إضافة `tenant_id` filter في جميع DB::table queries

---

## ✅ التغييرات المطبقة

### 1. RealisticDataSeeder.php
```php
// قبل
$adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);

// بعد
$adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
```

### 2. RolePermissionSeeder.php
```php
// قبل
Permission::firstOrCreate(['name' => $permission]);
Role::firstOrCreate(['name' => 'admin']);

// بعد
Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
```

### 3. UserSeeder.php
```php
// قبل
$admin->assignRole('admin');

// بعد
$admin->assignRole(\Spatie\Permission\Models\Role::firstOrCreate([
    'name' => 'admin',
    'guard_name' => 'sanctum'
]));
```

### 4. DashboardController.php
```php
// قبل
$lowStockProducts = Product::where('quantity', '<=', DB::raw('low_stock_threshold'))->count();
$expenses = Expense::whereBetween('date', [...]);

// بعد
$lowStockProducts = Product::whereColumn('quantity', '<=', 'min_stock_alert')->count();
$expenses = Expense::whereDate('date', '>=', ...)->whereDate('date', '<=', ...);

// إضافة tenant_id filter في DB::table queries
->where('sales.tenant_id', config('tenant_id'))
```

---

## 🚀 خطوات إعادة التشغيل

بعد الإصلاحات، يجب:

1. **مسح Cache:**
```bash
php artisan config:clear
php artisan cache:clear
```

2. **إعادة تشغيل Migrations و Seeders:**
```bash
php artisan migrate:fresh --seed
```

3. **تسجيل الدخول مرة أخرى:**
- تأكد من تسجيل الخروج ثم الدخول مرة أخرى
- هذا يضمن أن Token جديد يتم إنشاؤه

---

## ✅ النتيجة المتوقعة

بعد الإصلاحات:
- ✅ لا توجد أخطاء 403 Forbidden
- ✅ Dashboard Stats يعمل بشكل صحيح
- ✅ جميع الصلاحيات تعمل بشكل صحيح
- ✅ تحديث Categories يعمل

---

**آخر تحديث:** 2026-01-12  
**الحالة:** ✅ تم إصلاح جميع الأخطاء
