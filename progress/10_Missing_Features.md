# POS Project Reverse Engineering Audit: Missing Features

## Critical
* **Offline Mode (PWA/IndexedDB):** A POS must function during internet outages and queue sales for later synchronization.
* **Hardware Integration:** Support for native receipt printers (ESC/POS), cash drawer kick signals, and scale integration.
* **Customer Management (CRM):** Ability to assign a sale to a specific customer profile.

## Important
* **Multi-Warehouse / Multi-Branch:** Assigning stock and terminals to specific physical locations within the same tenant.
* **Product Variants / Matrix:** Support for size/color variations under a single parent product.
* **Promotions & Advanced Discounts:** Rule-based pricing (e.g., Buy One Get One, time-based happy hours).
* **Tax Classes:** Complex tax rules depending on product type and region.

## Nice to Have
* **Loyalty & Rewards Program:** Earning and redeeming points.
* **Gift Cards / Store Credit.**
* **API Webhooks:** For easy external integrations without full modularization.
