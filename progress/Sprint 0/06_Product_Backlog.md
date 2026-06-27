# Sprint 0: Product Backlog

## Epic 1: Backend Structural Modularization
* [Task] Install and configure `nwidart/laravel-modules` (or similar package).
* [Task] Migrate POS Models, Controllers, and Requests to `Modules/POS/`.
* [Task] Migrate DB Migrations and Seeders to isolated module paths.
* [Task] Refactor API routing to load from the module's `api.php`.

## Epic 2: Core Decoupling
* [Task] Create `SaleService` and move checkout logic out of `SaleController`.
* [Task] Create `InventoryService` and move stock deduction logic.
* [Task] Introduce explicit DTOs for `SaleRequest` and `ReturnRequest`.

## Epic 3: ERP Integration Points
* [Task] Abstract Spatie Permission seeding into an `InstallModule` command.
* [Task] Abstract App Settings into a module configuration file.
* [Task] Dispatch domain events (`SaleCompleted`, `InventoryAdjusted`).

## Epic 4: Frontend Modularization
* [Task] Refactor React Router to support dynamic route injection.
* [Task] Decouple `Layout.jsx` into an ERP Shell dependency.
* [Task] Package POS React components for external consumption.
