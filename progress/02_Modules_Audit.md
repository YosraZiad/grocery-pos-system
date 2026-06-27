# POS Project Reverse Engineering Audit: Functional Audit

## 1. Products & Categories Module
* **Purpose:** Manage product catalog, taxonomy, and pricing.
* **Entry Points:** `/api/products`, `/api/categories`
* **Controllers:** `ProductController`, `CategoryController`
* **Models:** `Product`, `Category`
* **UI Pages:** `Products.jsx`
* **Completion %:** ~90% (Lacks variants, matrix).

## 2. Point of Sale (Sales) Module
* **Purpose:** Process transactions, apply payments, handle shopping carts.
* **Entry Points:** `/api/sales`, `/api/sales/{id}/invoice`, `/api/suspended-sales`
* **Controllers:** `SaleController`, `SuspendedSaleController`, `TerminalController`
* **Models:** `Sale`, `SaleItem`, `SuspendedSale`
* **UI Pages:** `Home.jsx` (POS interface), `Sales.jsx`, `SaleDetails.jsx`
* **Completion %:** ~85% (Has hybrid payments, suspension. Missing offline sync).

## 3. Inventory Module
* **Purpose:** Track stock levels, transactions, expiry, and low stock warnings.
* **Entry Points:** `/api/inventory`
* **Controllers:** `InventoryController`
* **Models:** `InventoryTransaction`
* **UI Pages:** `Inventory.jsx`
* **Completion %:** ~80% (Missing multi-warehouse logic).

## 4. Suppliers & Purchasing Module
* **Purpose:** Manage vendors, purchase invoices, and vendor balances.
* **Entry Points:** `/api/suppliers`, `/api/purchase-invoices`
* **Controllers:** `SupplierController`, `PurchaseInvoiceController`
* **Models:** `Supplier`, `PurchaseInvoice`, `PurchaseItem`
* **UI Pages:** `Suppliers.jsx`, `PurchaseInvoices.jsx`
* **Completion %:** ~80%.

## 5. Returns Module
* **Purpose:** Process product returns from customers.
* **Entry Points:** `/api/returns`
* **Controllers:** `ReturnController`
* **Models:** `ProductReturn`
* **UI Pages:** `Returns.jsx`
* **Completion %:** ~75%.

## 6. Expenses Module
* **Purpose:** Track operational costs.
* **Entry Points:** `/api/expenses`, `/api/expense-categories`
* **Controllers:** `ExpenseController`, `ExpenseCategoryController`
* **Models:** `Expense`, `ExpenseCategory`
* **UI Pages:** `Expenses.jsx`
* **Completion %:** ~90%.

## 7. Reports & Analytics Module
* **Purpose:** Provide insights into sales, profits, and stock.
* **Entry Points:** `/api/reports`, `/api/profit-loss`
* **Controllers:** `ReportController`, `ProfitLossController`
* **UI Pages:** `Reports.jsx`, `ProfitLoss.jsx`
* **Completion %:** ~85%.

## 8. Users & Authorization Module
* **Purpose:** Manage accounts, access control, and shifts.
* **Entry Points:** `/api/auth`, `/api/users`, `/api/roles`, `/api/shifts`
* **Controllers:** `AuthController`, `UserController`, `RoleController`, `ShiftController`
* **Models:** `User`, `Shift`, `Tenant`
* **UI Pages:** `Login.jsx`, `Register.jsx`, `Users.jsx`, `Roles.jsx`, `StartShift.jsx`, `FastLoginTestPanel.jsx`
* **Completion %:** ~95%.

## 9. Settings & System Module
* **Purpose:** App configuration, backups, and audit trails.
* **Entry Points:** `/api/settings`, `/api/backup`, `/api/audit-logs`
* **Controllers:** `SettingController`, `BackupController`, `AuditLogController`
* **Models:** `Setting`, `AuditLog`
* **UI Pages:** `Settings.jsx`
* **Completion %:** ~80%.
