<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\InventoryTransaction;
use App\Services\SaleService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SaleController extends Controller
{
    protected SaleService $service;

    public function __construct(SaleService $service)
    {
        $this->service = $service;
    }
    /**
     * عرض جميع المبيعات
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'from', 'to', 'per_page']);
        $sales = $this->service->index($filters);

        return response()->json($sales, 200);
    }

    /**
     * إنشاء عملية بيع
     */
    public function store(Request $request)
    {
        // التحقق من وجود وردية نشطة للكاشير
        $activeShift = \App\Models\Shift::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        if (!$activeShift) {
            return response()->json([
                'message' => 'Cannot start a sale without an open shift. | لا يمكنك بدء عملية بيع دون فتح وردية.',
            ], 403);
        }

        $tenantId = config('tenant_id');
        
        // Custom validation for products with tenant_id
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                function ($attribute, $value, $fail) use ($tenantId) {
                    if ($tenantId) {
                        $product = Product::where('id', $value)
                            ->where('tenant_id', $tenantId)
                            ->first();
                        if (!$product) {
                            $fail('The selected product does not exist or does not belong to your tenant.');
                        }
                    } else {
                        $product = Product::find($value);
                        if (!$product) {
                            $fail('The selected product does not exist.');
                        }
                    }
                },
            ],
            'items.*.quantity' => 'required|integer|min:1',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:percentage,fixed',
            'payment_method' => 'required|in:cash,card,transfer,hybrid,account',
            'amount_received' => 'nullable|numeric|min:0',
            'change_amount' => 'nullable|numeric|min:0',
            'payment_details' => 'nullable|array',
            'payment_details.*.method' => 'required|in:cash,card,transfer,account',
            'payment_details.*.amount' => 'required|numeric|min:0.01',
            'voucher_code' => 'nullable|string|exists:vouchers,code',
            'customer_id' => 'nullable|integer|exists:customers,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $userId = $request->user()->id;
        
        if (!$tenantId) {
            return response()->json(['message' => 'Tenant ID is required'], 400);
        }
        
        if (!$userId) {
            return response()->json(['message' => 'User authentication required'], 401);
        }

        try {
            $data = $request->only(['items', 'discount', 'discount_type', 'payment_method', 'amount_received', 'change_amount', 'payment_details', 'voucher_code', 'customer_id']);
            $sale = $this->service->create($data, $userId, $tenantId);

            return response()->json([
                'message' => 'Sale created successfully',
                'data' => $sale,
            ], 201);

        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Sale creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            
            return response()->json([
                'message' => 'Error creating sale',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the sale',
            ], 500);
        }
    }

    /**
     * عرض فاتورة واحدة
     */
    public function show(string $id)
    {
        $sale = $this->service->show($id);

        return response()->json([
            'data' => $sale,
        ], 200);
    }

    /**
     * عرض الفاتورة كـ HTML للطباعة
     */
    public function invoice(Request $request, string $id)
    {
        $sale = $this->service->invoice($id);
        $lang = $request->get('lang', 'ar');

        $html = view('invoice', compact('sale', 'lang'))->render();

        return response($html)->header('Content-Type', 'text/html');
    }

    /**
     * إلغاء عملية بيع
     */
    public function cancel(string $id)
    {
        try {
            $sale = $this->service->cancel($id);

            return response()->json([
                'message' => 'Sale cancelled successfully',
                'data' => $sale,
            ], 200);

        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error cancelling sale',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * قائمة موحدة للمبيعات والمرتجعات مع الفلاتر والبحث
     */
    public function unified(Request $request)
    {
        $search = $request->get('search');
        $fromDate = $request->get('from');
        $toDate = $request->get('to');
        $type = $request->get('type'); // 'sale' or 'return'
        
        $tenantId = config('tenant_id');

        // Sales Query
        $salesQuery = DB::table('sales')
            ->select(
                'sales.id',
                DB::raw("'sale' as type"),
                'sales.invoice_number as number',
                'sales.created_at',
                'sales.user_id',
                'users.name as user_name',
                'sales.total as amount',
                'sales.payment_method',
                'sales.status',
                DB::raw("(SELECT COUNT(*) FROM sale_items WHERE sale_items.sale_id = sales.id) as items_count")
            )
            ->join('users', 'users.id', '=', 'sales.user_id');

        if ($tenantId) {
            $salesQuery->where('sales.tenant_id', $tenantId);
        }
        if ($search) {
            $salesQuery->where('sales.invoice_number', 'like', "%{$search}%");
        }
        if ($fromDate) {
            $salesQuery->where('sales.created_at', '>=', $fromDate . ' 00:00:00');
        }
        if ($toDate) {
            $salesQuery->where('sales.created_at', '<=', $toDate . ' 23:59:59');
        }

        // Returns Query
        $returnsQuery = DB::table('sales_returns')
            ->select(
                'sales_returns.id',
                DB::raw("'return' as type"),
                'sales_returns.return_number as number',
                'sales_returns.created_at',
                'sales_returns.user_id',
                'users.name as user_name',
                'sales_returns.refund_total as amount',
                'sales_returns.refund_method as payment_method',
                'sales_returns.status',
                DB::raw("(SELECT COUNT(*) FROM sales_return_items WHERE sales_return_items.sales_return_id = sales_returns.id) as items_count")
            )
            ->join('users', 'users.id', '=', 'sales_returns.user_id');

        if ($tenantId) {
            $returnsQuery->where('sales_returns.tenant_id', $tenantId);
        }
        if ($search) {
            $returnsQuery->where('sales_returns.return_number', 'like', "%{$search}%");
        }
        if ($fromDate) {
            $returnsQuery->where('sales_returns.created_at', '>=', $fromDate . ' 00:00:00');
        }
        if ($toDate) {
            $returnsQuery->where('sales_returns.created_at', '<=', $toDate . ' 23:59:59');
        }

        // Apply type filter
        if ($type === 'sale') {
            $unifiedQuery = $salesQuery;
        } elseif ($type === 'return') {
            $unifiedQuery = $returnsQuery;
        } else {
            // SQL union
            $unifiedQuery = $salesQuery->union($returnsQuery);
        }

        // Wrap union in a subquery to sort and paginate
        $subQuery = DB::table(DB::raw("({$unifiedQuery->toSql()}) as unified"))
            ->mergeBindings($unifiedQuery);

        $perPage = $request->get('per_page', 10);
        $results = $subQuery->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($results, 200);
    }
}
