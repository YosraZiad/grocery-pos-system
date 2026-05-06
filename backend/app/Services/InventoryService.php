<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class InventoryService
{
    /**
     * Cache duration in seconds (10 minutes for inventory stats)
     */
    protected int $cacheDuration = 600;

    /**
     * Get low stock products with caching
     *
     * @return \Illuminate\Support\Collection
     */
    public function lowStock()
    {
        $cacheKey = $this->getCacheKey('low_stock');

        return Cache::remember($cacheKey, $this->cacheDuration, function () {
            $products = Product::with('category')
                ->whereColumn('quantity', '<=', 'min_stock_alert')
                ->orderBy('quantity', 'asc')
                ->get();

            return $products->map(function ($product) {
                $product->stock_deficit = max(0, $product->min_stock_alert - $product->quantity);
                return $product;
            });
        });
    }

    /**
     * Get products expiring soon with caching
     *
     * @param int $days
     * @return \Illuminate\Support\Collection
     */
    public function expiringSoon(int $days = 7)
    {
        $cacheKey = $this->getCacheKey('expiring_soon', $days);

        return Cache::remember($cacheKey, $this->cacheDuration, function () use ($days) {
            $products = Product::with('category')
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<=', Carbon::now()->addDays($days))
                ->where('expiry_date', '>=', Carbon::now())
                ->orderBy('expiry_date', 'asc')
                ->get();

            return $products->map(function ($product) {
                $product->days_until_expiry = Carbon::parse($product->expiry_date)->diffInDays(Carbon::now());
                return $product;
            });
        });
    }

    /**
     * Get expired products with caching
     *
     * @return \Illuminate\Support\Collection
     */
    public function expired()
    {
        $cacheKey = $this->getCacheKey('expired');

        return Cache::remember($cacheKey, $this->cacheDuration, function () {
            $products = Product::with('category')
                ->whereNotNull('expiry_date')
                ->where('expiry_date', '<', Carbon::now())
                ->orderBy('expiry_date', 'asc')
                ->get();

            return $products->map(function ($product) {
                $product->days_expired = Carbon::now()->diffInDays(Carbon::parse($product->expiry_date));
                return $product;
            });
        });
    }

    /**
     * Get inventory statistics with caching
     *
     * @return array
     */
    public function stats()
    {
        $cacheKey = $this->getCacheKey('stats');

        return Cache::remember($cacheKey, $this->cacheDuration, function () {
            return [
                'total_products' => Product::count(),
                'low_stock_count' => Product::whereColumn('quantity', '<=', 'min_stock_alert')->count(),
                'out_of_stock_count' => Product::where('quantity', 0)->count(),
                'expired_count' => Product::whereNotNull('expiry_date')
                    ->where('expiry_date', '<', Carbon::now())
                    ->where('quantity', '>', 0)
                    ->count(),
                'expiring_soon_count' => Product::whereNotNull('expiry_date')
                    ->where('expiry_date', '<=', Carbon::now()->addDays(7))
                    ->where('expiry_date', '>=', Carbon::now())
                    ->where('quantity', '>', 0)
                    ->count(),
                'total_inventory_value' => Product::selectRaw('SUM(quantity * purchase_price) as value')->value('value') ?? 0,
            ];
        });
    }

    /**
     * Clear inventory cache
     *
     * @return void
     */
    public function clearCache(): void
    {
        $tenantId = config('tenant_id');
        Cache::forget($this->getCacheKey('low_stock'));
        Cache::forget($this->getCacheKey('expiring_soon', 7));
        Cache::forget($this->getCacheKey('expired'));
        Cache::forget($this->getCacheKey('stats'));
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
        return "tenant:{$tenantId}:inventory:{$type}:" . implode(':', $params);
    }
}
