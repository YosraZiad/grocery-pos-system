# 🔧 التفاصيل التقنية - Grocery Store POS System

## 📊 Database Schema

### Core Tables

```sql
-- Tenants (Multi-Tenant)
tenants
  id (bigint, primary)
  name (string)
  domain (string, unique)
  created_at
  updated_at

-- Users & Authentication
users
  id (bigint, primary)
  tenant_id (bigint, foreign)
  name (string)
  email (string, unique)
  password (string, hashed)
  role (enum: admin, cashier)
  created_at
  updated_at

roles
  id (bigint, primary)
  name (string: admin, cashier)
  guard_name (string)

permissions
  id (bigint, primary)
  name (string)
  guard_name (string)

model_has_roles
  role_id
  model_id
  model_type

-- Products & Categories
categories
  id (bigint, primary)
  tenant_id (bigint, foreign)
  name (string)
  description (text, nullable)
  created_at
  updated_at

products
  id (bigint, primary)
  tenant_id (bigint, foreign)
  category_id (bigint, foreign)
  name (string)
  barcode (string, unique, nullable)
  purchase_price (decimal 10,2)
  sale_price (decimal 10,2)
  quantity (integer, default 0)
  expiry_date (date, nullable)
  min_stock_alert (integer, default 5)
  min_expiry_alert (integer, default 7) -- days
  created_at
  updated_at

-- Inventory Transactions (⚠️ مهم: قبل Sales)
inventory_transactions
  id (bigint, primary)
  tenant_id (bigint, foreign)
  product_id (bigint, foreign)
  type (enum: in, out, return)
  quantity (integer)
  reference_type (string) -- Sale, Purchase, Return
  reference_id (bigint)
  notes (text, nullable)
  created_at
  updated_at

-- Sales
sales
  id (bigint, primary)
  tenant_id (bigint, foreign)
  invoice_number (string, unique)
  user_id (bigint, foreign)
  total (decimal 10,2)
  discount (decimal 10,2, default 0)
  discount_type (enum: percentage, fixed)
  payment_method (enum: cash, card, transfer)
  status (enum: completed, cancelled)
  created_at
  updated_at

sale_items
  id (bigint, primary)
  sale_id (bigint, foreign)
  product_id (bigint, foreign)
  quantity (integer)
  price (decimal 10,2)
  subtotal (decimal 10,2)
  created_at
  updated_at

-- Returns
returns
  id (bigint, primary)
  tenant_id (bigint, foreign)
  type (enum: customer, supplier)
  sale_id (bigint, foreign, nullable)
  supplier_id (bigint, foreign, nullable)
  product_id (bigint, foreign)
  quantity (integer)
  reason (text)
  amount (decimal 10,2)
  status (enum: pending, completed)
  created_at
  updated_at

-- Suppliers
suppliers
  id (bigint, primary)
  tenant_id (bigint, foreign)
  name (string)
  phone (string, nullable)
  email (string, nullable)
  address (text, nullable)
  balance (decimal 10,2, default 0) -- ديون
  created_at
  updated_at

purchase_invoices
  id (bigint, primary)
  tenant_id (bigint, foreign)
  supplier_id (bigint, foreign)
  invoice_number (string)
  total (decimal 10,2)
  paid_amount (decimal 10,2, default 0)
  balance (decimal 10,2)
  date (date)
  created_at
  updated_at

purchase_items
  id (bigint, primary)
  purchase_invoice_id (bigint, foreign)
  product_id (bigint, foreign)
  quantity (integer)
  price (decimal 10,2)
  subtotal (decimal 10,2)
  created_at
  updated_at

-- Expenses
expense_categories
  id (bigint, primary)
  tenant_id (bigint, foreign)
  name (string)
  created_at
  updated_at

expenses
  id (bigint, primary)
  tenant_id (bigint, foreign)
  category_id (bigint, foreign)
  amount (decimal 10,2)
  description (text, nullable)
  date (date)
  created_at
  updated_at

-- Settings
settings
  id (bigint, primary)
  tenant_id (bigint, foreign)
  key (string)
  value (text)
  created_at
  updated_at

-- ❌ NO profit_loss_reports table
-- Profit/Loss calculated On-The-Fly from sales, expenses, returns

-- Indexes
CREATE INDEX idx_products_tenant ON products(tenant_id);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_sales_tenant ON sales(tenant_id);
CREATE INDEX idx_sales_date ON sales(created_at);
CREATE INDEX idx_inventory_product ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_tenant ON inventory_transactions(tenant_id);
```

