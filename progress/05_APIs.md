# POS Project Reverse Engineering Audit: API Audit

## Authentication & Authorization
* `POST /api/auth/register` - Create new tenant/user
* `POST /api/auth/login` - Authenticate via password or barcode
* `POST /api/auth/logout` - Revoke token
* `GET /api/auth/me` - Get current user context
* `PUT /api/auth/pin` - Update user PIN
* `POST /api/auth/verify-pin` - Verify user PIN for sensitive actions

## POS & Sales
* `GET /api/sales` - List sales
* `POST /api/sales` - Process checkout
* `GET /api/sales/{id}/invoice` - Get receipt data
* `PUT /api/sales/{id}/cancel` - Void a sale
* `POST /api/terminal/charge` - Simulator for payment terminal
* `GET /api/suspended-sales` - List parked sales
* `POST /api/suspended-sales` - Park a sale

## Inventory & Catalog
* `GET /api/products` - List products
* `POST /api/products` - Create product
* `GET /api/categories` - List nested categories
* `GET /api/inventory/low-stock` - Low stock alerts

## Purchasing
* `GET /api/suppliers` - List vendors
* `POST /api/purchase-invoices` - Create purchase record

## Expenses & Reports
* `GET /api/expenses` - List expenses
* `GET /api/profit-loss/daily` - Daily P&L
* `GET /api/reports/best-selling` - Analytics

## System
* `GET /api/settings` - System configs
* `POST /api/backup/create` - Trigger DB backup
* `POST /api/shifts/start` - Open register
* `POST /api/shifts/end` - Close register
