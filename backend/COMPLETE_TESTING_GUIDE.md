# 🧪 دليل الاختبار الشامل - الأيام 1-5

## 📋 نظرة عامة

هذا الدليل الشامل لاختبار جميع الميزات المنجزة في الأيام الخمسة الأولى من المشروع.

---

## 🔧 إعداد البيئة

### Backend
```bash
cd c:\wamp64\www\grocery-pos-backend

# تثبيت الحزم
composer install

# إعداد .env
cp .env.example .env
php artisan key:generate

# تحديث إعدادات قاعدة البيانات في .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=grocery_pos
# DB_USERNAME=root
# DB_PASSWORD=

# تشغيل Migrations و Seeders
php artisan migrate:fresh --seed

# تشغيل الخادم
php artisan serve
```

**Backend URL**: `http://localhost:8000`

### Frontend
```bash
cd c:\wamp64\www\grocery-pos-frontend

# تثبيت الحزم
npm install

# إعداد .env
# إنشاء ملف .env وأضف:
# VITE_API_URL=http://localhost:8000/api

# تشغيل التطبيق
npm run dev
```

**Frontend URL**: `http://localhost:5173`

---

## 📊 ملخص ما تم إنجازه

### اليوم 1: إعداد المشروع والبنية الأساسية
- ✅ Multi-Tenant Structure
- ✅ BaseModel مع Global Scope
- ✅ TenantMiddleware
- ✅ CORS Configuration
- ✅ React Setup مع Vite

### اليوم 2: نظام المصادقة والصلاحيات
- ✅ Authentication (Register, Login, Logout)
- ✅ Roles & Permissions (Admin, Cashier)
- ✅ AuthContext
- ✅ Protected Routes

### اليوم 3: إدارة الأقسام والمنتجات
- ✅ Categories CRUD
- ✅ Products CRUD
- ✅ Product Search
- ✅ Frontend Pages

### اليوم 4: Inventory Transactions + شاشة المبيعات - الجزء الأول
- ✅ Inventory Transactions Table
- ✅ Sales Table
- ✅ Sale Items Table
- ✅ Sales Screen (Frontend)
- ✅ Cart Component
- ✅ Product Search Component

### اليوم 5: شاشة المبيعات - الجزء الثاني
- ✅ Invoice HTML Template
- ✅ Print Functionality
- ✅ Discount System
- ✅ Payment Methods

---

## 🔌 جميع API Endpoints المتاحة

### Authentication (Public)
```
POST   /api/auth/register
POST   /api/auth/login
```

### Authentication (Protected)
```
POST   /api/auth/logout
GET    /api/auth/me
```

### Categories (Protected)
```
GET    /api/categories
POST   /api/categories
GET    /api/categories/{id}
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

### Products (Protected)
```
GET    /api/products?page=1&per_page=20&search=query&category_id=1
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/search?q={query}
```

### Sales (Protected)
```
POST   /api/sales
GET    /api/sales?from=date&to=date&page=1
GET    /api/sales/{id}
GET    /api/sales/{id}/invoice  (HTML response)
```

### Test
```
GET    /api/test
```

---

## 🧪 اختبارات Postman

### 1. تسجيل الدخول (احفظ الـ Token)

**Request:**
```
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response المتوقع:**
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
  "token": "1|xxxxxxxxxxxxx",
  "tenant_id": 1
}
```

**✅ احفظ:**
- `token` في متغير Postman: `{{token}}`
- `tenant_id` في متغير: `{{tenant_id}}`

### 2. إعداد Environment Variables في Postman

أنشئ Environment جديد في Postman:
```
base_url: http://localhost:8000/api
token: (سيتم ملؤه تلقائيًا من login)
tenant_id: 1
```

### 3. إعداد Collection Headers

في Collection Settings → Headers:
```
Authorization: Bearer {{token}}
X-Tenant-ID: {{tenant_id}}
Content-Type: application/json
Accept: application/json
```

---

## 📝 اختبارات Postman التفصيلية

### Authentication

#### 1. Register
```
POST {{base_url}}/auth/register
Body (JSON):
{
  "name": "مستخدم تجريبي",
  "email": "test@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "tenant_id": 1
}
```

#### 2. Login
```
POST {{base_url}}/auth/login
Body (JSON):
{
  "email": "admin@example.com",
  "password": "password"
}
```

**✅ بعد Login:**
- احفظ `token` في Environment variable
- احفظ `tenant_id` في Environment variable

#### 3. Me (Get Current User)
```
GET {{base_url}}/auth/me
Headers:
  Authorization: Bearer {{token}}
  X-Tenant-ID: {{tenant_id}}
