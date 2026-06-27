# Sprint 0: Gap Analysis

## 1. Code Structure (Monolith vs. Module)
* **Current:** Code lives in global `app/`, `routes/`, `database/` directories.
* **Target:** Code must live in a dedicated `Modules/POS/` structure.
* **Classification:** **Critical**
* **Reason:** Without physical isolation, it cannot be packaged or installed as an ERP module.

## 2. Business Logic Coupling (Controllers vs. Services)
* **Current:** Logic is embedded in HTTP Controllers.
* **Target:** Logic must be extracted to abstract Service classes.
* **Classification:** **Critical**
* **Reason:** ERP integrations (like API gateways or CLI commands) must execute business logic without simulating HTTP requests.

## 3. Identity and Authorization Binding
* **Current:** Tied to global `User` model and direct Spatie calls.
* **Target:** Should authenticate against a central ERP Identity Provider or use abstract Identity interfaces.
* **Classification:** **Important**
* **Reason:** Prevents the module from breaking if the ERP uses a different user table structure or SSO mechanism.

## 4. Frontend Integration
* **Current:** React handles its own global routing (`App.jsx`).
* **Target:** React routes must be dynamically registered into an ERP Shell router.
* **Classification:** **Critical**
* **Reason:** A unified ERP requires a single seamless UI, not separate SPAs.

## 5. Offline Capabilities
* **Current:** Fully online dependent.
* **Target:** PWA / IndexedDB caching for core POS checkout.
* **Classification:** **Optional** (for immediate modularization, but Critical for retail operations).
* **Reason:** POS systems must survive temporary network drops.
