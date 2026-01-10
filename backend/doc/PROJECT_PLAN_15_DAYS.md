# 📋 خطة عمل مشروع Grocery Store POS & Inventory System
## مدة التنفيذ: 15 يوم

---

## 🎯 نظرة عامة على المشروع

**Stack:**
- Backend: Laravel (REST API)
- Frontend: React (Vite)
- Database: MySQL
- Architecture: Multi-Tenant (Single DB + tenant_id)

**المكونات الأساسية:**
1. نظام تسجيل الدخول والصلاحيات
2. شاشة المبيعات (الكاشير)
3. إدارة المنتجات
4. إدارة المخزون
5. المرتجعات
6. الأرباح والخسائر
7. المصروفات
8. الموردون
9. التقارير
10. الإعدادات

---

## 📅 اليوم 1: إعداد المشروع والبنية الأساسية

### 🎯 الهدف
إعداد بيئة العمل الأساسية وبنية المشروع (Backend + Frontend)

### ✅ المهام التفصيلية

#### Backend (Laravel):
- [x] إنشاء مشروع Laravel جديد ✅
- [x] تثبيت الحزم المطلوبة: ✅
  - `laravel/sanctum` (Authentication) ✅
  - `spatie/laravel-permission` (Roles & Permissions) ✅
- [ ] إعداد قاعدة البيانات (MySQL)
- [x] إعداد Multi-Tenant structure: ✅
  - Migration: `tenants` table ✅
  - Middleware: `TenantMiddleware` ✅
  - **BaseModel مع Global Scope** ⚠️ مهم جدًا ✅
  - User Model مع Global Scope ✅
- [x] إعداد CORS للاتصال مع React ✅
- [x] إنشاء Base Models & Controllers structure ✅

#### Frontend (React + Vite):
- [x] إنشاء مشروع React مع Vite ✅
- [x] تثبيت الحزم: ✅
  - `axios` (HTTP requests) ✅
  - `react-router-dom` (Routing) ✅
  - `react-hook-form` (Forms) ✅
  - `@tanstack/react-query` (Data fetching) ✅
  - ❌ **لا Zustand ولا Redux** - سنستخدم Context API فقط ✅
- [x] إعداد Structure المجلدات: ✅
  ```
  src/
    ├── components/
    ├── pages/
    ├── services/
    ├── hooks/
    ├── context/  ← Context API بدل store
    ├── utils/
    └── layouts/
  ```
- [x] إعداد Axios instance مع base URL ✅
- [x] إنشاء Layout أساسي ✅

### 🔌 Endpoints
```
N/A (Setup only)
```

### 🧩 Components
- [x] `Layout.jsx` - Layout أساسي ✅
- [x] `App.jsx` - Main App component ✅
- [x] `Home.jsx` - صفحة الرئيسية ✅
- [x] `api.js` - Axios instance ✅

### 🧪 الاختبارات
- [ ] التأكد من تشغيل Laravel API
- [ ] التأكد من تشغيل React App
- [ ] اختبار الاتصال بين Frontend و Backend
- [ ] اختبار Multi-Tenant middleware
- [ ] اختبار Global Scope على Models

### 📝 ملاحظات
- التأكد من إعداد `.env` بشكل صحيح
- إعداد Git repository
- **⚠️ مهم: BaseModel مع Global Scope للمواد**

---

## 📅 اليوم 2: نظام المصادقة والصلاحيات (Authentication & Authorization)

### 🎯 الهدف
بناء نظام تسجيل الدخول مع صلاحيات (مدير، كاشير)

### ✅ المهام التفصيلية

#### Backend:
- [x] إنشاء Migration: `users` table ✅
  - id, tenant_id, name, email, password, role ✅
- [x] إنشاء Migration: `roles` table ✅
  - id, name (admin, cashier) ✅
- [x] إنشاء Migration: `permissions` table ✅
- [x] إنشاء Seeder للمستخدمين والصلاحيات ✅
- [x] إنشاء `AuthController`: ✅
  - `register()` - تسجيل مستخدم جديد ✅
  - `login()` - تسجيل الدخول ✅
  - `logout()` - تسجيل الخروج ✅
  - `me()` - بيانات المستخدم الحالي ✅
