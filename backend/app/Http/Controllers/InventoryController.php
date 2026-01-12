<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryController extends Controller
{
    /**
     * عرض المخزون الحالي (جميع المنتجات مع الكميات)
     */
    public function index(Request $request)
    {
        $query = Product::with('category');

        // البحث
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // الفلترة حسب القسم
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // الفلترة حسب حالة المخزون
        if ($request->has('stock_status')) {
            switch ($request->stock_status) {
                case 'low':
                    $query->whereColumn('quantity', '<=', 'min_stock_alert');
                    break;
                case 'out':
                    $query->where('quantity', 0);
                    break;
                case 'available':
                    $query->whereColumn('quantity', '>', 'min_stock_alert');
                    break;
            }
        }

        // الفلترة حسب حالة الصلاحية
        if ($request->has('expiry_status')) {
            switch ($request->expiry_status) {
                case 'expiring_soon':
                    $query->whereNotNull('expiry_date')
                          ->where('expiry_date', '<=', Carbon::now()->addDays(7))
                          ->where('expiry_date', '>=', Carbon::now());
                    break;
                case 'expired':
                    $query->whereNotNull('expiry_date')
                          ->where('expiry_date', '<', Carbon::now());
                    break;
                case 'valid':
                    $query->where(function ($q) {
                        $q->whereNull('expiry_date')
                          ->orWhere('expiry_date', '>', Carbon::now()->addDays(7));
                    });
                    break;
            }
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $products = $query->paginate($perPage);

        // إضافة معلومات إضافية لكل منتج
        $products->getCollection()->transform(function ($product) {
            $product->stock_status = $this->getStockStatus($product);
            $product->expiry_status = $this->getExpiryStatus($product);
            return $product;
        });

        return response()->json($products, 200);
    }

    /**
     * عرض المنتجات منخفضة المخزون
     */
    public function lowStock(Request $request)
    {
        $products = Product::with('category')
            ->whereColumn('quantity', '<=', 'min_stock_alert')
            ->orderBy('quantity', 'asc')
            ->get();

        // إضافة معلومات إضافية
        $products->transform(function ($product) {
            $product->stock_status = $this->getStockStatus($product);
            $product->stock_deficit = max(0, $product->min_stock_alert - $product->quantity);
            return $product;
        });

        return response()->json([
            'data' => $products,
            'count' => $products->count(),
        ], 200);
    }

    /**
     * عرض المنتجات قريبة الانتهاء
     */
    public function expiringSoon(Request $request)
    {
        $days = $request->get('days', 7); // افتراضي 7 أيام

        $products = Product::with('category')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', Carbon::now()->addDays($days))
            ->where('expiry_date', '>=', Carbon::now())
            ->orderBy('expiry_date', 'asc')
            ->get();

        // إضافة معلومات إضافية
        $products->transform(function ($product) {
            $product->expiry_status = $this->getExpiryStatus($product);
            $product->days_until_expiry = Carbon::parse($product->expiry_date)->diffInDays(Carbon::now());
            return $product;
        });

        return response()->json([
            'data' => $products,
            'count' => $products->count(),
        ], 200);
    }

    /**
     * عرض المنتجات المنتهية الصلاحية
     */
    public function expired(Request $request)
    {
        $products = Product::with('category')
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<', Carbon::now())
            ->orderBy('expiry_date', 'asc')
            ->get();

        // إضافة معلومات إضافية
        $products->transform(function ($product) {
            $product->expiry_status = $this->getExpiryStatus($product);
            $product->days_expired = Carbon::now()->diffInDays(Carbon::parse($product->expiry_date));
            return $product;
        });

        return response()->json([
            'data' => $products,
            'count' => $products->count(),
        ], 200);
    }

    /**
     * عرض سجل حركة المخزون
     */
    public function transactions(Request $request)
    {
        $query = InventoryTransaction::with('product.category');

        // الفلترة حسب المنتج
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // الفلترة حسب نوع الحركة
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // الفلترة حسب نوع المرجع
        if ($request->has('reference_type')) {
            $query->where('reference_type', $request->reference_type);
        }

        // الفلترة حسب التاريخ
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }

        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        // الترتيب
        $query->orderBy('created_at', 'desc');

        // Pagination
        $perPage = $request->get('per_page', 20);
        $transactions = $query->paginate($perPage);

        return response()->json($transactions, 200);
    }

    /**
     * إحصائيات المخزون
     */
    public function stats()
    {
        $totalProducts = Product::count();
        $lowStockCount = Product::whereColumn('quantity', '<=', 'min_stock_alert')->count();
        $outOfStockCount = Product::where('quantity', 0)->count();
        $expiringSoonCount = Product::whereNotNull('expiry_date')
            ->where('expiry_date', '<=', Carbon::now()->addDays(7))
            ->where('expiry_date', '>=', Carbon::now())
            ->count();
        $expiredCount = Product::whereNotNull('expiry_date')
            ->where('expiry_date', '<', Carbon::now())
            ->count();

        $totalValue = Product::sum(DB::raw('quantity * purchase_price'));

        return response()->json([
            'data' => [
                'total_products' => $totalProducts,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'expiring_soon_count' => $expiringSoonCount,
                'expired_count' => $expiredCount,
                'total_inventory_value' => round($totalValue, 2),
            ],
        ], 200);
    }

    /**
     * تحديد حالة المخزون
     */
    private function getStockStatus($product)
    {
        if ($product->quantity == 0) {
            return 'out_of_stock';
        } elseif ($product->quantity <= $product->min_stock_alert) {
            return 'low_stock';
        } else {
            return 'available';
        }
    }

    /**
     * تحديد حالة الصلاحية
     */
    private function getExpiryStatus($product)
    {
        if (!$product->expiry_date) {
            return 'no_expiry';
        }

        $expiryDate = Carbon::parse($product->expiry_date);
        $now = Carbon::now();

        if ($expiryDate->isPast()) {
            return 'expired';
        } elseif ($expiryDate->diffInDays($now) <= $product->min_expiry_alert) {
            return 'expiring_soon';
        } else {
            return 'valid';
        }
    }
}
