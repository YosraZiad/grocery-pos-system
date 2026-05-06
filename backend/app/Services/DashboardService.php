<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Product;
use App\Models\Expense;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardService
{
    /**
     * Cache duration in seconds (3 minutes for dashboard)
     */
    protected int $cacheDuration = 180;

    /**
     * Get dashboard statistics with caching
     *
     * @param string $period
     * @return array
     */
    public function stats(string $period = 'today')
    {
        $cacheKey = $this->getCacheKey('stats', $period);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($period) {
            $startDate = $this->getStartDate($period);
            $endDate = now()->endOfDay();

            $sales = Sale::whereBetween('created_at', [$startDate, $endDate])
                ->select(
                    DB::raw('COUNT(*) as count'),
                    DB::raw('SUM(total) as total'),
                    DB::raw('SUM(CASE WHEN payment_method = "cash" THEN total ELSE 0 END) as cash'),
                    DB::raw('SUM(CASE WHEN payment_method = "card" THEN total ELSE 0 END) as card'),
                    DB::raw('SUM(CASE WHEN payment_method = "transfer" THEN total ELSE 0 END) as transfer')
                )
                ->first();

            $itemsSold = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->where('sales.tenant_id', config('tenant_id'))
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->sum('sale_items.quantity');

            $profit = DB::table('sale_items')
                ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
                ->join('products', 'sale_items.product_id', '=', 'products.id')
                ->where('sales.tenant_id', config('tenant_id'))
                ->where('products.tenant_id', config('tenant_id'))
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->selectRaw('SUM((sale_items.price - COALESCE(products.purchase_price, 0)) * sale_items.quantity) as profit')
                ->value('profit') ?? 0;

            $expenses = Expense::whereDate('date', '>=', $startDate->toDateString())
                ->whereDate('date', '<=', $endDate->toDateString())
                ->select(
                    DB::raw('SUM(amount) as total'),
                    DB::raw('COUNT(*) as count')
                )
                ->first();

            $lowStockProducts = Product::whereColumn('quantity', '<=', 'min_stock_alert')->count();
            $expiredProducts = Product::where('expiry_date', '<', now()->toDateString())
                ->where('quantity', '>', 0)
                ->count();
            $expiringSoonProducts = Product::whereBetween('expiry_date', [
                now()->toDateString(),
                now()->addDays(7)->toDateString()
            ])
            ->where('quantity', '>', 0)
            ->count();

            return [
                'period' => $period,
                'sales' => [
                    'count' => $sales->count ?? 0,
                    'total' => $sales->total ?? 0,
                    'cash' => $sales->cash ?? 0,
                    'card' => $sales->card ?? 0,
                    'transfer' => $sales->transfer ?? 0,
                ],
                'items_sold' => $itemsSold,
                'profit' => $profit,
                'expenses' => [
                    'total' => $expenses->total ?? 0,
                    'count' => $expenses->count ?? 0,
                ],
                'alerts' => [
                    'low_stock' => $lowStockProducts,
                    'expired' => $expiredProducts,
                    'expiring_soon' => $expiringSoonProducts,
                ],
            ];
        });
    }

    /**
     * Clear dashboard cache
     *
     * @return void
     */
    public function clearCache(): void
    {
        $tenantId = config('tenant_id');
        foreach (['today', 'week', 'month', 'year'] as $period) {
            Cache::forget($this->getCacheKey('stats', $period));
        }
    }

    /**
     * Get start date based on period
     *
     * @param string $period
     * @return Carbon
     */
    protected function getStartDate(string $period): Carbon
    {
        return match($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year' => now()->startOfYear(),
            default => now()->startOfDay(),
        };
    }

    /**
     * Generate cache key
     *
     * @param string $type
     * @param mixed ...$params
     * @return string
     */
    protected function getCacheKey(string $type, ...$params): string
    {
        $tenantId = config('tenant_id');
        return "tenant:{$tenantId}:dashboard:{$type}:" . implode(':', $params);
    }
}