- [x] إعداد Sanctum للـ API tokens ✅
- [x] تحديث TenantMiddleware للتعامل مع routes التسجيل ✅

#### Frontend:
- [x] صفحة تسجيل الدخول (`Login.jsx`) ✅
- [x] صفحة تسجيل مستخدم جديد (`Register.jsx`) ✅
- [x] **`AuthContext.jsx`** - Context API للمصادقة (بدل Zustand/Redux) ✅
- [x] Protected Route component ✅
- [x] إعداد Axios interceptors للـ tokens ✅ (موجود من اليوم الأول)

### 🔌 Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### 🧩 Components
- `Login.jsx` - صفحة تسجيل الدخول
- `Register.jsx` - صفحة التسجيل
- `ProtectedRoute.jsx` - حماية المسارات
- `AuthContext.jsx` - Context للمصادقة (بدل Store)

### 🧪 الاختبارات
- [ ] تسجيل مستخدم جديد
- [ ] تسجيل الدخول
- [ ] التحقق من الصلاحيات
- [ ] تسجيل الخروج
- [ ] اختبار Protected Routes

---

## 📅 اليوم 3: إدارة الأقسام والمنتجات (Categories & Products)

### 🎯 الهدف
بناء نظام إدارة الأقسام والمنتجات الأساسي

### ✅ المهام التفصيلية

#### Backend:
- [ ] Migration: `categories` table
  - id, tenant_id, name, description
- [ ] Migration: `products` table
  - id, tenant_id, category_id, name, barcode, purchase_price, 
    sale_price, quantity, expiry_date, min_stock_alert, 
    min_expiry_alert, created_at, updated_at
- [ ] **Model: `BaseModel`** مع Global Scope للمواد ⚠️
- [ ] `CategoryController`:
  - `index()` - عرض جميع الأقسام
  - `store()` - إضافة قسم
  - `update()` - تعديل قسم
  - `destroy()` - حذف قسم
- [ ] `ProductController`:
  - `index()` - عرض جميع المنتجات (مع pagination & search)
  - `store()` - إضافة منتج
  - `show()` - عرض منتج واحد
  - `update()` - تعديل منتج
  - `destroy()` - حذف منتج
  - `search()` - بحث سريع (اسم/باركود)
- [ ] Validation Rules للمنتجات

#### Frontend:
- [ ] صفحة الأقسام (`Categories.jsx`)
  - عرض الأقسام
  - إضافة/تعديل/حذف قسم
- [ ] صفحة المنتجات (`Products.jsx`)
  - جدول المنتجات
  - بحث سريع
  - إضافة/تعديل/حذف منتج
- [ ] Modal/Form لإضافة/تعديل منتج
- [ ] Component لعرض تنبيهات المخزون والصلاحية

### 🔌 Endpoints
```
Categories:
GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
DELETE /api/categories/{id}

Products:
GET    /api/products
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/search?q={query}
```

### 🧩 Components
- `Categories.jsx` - إدارة الأقسام
- `Products.jsx` - إدارة المنتجات
- `ProductForm.jsx` - نموذج إضافة/تعديل منتج
- `ProductCard.jsx` - بطاقة منتج
- `SearchBar.jsx` - شريط البحث

### 🧪 الاختبارات
- [ ] إضافة قسم جديد
- [ ] إضافة منتج جديد
- [ ] البحث عن منتج
- [ ] تعديل منتج
- [ ] حذف منتج
- [ ] التحقق من Validation
- [ ] اختبار Global Scope (لا يمكن رؤية منتجات tenant آخر)

---

## 📅 اليوم 4: Inventory Transactions + شاشة المبيعات - الجزء الأول

### 🎯 الهدف
إنشاء Inventory Transactions أولاً (لازم قبل Sales)، ثم بناء واجهة شاشة المبيعات الأساسية

### ✅ المهام التفصيلية

#### Backend:
- [ ] **Migration: `inventory_transactions` table** ⚠️ أولاً
  - id, tenant_id, product_id, type (in/out/return), 
    quantity, reference_type, reference_id, notes, created_at
