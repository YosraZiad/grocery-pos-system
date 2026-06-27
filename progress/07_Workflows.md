# POS Project Reverse Engineering Audit: Business Workflow Audit

## 1. Fast Login Workflow
* **Input:** Employee scans Barcode or enters credentials.
* **Processing:** System checks `users` table. If 3 failed attempts, locks for 15 mins. Logs `last_login_at`. Issues Sanctum token.
* **Output:** User redirected to POS Home or Dashboard.

## 2. Shift Management Workflow
* **Input:** Cashier starts shift, inputs opening cash amount.
* **Processing:** `shifts` table record created. Registers subsequent sales against this shift.
* **Output:** Shift becomes Active. At end of shift, cash is reconciled against system totals.

## 3. POS Sale Workflow
* **Input:** Cashier scans barcode or clicks Product Card. Items added to `Cart`.
* **Processing:** Quantities are adjusted in state. Cashier selects payment method (Cash, Card, Hybrid). Sale sent to `/api/sales`. System deducts inventory and logs `inventory_transactions`.
* **Output:** `Sale` record generated. Invoice data returned for printing.

## 4. Suspend / Resume Sale Workflow
* **Input:** Cashier clicks "Suspend".
* **Processing:** Cart items saved to `suspended_sales` table via API. Cart is cleared locally.
* **Output:** Cart can be resumed later from the `SuspendedInvoicesModal`.

## 5. Category Tree Navigation
* **Input:** User clicks a node in the Category Tree.
* **Processing:** System loads children categories and associated products via API.
* **Output:** Products Grid updates to show relevant items.
