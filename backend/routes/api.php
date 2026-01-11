<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SaleController;

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
    Route::apiResource('categories', CategoryController::class);
    
    // Products
    Route::apiResource('products', ProductController::class);
    Route::get('/products/search', [ProductController::class, 'search']);
    
    // Sales
    Route::apiResource('sales', SaleController::class)->only(['index', 'store', 'show']);
    Route::get('/sales/{id}/invoice', [SaleController::class, 'invoice']);
    
    // Test route
    Route::get('/test', function (Request $request) {
        return response()->json([
            'message' => 'API is working',
            'tenant_id' => config('tenant_id'),
            'user' => $request->user(),
        ]);
    });
});