- [ ] Model: `InventoryTransaction` (extends BaseModel)
- [ ] Migration: `sales` table
  - id, tenant_id, invoice_number, user_id, total, discount, 
    payment_method, status, created_at
- [ ] Migration: `sale_items` table
  - id, sale_id, product_id, quantity, price, subtotal
- [ ] `SaleController`:
  - `store()` - إنشاء عملية بيع
  - `index()` - عرض المبيعات
  - `show()` - عرض فاتورة واحدة
- [ ] Logic لخصم الكمية من المخزون تلقائيًا
- [ ] Logic لإنشاء Inventory Transaction عند البيع
- [ ] Logic لتوليد رقم فاتورة تلقائي

#### Frontend:
- [ ] صفحة المبيعات (`Sales.jsx`)
- [ ] Component: `Cart.jsx` - سلة المشتريات
- [ ] Component: `ProductSearch.jsx` - بحث سريع
- [ ] Component: `CartItem.jsx` - عنصر في السلة
- [ ] إضافة/حذف/تعديل الكمية في السلة
- [ ] حساب الإجمالي تلقائيًا

### 🔌 Endpoints
```
POST   /api/sales
GET    /api/sales
GET    /api/sales/{id}
```

### 🧩 Components
- `Sales.jsx` - صفحة المبيعات الرئيسية
- `Cart.jsx` - سلة المشتريات
- `ProductSearch.jsx` - بحث المنتجات
- `CartItem.jsx` - عنصر في السلة
- `QuantityControl.jsx` - تحكم في الكمية

### 🧪 الاختبارات
- [ ] البحث عن منتج
- [ ] إضافة منتج للسلة
- [ ] تعديل الكمية
- [ ] حذف منتج من السلة
- [ ] حساب الإجمالي
- [ ] التحقق من إنشاء Inventory Transaction عند البيع

---

## 📅 اليوم 5: شاشة المبيعات - الجزء الثاني (Sales Screen Part 2)

### 🎯 الهدف
إكمال شاشة المبيعات: الخصم، طرق الدفع، البيع، طباعة الفاتورة

### ✅ المهام التفصيلية

#### Backend:
- [ ] إضافة Logic للخصومات (نسبة/قيمة)
- [ ] إضافة طرق الدفع (كاش، بطاقة، تحويل)
- [ ] **Invoice HTML Template** (بدل PDF معقد) ✅
  - HTML بسيط + CSS خاص للطباعة
  - Endpoint لإرجاع HTML
- [ ] Endpoint لطباعة الفاتورة (HTML)

#### Frontend:
- [ ] Component: `DiscountModal.jsx` - إضافة خصم
- [ ] Component: `PaymentMethod.jsx` - اختيار طريقة الدفع
- [ ] زر البيع مع Confirmation
- [ ] Component: `Invoice.jsx` - عرض الفاتورة (HTML)
- [ ] زر طباعة الفاتورة (window.print())
- [ ] CSS خاص للطباعة (@media print)
- [ ] إعادة تعيين السلة بعد البيع

### 🔌 Endpoints
```
GET    /api/sales/{id}/invoice  (HTML response)
```

### 🧩 Components
- `DiscountModal.jsx` - نافذة الخصم
- `PaymentMethod.jsx` - طرق الدفع
- `Invoice.jsx` - عرض الفاتورة (HTML)
- `PrintButton.jsx` - زر الطباعة

### 🧪 الاختبارات
- [ ] إضافة خصم (نسبة)
- [ ] إضافة خصم (قيمة)
- [ ] اختيار طريقة الدفع
- [ ] إتمام عملية البيع
- [ ] التحقق من خصم الكمية من المخزون
- [ ] طباعة الفاتورة (HTML)

---

## 📅 اليوم 6: إدارة المخزون (Inventory Management)

### 🎯 الهدف
بناء نظام إدارة المخزون مع التنبيهات (Inventory Transactions جاهزة من يوم 4)

### ✅ المهام التفصيلية

#### Backend:
- [ ] `InventoryController`:
  - `index()` - عرض المخزون الحالي
  - `lowStock()` - منتجات قاربت على النفاد
  - `expiringSoon()` - منتجات قريبة الانتهاء
  - `transactions()` - سجل حركة المخزون (من inventory_transactions)
