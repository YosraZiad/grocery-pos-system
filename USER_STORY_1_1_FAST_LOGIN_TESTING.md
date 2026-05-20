# User Story 1.1 - Fast Login (دليل الاختبار الكامل)

## الهدف من هذا الملف
هذا الدليل يشرح:
- ما الذي تم إضافته في النظام.
- كيف تشغل Seeder خاص بكل حالات اختبار Fast Login.
- كيف تختبر كل حالة مع أمثلة طلبات API.
- ما هي النتيجة المتوقعة لكل حالة.

## ما تم تنفيذه

### على مستوى Backend
- دعم تسجيل الدخول بطريقتين:
  - Username/Email + Password
  - Barcode (القيمة تبدأ بـ EMP-)
- قفل الحساب بعد 3 محاولات فاشلة (مدة القفل 15 دقيقة).
- تسجيل وقت الدخول من السيرفر last_login_at وإرجاع login_at_server.

الملف الأساسي:
- backend/app/Http/Controllers/AuthController.php

### على مستوى قاعدة البيانات
تمت إضافة أعمدة في users:
- username
- employee_barcode
- failed_login_attempts
- locked_until
- last_login_at

ملف المايجريشن:
- backend/database/migrations/2026_05_17_000001_add_fast_login_fields_to_users_table.php

### Seeder جديد لكل حالات الاختبار
تم إنشاء Seeder مخصص:
- backend/database/seeders/FastLoginTestCasesSeeder.php

وتم ربطه داخل:
- backend/database/seeders/DatabaseSeeder.php

## تشغيل النظام والبيانات

## 1) تشغيل المايجريشن
داخل مجلد backend:

```bash
php artisan migrate
```

## 2) إدخال بيانات الاختبار
لإدخال كل الحالات:

```bash
php artisan db:seed
```

أو تشغيل Seeder الخاص فقط:

```bash
php artisan db:seed --class=FastLoginTestCasesSeeder
```

## 3) تشغيل الخادم
```bash
php artisan serve
```

## 4) تشغيل الواجهة
داخل مجلد frontend:

```bash
npm run dev
```

افتح:
- http://localhost:5173/login

## حالات الاختبار الجاهزة من Seeder

جميع المستخدمين كلمة المرور لهم:
- password

### الحالة 1: نجاح تسجيل الدخول العادي
- email: fastlogin.active@example.com
- username: fast_active
- employee_barcode: EMP-100001
- الحالة: active

### الحالة 2: نجاح تسجيل الدخول بالباركود
- email: fastlogin.barcode@example.com
- username: fast_barcode
- employee_barcode: EMP-100002
- الحالة: active

### الحالة 3: مستخدم عنده محاولتان فاشلتان مسبقا
- email: fastlogin.twofails@example.com
- username: fast_twofails
- employee_barcode: EMP-100003
- failed_login_attempts: 2
- الحالة: المحاولة الفاشلة التالية تقفل الحساب مباشرة

### الحالة 4: مستخدم مقفول حاليا
- email: fastlogin.locked@example.com
- username: fast_locked
- employee_barcode: EMP-100004
- failed_login_attempts: 3
- locked_until: بعد 15 دقيقة من وقت seeding
- الحالة: أي محاولة دخول ترجع 423

### الحالة 5: قفل منتهي (Expired Lock)
- email: fastlogin.expiredlock@example.com
- username: fast_expired
- employee_barcode: EMP-100005
- failed_login_attempts: 3
- locked_until: وقت قديم (منتهي)
- الحالة: يسمح بالدخول ويصفر العدادات بعد النجاح

### الحالة 6: حساب مدير للتأكد من أدوار الصلاحيات
- email: fastlogin.admin@example.com
- username: fast_admin
- employee_barcode: EMP-100006
- الحالة: active + role admin

## سيناريوهات الاختبار مع النتائج المتوقعة

