# ✅ قائمة التحقق اليومية - Daily Checklist

استخدم هذا الملف لتتبع تقدمك في كل يوم من أيام المشروع.

---

## 📅 اليوم 1: إعداد المشروع والبنية الأساسية

### Backend (Laravel)
- [ ] `composer create-project laravel/laravel grocery-pos-backend`
- [ ] `cd grocery-pos-backend`
- [ ] `composer require laravel/sanctum`
- [ ] `composer require spatie/laravel-permission`
- [ ] `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`
- [ ] `php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"`
- [ ] إنشاء قاعدة البيانات في MySQL
- [ ] تحديث `.env` مع بيانات قاعدة البيانات
- [ ] إنشاء Migration: `tenants` table
- [ ] إنشاء Middleware: `TenantMiddleware`
- [ ] تسجيل Middleware في `Kernel.php`
- [ ] **إنشاء BaseModel مع Global Scope** ⚠️ مهم جدًا
- [ ] إعداد CORS في `config/cors.php`
- [ ] اختبار API endpoint بسيط
- [ ] اختبار Global Scope

### Frontend (React + Vite)
- [ ] `npm create vite@latest grocery-pos-frontend -- --template react`
- [ ] `cd grocery-pos-frontend`
- [ ] `npm install`
- [ ] `npm install axios react-router-dom react-hook-form @tanstack/react-query`
- [ ] ❌ **لا Zustand ولا Redux**
- [ ] إنشاء Structure المجلدات (context/ بدل store/)
- [ ] إنشاء `src/services/api.js`
- [ ] إنشاء `src/layouts/MainLayout.jsx`
- [ ] تحديث `src/App.jsx`
- [ ] `npm run dev` - التأكد من التشغيل

### Git
- [ ] `git init`
- [ ] إنشاء `.gitignore`
- [ ] `git add .`
- [ ] `git commit -m "Day 1: Project setup"`

---

## 📅 اليوم 2: نظام المصادقة والصلاحيات

### Backend
- [ ] Migration: `users` table
- [ ] Migration: `roles` table
- [ ] Migration: `permissions` table
- [ ] Seeder: Roles & Permissions
- [ ] Seeder: Admin User
- [ ] `AuthController` - register()
- [ ] `AuthController` - login()
- [ ] `AuthController` - logout()
- [ ] `AuthController` - me()
- [ ] Routes في `api.php`
- [ ] اختبار Register endpoint
- [ ] اختبار Login endpoint
- [ ] اختبار Logout endpoint

### Frontend
- [ ] صفحة `Login.jsx`
- [ ] صفحة `Register.jsx`
- [ ] **`AuthContext.jsx`** - Context API (بدل Zustand)
- [ ] `ProtectedRoute.jsx`
- [ ] Axios interceptors للـ tokens
- [ ] اختبار تسجيل الدخول
- [ ] اختبار Protected Routes

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 2: Authentication & Authorization"`

---

## 📅 اليوم 3: إدارة الأقسام والمنتجات

### Backend
- [ ] Migration: `categories` table
- [ ] Migration: `products` table
- [ ] Model: `Category` (extends BaseModel)
- [ ] Model: `Product` (extends BaseModel)
- [ ] اختبار Global Scope على Models
- [ ] `CategoryController` - CRUD
- [ ] `ProductController` - index()
- [ ] `ProductController` - store()
- [ ] `ProductController` - show()
- [ ] `ProductController` - update()
- [ ] `ProductController` - destroy()
- [ ] `ProductController` - search()
- [ ] Form Requests للـ Validation
- [ ] Routes
- [ ] اختبار جميع Endpoints
- [ ] اختبار Global Scope (لا يمكن رؤية منتجات tenant آخر)

### Frontend
- [ ] صفحة `Categories.jsx`
- [ ] صفحة `Products.jsx`
- [ ] `ProductForm.jsx` - Modal/Form
- [ ] `ProductCard.jsx`
- [ ] `SearchBar.jsx`
- [ ] `productsService.js`
- [ ] `categoriesService.js`
- [ ] اختبار CRUD للمنتجات
- [ ] اختبار البحث

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 3: Categories & Products Management"`

---

## 📅 اليوم 4: Inventory Transactions + شاشة المبيعات - الجزء الأول

