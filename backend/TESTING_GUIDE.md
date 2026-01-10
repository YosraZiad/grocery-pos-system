# 🧪 دليل الاختبار - اليوم الأول والثاني

## 📋 متطلبات الاختبار

### Backend
1. تأكد من تشغيل Laravel API:
   ```bash
   cd c:\wamp64\www\grocery-pos-backend
   php artisan serve
   ```
   API سيعمل على: `http://localhost:8000`

### Frontend
1. تأكد من تشغيل React App:
   ```bash
   cd c:\wamp64\www\grocery-pos-frontend
   npm run dev
   ```
   Frontend سيعمل على: `http://localhost:5173`

2. تأكد من وجود ملف `.env` في `grocery-pos-frontend`:
   ```
   VITE_API_URL=http://localhost:8000/api
   ```

## 🧪 اختبارات اليوم الأول

### 1. اختبار Backend API
```bash
# Test endpoint
curl http://localhost:8000/api/test
```

**النتيجة المتوقعة:**
```json
{
  "message": "API is working",
  "tenant_id": null
}
```

### 2. اختبار CORS
افتح المتصفح وانتقل إلى `http://localhost:5173`
- يجب أن تعمل الصفحة بدون أخطاء CORS

### 3. اختبار Multi-Tenant Middleware
```bash
# بدون tenant_id (يجب أن يفشل)
curl http://localhost:8000/api/test

# مع tenant_id في header
curl -H "X-Tenant-ID: 1" http://localhost:8000/api/test
```

## 🧪 اختبارات اليوم الثاني

### 1. اختبار تسجيل الدخول (Backend)

#### تسجيل الدخول كمدير:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

**النتيجة المتوقعة:**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "مدير النظام",
    "email": "admin@example.com",
    "tenant_id": 1,
    "roles": [{"id": 1, "name": "admin"}]
  },
  "token": "1|...",
  "tenant_id": 1
}
```

#### تسجيل الدخول ككاشير:
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cashier@example.com",
    "password": "password"
  }'
```

### 2. اختبار بيانات المستخدم (Backend)
```bash
# احفظ الـ token من الخطوة السابقة
TOKEN="1|..."

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: 1"
```

### 3. اختبار تسجيل الخروج (Backend)
```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: 1"
```

### 4. اختبار Frontend

#### تسجيل الدخول:
1. افتح `http://localhost:5173`
2. سيتم توجيهك تلقائيًا إلى `/login`
3. استخدم:
   - Email: `admin@example.com`
   - Password: `password`
4. يجب أن يتم تسجيل الدخول بنجاح وتوجيهك للصفحة الرئيسية

#### التحقق من Layout:
- يجب أن ترى اسم المستخدم في Header
- يجب أن ترى الدور (admin أو cashier)
- يجب أن ترى زر "تسجيل الخروج"

#### تسجيل الخروج:
1. اضغط على "تسجيل الخروج"
2. يجب أن يتم توجيهك إلى `/login`
3. يجب أن يتم مسح token من localStorage

#### Protected Routes:
1. حاول الوصول مباشرة إلى `http://localhost:5173` بدون تسجيل دخول
2. يجب أن يتم توجيهك تلقائيًا إلى `/login`

### 5. اختبار التسجيل (Frontend)
1. اذهب إلى `/register`
2. املأ النموذج:
   - الاسم: "مستخدم تجريبي"
   - البريد: "test@example.com"
   - كلمة المرور: "password123"
   - تأكيد كلمة المرور: "password123"
   - tenant_id: 1 (افتراضي)
3. اضغط "إنشاء حساب"
4. يجب أن يتم التسجيل بنجاح وتوجيهك للصفحة الرئيسية

## ✅ قائمة التحقق

### Backend
- [ ] Laravel API يعمل على `http://localhost:8000`
- [ ] Migrations تم تشغيلها بنجاح
- [ ] Seeders تم تشغيلها بنجاح
- [ ] تسجيل الدخول يعمل
- [ ] `/api/auth/me` يعمل مع token
- [ ] تسجيل الخروج يعمل
- [ ] CORS يعمل بشكل صحيح

### Frontend
- [ ] React App يعمل على `http://localhost:5173`
- [ ] صفحة Login تعمل
- [ ] صفحة Register تعمل
- [ ] تسجيل الدخول من Frontend يعمل
- [ ] Protected Routes تعمل
- [ ] Layout يعرض معلومات المستخدم
- [ ] تسجيل الخروج يعمل

### Integration
- [ ] الاتصال بين Frontend و Backend يعمل
- [ ] Token يتم إرساله تلقائيًا في Requests
- [ ] tenant_id يتم إرساله تلقائيًا في Requests
- [ ] عند 401 Unauthorized، يتم توجيه المستخدم للـ login

## 🐛 حل المشاكل الشائعة

### مشكلة CORS
- تأكد من أن `config/cors.php` يحتوي على `localhost:5173`
- تأكد من أن `config/sanctum.php` يحتوي على `localhost:5173` في `stateful`

### مشكلة Token
- تأكد من أن token يتم حفظه في localStorage
- تأكد من أن Axios interceptors يضيف token في header

### مشكلة tenant_id
- تأكد من أن tenant_id يتم حفظه في localStorage بعد تسجيل الدخول
- تأكد من أن TenantMiddleware يقرأ tenant_id من header أو user

### مشكلة Database
- تأكد من إعدادات `.env` لقاعدة البيانات
- تأكد من تشغيل `php artisan migrate:fresh --seed`

---
**تاريخ الإنشاء**: 2026-01-10
