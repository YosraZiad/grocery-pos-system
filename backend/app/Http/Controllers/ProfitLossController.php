<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Expense;
use App\Models\ProductReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfitLossController extends Controller
{
    /**
     * أرباح يومية
     */
    public function daily(Request $request)
    {
        $date = $request->date ?? now()->toDateString();

        // المبيعات
        $sales = Sale::whereDate('created_at', $date)
            ->where('status', 'completed')
            ->sum('total');

        // تكلفة البضاعة المباعة (On-The-Fly)
        $costOfGoods = SaleItem::whereHas('sale', function ($query) use ($date) {
            $query->whereDate('created_at', $date)
                ->where('status', 'completed');
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * products.purchase_price) as total_cost')
        ->value('total_cost') ?? 0;

        // المصروفات
        $expenses = Expense::whereDate('date', $date)
            ->sum('amount');

        // المرتجعات (يتم خصمها من الأرباح)
        $returns = ProductReturn::whereDate('created_at', $date)
            ->where('status', 'approved')
            ->sum('amount');

        // حساب الأرباح
        $grossProfit = $sales - $costOfGoods - $returns;
        $netProfit = $grossProfit - $expenses;

        // عدد المبيعات
        $salesCount = Sale::whereDate('created_at', $date)
            ->where('status', 'completed')
            ->count();

        return response()->json([
            'data' => [
                'date' => $date,
                'sales' => $sales,
                'cost_of_goods' => $costOfGoods,
                'returns' => $returns,
                'gross_profit' => $grossProfit,
                'expenses' => $expenses,
                'net_profit' => $netProfit,
                'sales_count' => $salesCount,
            ],
        ], 200);
    }

    /**
     * أرباح شهرية
     */
    public function monthly(Request $request)
    {
        $month = $request->month ?? now()->month;
        $year = $request->year ?? now()->year;

        // المبيعات
        $sales = Sale::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->where('status', 'completed')
            ->sum('total');

        // تكلفة البضاعة المباعة
        $costOfGoods = SaleItem::whereHas('sale', function ($query) use ($year, $month) {
            $query->whereYear('created_at', $year)
                ->whereMonth('created_at', $month)
                ->where('status', 'completed');
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * products.purchase_price) as total_cost')
        ->value('total_cost') ?? 0;

        // المصروفات
        $expenses = Expense::whereYear('date', $year)
            ->whereMonth('date', $month)
            ->sum('amount');

        // المرتجعات
        $returns = ProductReturn::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->where('status', 'approved')
            ->sum('amount');

        // حساب الأرباح
        $grossProfit = $sales - $costOfGoods - $returns;
        $netProfit = $grossProfit - $expenses;

        // عدد المبيعات
        $salesCount = Sale::whereYear('created_at', $year)
            ->whereMonth('created_at', $month)
            ->where('status', 'completed')
            ->count();

        // ملخص يومي للشهر
        $dailyBreakdown = Sale::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(total) as sales'),
            DB::raw('COUNT(*) as sales_count')
        )
        ->whereYear('created_at', $year)
        ->whereMonth('created_at', $month)
        ->where('status', 'completed')
        ->groupBy(DB::raw('DATE(created_at)'))
        ->orderBy('date')
        ->get();

        return response()->json([
            'data' => [
                'month' => $month,
                'year' => $year,
                'sales' => $sales,
                'cost_of_goods' => $costOfGoods,
                'returns' => $returns,
                'gross_profit' => $grossProfit,
                'expenses' => $expenses,
                'net_profit' => $netProfit,
                'sales_count' => $salesCount,
                'daily_breakdown' => $dailyBreakdown,
            ],
        ], 200);
    }

    /**
     * أرباح حسب منتج
     */
    public function byProduct(Request $request)
    {
        $productId = $request->product_id;
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        $product = Product::findOrFail($productId);

        // المبيعات للمنتج
        $sales = SaleItem::where('product_id', $productId)
            ->whereHas('sale', function ($query) use ($from, $to) {
                $query->whereBetween('created_at', [$from, $to])
                    ->where('status', 'completed');
            })
            ->sum('subtotal');

        // الكمية المباعة
        $quantitySold = SaleItem::where('product_id', $productId)
            ->whereHas('sale', function ($query) use ($from, $to) {
                $query->whereBetween('created_at', [$from, $to])
                    ->where('status', 'completed');
            })
            ->sum('quantity');

        // تكلفة البضاعة المباعة
        $costOfGoods = $quantitySold * $product->purchase_price;

        // المرتجعات
        $returns = ProductReturn::where('product_id', $productId)
            ->whereBetween('created_at', [$from, $to])
            ->where('status', 'approved')
            ->sum('amount');

        // حساب الأرباح
        $grossProfit = $sales - $costOfGoods - $returns;
        $netProfit = $grossProfit; // لا نخصم المصروفات هنا لأنها عامة

        return response()->json([
            'data' => [
                'product' => $product,
                'period' => [
                    'from' => $from,
                    'to' => $to,
                ],
                'quantity_sold' => $quantitySold,
                'sales' => $sales,
                'cost_of_goods' => $costOfGoods,
                'returns' => $returns,
                'gross_profit' => $grossProfit,
                'net_profit' => $netProfit,
            ],
        ], 200);
    }

    /**
     * أرباح حسب قسم
     */
    public function byCategory(Request $request)
    {
        $categoryId = $request->category_id;
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        // المبيعات للقسم
        $sales = SaleItem::whereHas('product', function ($query) use ($categoryId) {
            $query->where('category_id', $categoryId);
        })
        ->whereHas('sale', function ($query) use ($from, $to) {
            $query->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed');
        })
        ->sum('subtotal');

        // تكلفة البضاعة المباعة
        $costOfGoods = SaleItem::whereHas('product', function ($query) use ($categoryId) {
            $query->where('category_id', $categoryId);
        })
        ->whereHas('sale', function ($query) use ($from, $to) {
            $query->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed');
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * products.purchase_price) as total_cost')
        ->value('total_cost') ?? 0;

        // المرتجعات
        $returns = ProductReturn::whereHas('product', function ($query) use ($categoryId) {
            $query->where('category_id', $categoryId);
        })
        ->whereBetween('created_at', [$from, $to])
        ->where('status', 'approved')
        ->sum('amount');

        // حساب الأرباح
        $grossProfit = $sales - $costOfGoods - $returns;
        $netProfit = $grossProfit;

        // عدد المنتجات المباعة
        $productsSold = SaleItem::whereHas('product', function ($query) use ($categoryId) {
            $query->where('category_id', $categoryId);
        })
        ->whereHas('sale', function ($query) use ($from, $to) {
            $query->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed');
        })
        ->distinct('product_id')
        ->count('product_id');

        return response()->json([
            'data' => [
                'category_id' => $categoryId,
                'period' => [
                    'from' => $from,
                    'to' => $to,
                ],
                'products_sold' => $productsSold,
                'sales' => $sales,
                'cost_of_goods' => $costOfGoods,
                'returns' => $returns,
                'gross_profit' => $grossProfit,
                'net_profit' => $netProfit,
            ],
        ], 200);
    }

    /**
     * ملخص شامل
     */
    public function summary(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        // المبيعات
        $sales = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->sum('total');

        // تكلفة البضاعة المباعة
        $costOfGoods = SaleItem::whereHas('sale', function ($query) use ($from, $to) {
            $query->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed');
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * products.purchase_price) as total_cost')
        ->value('total_cost') ?? 0;

        // المصروفات
        $expenses = Expense::whereBetween('date', [$from, $to])
            ->sum('amount');

        // المرتجعات
        $returns = ProductReturn::whereBetween('created_at', [$from, $to])
            ->where('status', 'approved')
            ->sum('amount');

        // حساب الأرباح
        $grossProfit = $sales - $costOfGoods - $returns;
        $netProfit = $grossProfit - $expenses;

        // إحصائيات إضافية
        $salesCount = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->count();

        $expensesCount = Expense::whereBetween('date', [$from, $to])
            ->count();

        $returnsCount = ProductReturn::whereBetween('created_at', [$from, $to])
            ->where('status', 'approved')
            ->count();

        // ملخص حسب القسم
        $byCategory = SaleItem::select(
            'categories.id as category_id',
            'categories.name as category_name',
            DB::raw('SUM(sale_items.subtotal) as sales'),
            DB::raw('SUM(sale_items.quantity * products.purchase_price) as cost_of_goods')
        )
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->join('categories', 'products.category_id', '=', 'categories.id')
        ->whereHas('sale', function ($query) use ($from, $to) {
            $query->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed');
        })
        ->groupBy('categories.id', 'categories.name')
        ->get()
        ->map(function ($item) {
            $item->gross_profit = $item->sales - $item->cost_of_goods;
            return $item;
        });

        // ملخص يومي
        $dailyBreakdown = Sale::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('SUM(total) as sales'),
            DB::raw('COUNT(*) as sales_count')
        )
        ->whereBetween('created_at', [$from, $to])
        ->where('status', 'completed')
        ->groupBy(DB::raw('DATE(created_at)'))
        ->orderBy('date')
        ->get();

        return response()->json([
            'data' => [
                'period' => [
                    'from' => $from,
                    'to' => $to,
                ],
                'sales' => $sales,
                'cost_of_goods' => $costOfGoods,
                'returns' => $returns,
                'gross_profit' => $grossProfit,
                'expenses' => $expenses,
                'net_profit' => $netProfit,
                'statistics' => [
                    'sales_count' => $salesCount,
                    'expenses_count' => $expensesCount,
                    'returns_count' => $returnsCount,
                ],
                'by_category' => $byCategory,
                'daily_breakdown' => $dailyBreakdown,
            ],
        ], 200);
    }
}