### Backend
- [ ] **Migration: `inventory_transactions` table** ⚠️ أولاً
- [ ] Model: `InventoryTransaction` (extends BaseModel)
- [ ] Migration: `sales` table
- [ ] Migration: `sale_items` table
- [ ] Model: `Sale` (extends BaseModel)
- [ ] Model: `SaleItem`
- [ ] `SaleController` - store()
- [ ] Logic لخصم المخزون
- [ ] Logic لإنشاء Inventory Transaction عند البيع ⚠️
- [ ] Logic لتوليد رقم فاتورة
- [ ] `SaleController` - index()
- [ ] `SaleController` - show()
- [ ] Routes
- [ ] اختبار عملية بيع كاملة
- [ ] اختبار Inventory Transaction

### Frontend
- [ ] صفحة `Sales.jsx`
- [ ] `Cart.jsx` component
- [ ] `ProductSearch.jsx` component
- [ ] `CartItem.jsx` component
- [ ] `QuantityControl.jsx` component
- [ ] `salesService.js`
- [ ] State management للسلة (useState)
- [ ] حساب الإجمالي
- [ ] اختبار إضافة منتج للسلة
- [ ] اختبار تعديل الكمية

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 4: Inventory Transactions + Sales Screen Part 1"`

---

## 📅 اليوم 5: شاشة المبيعات - الجزء الثاني

### Backend
- [ ] Logic للخصومات
- [ ] **Invoice HTML Template** (بدل PDF معقد) ✅
- [ ] Endpoint: `/api/sales/{id}/invoice` (HTML)
- [ ] اختبار الخصومات
- [ ] اختبار Invoice HTML

### Frontend
- [ ] `DiscountModal.jsx`
- [ ] `PaymentMethod.jsx`
- [ ] `Invoice.jsx` component (HTML)
- [ ] CSS خاص للطباعة (@media print)
- [ ] زر البيع مع Confirmation
- [ ] زر طباعة (window.print())
- [ ] إعادة تعيين السلة بعد البيع
- [ ] اختبار عملية بيع كاملة
- [ ] اختبار طباعة الفاتورة

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 5: Sales Screen Part 2 - Complete"`

---

## 📅 اليوم 6: إدارة المخزون

### Backend
- [ ] `InventoryController` - index()
- [ ] `InventoryController` - lowStock()
- [ ] `InventoryController` - expiringSoon()
- [ ] `InventoryController` - transactions()
- [ ] Logic للتنبيهات
- [ ] Routes
- [ ] اختبار جميع Endpoints

### Frontend
- [ ] صفحة `Inventory.jsx`
- [ ] `StockAlert.jsx` component
- [ ] `ExpiryAlert.jsx` component
- [ ] `InventoryTransactions.jsx` component
- [ ] `StockCard.jsx` component
- [ ] Dashboard cards للتنبيهات
- [ ] `inventoryService.js`
- [ ] اختبار عرض المخزون
- [ ] اختبار التنبيهات

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 6: Inventory Management"`

---

## 📅 اليوم 7: المرتجعات

### Backend
- [ ] Migration: `returns` table
- [ ] Model: `Return` (extends BaseModel)
- [ ] `ReturnController` - store()
- [ ] `ReturnController` - index()
- [ ] `ReturnController` - show()
- [ ] `ReturnController` - update()
- [ ] Logic لتحديث المخزون
- [ ] Logic لإنشاء Inventory Transaction (type: return)
- [ ] Logic لتحديث الأرباح
- [ ] Routes
- [ ] اختبار المرتجعات

### Frontend
- [ ] صفحة `Returns.jsx`
- [ ] `ReturnForm.jsx` component
- [ ] `ReturnCard.jsx` component
- [ ] `ReturnTypeSelector.jsx`
- [ ] `returnsService.js`
- [ ] اختبار إضافة مرتجع
- [ ] اختبار عرض المرتجعات

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 7: Returns Management"`

---

## 📅 اليوم 8: الموردون

### Backend
- [ ] Migration: `suppliers` table
- [ ] Migration: `purchase_invoices` table
- [ ] Migration: `purchase_items` table
- [ ] Model: `Supplier` (extends BaseModel)
- [ ] Model: `PurchaseInvoice` (extends BaseModel)
- [ ] Model: `PurchaseItem`
- [ ] `SupplierController` - CRUD
- [ ] `SupplierController` - balance()
- [ ] `PurchaseInvoiceController` - store()
- [ ] `PurchaseInvoiceController` - index()
- [ ] `PurchaseInvoiceController` - pay()
- [ ] Logic لتحديث المخزون عند الشراء
- [ ] Logic لإنشاء Inventory Transaction (type: in)
- [ ] Routes
- [ ] اختبار الموردين
- [ ] اختبار فواتير الشراء

