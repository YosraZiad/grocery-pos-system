<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Routes التسجيل لا تحتاج tenant_id (سيتم إرساله في body)
        $isAuthRoute = $request->is('api/auth/register') || $request->is('api/auth/login');
        
        if ($isAuthRoute) {
            // للتسجيل، tenant_id يأتي من request body
            if ($request->has('tenant_id')) {
                config(['tenant_id' => $request->tenant_id]);
            }
            return $next($request);
        }

        $tenantId = $request->header('X-Tenant-ID') 
            ?? auth()->user()?->tenant_id 
            ?? session('tenant_id');

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant not identified'], 403);
        }

        // Set tenant in request
        $request->merge(['tenant_id' => $tenantId]);
        
        // Set global scope for tenant ⚠️ مهم جدًا
        config(['tenant_id' => $tenantId]);

        return $next($request);
    }
}