- [ ] Logic للتنبيهات (low stock, expiry)

#### Frontend:
- [ ] صفحة المخزون (`Inventory.jsx`)
  - عرض جميع المنتجات مع الكميات
  - فلترة حسب الحالة (منخفض، منتهي)
- [ ] Component: `StockAlert.jsx` - تنبيهات المخزون
- [ ] Component: `ExpiryAlert.jsx` - تنبيهات الصلاحية
- [ ] Component: `InventoryTransactions.jsx` - سجل الحركة
- [ ] Dashboard cards للتنبيهات

### 🔌 Endpoints
```
GET    /api/inventory
GET    /api/inventory/low-stock
GET    /api/inventory/expiring-soon
GET    /api/inventory/transactions
```

### 🧩 Components
- `Inventory.jsx` - صفحة المخزون
- `StockAlert.jsx` - تنبيهات المخزون
- `ExpiryAlert.jsx` - تنبيهات الصلاحية
- `InventoryTransactions.jsx` - سجل الحركة
- `StockCard.jsx` - بطاقة مخزون منتج

### 🧪 الاختبارات
- [ ] عرض المخزون الحالي
- [ ] عرض المنتجات منخفضة المخزون
- [ ] عرض المنتجات قريبة الانتهاء
- [ ] عرض سجل الحركة
- [ ] اختبار التنبيهات

---

## 📅 اليوم 7: المرتجعات (Returns Management)

### 🎯 الهدف
بناء نظام إدارة المرتجعات (من زبون/لمورّد)

### ✅ المهام التفصيلية

#### Backend:
- [ ] Migration: `returns` table
  - id, tenant_id, type (customer/supplier), sale_id (nullable),
    supplier_id (nullable), product_id, quantity, reason, 
    amount, status, created_at
- [ ] `ReturnController`:
  - `store()` - إضافة مرتجع
  - `index()` - عرض المرتجعات
  - `show()` - عرض مرتجع واحد
  - `update()` - تحديث حالة المرتجع
- [ ] Logic لتحديث المخزون عند الإرجاع
- [ ] Logic لإنشاء Inventory Transaction (type: return)
- [ ] Logic لتحديث الأرباح

#### Frontend:
- [ ] صفحة المرتجعات (`Returns.jsx`)
- [ ] Component: `ReturnForm.jsx` - نموذج إضافة مرتجع
- [ ] اختيار نوع المرتجع (زبون/مورّد)
- [ ] ربط المرتجع بالفاتورة (إن كان من زبون)
- [ ] عرض سجل المرتجعات

### 🔌 Endpoints
```
POST   /api/returns
GET    /api/returns
GET    /api/returns/{id}
PUT    /api/returns/{id}
```

### 🧩 Components
- `Returns.jsx` - صفحة المرتجعات
- `ReturnForm.jsx` - نموذج المرتجع
- `ReturnCard.jsx` - بطاقة مرتجع
- `ReturnTypeSelector.jsx` - اختيار نوع المرتجع

### 🧪 الاختبارات
- [ ] إضافة مرتجع من زبون
- [ ] إضافة مرتجع لمورّد
- [ ] التحقق من تحديث المخزون
- [ ] التحقق من Inventory Transaction
- [ ] عرض سجل المرتجعات

---

## 📅 اليوم 8: الموردون (Suppliers Management)

### 🎯 الهدف
بناء نظام إدارة الموردين

### ✅ المهام التفصيلية

#### Backend:
- [ ] Migration: `suppliers` table
  - id, tenant_id, name, phone, email, address, balance (ديون)
- [ ] Migration: `purchase_invoices` table
  - id, tenant_id, supplier_id, invoice_number, total, 
    paid_amount, balance, date, created_at
- [ ] Migration: `purchase_items` table
  - id, purchase_invoice_id, product_id, quantity, price, subtotal
- [ ] `SupplierController`:
  - `index()` - عرض الموردين
  - `store()` - إضافة مورد
  - `update()` - تعديل مورد
  - `destroy()` - حذف مورد
  - `balance()` - رصيد المورد