---

## 🔌 API Endpoints Structure

### Authentication
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

### Categories
```
GET    /api/categories
POST   /api/categories
GET    /api/categories/{id}
PUT    /api/categories/{id}
DELETE /api/categories/{id}
```

### Products
```
GET    /api/products?page=1&per_page=20&search=query&category_id=1
POST   /api/products
GET    /api/products/{id}
PUT    /api/products/{id}
DELETE /api/products/{id}
GET    /api/products/search?q={query}
```

### Sales
```
POST   /api/sales
GET    /api/sales?from=date&to=date&page=1
GET    /api/sales/{id}
GET    /api/sales/{id}/invoice  (HTML response)
```

### Inventory
```
GET    /api/inventory
GET    /api/inventory/low-stock
GET    /api/inventory/expiring-soon
GET    /api/inventory/transactions?product_id=1
```

### Returns
```
POST   /api/returns
GET    /api/returns?type=customer&from=date&to=date
GET    /api/returns/{id}
PUT    /api/returns/{id}
```

### Suppliers
```
GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/{id}
PUT    /api/suppliers/{id}
DELETE /api/suppliers/{id}
GET    /api/suppliers/{id}/balance
```

### Purchase Invoices
```
POST   /api/purchase-invoices
GET    /api/purchase-invoices?supplier_id=1
GET    /api/purchase-invoices/{id}
POST   /api/purchase-invoices/{id}/pay
```

### Expenses
```
GET    /api/expense-categories
POST   /api/expense-categories
PUT    /api/expense-categories/{id}
DELETE /api/expense-categories/{id}

GET    /api/expenses?category_id=1&from=date&to=date
POST   /api/expenses
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}
GET    /api/expenses/summary?period=daily/monthly
```

### Profit & Loss (On-The-Fly)
```
GET    /api/profit-loss/daily?date=2024-01-15
GET    /api/profit-loss/monthly?month=1&year=2024
GET    /api/profit-loss/by-product?product_id=1&from=date&to=date
GET    /api/profit-loss/by-category?category_id=1&from=date&to=date
GET    /api/profit-loss/summary?from=date&to=date
```

### Reports
```
GET    /api/reports/best-selling?period=daily/monthly&limit=10
GET    /api/reports/worst-selling?period=daily/monthly&limit=10
GET    /api/reports/sales-by-time?date=2024-01-15
GET    /api/reports/expired-losses?from=date&to=date
GET    /api/reports/inventory
GET    /api/reports/financial?from=date&to=date
GET    /api/reports/export/pdf?type=best-selling
```

### Settings
```
GET    /api/settings
PUT    /api/settings/{key}
POST   /api/settings/bulk-update
POST   /api/settings/upload-logo
```

### Backup
```
POST   /api/backup/create
GET    /api/backup/list
POST   /api/backup/restore/{id}
DELETE /api/backup/{id}
```

### Dashboard
```
GET    /api/dashboard/stats
GET    /api/dashboard/recent-sales?limit=10
GET    /api/dashboard/alerts
```

---