## السيناريو A: تسجيل دخول Username/Password ناجح
الطلب:

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "fast_active",
  "password": "password",
  "login_method": "username_password"
}
```

المتوقع:
- Status: 200
- message = Login successful
- login_method = username_password
- يوجد token
- يوجد login_at_server
- يتم تحديث last_login_at في قاعدة البيانات

## السيناريو B: تسجيل دخول Barcode ناجح
الطلب:

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "EMP-100002",
  "login_method": "barcode"
}
```

المتوقع:
- Status: 200
- login_method = barcode
- نجاح بدون إرسال password

## السيناريو C: فشل كلمة المرور قبل القفل (من 2 إلى 3)
استخدم المستخدم fast_twofails مع كلمة مرور خطأ:

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "fast_twofails",
  "password": "wrong-password",
  "login_method": "username_password"
}
```

المتوقع:
- Status: 423 مباشرة (لأنه كان بالفعل على attempt=2)
- message = Account locked after 3 failed attempts
- attempts_remaining = 0
- يوجد locked_until

## السيناريو D: محاولة دخول على حساب مقفول
استخدم fast_locked بأي طريقة دخول:

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "fast_locked",
  "password": "password",
  "login_method": "username_password"
}
```

المتوقع:
- Status: 423
- message = Account is locked due to multiple failed attempts
- يوجد locked_until
- يوجد retry_after_seconds

## السيناريو E: قفل منتهي ثم دخول ناجح
استخدم fast_expired:

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "fast_expired",
  "password": "password",
  "login_method": "username_password"
}
```

المتوقع:
- Status: 200
- نجاح الدخول
- failed_login_attempts يصبح 0
- locked_until يصبح null

## السيناريو F: باركود غير موجود

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "EMP-999999",
  "login_method": "barcode"
}
```

المتوقع:
- Status: 401
- message = Invalid credentials

## السيناريو G: تحقق من UX على الواجهة
1. افتح /login
2. تأكد أن المؤشر في حقل identifier تلقائيا.
3. جرب Enter في تسجيل دخول عادي.
4. الصق EMP-100002 وتابع الإرسال التلقائي.

المتوقع:
- لا حاجة لاستخدام الماوس.
- الحقول والأزرار مناسبة للموبايل واللمس.
- نفس الصفحة تعمل بسلاسة على الشاشات الصغيرة والكبيرة.

## مثال استجابة نجاح

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Fast Login Active"
  },
  "token": "1|xxxxxxxx",
  "tenant_id": 1,
  "login_method": "username_password",
  "login_at_server": "2026-05-17T12:20:01+00:00"
}
```

## مثال استجابة قفل

```json
{
  "message": "Account is locked due to multiple failed attempts",
  "locked_until": "2026-05-17T12:40:01+00:00",
  "retry_after_seconds": 882
}
```

## SQL سريع للتحقق من الحالة في قاعدة البيانات

```sql
SELECT
  email,
  username,
  employee_barcode,
  failed_login_attempts,
  locked_until,
  last_login_at
FROM users
WHERE email LIKE 'fastlogin.%@example.com'
ORDER BY email;
```

## مشاكل شائعة

### 1) خطأ Validation على username أو barcode unique
السبب:
- تم تشغيل Seeder أكثر من مرة مع تغييرات يدوية في نفس القيم.

الحل:
- هذا Seeder يستخدم updateOrCreate، غالبا لا يحتاج حذف.
- تأكد أنك لم تنشئ قيما متعارضة يدويا على نفس unique fields.

### 2) الباركود لا يعمل من الواجهة
- تأكد أن القيمة تبدأ بـ EMP-.
- تأكد أن الحقل عليه focus.
- تأكد أن الحساب له employee_barcode مطابق.

### 3) الحساب ما زال مقفول
- locked_until لم ينته بعد.
- اختبر بحساب active أو انتظر انتهاء مدة القفل.

## ملفات تم تعديلها لهذا الطلب
- backend/database/seeders/FastLoginTestCasesSeeder.php
- backend/database/seeders/DatabaseSeeder.php
- backend/database/seeders/UserSeeder.php
- USER_STORY_1_1_FAST_LOGIN_TESTING.md
