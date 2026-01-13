<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SaleController extends Controller
{
    /**
     * عرض جميع المبيعات
     */
    public function index(Request $request)
    {
        $query = Sale::with(['user', 'items.product']);

        // البحث برقم الفاتورة
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('invoice_number', 'like', "%{$search}%");
        }

        // فلترة حسب التاريخ
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $perPage = $request->get('per_page', 20);
        $sales = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($sales, 200);
    }

    /**
     * إنشاء عملية بيع
     */
    public function store(Request $request)
    {
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
            'payment_method' => 'required|in:cash,card,transfer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $userId = $request->user()->id;
            
            if (!$tenantId) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Tenant ID is required',
                ], 400);
            }
            
            if (!$userId) {
                DB::rollBack();
                return response()->json([
                    'message' => 'User authentication required',
                ], 401);
            }
            
            // التحقق من توفر الكمية
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->quantity < $item['quantity']) {
                    DB::rollBack();
                    return response()->json([
                        'message' => "الكمية المتاحة غير كافية للمنتج: {$product->name}",
                        'product' => $product->name,
                        'available' => $product->quantity,
                        'requested' => $item['quantity'],
                    ], 422);
                }
            }

            // حساب الإجمالي
            $subtotal = 0;
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $subtotal += $product->sale_price * $item['quantity'];
            }

            // حساب الخصم
            $discount = $request->discount ?? 0;
            $discountType = $request->discount_type ?? 'fixed';
            
            if ($discountType === 'percentage') {
                $discountAmount = ($subtotal * $discount) / 100;
            } else {
                $discountAmount = $discount;
            }

            $total = $subtotal - $discountAmount;

            // إنشاء البيع
            $sale = Sale::create([
                'tenant_id' => $tenantId,
                'invoice_number' => Sale::generateInvoiceNumber(),
                'user_id' => $userId,
                'total' => $total,
                'discount' => $discountAmount,
                'discount_type' => $discountType,
                'payment_method' => $request->payment_method,
                'status' => 'completed',
            ]);

            // إنشاء عناصر البيع وخصم الكمية من المخزون
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $price = $product->sale_price;
                $quantity = $item['quantity'];
                $itemSubtotal = $price * $quantity;

                // إنشاء عنصر البيع
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'subtotal' => $itemSubtotal,
                ]);

                // خصم الكمية من المخزون
                $product->decrement('quantity', $quantity);

                // إنشاء Inventory Transaction
                InventoryTransaction::create([
                    'tenant_id' => $tenantId,
                    'product_id' => $product->id,
                    'type' => 'out',
                    'quantity' => $quantity,
                    'reference_type' => 'Sale',
                    'reference_id' => $sale->id,
                    'notes' => "بيع - فاتورة رقم: {$sale->invoice_number}",
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Sale created successfully',
                'data' => $sale->load(['user', 'items.product']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log the error for debugging
            \Log::error('Sale creation error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all(),
            ]);
            
            return response()->json([
                'message' => 'Error creating sale: ' . $e->getMessage(),
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred while creating the sale',
            ], 500);
        }
    }

    /**
     * عرض فاتورة واحدة
     */
    public function show(string $id)
    {
        $sale = Sale::with(['user', 'items.product.category'])
            ->findOrFail($id);

        return response()->json([
            'data' => $sale,
        ], 200);
    }

    /**
     * عرض الفاتورة كـ HTML للطباعة
     */
    public function invoice(string $id)
    {
        $sale = Sale::with(['user', 'items.product.category'])
            ->findOrFail($id);

        $html = view('invoice', compact('sale'))->render();

        return response($html)->header('Content-Type', 'text/html');
    }

    /**
     * إلغاء عملية بيع
     */
    public function cancel(string $id)
    {
        DB::beginTransaction();
        try {
            $sale = Sale::with('items.product')->findOrFail($id);

            // التحقق من أن البيع مكتمل
            if ($sale->status !== 'completed') {
                return response()->json([
                    'message' => 'Cannot cancel a sale that is not completed',
                ], 422);
            }

            // إرجاع الكمية للمخزون وإنشاء Inventory Transaction
            foreach ($sale->items as $item) {
                $product = $item->product;
                
                // إرجاع الكمية للمخزون
                $product->increment('quantity', $item->quantity);

                // إنشاء Inventory Transaction للإرجاع
                InventoryTransaction::create([
                    'tenant_id' => config('tenant_id'),
                    'product_id' => $product->id,
                    'type' => 'return',
                    'quantity' => $item->quantity,
                    'reference_type' => 'Sale',
                    'reference_id' => $sale->id,
                    'notes' => "إلغاء بيع - فاتورة رقم: {$sale->invoice_number}",
                ]);
            }

            // تحديث حالة البيع
            $sale->update(['status' => 'cancelled']);

            DB::commit();

            return response()->json([
                'message' => 'Sale cancelled successfully',
                'data' => $sale->load(['user', 'items.product']),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error cancelling sale',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
