<?php

namespace App\Observers;

use App\Models\Sale;
use App\Services\ReportService;
use App\Services\DashboardService;

class SaleObserver
{
    /**
     * Handle the Sale "created" event.
     */
    public function created(Sale $sale): void
    {
        $this->clearCaches();
    }

    /**
     * Handle the Sale "updated" event.
     */
    public function updated(Sale $sale): void
    {
        $this->clearCaches();
    }

    /**
     * Clear related caches
     */
    protected function clearCaches(): void
    {
        app(ReportService::class)->clearCache();
        app(DashboardService::class)->clearCache();
    }
}