### Frontend
- [ ] صفحة `Suppliers.jsx`
- [ ] `SupplierForm.jsx`
- [ ] `PurchaseInvoices.jsx`
- [ ] `PurchaseInvoiceForm.jsx`
- [ ] `SupplierCard.jsx`
- [ ] `suppliersService.js`
- [ ] `purchaseInvoicesService.js`
- [ ] اختبار CRUD للموردين
- [ ] اختبار فواتير الشراء

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 8: Suppliers Management"`

---

## 📅 اليوم 9: المصروفات

### Backend
- [ ] Migration: `expense_categories` table
- [ ] Migration: `expenses` table
- [ ] Model: `ExpenseCategory` (extends BaseModel)
- [ ] Model: `Expense` (extends BaseModel)
- [ ] `ExpenseCategoryController` - CRUD
- [ ] `ExpenseController` - index()
- [ ] `ExpenseController` - store()
- [ ] `ExpenseController` - update()
- [ ] `ExpenseController` - destroy()
- [ ] `ExpenseController` - summary()
- [ ] Routes
- [ ] اختبار المصروفات

### Frontend
- [ ] صفحة `Expenses.jsx`
- [ ] `ExpenseForm.jsx`
- [ ] `ExpenseCategoryManager.jsx`
- [ ] `ExpenseCard.jsx`
- [ ] `ExpenseChart.jsx`
- [ ] Filters
- [ ] `expensesService.js`
- [ ] اختبار CRUD للمصروفات
- [ ] اختبار Filters

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 9: Expenses Management"`

---

## 📅 اليوم 10: الأرباح والخسائر

### Backend
- [ ] `ProfitLossController` - daily()
- [ ] `ProfitLossController` - monthly()
- [ ] `ProfitLossController` - byProduct()
- [ ] `ProfitLossController` - byCategory()
- [ ] `ProfitLossController` - summary()
- [ ] Logic لحساب الربح **On-The-Fly** (من sales, expenses)
- [ ] ❌ **لا profit_loss_reports table**
- [ ] Routes
- [ ] اختبار جميع الحسابات

### Frontend
- [ ] صفحة `ProfitLoss.jsx`
- [ ] `ProfitSummary.jsx` component
- [ ] `ProfitChart.jsx` component
- [ ] `ProfitFilters.jsx`
- [ ] `ProfitTable.jsx`
- [ ] `profitLossService.js`
- [ ] `npm install recharts` (للرسوم البيانية)
- [ ] اختبار عرض الأرباح
- [ ] اختبار Charts

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 10: Profit & Loss (On-The-Fly)"`

---

## 📅 اليوم 11: التقارير - الجزء الأول

### Backend
- [ ] `ReportController` - bestSelling()
- [ ] `ReportController` - worstSelling()
- [ ] `ReportController` - salesByTime()
- [ ] `ReportController` - expiredLosses()
- [ ] ❌ `monthlyComparison()` - **لاحقًا**
- [ ] Routes
- [ ] اختبار جميع التقارير

### Frontend
- [ ] صفحة `Reports.jsx`
- [ ] `BestSellingProducts.jsx`
- [ ] `SalesByTime.jsx`
- [ ] `ExpiredLosses.jsx`
- [ ] Charts وتصورات
- [ ] `reportsService.js`
- [ ] اختبار عرض التقارير

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 11: Reports Part 1"`

---

## 📅 اليوم 12: التقارير - الجزء الثاني

### Backend
- [ ] `composer require barryvdh/laravel-dompdf`
- [ ] Export to PDF functionality ✅
- [ ] ❌ Export to Excel - **لاحقًا**
- [ ] `ReportController` - inventoryReports()
- [ ] `ReportController` - financialReports()
- [ ] Routes
- [ ] اختبار Export PDF

### Frontend
- [ ] `ReportFilters.jsx` - Filters متقدمة
- [ ] `ExportButtons.jsx` (PDF فقط)
- [ ] `ReportCharts.jsx`
- [ ] `ReportTable.jsx`
- [ ] `ReportDashboard.jsx`
- [ ] تحسين UI/UX
- [ ] اختبار Export to PDF

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 12: Reports Part 2 - PDF Export"`

---

## 📅 اليوم 13: الإعدادات

