<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Expense;
use App\Models\ProductReturn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Dompdf\Dompdf;
use Dompdf\Options;

class ReportController extends Controller
{
    /**
     * أفضل المنتجات مبيعًا
     */
    public function bestSelling(Request $request)
    {
        $period = $request->period ?? 'monthly'; // daily, monthly
        $limit = $request->limit ?? 10;

        $query = SaleItem::select(
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
        ->limit($limit);

        $products = $query->get();

        return response()->json([
            'data' => $products,
            'period' => $period,
        ], 200);
    }

    /**
     * المنتجات الضعيفة (أقل مبيعًا)
     */
    public function worstSelling(Request $request)
    {
        $period = $request->period ?? 'monthly'; // daily, monthly
        $limit = $request->limit ?? 10;

        $query = SaleItem::select(
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
        ->limit($limit);

        $products = $query->get();

        // إضافة المنتجات التي لم تُبَع
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

        $allProducts = $products->merge($allProducts)->take($limit);

        return response()->json([
            'data' => $allProducts,
            'period' => $period,
        ], 200);
    }

    /**
     * مبيعات حسب الوقت
     */
    public function salesByTime(Request $request)
    {
        $date = $request->date ?? now()->toDateString();

        // مبيعات حسب الساعة
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

        // إجمالي المبيعات
        $totalSales = Sale::whereDate('created_at', $date)
            ->where('status', 'completed')
            ->sum('total');

        // عدد المبيعات
        $salesCount = Sale::whereDate('created_at', $date)
            ->where('status', 'completed')
            ->count();

        // متوسط قيمة البيع
        $averageSale = $salesCount > 0 ? $totalSales / $salesCount : 0;

        return response()->json([
            'data' => [
                'date' => $date,
                'total_sales' => $totalSales,
                'sales_count' => $salesCount,
                'average_sale' => $averageSale,
                'hourly_sales' => $hourlySales,
            ],
        ], 200);
    }

    /**
     * خسائر بسبب انتهاء الصلاحية
     */
    public function expiredLosses(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        // المنتجات المنتهية الصلاحية
        $expiredProducts = Product::whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [$from, $to])
            ->where('expiry_date', '<', now())
            ->get();

        // حساب الخسائر
        $totalLoss = 0;
        $productsWithLoss = [];

        foreach ($expiredProducts as $product) {
            // الخسارة = الكمية * سعر الشراء
            $loss = $product->quantity * $product->purchase_price;
            $totalLoss += $loss;

            $productsWithLoss[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'category_name' => $product->category->name ?? '-',
                'quantity' => $product->quantity,
                'purchase_price' => $product->purchase_price,
                'expiry_date' => $product->expiry_date,
                'loss' => $loss,
                'days_expired' => Carbon::parse($product->expiry_date)->diffInDays(now()),
            ];
        }

        // ترتيب حسب الخسارة (الأكبر أولاً)
        usort($productsWithLoss, function ($a, $b) {
            return $b['loss'] <=> $a['loss'];
        });

        return response()->json([
            'data' => [
                'period' => [
                    'from' => $from,
                    'to' => $to,
                ],
                'total_loss' => $totalLoss,
                'expired_products_count' => count($productsWithLoss),
                'products' => $productsWithLoss,
            ],
        ], 200);
    }

    /**
     * تقارير المخزون
     */
    public function inventoryReports(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        // إجمالي المنتجات
        $totalProducts = Product::count();

        // منتجات منخفضة المخزون
        $lowStockProducts = Product::whereColumn('quantity', '<=', 'min_stock_alert')
            ->count();

        // منتجات قريبة الانتهاء
        $expiringSoonProducts = Product::whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [now(), now()->addDays(7)])
            ->count();

        // منتجات منتهية الصلاحية
        $expiredProducts = Product::whereNotNull('expiry_date')
            ->where('expiry_date', '<', now())
            ->count();

        // القيمة الإجمالية للمخزون
        $totalInventoryValue = Product::sum(DB::raw('quantity * purchase_price'));

        // حركة المخزون (In/Out)
        $inventoryIn = DB::table('inventory_transactions')
            ->whereBetween('created_at', [$from, $to])
            ->where('type', 'in')
            ->sum('quantity');

        $inventoryOut = DB::table('inventory_transactions')
            ->whereBetween('created_at', [$from, $to])
            ->where('type', 'out')
            ->sum('quantity');

        return response()->json([
            'data' => [
                'period' => [
                    'from' => $from,
                    'to' => $to,
                ],
                'total_products' => $totalProducts,
                'low_stock_products' => $lowStockProducts,
                'expiring_soon_products' => $expiringSoonProducts,
                'expired_products' => $expiredProducts,
                'total_inventory_value' => $totalInventoryValue,
                'inventory_in' => $inventoryIn,
                'inventory_out' => $inventoryOut,
                'net_inventory_change' => $inventoryIn - $inventoryOut,
            ],
        ], 200);
    }

