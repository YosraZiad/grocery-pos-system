# POS Project Reverse Engineering Audit: React Frontend Audit

## Pages
* `Home.jsx` (Main POS Terminal)
* `Login.jsx`, `Register.jsx`, `FastLoginTestPanel.jsx` (Auth)
* `Products.jsx`, `Inventory.jsx`
* `Categories.jsx` (Implied via category tree feature)
* `Sales.jsx`, `SalesList.jsx`, `SaleDetails.jsx`
* `Returns.jsx`
* `Suppliers.jsx`, `PurchaseInvoices.jsx`
* `Expenses.jsx`
* `Reports.jsx`, `ProfitLoss.jsx`
* `Users.jsx`, `Roles.jsx`, `Profile.jsx`
* `Settings.jsx`
* `StartShift.jsx`
* `CardTerminalSimulator.jsx`
* `Invoice.jsx`

## Layouts
* `Layout.jsx` (Shell layout combining Sidebar, Topnav, and Main Content)

## Reusable Components
* `AdminAuthModal.jsx` (Override actions)
* `CardPaymentModal.jsx`, `CashPaymentModal.jsx`, `HybridPaymentModal.jsx`
* `Cart.jsx`, `CartItem.jsx`
* `ConfirmationModal.jsx`, `DiscountModal.jsx`
* `ProductForm.jsx`, `ProductSearch.jsx`, `ProductCard.jsx`
* `QuantityControl.jsx`, `SearchBar.jsx`
* `SuspendCartModal.jsx`, `SuspendedInvoicesModal.jsx`
* `ProtectedComponent.jsx`, `ProtectedRoute.jsx` (PBAC implementations)
* `LockScreen.jsx`

## Architecture Highlights
* **Routing:** Handled by `react-router-dom` in `App.jsx` or `main.jsx`.
* **State & Fetching:** Uses `@tanstack/react-query` to cache and synchronize API data.
* **Styling:** Tailwind CSS (`index.css`).
* **Icons:** FontAwesome.
* **Permissions:** `ProtectedComponent.jsx` renders UI conditionally based on user capabilities.
