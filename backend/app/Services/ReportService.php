<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Cache\TaggableStore;

class ReportService
{
    /**
     * Cache duration in seconds (5 minutes)
     */
    protected int $cacheDuration = 300;

    /**
     * Get best selling products with caching
     *
     * @param string $period
     * @param int $limit
     * @return \Illuminate\Support\Collection
     */
    public function bestSelling(string $period = 'monthly', int $limit = 10)
    {
        $cacheKey = $this->getCacheKey('best_selling', $period, $limit);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($period, $limit) {
            return SaleItem::select(
                'products.id',
                'products.name',
                'products.category_id',
                'categories.name as category_name',
                DB::raw('SUM(sale_items.quantity) as total_quantity'),
                DB::raw('SUM(sale_items.subtotal) as total_sales'),
                DB::raw('COUNT(DISTINCT sale_items.sale_id) as sales_count')
            )
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereHas('sale', function ($q) use ($period) {
                $q->where('status', 'completed');
                if ($period === 'daily') {
                    $q->whereDate('created_at', now()->toDateString());
                } elseif ($period === 'monthly') {
                    $q->whereMonth('created_at', now()->month)
                      ->whereYear('created_at', now()->year);
                }
            })
            ->groupBy('products.id', 'products.name', 'products.category_id', 'categories.name')
            ->orderBy('total_quantity', 'desc')
            ->limit($limit)
            ->get();
        });
    }

    /**
     * Get worst selling products with caching
     *
     * @param string $period
     * @param int $limit
     * @return \Illuminate\Support\Collection
     */
    public function worstSelling(string $period = 'monthly', int $limit = 10)
    {
        $cacheKey = $this->getCacheKey('worst_selling', $period, $limit);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($period, $limit) {
            $products = SaleItem::select(
                'products.id',
                'products.name',
                'products.category_id',
                'categories.name as category_name',
                DB::raw('COALESCE(SUM(sale_items.quantity), 0) as total_quantity'),
                DB::raw('COALESCE(SUM(sale_items.subtotal), 0) as total_sales'),
                DB::raw('COUNT(DISTINCT sale_items.sale_id) as sales_count')
            )
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereHas('sale', function ($q) use ($period) {
                $q->where('status', 'completed');
                if ($period === 'daily') {
                    $q->whereDate('created_at', now()->toDateString());
                } elseif ($period === 'monthly') {
                    $q->whereMonth('created_at', now()->month)
                      ->whereYear('created_at', now()->year);
                }
            })
            ->groupBy('products.id', 'products.name', 'products.category_id', 'categories.name')
            ->orderBy('total_quantity', 'asc')
            ->limit($limit)
            ->get();

            // Add products with no sales
            $allProducts = Product::select(
                'products.id',
                'products.name',
                'products.category_id',
                'categories.name as category_name'
            )
            ->leftJoin('categories', 'products.category_id', '=', 'categories.id')
            ->whereNotIn('products.id', $products->pluck('id'))
            ->limit($limit - $products->count())
            ->get()
            ->map(function ($product) {
                $product->total_quantity = 0;
                $product->total_sales = 0;
                $product->sales_count = 0;
                return $product;
            });

            return $products->merge($allProducts)->take($limit);
        });
    }

    /**
     * Get sales by time with caching
     *
     * @param string $date
     * @return array
     */
    public function salesByTime(string $date)
    {
        $cacheKey = $this->getCacheKey('sales_by_time', $date);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($date) {
            $hourlySales = Sale::select(
                DB::raw('HOUR(created_at) as hour'),
                DB::raw('COUNT(*) as sales_count'),
                DB::raw('SUM(total) as total_sales')
            )
            ->whereDate('created_at', $date)
            ->where('status', 'completed')
            ->groupBy(DB::raw('HOUR(created_at)'))
            ->orderBy('hour')
            ->get();

            $totalSales = Sale::whereDate('created_at', $date)
                ->where('status', 'completed')
                ->sum('total');

            $salesCount = Sale::whereDate('created_at', $date)
                ->where('status', 'completed')
                ->count();

            $averageSale = $salesCount > 0 ? $totalSales / $salesCount : 0;

            return [
                'date' => $date,
                'total_sales' => $totalSales,
                'sales_count' => $salesCount,
                'average_sale' => $averageSale,
                'hourly_sales' => $hourlySales,
            ];
        });
    }

    /**
     * Clear all report caches
     *
     * @return void
     */
    public function clearCache(): void
    {
        $store = Cache::getStore();

        if ($store instanceof TaggableStore) {
            Cache::tags(['reports'])->flush();
            return;
        }

        // Fallback for database/file cache drivers that do not support tags.
        $tenantId = config('tenant_id');
        $keys = [
            "tenant:{$tenantId}:reports:best_selling:daily:10",
            "tenant:{$tenantId}:reports:best_selling:monthly:10",
            "tenant:{$tenantId}:reports:worst_selling:daily:10",
            "tenant:{$tenantId}:reports:worst_selling:monthly:10",
            "tenant:{$tenantId}:reports:sales_by_time:" . now()->toDateString(),
        ];

        foreach ($keys as $key) {
            Cache::forget($key);
        }
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
        return "tenant:{$tenantId}:reports:{$type}:" . implode(':', $params);
    }
}