    /**
     * تقارير مالية شاملة
     */
    public function financialReports(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to = $request->to ?? now()->toDateString();

        // المبيعات
        $totalSales = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->sum('total');

        $salesCount = Sale::whereBetween('created_at', [$from, $to])
            ->where('status', 'completed')
            ->count();

        // المصروفات
        $totalExpenses = Expense::whereBetween('date', [$from, $to])
            ->sum('amount');

        $expensesCount = Expense::whereBetween('date', [$from, $to])
            ->count();

        // المرتجعات
        $totalReturns = ProductReturn::whereBetween('created_at', [$from, $to])
            ->where('status', 'approved')
            ->sum('amount');

        // تكلفة البضاعة المباعة
        $costOfGoods = SaleItem::whereHas('sale', function ($q) use ($from, $to) {
            $q->whereBetween('created_at', [$from, $to])
                ->where('status', 'completed');
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * products.purchase_price) as total_cost')
        ->value('total_cost') ?? 0;

        // حساب الأرباح
        $grossProfit = $totalSales - $costOfGoods - $totalReturns;
        $netProfit = $grossProfit - $totalExpenses;

        // المبيعات حسب طريقة الدفع
        $salesByPaymentMethod = Sale::select(
            'payment_method',
            DB::raw('SUM(total) as total'),
            DB::raw('COUNT(*) as count')
        )
        ->whereBetween('created_at', [$from, $to])
        ->where('status', 'completed')
        ->groupBy('payment_method')
        ->get();

        return response()->json([
            'data' => [
                'period' => [
                    'from' => $from,
                    'to' => $to,
                ],
                'sales' => [
                    'total' => $totalSales,
                    'count' => $salesCount,
                ],
                'expenses' => [
                    'total' => $totalExpenses,
                    'count' => $expensesCount,
                ],
                'returns' => [
                    'total' => $totalReturns,
                ],
                'cost_of_goods' => $costOfGoods,
                'gross_profit' => $grossProfit,
                'net_profit' => $netProfit,
                'sales_by_payment_method' => $salesByPaymentMethod,
            ],
        ], 200);
    }

    /**
     * تصدير تقرير إلى PDF
     */
    public function exportPDF(Request $request)
    {
        $type = $request->type; // best-selling, worst-selling, sales-by-time, expired-losses, inventory, financial
        $data = null;

        // جلب البيانات حسب نوع التقرير
        switch ($type) {
            case 'best-selling':
                $period = $request->period ?? 'monthly';
                $response = $this->bestSelling($request);
                $data = json_decode($response->getContent(), true);
                $title = 'أفضل المنتجات مبيعًا';
                break;

            case 'worst-selling':
                $period = $request->period ?? 'monthly';
                $response = $this->worstSelling($request);
                $data = json_decode($response->getContent(), true);
                $title = 'المنتجات الضعيفة';
                break;

            case 'sales-by-time':
                $response = $this->salesByTime($request);
                $data = json_decode($response->getContent(), true);
                $title = 'مبيعات حسب الوقت';
                break;

            case 'expired-losses':
                $response = $this->expiredLosses($request);
                $data = json_decode($response->getContent(), true);
                $title = 'خسائر الصلاحية';
                break;

            case 'inventory':
                $response = $this->inventoryReports($request);
                $data = json_decode($response->getContent(), true);
                $title = 'تقارير المخزون';
                break;

            case 'financial':
                $response = $this->financialReports($request);
                $data = json_decode($response->getContent(), true);
                $title = 'تقارير مالية';
                break;

            default:
                return response()->json([
                    'message' => 'Invalid report type',
                ], 422);
        }

        // إنشاء HTML للتقرير
        $html = $this->generateReportHTML($title, $type, $data);

        // إنشاء PDF
        $options = new Options();
        $options->set('isHtml5ParserEnabled', true);
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $filename = 'report_' . $type . '_' . now()->format('Y-m-d') . '.pdf';

        return response($dompdf->output(), 200)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
    }

    /**
     * توليد HTML للتقرير
     */
    private function generateReportHTML($title, $type, $data)
    {
        $html = '<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <title>' . $title . '</title>
    <style>
        body {
            font-family: DejaVu Sans, Arial, sans-serif;
            direction: rtl;
            text-align: right;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #333;
        }
        .info {
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .summary {
            margin-top: 30px;
            padding: 15px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>' . $title . '</h1>
        <p>تاريخ التقرير: ' . now()->format('Y-m-d H:i') . '</p>
    </div>';

        // إضافة محتوى التقرير حسب النوع
        switch ($type) {
            case 'best-selling':
            case 'worst-selling':
                if (isset($data['data']) && count($data['data']) > 0) {
                    $html .= '<table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>اسم المنتج</th>
                                <th>القسم</th>
                                <th>الكمية المباعة</th>
                                <th>إجمالي المبيعات</th>
                                <th>عدد المبيعات</th>
                            </tr>
                        </thead>
                        <tbody>';
                    foreach ($data['data'] as $index => $product) {
                        $html .= '<tr>
                            <td>' . ($index + 1) . '</td>
                            <td>' . htmlspecialchars($product['name']) . '</td>
                            <td>' . htmlspecialchars($product['category_name'] ?? '-') . '</td>
                            <td>' . ($product['total_quantity'] ?? 0) . '</td>
                            <td>' . number_format($product['total_sales'] ?? 0, 2) . ' ر.س</td>
                            <td>' . ($product['sales_count'] ?? 0) . '</td>
                        </tr>';
                    }
                    $html .= '</tbody></table>';
                }
                break;

            case 'sales-by-time':
                if (isset($data['data'])) {
                    $html .= '<div class="summary">
                        <p><strong>إجمالي المبيعات:</strong> ' . number_format($data['data']['total_sales'] ?? 0, 2) . ' ر.س</p>
                        <p><strong>عدد المبيعات:</strong> ' . ($data['data']['sales_count'] ?? 0) . '</p>
                        <p><strong>متوسط البيع:</strong> ' . number_format($data['data']['average_sale'] ?? 0, 2) . ' ر.س</p>
                    </div>';
                    if (isset($data['data']['hourly_sales']) && count($data['data']['hourly_sales']) > 0) {
                        $html .= '<h3>مبيعات حسب الساعة</h3><table>
                            <thead>
                                <tr>
                                    <th>الساعة</th>
                                    <th>عدد المبيعات</th>
                                    <th>إجمالي المبيعات</th>
                                </tr>
                            </thead>
                            <tbody>';
                        foreach ($data['data']['hourly_sales'] as $item) {
                            $html .= '<tr>
                                <td>' . $item['hour'] . ':00</td>
                                <td>' . ($item['sales_count'] ?? 0) . '</td>
                                <td>' . number_format($item['total_sales'] ?? 0, 2) . ' ر.س</td>
                            </tr>';
                        }
                        $html .= '</tbody></table>';
                    }
                }
                break;

            case 'expired-losses':
                if (isset($data['data'])) {
                    $html .= '<div class="summary">
                        <p><strong>إجمالي الخسائر:</strong> ' . number_format($data['data']['total_loss'] ?? 0, 2) . ' ر.س</p>
                        <p><strong>عدد المنتجات المنتهية:</strong> ' . ($data['data']['expired_products_count'] ?? 0) . '</p>
                    </div>';
                    if (isset($data['data']['products']) && count($data['data']['products']) > 0) {
                        $html .= '<table>
                            <thead>
                                <tr>
                                    <th>اسم المنتج</th>
                                    <th>القسم</th>
                                    <th>الكمية</th>
                                    <th>سعر الشراء</th>
                                    <th>تاريخ الانتهاء</th>
                                    <th>الخسارة</th>
                                </tr>
                            </thead>
                            <tbody>';
                        foreach ($data['data']['products'] as $product) {
                            $html .= '<tr>
                                <td>' . htmlspecialchars($product['product_name']) . '</td>
                                <td>' . htmlspecialchars($product['category_name'] ?? '-') . '</td>
                                <td>' . ($product['quantity'] ?? 0) . '</td>
                                <td>' . number_format($product['purchase_price'] ?? 0, 2) . ' ر.س</td>
                                <td>' . $product['expiry_date'] . '</td>
                                <td>' . number_format($product['loss'] ?? 0, 2) . ' ر.س</td>
                            </tr>';
                        }
                        $html .= '</tbody></table>';
                    }
                }
                break;

            case 'inventory':
                if (isset($data['data'])) {
                    $html .= '<div class="summary">
                        <p><strong>إجمالي المنتجات:</strong> ' . ($data['data']['total_products'] ?? 0) . '</p>
                        <p><strong>منتجات منخفضة المخزون:</strong> ' . ($data['data']['low_stock_products'] ?? 0) . '</p>
                        <p><strong>منتجات قريبة الانتهاء:</strong> ' . ($data['data']['expiring_soon_products'] ?? 0) . '</p>
                        <p><strong>منتجات منتهية الصلاحية:</strong> ' . ($data['data']['expired_products'] ?? 0) . '</p>
                        <p><strong>القيمة الإجمالية للمخزون:</strong> ' . number_format($data['data']['total_inventory_value'] ?? 0, 2) . ' ر.س</p>
                        <p><strong>داخل المخزون:</strong> ' . ($data['data']['inventory_in'] ?? 0) . '</p>
                        <p><strong>خارج المخزون:</strong> ' . ($data['data']['inventory_out'] ?? 0) . '</p>
                        <p><strong>صافي التغيير:</strong> ' . ($data['data']['net_inventory_change'] ?? 0) . '</p>
                    </div>';
                }
                break;

            case 'financial':
                if (isset($data['data'])) {
                    $html .= '<div class="summary">
                        <p><strong>إجمالي المبيعات:</strong> ' . number_format($data['data']['sales']['total'] ?? 0, 2) . ' ر.س</p>
                        <p><strong>عدد المبيعات:</strong> ' . ($data['data']['sales']['count'] ?? 0) . '</p>
                        <p><strong>إجمالي المصروفات:</strong> ' . number_format($data['data']['expenses']['total'] ?? 0, 2) . ' ر.س</p>
                        <p><strong>تكلفة البضاعة:</strong> ' . number_format($data['data']['cost_of_goods'] ?? 0, 2) . ' ر.س</p>
                        <p><strong>الربح الإجمالي:</strong> ' . number_format($data['data']['gross_profit'] ?? 0, 2) . ' ر.س</p>
                        <p><strong>الربح الصافي:</strong> ' . number_format($data['data']['net_profit'] ?? 0, 2) . ' ر.س</p>
                    </div>';
                    if (isset($data['data']['sales_by_payment_method']) && count($data['data']['sales_by_payment_method']) > 0) {
                        $html .= '<h3>المبيعات حسب طريقة الدفع</h3><table>
                            <thead>
                                <tr>
                                    <th>طريقة الدفع</th>
                                    <th>عدد المبيعات</th>
                                    <th>الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>';
                        foreach ($data['data']['sales_by_payment_method'] as $item) {
                            $html .= '<tr>
                                <td>' . htmlspecialchars($item['payment_method']) . '</td>
                                <td>' . ($item['count'] ?? 0) . '</td>
                                <td>' . number_format($item['total'] ?? 0, 2) . ' ر.س</td>
                            </tr>';
                        }
                        $html .= '</tbody></table>';
                    }
                }
                break;
        }

        $html .= '
    <div class="footer">
        <p>تم إنشاء التقرير تلقائيًا من نظام إدارة المتجر</p>
    </div>
</body>
</html>';

        return $html;
    }
}