- [ ] `PurchaseInvoiceController`:
  - `store()` - إضافة فاتورة شراء
  - `index()` - عرض فواتير الشراء
  - `pay()` - دفع جزء من الدين
- [ ] Logic لتحديث المخزون عند الشراء
- [ ] Logic لإنشاء Inventory Transaction (type: in)

#### Frontend:
- [ ] صفحة الموردين (`Suppliers.jsx`)
- [ ] Component: `SupplierForm.jsx` - نموذج مورد
- [ ] صفحة فواتير الشراء (`PurchaseInvoices.jsx`)
- [ ] Component: `PurchaseInvoiceForm.jsx` - نموذج فاتورة شراء
- [ ] عرض رصيد المورد

### 🔌 Endpoints
```
Suppliers:
GET    /api/suppliers
POST   /api/suppliers
PUT    /api/suppliers/{id}
DELETE /api/suppliers/{id}
GET    /api/suppliers/{id}/balance

Purchase Invoices:
POST   /api/purchase-invoices
GET    /api/purchase-invoices
POST   /api/purchase-invoices/{id}/pay
```

### 🧩 Components
- `Suppliers.jsx` - صفحة الموردين
- `SupplierForm.jsx` - نموذج مورد
- `PurchaseInvoices.jsx` - فواتير الشراء
- `PurchaseInvoiceForm.jsx` - نموذج فاتورة شراء
- `SupplierCard.jsx` - بطاقة مورد

### 🧪 الاختبارات
- [ ] إضافة مورد جديد
- [ ] إضافة فاتورة شراء
- [ ] تحديث المخزون عند الشراء
- [ ] التحقق من Inventory Transaction
- [ ] دفع جزء من الدين
- [ ] عرض رصيد المورد

---

## 📅 اليوم 9: المصروفات (Expenses Management)

### 🎯 الهدف
بناء نظام إدارة المصروفات

### ✅ المهام التفصيلية

#### Backend:
- [ ] Migration: `expense_categories` table
  - id, tenant_id, name
- [ ] Migration: `expenses` table
  - id, tenant_id, category_id, amount, description, date, created_at
- [ ] `ExpenseCategoryController`:
  - CRUD operations
- [ ] `ExpenseController`:
  - `index()` - عرض المصروفات (مع filters)
  - `store()` - إضافة مصروف
  - `update()` - تعديل مصروف
  - `destroy()` - حذف مصروف
  - `summary()` - ملخص المصروفات (يومي/شهري)

#### Frontend:
- [ ] صفحة المصروفات (`Expenses.jsx`)
- [ ] Component: `ExpenseForm.jsx` - نموذج مصروف
- [ ] Component: `ExpenseCategoryManager.jsx` - إدارة الأقسام
- [ ] Filters (تاريخ، قسم)
- [ ] Charts للمصروفات

### 🔌 Endpoints
```
Expense Categories:
GET    /api/expense-categories
POST   /api/expense-categories
PUT    /api/expense-categories/{id}
DELETE /api/expense-categories/{id}

Expenses:
GET    /api/expenses
POST   /api/expenses
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}
GET    /api/expenses/summary
```

### 🧩 Components
- `Expenses.jsx` - صفحة المصروفات
- `ExpenseForm.jsx` - نموذج مصروف
- `ExpenseCategoryManager.jsx` - إدارة الأقسام
- `ExpenseCard.jsx` - بطاقة مصروف
- `ExpenseChart.jsx` - رسم بياني

### 🧪 الاختبارات
- [ ] إضافة مصروف جديد
- [ ] إضافة قسم مصروفات
- [ ] عرض المصروفات مع Filters
- [ ] حساب ملخص المصروفات

---

## 📅 اليوم 10: الأرباح والخسائر (Profit & Loss)

### 🎯 الهدف
بناء نظام حساب الأرباح والخسائر الحقيقية (On-The-Fly)

### ✅ المهام التفصيلية

#### Backend:
- [ ] `ProfitLossController`:
  - `daily()` - أرباح يومية
  - `monthly()` - أرباح شهرية
  - `byProduct()` - أرباح حسب منتج
  - `byCategory()` - أرباح حسب قسم
  - `summary()` - ملخص شامل
