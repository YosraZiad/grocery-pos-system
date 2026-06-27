# Sprint 0: Risk Assessment

## 1. Database Isolation Complexity
* **Risk:** Migrating globally tracked tables (e.g., `products`, `sales`) to module-specific domains may cause foreign key constraints to fail if cross-module joins are prevalent.
* **Mitigation:** Use soft dependencies or map external tables strictly via Interfaces instead of direct Eloquent relationships.

## 2. Frontend Routing Conflicts
* **Risk:** The standalone React SPA uses explicit routes that might clash with other ERP modules (e.g., `/settings` or `/reports`).
* **Mitigation:** Namespace all POS frontend routes under a `/pos/*` prefix during extraction.

## 3. Scope Creep during Refactoring
* **Risk:** While decoupling God Controllers, engineers might attempt to fix or optimize business logic, introducing regressions.
* **Mitigation:** Enforce strict "lift and shift" policies for Phase 1. Do not alter business outcomes while refactoring architecture.

## 4. Broken Test Coverage
* **Risk:** Minimal existing automated tests mean architectural refactoring has a high chance of breaking core functionality (like Cart calculations).
* **Mitigation:** Mandate writing integration tests for checkout and inventory flows **before** beginning controller refactoring.
