<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\Request;
use Illuminate\Cache\RateLimiting\Limit;
use App\Models\User;
use App\Models\Product;
use App\Models\Sale;
use App\Observers\ProductObserver;
use App\Observers\SaleObserver;

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

        // Register model observers for cache invalidation
        Product::observe(ProductObserver::class);
        Sale::observe(SaleObserver::class);

        // Ensure named API limiter exists for throttle:api middleware.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Compatibility aliases for environments resolving user-scoped limiter names.
        RateLimiter::for(User::class.'::api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for(User::class.':api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });
    }
}