- [ ] Logic لحساب الربح **On-The-Fly** (من sales, expenses, returns):
  - إجمالي المبيعات (من sales)
  - تكلفة الشراء (من sale_items + products.purchase_price)
  - المصروفات (من expenses)
  - الربح الصافي
- [ ] ❌ **لا نحتاج profit_loss_reports table** - حساب مباشر

#### Frontend:
- [ ] صفحة الأرباح والخسائر (`ProfitLoss.jsx`)
- [ ] Component: `ProfitSummary.jsx` - ملخص الأرباح
- [ ] Component: `ProfitChart.jsx` - رسم بياني
- [ ] Filters (تاريخ، منتج، قسم)

### 🔌 Endpoints
```
GET    /api/profit-loss/daily?date={date}
GET    /api/profit-loss/monthly?month={month}&year={year}
GET    /api/profit-loss/by-product?product_id={id}
GET    /api/profit-loss/by-category?category_id={id}
GET    /api/profit-loss/summary?from={date}&to={date}
```

### 🧩 Components
- `ProfitLoss.jsx` - صفحة الأرباح والخسائر
- `ProfitSummary.jsx` - ملخص الأرباح
- `ProfitChart.jsx` - رسم بياني
- `ProfitFilters.jsx` - Filters
- `ProfitTable.jsx` - جدول الأرباح

### 🧪 الاختبارات
- [ ] حساب الأرباح اليومية
- [ ] حساب الأرباح الشهرية
- [ ] حساب الأرباح حسب منتج
- [ ] حساب الأرباح حسب قسم
- [ ] التحقق من دقة الحسابات (On-The-Fly)

---

## 📅 اليوم 11: التقارير - الجزء الأول (Reports Part 1)

### 🎯 الهدف
بناء تقارير المبيعات والمنتجات الأساسية

### ✅ المهام التفصيلية

#### Backend:
- [ ] `ReportController`:
  - `bestSelling()` - أفضل المنتجات مبيعًا ✅
  - `worstSelling()` - المنتجات الضعيفة ✅
  - `salesByTime()` - مبيعات حسب الوقت ✅
  - `expiredLosses()` - خسائر بسبب انتهاء الصلاحية ✅
  - ❌ `monthlyComparison()` - **لاحقًا** (مش في الخطة الأساسية)

#### Frontend:
- [ ] صفحة التقارير (`Reports.jsx`)
- [ ] Component: `BestSellingProducts.jsx` - أفضل المنتجات
- [ ] Component: `SalesByTime.jsx` - مبيعات حسب الوقت
- [ ] Component: `ExpiredLosses.jsx` - خسائر الصلاحية
- [ ] Charts وتصورات

### 🔌 Endpoints
```
GET    /api/reports/best-selling?period={daily/monthly}
GET    /api/reports/worst-selling?period={daily/monthly}
GET    /api/reports/sales-by-time?date={date}
GET    /api/reports/expired-losses?from={date}&to={date}
```

### 🧩 Components
- `Reports.jsx` - صفحة التقارير
- `BestSellingProducts.jsx` - أفضل المنتجات
- `SalesByTime.jsx` - مبيعات حسب الوقت
- `ExpiredLosses.jsx` - خسائر الصلاحية

### 🧪 الاختبارات
- [ ] عرض أفضل المنتجات مبيعًا
- [ ] عرض المنتجات الضعيفة
- [ ] عرض مبيعات حسب الوقت
- [ ] عرض خسائر الصلاحية

---

## 📅 اليوم 12: التقارير - الجزء الثاني (Reports Part 2)

### 🎯 الهدف
إكمال التقارير مع Export PDF فقط (Excel لاحقًا)

### ✅ المهام التفصيلية

#### Backend:
- [ ] إضافة Export functionality:
  - Export to PDF ✅ (باستخدام DomPDF)
  - ❌ Export to Excel - **لاحقًا** (مش في الخطة الأساسية)
- [ ] تقارير إضافية:
  - `inventoryReports()` - تقارير المخزون
  - `financialReports()` - تقارير مالية شاملة

