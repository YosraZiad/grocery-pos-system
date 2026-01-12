<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\Product;
use App\Models\Expense;
use App\Models\InventoryTransaction;
use App\Models\ProductReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * إحصائيات Dashboard
     */
    public function stats(Request $request)
    {
        $period = $request->get('period', 'today'); // today, week, month, year
        
        $startDate = $this->getStartDate($period);
        $endDate = now()->endOfDay();

        // مبيعات اليوم/الفترة
        $sales = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total) as total'),
                DB::raw('SUM(CASE WHEN payment_method = "cash" THEN total ELSE 0 END) as cash'),
                DB::raw('SUM(CASE WHEN payment_method = "card" THEN total ELSE 0 END) as card'),
                DB::raw('SUM(CASE WHEN payment_method = "transfer" THEN total ELSE 0 END) as transfer')
            )
            ->first();

        // عدد المنتجات المباعة
        $itemsSold = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->sum('sale_items.quantity');

        // إجمالي الأرباح (تقريبي)
        $profit = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.created_at', [$startDate, $endDate])
            ->selectRaw('SUM((sale_items.price - COALESCE(products.purchase_price, 0)) * sale_items.quantity) as profit')
            ->value('profit') ?? 0;

        // المصروفات
        $expenses = Expense::whereBetween('date', [$startDate->toDateString(), $endDate->toDateString()])
            ->select(
                DB::raw('SUM(amount) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->first();

        // المنتجات منخفضة المخزون
        $lowStockProducts = Product::where('quantity', '<=', DB::raw('low_stock_threshold'))
            ->count();

        // المنتجات المنتهية الصلاحية
        $expiredProducts = Product::where('expiry_date', '<', now()->toDateString())
            ->where('quantity', '>', 0)
            ->count();

        // المنتجات التي تنتهي قريبًا (خلال 7 أيام)
        $expiringSoonProducts = Product::whereBetween('expiry_date', [
            now()->toDateString(),
            now()->addDays(7)->toDateString()
        ])
        ->where('quantity', '>', 0)
        ->count();

        // المرتجعات المعلقة
        $pendingReturns = ProductReturn::where('status', 'pending')->count();

        // المبيعات اليومية (آخر 7 أيام)
        $dailySales = Sale::whereBetween('created_at', [now()->subDays(6)->startOfDay(), $endDate])
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('SUM(total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        // أفضل المنتجات مبيعًا (آخر 7 أيام)
        $topProducts = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->whereBetween('sales.created_at', [now()->subDays(6)->startOfDay(), $endDate])
            ->select(
                'products.id',
                'products.name',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.subtotal) as total_revenue')
            )
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_quantity')
            ->limit(5)
            ->get();

        return response()->json([
            'data' => [
                'period' => $period,
                'sales' => [
                    'count' => (int) ($sales->count ?? 0),
                    'total' => (float) ($sales->total ?? 0),
                    'cash' => (float) ($sales->cash ?? 0),
                    'card' => (float) ($sales->card ?? 0),
                ],
                'items_sold' => (int) $itemsSold,
                'profit' => (float) $profit,
                'expenses' => [
                    'total' => (float) ($expenses->total ?? 0),
                    'count' => (int) ($expenses->count ?? 0),
                ],
                'alerts' => [
                    'low_stock' => $lowStockProducts,
                    'expired' => $expiredProducts,
                    'expiring_soon' => $expiringSoonProducts,
                    'pending_returns' => $pendingReturns,
                ],
                'daily_sales' => $dailySales,
                'top_products' => $topProducts,
            ],
        ], 200);
    }

    /**
     * الحصول على تاريخ البداية حسب الفترة
     */
    private function getStartDate($period)
    {
        switch ($period) {
            case 'today':
                return now()->startOfDay();
            case 'week':
                return now()->startOfWeek();
            case 'month':
                return now()->startOfMonth();
            case 'year':
                return now()->startOfYear();
            default:
                return now()->startOfDay();
        }
    }
}
