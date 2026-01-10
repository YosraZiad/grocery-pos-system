<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // إصلاح مشكلة طول المفتاح في MySQL/MariaDB القديم
        // تحديد طول الـ string الافتراضي إلى 191 حرف بدل 255
        Schema::defaultStringLength(191);
    }
}
