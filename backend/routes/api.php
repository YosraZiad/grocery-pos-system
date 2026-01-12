<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ReturnController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\PurchaseInvoiceController;
use App\Http\Controllers\ExpenseCategoryController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ProfitLossController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (لا تحتاج tenant_id)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (تحتاج authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    // Categories
    Route::get('/categories', [CategoryController::class, 'index'])->middleware('permission:view products');
    Route::post('/categories', [CategoryController::class, 'store'])->middleware('permission:create products');
    Route::get('/categories/{id}', [CategoryController::class, 'show'])->middleware('permission:view products');
    Route::put('/categories/{id}', [CategoryController::class, 'update'])->middleware('permission:edit products');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->middleware('permission:delete products');
    
    // Products
    Route::get('/products', [ProductController::class, 'index'])->middleware('permission:view products');
    Route::post('/products', [ProductController::class, 'store'])->middleware('permission:create products');
    Route::get('/products/{id}', [ProductController::class, 'show'])->middleware('permission:view products');
    Route::put('/products/{id}', [ProductController::class, 'update'])->middleware('permission:edit products');
    Route::delete('/products/{id}', [ProductController::class, 'destroy'])->middleware('permission:delete products');
    Route::get('/products/search', [ProductController::class, 'search'])->middleware('permission:view products');
    
    // Sales
    Route::get('/sales', [SaleController::class, 'index'])->middleware('permission:view sales');
    Route::post('/sales', [SaleController::class, 'store'])->middleware('permission:create sales');
    Route::get('/sales/{id}', [SaleController::class, 'show'])->middleware('permission:view sales');
    Route::get('/sales/{id}/invoice', [SaleController::class, 'invoice'])->middleware('permission:view sales');
    Route::put('/sales/{id}/cancel', [SaleController::class, 'cancel'])->middleware('permission:edit sales');
    
    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index'])->middleware('permission:view inventory');
    Route::get('/inventory/low-stock', [InventoryController::class, 'lowStock'])->middleware('permission:view inventory');
    Route::get('/inventory/expiring-soon', [InventoryController::class, 'expiringSoon'])->middleware('permission:view inventory');
    Route::get('/inventory/expired', [InventoryController::class, 'expired'])->middleware('permission:view inventory');
    Route::get('/inventory/transactions', [InventoryController::class, 'transactions'])->middleware('permission:view inventory');
    Route::get('/inventory/stats', [InventoryController::class, 'stats'])->middleware('permission:view inventory');
    
    // Returns
    Route::get('/returns', [ReturnController::class, 'index'])->middleware('permission:view returns');
    Route::post('/returns', [ReturnController::class, 'store'])->middleware('permission:create returns');
    Route::get('/returns/{id}', [ReturnController::class, 'show'])->middleware('permission:view returns');
    Route::put('/returns/{id}', [ReturnController::class, 'update'])->middleware('permission:edit returns');
    
    // Suppliers
    Route::get('/suppliers', [SupplierController::class, 'index'])->middleware('permission:view suppliers');
    Route::post('/suppliers', [SupplierController::class, 'store'])->middleware('permission:create suppliers');
    Route::get('/suppliers/{id}', [SupplierController::class, 'show'])->middleware('permission:view suppliers');
    Route::put('/suppliers/{id}', [SupplierController::class, 'update'])->middleware('permission:edit suppliers');
    Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy'])->middleware('permission:delete suppliers');
    Route::get('/suppliers/{id}/balance', [SupplierController::class, 'balance'])->middleware('permission:view suppliers');
    
    // Purchase Invoices
    Route::get('/purchase-invoices', [PurchaseInvoiceController::class, 'index'])->middleware('permission:view purchases');
    Route::post('/purchase-invoices', [PurchaseInvoiceController::class, 'store'])->middleware('permission:create purchases');
    Route::get('/purchase-invoices/{id}', [PurchaseInvoiceController::class, 'show'])->middleware('permission:view purchases');
    Route::post('/purchase-invoices/{id}/pay', [PurchaseInvoiceController::class, 'pay'])->middleware('permission:edit purchases');
    
    // Expense Categories
    Route::get('/expense-categories', [ExpenseCategoryController::class, 'index'])->middleware('permission:view expenses');
    Route::post('/expense-categories', [ExpenseCategoryController::class, 'store'])->middleware('permission:create expenses');
    Route::get('/expense-categories/{id}', [ExpenseCategoryController::class, 'show'])->middleware('permission:view expenses');
    Route::put('/expense-categories/{id}', [ExpenseCategoryController::class, 'update'])->middleware('permission:edit expenses');
    Route::delete('/expense-categories/{id}', [ExpenseCategoryController::class, 'destroy'])->middleware('permission:delete expenses');
    
    // Expenses
    Route::get('/expenses', [ExpenseController::class, 'index'])->middleware('permission:view expenses');
    Route::post('/expenses', [ExpenseController::class, 'store'])->middleware('permission:create expenses');
    Route::get('/expenses/{id}', [ExpenseController::class, 'show'])->middleware('permission:view expenses');
    Route::put('/expenses/{id}', [ExpenseController::class, 'update'])->middleware('permission:edit expenses');
    Route::delete('/expenses/{id}', [ExpenseController::class, 'destroy'])->middleware('permission:delete expenses');
    Route::get('/expenses/summary', [ExpenseController::class, 'summary'])->middleware('permission:view expenses');
    
    // Profit & Loss
    Route::get('/profit-loss/daily', [ProfitLossController::class, 'daily'])->middleware('permission:view reports');
    Route::get('/profit-loss/monthly', [ProfitLossController::class, 'monthly'])->middleware('permission:view reports');
    Route::get('/profit-loss/by-product', [ProfitLossController::class, 'byProduct'])->middleware('permission:view reports');
    Route::get('/profit-loss/by-category', [ProfitLossController::class, 'byCategory'])->middleware('permission:view reports');
    Route::get('/profit-loss/summary', [ProfitLossController::class, 'summary'])->middleware('permission:view reports');
    
    // Test route
    Route::get('/test', function (Request $request) {
        return response()->json([
            'message' => 'API is working',
            'tenant_id' => config('tenant_id'),
            'user' => $request->user(),
        ]);
    });
});