#### Frontend:
- [ ] Component: `ReportFilters.jsx` - Filters متقدمة
- [ ] Component: `ExportButtons.jsx` - أزرار التصدير (PDF فقط)
- [ ] Component: `ReportCharts.jsx` - Charts متعددة
- [ ] Component: `ReportTable.jsx` - جداول التقارير
- [ ] تحسين UI/UX للتقارير

### 🔌 Endpoints
```
GET    /api/reports/export/pdf?type={report_type}
GET    /api/reports/inventory
GET    /api/reports/financial
```

### 🧩 Components
- `ReportFilters.jsx` - Filters
- `ExportButtons.jsx` - أزرار التصدير (PDF)
- `ReportCharts.jsx` - Charts
- `ReportTable.jsx` - جداول
- `ReportDashboard.jsx` - Dashboard التقارير

### 🧪 الاختبارات
- [ ] Export to PDF
- [ ] تقارير المخزون
- [ ] تقارير مالية
- [ ] Filters متقدمة

---

## 📅 اليوم 13: الإعدادات (Settings)

### 🎯 الهدف
بناء صفحة الإعدادات والنسخ الاحتياطي

### ✅ المهام التفصيلية

#### Backend:
- [ ] Migration: `settings` table
  - id, tenant_id, key, value
- [ ] `SettingController`:
  - `index()` - عرض الإعدادات
  - `update()` - تحديث إعداد
  - `bulkUpdate()` - تحديث متعدد
- [ ] إعدادات:
  - اسم المتجر
  - الشعار (file upload)
  - العملة
  - إعدادات الطابعة
- [ ] `BackupController`:
  - `create()` - إنشاء نسخة احتياطية
  - `list()` - عرض النسخ الاحتياطية
  - `restore()` - استرجاع نسخة

#### Frontend:
- [ ] صفحة الإعدادات (`Settings.jsx`)
- [ ] Component: `StoreSettings.jsx` - إعدادات المتجر
- [ ] Component: `PrinterSettings.jsx` - إعدادات الطابعة
- [ ] Component: `BackupManager.jsx` - إدارة النسخ الاحتياطية
- [ ] File upload للشعار

### 🔌 Endpoints
```
Settings:
GET    /api/settings
PUT    /api/settings
POST   /api/settings/bulk-update
POST   /api/settings/upload-logo

Backup:
POST   /api/backup/create
GET    /api/backup/list
POST   /api/backup/restore/{id}
```

### 🧩 Components
- `Settings.jsx` - صفحة الإعدادات
- `StoreSettings.jsx` - إعدادات المتجر
- `PrinterSettings.jsx` - إعدادات الطابعة
- `BackupManager.jsx` - إدارة النسخ
- `LogoUpload.jsx` - رفع الشعار

### 🧪 الاختبارات
- [ ] تحديث إعدادات المتجر
- [ ] رفع الشعار
- [ ] إعدادات الطابعة
- [ ] إنشاء نسخة احتياطية
- [ ] استرجاع نسخة احتياطية

---

## 📅 اليوم 14: Dashboard وتحسينات UX

### 🎯 الهدف
بناء Dashboard رئيسي وتحسين تجربة المستخدم

### ✅ المهام التفصيلية

#### Backend:
- [ ] `DashboardController`:
  - `stats()` - إحصائيات سريعة
    - مبيعات اليوم
    - أرباح اليوم
    - منتجات منخفضة المخزون
    - منتجات قريبة الانتهاء
    - مصروفات اليوم
    - أفضل منتج اليوم

#### Frontend:
- [ ] صفحة Dashboard (`Dashboard.jsx`)
- [ ] Component: `StatsCards.jsx` - بطاقات الإحصائيات
- [ ] Component: `SalesChart.jsx` - رسم بياني للمبيعات
- [ ] Component: `QuickActions.jsx` - إجراءات سريعة
- [ ] Component: `RecentSales.jsx` - آخر المبيعات
- [ ] Component: `AlertsPanel.jsx` - لوحة التنبيهات
- [ ] تحسين Navigation
- [ ] تحسين Responsive Design

### 🔌 Endpoints
```
GET    /api/dashboard/stats
GET    /api/dashboard/recent-sales
GET    /api/dashboard/alerts
```

