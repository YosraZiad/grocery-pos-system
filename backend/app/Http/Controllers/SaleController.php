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
            'payment_method' => 'required|in:cash,card,transfer,hybrid',
            'amount_received' => 'nullable|numeric|min:0',
            'change_amount' => 'nullable|numeric|min:0',
            'payment_details' => 'nullable|array',
            'payment_details.*.method' => 'required|in:cash,card,transfer',
            'payment_details.*.amount' => 'required|numeric|min:0.01',
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
            $data = $request->only(['items', 'discount', 'discount_type', 'payment_method', 'amount_received', 'change_amount', 'payment_details']);
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
    public function invoice(string $id)
    {
        $sale = $this->service->invoice($id);

        $html = view('invoice', compact('sale'))->render();

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
}