### Backend
- [ ] Migration: `settings` table
- [ ] Model: `Setting` (extends BaseModel)
- [ ] `SettingController` - index()
- [ ] `SettingController` - update()
- [ ] `SettingController` - bulkUpdate()
- [ ] `SettingController` - uploadLogo()
- [ ] `BackupController` - create()
- [ ] `BackupController` - list()
- [ ] `BackupController` - restore()
- [ ] Logic للنسخ الاحتياطي
- [ ] Routes
- [ ] اختبار الإعدادات
- [ ] اختبار النسخ الاحتياطي

### Frontend
- [ ] صفحة `Settings.jsx`
- [ ] `StoreSettings.jsx`
- [ ] `PrinterSettings.jsx`
- [ ] `BackupManager.jsx`
- [ ] `LogoUpload.jsx`
- [ ] `settingsService.js`
- [ ] `backupService.js`
- [ ] اختبار تحديث الإعدادات
- [ ] اختبار النسخ الاحتياطي

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 13: Settings & Backup"`

---

## 📅 اليوم 14: Dashboard وتحسينات UX

### Backend
- [ ] `DashboardController` - stats()
- [ ] `DashboardController` - recentSales()
- [ ] `DashboardController` - alerts()
- [ ] Routes
- [ ] اختبار Dashboard APIs

### Frontend
- [ ] صفحة `Dashboard.jsx`
- [ ] `StatsCards.jsx`
- [ ] `SalesChart.jsx`
- [ ] `QuickActions.jsx`
- [ ] `RecentSales.jsx`
- [ ] `AlertsPanel.jsx`
- [ ] تحسين Navigation
- [ ] تحسين Responsive Design
- [ ] `dashboardService.js`
- [ ] `npm install react-hot-toast` (للإشعارات)
- [ ] اختبار Dashboard
- [ ] اختبار Responsive

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 14: Dashboard & UX Improvements"`

---

## 📅 اليوم 15: الاختبارات النهائية والتحسينات

### Backend Testing
- [ ] Unit Tests للـ Controllers المهمة
- [ ] Integration Tests للـ APIs
- [ ] اختبار Multi-Tenant isolation
- [ ] **اختبار Global Scope على جميع Models** ⚠️
- [ ] اختبار Performance
- [ ] إصلاح الأخطاء المكتشفة
- [ ] تحسين Queries (Eager Loading)
- [ ] إضافة Database Indexes
- [ ] مراجعة Security

### Frontend Testing
- [ ] اختبار جميع الصفحات
- [ ] اختبار جميع Forms
- [ ] اختبار Responsive Design
- [ ] اختبار Performance
- [ ] إصلاح الأخطاء
- [ ] تحسين Loading States
- [ ] تحسين Error Handling
- [ ] إضافة Toast Notifications
- [ ] إضافة Error Boundaries

### General
- [ ] مراجعة الأمان (Security)
- [ ] مراجعة Validation
- [ ] مراجعة Error Messages
- [ ] إعداد Production Environment
- [ ] كتابة README.md
- [ ] كتابة API Documentation
- [ ] Final code review
- [ ] Clean up unused code

### Git
- [ ] `git add .`
- [ ] `git commit -m "Day 15: Final Testing & Polish"`
- [ ] `git tag v1.0.0`
- [ ] إنشاء Release Notes

---

## 📊 ملخص التقدم الإجمالي

### الميزات المكتملة
- [ ] Authentication & Authorization
- [ ] Products Management
- [ ] Categories Management
- [ ] Inventory Transactions
- [ ] Sales (POS)
- [ ] Inventory Management
- [ ] Returns
- [ ] Suppliers
- [ ] Purchase Invoices
- [ ] Expenses
- [ ] Profit & Loss (On-The-Fly)
- [ ] Reports (مبسطة)
- [ ] Settings
- [ ] Backup
- [ ] Dashboard

### الاختبارات
- [ ] Unit Tests
- [ ] Integration Tests
- [ ] E2E Tests (اختياري)
- [ ] Performance Tests
- [ ] Security Tests
- [ ] **Global Scope Tests** ⚠️

### التوثيق
- [ ] README.md
- [ ] API Documentation
- [ ] User Guide (اختياري)

---

## 🎯 نصائح للنجاح

1. **التزم بالخطة**: اتبع الخطة يوم بيوم
2. **اختبر باستمرار**: اختبر كل Feature بعد إكماله
3. **استخدم Git**: احفظ التغييرات يوميًا
4. **راجع الكود**: راجع الكود قبل الانتقال لليوم التالي
5. **⚠️ Global Scope**: تأكد من Global Scope على جميع Models
6. **اطلب المساعدة**: لا تتردد في طلب المساعدة عند الحاجة

---

**Good Luck! 🚀**