```

#### 4. Logout
```
POST {{base_url}}/auth/logout
Headers:
  Authorization: Bearer {{token}}
  X-Tenant-ID: {{tenant_id}}
```

---

### Categories

#### 1. Get All Categories
```
GET {{base_url}}/categories
Headers:
  Authorization: Bearer {{token}}
  X-Tenant-ID: {{tenant_id}}
```

#### 2. Create Category
```
POST {{base_url}}/categories
Headers:
  Authorization: Bearer {{token}}
  X-Tenant-ID: {{tenant_id}}
Body (JSON):
{
  "name": "مشروبات",
  "description": "مشروبات غازية وعصائر"
}
```

**✅ احفظ `id` من Response في متغير: `{{category_id}}`**

#### 3. Get Category by ID
```
GET {{base_url}}/categories/{{category_id}}
```

#### 4. Update Category
```
PUT {{base_url}}/categories/{{category_id}}
Body (JSON):
{
  "name": "مشروبات محدثة",
  "description": "وصف محدث"
}
```

#### 5. Delete Category
```
DELETE {{base_url}}/categories/{{category_id}}
```

**⚠️ ملاحظة:** لا يمكن حذف قسم يحتوي على منتجات

---

### Products

#### 1. Get All Products
```
GET {{base_url}}/products?page=1&per_page=20
```

#### 2. Search Products
```
GET {{base_url}}/products/search?q=كوكا
```

#### 3. Filter by Category
```
GET {{base_url}}/products?category_id={{category_id}}
```

#### 4. Create Product
```
POST {{base_url}}/products
Body (JSON):
{
  "category_id": {{category_id}},
  "name": "كوكا كولا",
  "barcode": "123456789",
  "purchase_price": 2.5,
  "sale_price": 3.5,
  "quantity": 100,
  "expiry_date": "2026-12-31",
  "min_stock_alert": 10,
  "min_expiry_alert": 7
}
```

**✅ احفظ `id` من Response في متغير: `{{product_id}}`**

#### 5. Get Product by ID
```
GET {{base_url}}/products/{{product_id}}
```

#### 6. Update Product
```
PUT {{base_url}}/products/{{product_id}}
Body (JSON):
{
  "category_id": {{category_id}},
  "name": "كوكا كولا محدثة",
  "quantity": 150
}
```

#### 7. Delete Product
```
DELETE {{base_url}}/products/{{product_id}}
```

---

### Sales

#### 1. Create Sale
```
POST {{base_url}}/sales
Body (JSON):
{
  "items": [
    {
      "product_id": {{product_id}},
      "quantity": 2
    }
  ],
  "discount": 5,
  "discount_type": "fixed",
  "payment_method": "cash"
}
```

**✅ احفظ `id` من Response في متغير: `{{sale_id}}`**

#### 2. Get All Sales
```
GET {{base_url}}/sales?page=1&per_page=20
```

#### 3. Filter Sales by Date
```
GET {{base_url}}/sales?from=2026-01-01&to=2026-01-31
```

#### 4. Get Sale by ID
```
GET {{base_url}}/sales/{{sale_id}}
```

#### 5. Get Invoice (HTML)
```
GET {{base_url}}/sales/{{sale_id}}/invoice
```

**✅ Response:** HTML page للطباعة

---

## 🖥️ اختبارات Frontend

### 1. تسجيل الدخول

1. افتح `http://localhost:5173`
2. سيتم توجيهك تلقائيًا إلى `/login`
3. استخدم:
   - Email: `admin@example.com`
   - Password: `password`
4. اضغط "تسجيل الدخول"

**✅ النجاح:**
- يتم توجيهك للصفحة الرئيسية
- يظهر اسم المستخدم في Header
- يظهر الدور (admin)

### 2. إدارة الأقسام

1. اذهب إلى `/categories`
2. اضغط "إضافة قسم جديد"
3. املأ النموذج:
   - الاسم: "مشروبات"
   - الوصف: "مشروبات غازية وعصائر"
4. اضغط "إضافة"

**✅ النجاح:**
- يظهر القسم الجديد في الجدول
- يمكنك تعديله
- يمكنك حذفه (إذا لم يكن به منتجات)

### 3. إدارة المنتجات

1. اذهب إلى `/products`
2. اضغط "إضافة منتج جديد"
3. املأ النموذج:
   - القسم: اختر قسم
   - اسم المنتج: "كوكا كولا"
   - الباركود: "123456789"
   - سعر الشراء: 2.5
   - سعر البيع: 3.5
   - الكمية: 100
4. اضغط "إضافة"

**✅ النجاح:**
- يظهر المنتج في الجدول
- يمكنك البحث عنه
- يمكنك تعديله
- يمكنك حذفه

### 4. شاشة المبيعات

