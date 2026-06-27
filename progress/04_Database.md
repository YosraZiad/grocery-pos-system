# POS Project Reverse Engineering Audit: Database Audit

## Core Tables

### 1. `users` & `tenants`
* **Purpose:** Multi-tenant isolation and user authentication.
* **Key Columns:** `tenant_id`, `email`, `password`, `employee_barcode`, `failed_login_attempts`, `locked_until`, `pin`.

### 2. `categories` & `products`
* **Purpose:** Inventory catalog.
* **Key Columns:** `tenant_id`, `parent_id` (nested categories), `barcode`, `purchase_price`, `sale_price`, `quantity`, `min_stock_alert`.
* **Relationships:** Product `belongsTo` Category.

### 3. `sales` & `sale_items`
* **Purpose:** POS transactions.
* **Key Columns:** `tenant_id`, `total_amount`, `payment_method`, `shift_id` (assumed).
* **Relationships:** Sale `hasMany` SaleItems. SaleItem `belongsTo` Product.

### 4. `inventory_transactions`
* **Purpose:** Audit ledger for stock movements.
* **Key Columns:** `tenant_id`, `product_id`, `type` (in/out), `quantity`, `reference_type`.

### 5. `suppliers`, `purchase_invoices`, `purchase_items`
* **Purpose:** Supply chain management.
* **Relationships:** Supplier `hasMany` Invoices `hasMany` Items.

### 6. `expense_categories` & `expenses`
* **Purpose:** Accounting for operational costs.

### 7. `shifts`
* **Purpose:** Cash drawer and session management for cashiers.

### 8. `audit_logs`
* **Purpose:** System traceability.

### 9. `suspended_sales`
* **Purpose:** Parked POS carts.

### 10. `returns`
* **Purpose:** Product return records.

## Database Assessment
* **Normalization:** Generally well-normalized. Sub-categories use an adjacency list (`parent_id`).
* **Missing Foreign Keys:** Cannot definitively prove without schema dump, but Laravel migrations typically define them.
* **Dead/Duplicate Tables:** None identified in the migrations directory.
* **Multi-Tenancy:** Handled via a global `tenant_id` column rather than separate databases.