### 🧩 Components
- `Dashboard.jsx` - Dashboard الرئيسي
- `StatsCards.jsx` - بطاقات الإحصائيات
- `SalesChart.jsx` - رسم بياني
- `QuickActions.jsx` - إجراءات سريعة
- `RecentSales.jsx` - آخر المبيعات
- `AlertsPanel.jsx` - لوحة التنبيهات

### 🧪 الاختبارات
- [ ] عرض الإحصائيات
- [ ] عرض آخر المبيعات
- [ ] عرض التنبيهات
- [ ] اختبار Responsive
- [ ] اختبار Navigation

---

## 📅 اليوم 15: الاختبارات النهائية والتحسينات

### 🎯 الهدف
اختبار شامل للمشروع وإصلاح الأخطاء والتحسينات النهائية

### ✅ المهام التفصيلية

#### Backend:
- [ ] Unit Tests للـ Controllers المهمة
- [ ] Integration Tests للـ APIs
- [ ] اختبار Multi-Tenant isolation
- [ ] اختبار Performance
- [ ] إصلاح أي أخطاء
- [ ] تحسين Queries (Eager Loading)
- [ ] إضافة Indexes للـ Database
- [ ] **اختبار Global Scope على جميع Models**

#### Frontend:
- [ ] اختبار جميع الصفحات
- [ ] اختبار جميع Forms
- [ ] اختبار Responsive Design
- [ ] اختبار Performance
- [ ] إصلاح أي أخطاء
- [ ] تحسين Loading States
- [ ] تحسين Error Handling
- [ ] إضافة Toast Notifications

#### General:
- [ ] مراجعة الأمان (Security)
- [ ] مراجعة Validation
- [ ] مراجعة Error Messages
- [ ] إعداد Production Environment
- [ ] كتابة Documentation أساسية

### 🔌 Endpoints
```
N/A (Testing only)
```

### 🧩 Components
- Testing all components
- Error boundaries
- Loading states
- Toast notifications

### 🧪 الاختبارات
- [ ] اختبار جميع Features
- [ ] اختبار Edge Cases
- [ ] اختبار Performance
- [ ] اختبار Security
- [ ] اختبار Multi-Tenant
- [ ] اختبار Global Scope
- [ ] اختبار Responsive
- [ ] User Acceptance Testing

---

## 📊 ملخص الخطة

### التوزيع الزمني:
- **الأيام 1-2**: Setup + Authentication (2 أيام)
- **الأيام 3-4**: Products + Inventory Transactions + Sales Part 1 (2 أيام)
- **اليوم 5**: Sales Part 2 (1 يوم)
- **الأيام 6-7**: Inventory + Returns (2 أيام)
- **الأيام 8-9**: Suppliers + Expenses (2 أيام)
- **الأيام 10-12**: Profit/Loss + Reports (3 أيام)
- **الأيام 13-14**: Settings + Dashboard (2 أيام)
- **اليوم 15**: Testing & Polish (1 يوم)

### الأولويات:
1. ✅ Authentication & Authorization
2. ✅ Products Management
3. ✅ Inventory Transactions (قبل Sales)
4. ✅ Sales (POS)
5. ✅ Inventory Management
6. ✅ Returns
7. ✅ Profit & Loss (On-The-Fly)
8. ✅ Reports (مبسطة)
9. ✅ Settings

### ملاحظات مهمة:
- ✅ **Multi-Tenant Global Scope** على جميع Models (BaseModel)
- ✅ **Inventory Transactions** قبل Sales (يوم 4)
- ✅ **Context API** بدل Zustand/Redux
- ✅ **Profit/Loss On-The-Fly** (لا table)
- ✅ **HTML Invoice** بدل PDF معقد
- ✅ **PDF Export فقط** (Excel لاحقًا)
- ✅ **Monthly Comparison لاحقًا**
- اختبار كل Feature بعد إكماله
- استخدام Git للـ Version Control
- توثيق الـ APIs باستخدام Postman/Swagger
- إعداد Environment Variables بشكل صحيح

---

## 🚀 Ready to Start!

ابدأ باليوم الأول واعمل بشكل منهجي. كل يوم بناءً على اليوم السابق.

**Good Luck! 🎉**