1. اذهب إلى `/sales`
2. ابحث عن منتج (اكتب اسم أو باركود)
3. اضغط على منتج لإضافته للسلة
4. عدل الكمية إذا لزم الأمر
5. أضف خصم (اختياري):
   - اختر نوع الخصم (نسبة/قيمة)
   - أدخل قيمة الخصم
6. اختر طريقة الدفع
7. اضغط "إتمام البيع"

**✅ النجاح:**
- يتم إتمام البيع
- يتم توجيهك لصفحة الفاتورة
- يتم خصم الكمية من المخزون تلقائيًا
- يتم إنشاء Inventory Transaction

### 5. طباعة الفاتورة

1. بعد إتمام البيع، ستظهر صفحة الفاتورة
2. اضغط "🖨️ طباعة"
3. اختر الطابعة أو احفظ كـ PDF

**✅ النجاح:**
- تظهر الفاتورة بشكل احترافي
- يمكن طباعتها أو حفظها كـ PDF

---

## ✅ قائمة التحقق الشاملة

### Backend API
- [ ] تسجيل الدخول يعمل
- [ ] `/api/auth/me` يعمل
- [ ] تسجيل الخروج يعمل
- [ ] Categories CRUD يعمل
- [ ] Products CRUD يعمل
- [ ] Products Search يعمل
- [ ] Create Sale يعمل
- [ ] Get Sales يعمل
- [ ] Get Invoice (HTML) يعمل
- [ ] Inventory Transaction يتم إنشاؤه تلقائيًا
- [ ] الكمية تُخصم من المخزون تلقائيًا

### Frontend
- [ ] صفحة Login تعمل
- [ ] صفحة Register تعمل
- [ ] Protected Routes تعمل
- [ ] صفحة Categories تعمل
- [ ] صفحة Products تعمل
- [ ] صفحة Sales تعمل
- [ ] Cart Component يعمل
- [ ] Product Search يعمل
- [ ] Invoice Page تعمل
- [ ] Print Functionality يعمل

### Integration
- [ ] Token يتم إرساله تلقائيًا
- [ ] tenant_id يتم إرساله تلقائيًا
- [ ] عند 401، يتم توجيه المستخدم للـ login
- [ ] Error Handling يعمل

### Multi-Tenant
- [ ] Global Scope يعمل (لا يمكن رؤية بيانات tenant آخر)
- [ ] TenantMiddleware يعمل

---

## 🐛 حل المشاكل الشائعة

### مشكلة CORS
**الحل:**
- تأكد من أن `config/cors.php` يحتوي على `localhost:5173`
- تأكد من أن `config/sanctum.php` يحتوي على `localhost:5173`

### مشكلة Token
**الحل:**
- تأكد من حفظ token في localStorage
- تأكد من أن Axios interceptors يضيف token في header

### مشكلة tenant_id
**الحل:**
- تأكد من حفظ tenant_id في localStorage بعد login
- تأكد من إرسال `X-Tenant-ID` header

### مشكلة Database
**الحل:**
- تأكد من تشغيل MySQL
- تأكد من إعدادات `.env`
- شغل `php artisan migrate:fresh --seed`

---

## 📊 Postman Collection Structure

أنشئ Collection في Postman بهذا الشكل:

```
Grocery POS API
├── Authentication
│   ├── Register
│   ├── Login
│   ├── Me
│   └── Logout
├── Categories
│   ├── Get All
│   ├── Create
│   ├── Get by ID
│   ├── Update
│   └── Delete
├── Products
│   ├── Get All
│   ├── Search
│   ├── Create
│   ├── Get by ID
│   ├── Update
│   └── Delete
└── Sales
    ├── Create
    ├── Get All
    ├── Get by ID
    └── Get Invoice
```

---

## 🎯 نصائح للاختبار

1. **ابدأ بـ Authentication**: تأكد من تسجيل الدخول أولاً
2. **احفظ Variables**: استخدم Environment Variables في Postman
3. **اختبر بالترتيب**: Categories → Products → Sales
4. **اختبر Edge Cases**: كميات غير كافية، حذف قسم به منتجات، إلخ
5. **اختبر Multi-Tenant**: تأكد من أن كل tenant يرى بياناته فقط

---

## 📝 تقرير الاختبار

بعد إكمال الاختبارات، املأ هذا التقرير:

### النتائج
- **عدد الاختبارات**: ___
- **الاختبارات الناجحة**: ___
- **الاختبارات الفاشلة**: ___
- **نسبة النجاح**: ___%

### المشاكل المكتشفة
1. ___
2. ___
3. ___

### الملاحظات
___

---

**تاريخ الاختبار**: ___
**المختبر**: ___
