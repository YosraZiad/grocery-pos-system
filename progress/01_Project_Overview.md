# POS Project Reverse Engineering Audit: Project Discovery

## Backend Framework
* **Framework:** Laravel 12
* **Language:** PHP 8.2+
* **Style:** REST API Server

## Frontend Framework
* **Framework:** React 19
* **Language:** JavaScript/JSX
* **Build Tool:** Vite

## Folder Structure
* `backend/` - Contains the Laravel API.
* `frontend/` - Contains the React SPA.

## Architecture Style
* **Pattern:** Monolithic REST API Backend + Single Page Application (SPA) Frontend.
* **Tenancy:** Single-database multi-tenancy (via `tenant_id`).

## Domain Boundaries
* Authentication & Users
* Inventory & Products
* Point of Sale (POS) & Sales
* Purchasing & Suppliers
* Accounting (Expenses, Profit & Loss)
* Reporting
* System Configuration & Backups

## Package Managers
* **Backend:** Composer
* **Frontend:** npm

## API Style
* RESTful API, returning JSON payloads.
* Un-versioned endpoints (e.g., `/api/products` rather than `/api/v1/products`).

## Authentication Mechanism
* **System:** Laravel Sanctum (Token-based).
* **Methods:** Username/Password, Email/Password, Barcode (Fast Login).
* **Authorization:** Role & Permission based (Spatie Laravel Permission).

## State Management
* React Query (`@tanstack/react-query`) for server state.
* React Context API for global client state.
* Local state (`useState`, `useReducer`) for component state.

## Database Structure
* **Engine:** MySQL (>= 8.0).
* **Design:** Relational, multi-tenant with `tenant_id` columns across domain tables.

## Existing Migrations
The database schema encompasses users, tenants, products, categories, sales, returns, purchases, expenses, settings, shifts, audit logs, suspended sales, and Spatie permission tables.

## Existing Seeders
* `DatabaseSeeder`
* `UserSeeder`
* `FastLoginTestCasesSeeder`
