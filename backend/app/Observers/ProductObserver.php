<?php

namespace App\Observers;

use App\Models\Product;
use App\Services\InventoryService;
use App\Services\ReportService;
use App\Services\DashboardService;

class ProductObserver
{
    /**
     * Handle the Product "created" event.
     */
    public function created(Product $product): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Product "updated" event.
     */
    public function updated(Product $product): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Product "deleted" event.
     */
    public function deleted(Product $product): void
    {
        $this->clearCaches();
    }

    /**
     * Clear related caches
     */
    protected function clearCaches(): void
    {
        app(InventoryService::class)->clearCache();
        app(ReportService::class)->clearCache();
        app(DashboardService::class)->clearCache();
    }
}