## 🧩 Frontend Component Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── ProtectedRoute.jsx
│   │   ├── Loading.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── Toast.jsx
│   ├── auth/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── products/
│   │   ├── ProductsList.jsx
│   │   ├── ProductForm.jsx
│   │   ├── ProductCard.jsx
│   │   └── SearchBar.jsx
│   ├── sales/
│   │   ├── SalesScreen.jsx
│   │   ├── Cart.jsx
│   │   ├── CartItem.jsx
│   │   ├── ProductSearch.jsx
│   │   ├── DiscountModal.jsx
│   │   ├── PaymentMethod.jsx
│   │   └── Invoice.jsx  (HTML)
│   ├── inventory/
│   │   ├── InventoryList.jsx
│   │   ├── StockAlert.jsx
│   │   ├── ExpiryAlert.jsx
│   │   └── InventoryTransactions.jsx
│   ├── returns/
│   │   ├── ReturnsList.jsx
│   │   └── ReturnForm.jsx
│   ├── suppliers/
│   │   ├── SuppliersList.jsx
│   │   ├── SupplierForm.jsx
│   │   └── PurchaseInvoiceForm.jsx
│   ├── expenses/
│   │   ├── ExpensesList.jsx
│   │   └── ExpenseForm.jsx
│   ├── reports/
│   │   ├── ReportsDashboard.jsx
│   │   ├── BestSellingProducts.jsx
│   │   └── ReportCharts.jsx
│   └── dashboard/
│       ├── StatsCards.jsx
│       ├── SalesChart.jsx
│       └── AlertsPanel.jsx
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── Products.jsx
│   ├── Sales.jsx
│   ├── Inventory.jsx
│   ├── Returns.jsx
│   ├── Suppliers.jsx
│   ├── Expenses.jsx
│   ├── ProfitLoss.jsx
│   ├── Reports.jsx
│   └── Settings.jsx
├── services/
│   ├── api.js
│   ├── auth.js
│   ├── products.js
│   ├── sales.js
│   └── ...
├── hooks/
│   ├── useAuth.js
│   ├── useProducts.js
│   └── ...
├── context/  ← Context API بدل store
│   ├── AuthContext.jsx
│   └── ...
├── utils/
│   ├── format.js
│   ├── validation.js
│   └── constants.js
└── layouts/
    └── MainLayout.jsx
```

---

## 🔐 Security Considerations

### Backend (Laravel)
- ✅ Sanctum for API authentication
- ✅ Role-based permissions (Spatie)
- ✅ Multi-tenant isolation (middleware + Global Scope)
- ✅ **Global Scope على جميع Models** ⚠️ مهم جدًا
- ✅ Input validation (Form Requests)
- ✅ SQL injection protection (Eloquent)
- ✅ XSS protection
- ✅ CSRF protection (for web routes)
- ✅ Rate limiting
- ✅ Password hashing (bcrypt)

### Frontend (React)
- ✅ Token storage (httpOnly cookies preferred)
- ✅ Protected routes
- ✅ Input sanitization
- ✅ XSS prevention
- ✅ Secure API calls (HTTPS)

---

## 📦 Required Packages

### Backend (Laravel)
```json
{
  "require": {
    "laravel/framework": "^10.0",
    "laravel/sanctum": "^3.0",
    "spatie/laravel-permission": "^5.0",
    "barryvdh/laravel-dompdf": "^2.0"
  }
}
```

**ملاحظة:** Excel Export لاحقًا (مش في الخطة الأساسية)

### Frontend (React)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0",
    "@tanstack/react-query": "^5.0.0",
    "recharts": "^2.10.0",
    "react-hot-toast": "^2.4.0"
  }
}
```

**ملاحظة:** ❌ لا Zustand ولا Redux - Context API فقط

---

## 🧪 Testing Strategy

### Backend Tests
- Unit Tests: Controllers, Models, Services
- Feature Tests: API endpoints
- Integration Tests: Multi-tenant isolation
- **Global Scope Tests** ⚠️

### Frontend Tests
- Component Tests: React Testing Library
- Integration Tests: User flows
- E2E Tests: Critical paths (optional)

### Test Cases Priority
1. Authentication & Authorization
2. Sales flow (complete transaction)
3. Inventory updates
4. Profit calculations (On-The-Fly)
5. Multi-tenant isolation
6. **Global Scope verification**

---

## 🚀 Deployment Checklist

### Backend
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Seeders run (if needed)
- [ ] Storage linked
- [ ] Queue workers configured
- [ ] Cron jobs set up
- [ ] SSL certificate installed
- [ ] Backup system configured

### Frontend
- [ ] Build production bundle
- [ ] Environment variables set
- [ ] API URL configured
- [ ] Assets optimized
- [ ] CDN configured (optional)

---

## 📝 Notes

- Use Laravel Queues for heavy operations (reports, exports)
- Implement caching for frequently accessed data
- Use database transactions for critical operations
- Implement soft deletes for important records
- Add activity logging for audit trail
- **Global Scope على جميع Models** ⚠️
- **Profit/Loss On-The-Fly** (لا table)
- **HTML Invoice** (بدل PDF معقد)
- **Inventory Transactions قبل Sales**

---

**Last Updated:** 2024
