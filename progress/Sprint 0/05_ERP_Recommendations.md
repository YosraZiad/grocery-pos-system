# Sprint 0: ERP Platform Recommendations

*Note: These are capabilities the central ERP Platform must provide to support the POS Module effectively.*

## 1. Dynamic Module Registry
* **Description:** A core service where modules can register their existence, version, and health status.
* **Reason:** The ERP needs to know the POS is installed to show its UI and listen to its APIs.
* **Priority:** Critical

## 2. Permission Registry via API
* **Description:** A mechanism for the POS module to inject its granular permissions (e.g., `void sales`, `open cash drawer`) into the central ERP Role Manager.
* **Reason:** Centralized administration of users requires knowing what permissions exist across all modules.
* **Priority:** Critical

## 3. Global Identity & Authentication Context
* **Description:** A unified way (e.g., standard Bearer tokens via SSO) to identify the current user and `tenant_id` across all modules.
* **Reason:** Prevents modules from implementing divergent authentication logic.
* **Priority:** Critical

## 4. Frontend Application Shell
* **Description:** An overarching React application that dynamically loads remote components (Micro-frontends) or dynamically imports module routes.
* **Reason:** Ensures a unified user experience (single Sidebar, single Topnav).
* **Priority:** Critical

## 5. Event Bus / Notification APIs
* **Description:** A centralized pub/sub system.
* **Reason:** Allows the POS to broadcast `InventoryLow` or `ShiftClosed` without caring which other modules (like Accounting or Procurement) are listening.
* **Priority:** Important
