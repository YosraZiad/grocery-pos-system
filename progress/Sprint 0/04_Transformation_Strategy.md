# Sprint 0: Transformation Strategy

## Core Philosophy
Maximize reuse of the existing Laravel 12 / React 19 codebase. Prefer incremental transformations over complete rewrites.

## Phase 1: Structural Extraction (Backend)
* **Purpose:** Isolate the codebase physically.
* **Affected Components:** Routes, Controllers, Models, Migrations.
* **Outcome:** The app runs exactly as before, but all POS code lives in `Modules/POS/`.

## Phase 2: Decoupling & Service Abstraction
* **Purpose:** Remove business logic from Controllers.
* **Affected Components:** `SaleController`, `InventoryController`.
* **Outcome:** Clean controllers that only handle HTTP requests and DTO mapping, delegating to `SaleService` and `InventoryService`.

## Phase 3: ERP Integration Hooks
* **Purpose:** Allow the POS module to communicate with the ERP Core.
* **Affected Components:** Event listeners, Observers.
* **Outcome:** Operations like completing a sale will fire a `SaleCompletedEvent` which the ERP Core's Accounting module can listen to, eliminating direct database updates.

## Phase 4: Frontend Modularization
* **Purpose:** Convert the React SPA into an embeddable UI Module.
* **Affected Components:** `App.jsx`, React Router setup, Navigation components.
* **Outcome:** POS components register themselves into a global ERP registry, rendering inside an ERP layout shell.
