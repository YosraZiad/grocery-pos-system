# Sprint 0: Current State Assessment

## 1. Business Capabilities
The current project is a standalone Monolithic POS system.
* **Completed:** User Authentication, Fast Login (Barcode), Role/Permission management, Product/Category catalog, Basic POS Checkout (hybrid payments, suspensions), Shift sessions, Inventory tracking (in/out ledger), Expenses, Purchases, and Reporting.
* **Partial Implementations:** Returns (needs deep linking to original sales), Shift Management (needs robust cash reconciliation).
* **Missing Capabilities:** Offline Mode, Hardware integration (printers/scanners beyond keyboard emulation), Customer profiles (CRM), Loyalty programs, Multi-warehouse management.

## 2. Architecture & Folder Structure
* **Backend:** Laravel 12 standard MVC structure (`app/Http/Controllers`, `app/Models`).
* **Frontend:** React 19 SPA (`src/components`, `src/pages`) bundled with Vite.
* **Database:** MySQL. Multi-tenancy is achieved via a global `tenant_id` column across all domain tables.

## 3. Coupling Points & Technical Debt
* **God Controllers:** Business logic (inventory deduction, cart calculation, payment processing) is heavily coupled inside `SaleController`, `InventoryController`, and `ReportController`.
* **Coupling Points:** The POS domain is tightly coupled to the global `users` table and global `Spatie` permission tables.
* **Technical Debt:** Lack of a dedicated Service Layer and Repository Pattern. Eloquent models are queried statically directly within the HTTP request lifecycle.
* **Offline Capabilities:** Non-existent. The React frontend relies strictly on live REST API endpoints.
