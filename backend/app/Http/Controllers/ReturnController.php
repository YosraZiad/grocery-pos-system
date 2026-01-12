<?php

namespace App\Http\Controllers;

use App\Models\ProductReturn;
use App\Models\Product;
use App\Models\Sale;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ReturnController extends Controller
{
    /**
     * عرض جميع المرتجعات
     */
    public function index(Request $request)
    {
        $query = ProductReturn::with(['product', 'sale', 'user']);

        // فلترة حسب النوع
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // فلترة حسب الحالة
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // فلترة حسب المنتج
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // فلترة حسب الفاتورة (للـ customer returns)
        if ($request->has('sale_id')) {
            $query->where('sale_id', $request->sale_id);
        }

        // فلترة حسب التاريخ
        if ($request->has('from')) {
            $query->whereDate('created_at', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->whereDate('created_at', '<=', $request->to);
        }

        $perPage = $request->get('per_page', 20);
        $returns = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($returns, 200);
    }

    /**
     * عرض مرتجع واحد
     */
    public function show(string $id)
    {
        $return = ProductReturn::with(['product.category', 'sale', 'user'])
            ->findOrFail($id);

        return response()->json([
            'data' => $return,
        ], 200);
    }

    /**
     * إضافة مرتجع جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'type' => 'required|in:customer,supplier',
            'sale_id' => 'required_if:type,customer|exists:sales,id',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'reason' => 'nullable|string|max:500',
            'amount' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $product = Product::findOrFail($request->product_id);

            // التحقق من أن الفاتورة موجودة (للـ customer returns)
            if ($request->type === 'customer') {
                $sale = Sale::findOrFail($request->sale_id);
                
                // التحقق من أن المنتج موجود في الفاتورة
                $saleItem = $sale->items()->where('product_id', $request->product_id)->first();
                if (!$saleItem) {
                    return response()->json([
                        'message' => 'المنتج غير موجود في الفاتورة المحددة',
                    ], 422);
                }

                // التحقق من أن الكمية المرتجعة لا تتجاوز الكمية المباعة
                if ($request->quantity > $saleItem->quantity) {
                    return response()->json([
                        'message' => 'الكمية المرتجعة أكبر من الكمية المباعة',
                        'max_quantity' => $saleItem->quantity,
                    ], 422);
                }
            }

            // إنشاء المرتجع
            $return = ProductReturn::create([
                'tenant_id' => config('tenant_id'),
                'type' => $request->type,
                'sale_id' => $request->type === 'customer' ? $request->sale_id : null,
                'supplier_id' => $request->type === 'supplier' ? $request->supplier_id : null,
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
                'reason' => $request->reason,
                'amount' => $request->amount,
                'status' => 'pending',
                'user_id' => $request->user()->id,
            ]);

            // إذا كان المرتجع معتمدًا مباشرة، تحديث المخزون
            if ($request->has('auto_approve') && $request->auto_approve) {
                $this->approveReturn($return);
            }

            DB::commit();

            return response()->json([
                'message' => 'Return created successfully',
                'data' => $return->load(['product', 'sale', 'user']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error creating return',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * تحديث حالة المرتجع
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,approved,rejected',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $return = ProductReturn::with('product')->findOrFail($id);

            // إذا كان المرتجع معتمدًا، تحديث المخزون
            if ($request->status === 'approved' && $return->status !== 'approved') {
                $this->approveReturn($return);
            }

            // تحديث الحالة
            $return->update([
                'status' => $request->status,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Return updated successfully',
                'data' => $return->load(['product', 'sale', 'user']),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error updating return',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * الموافقة على المرتجع وتحديث المخزون
     */
    private function approveReturn(ProductReturn $return)
    {
        $product = $return->product;

        // إضافة الكمية للمخزون
        $product->increment('quantity', $return->quantity);

        // إنشاء Inventory Transaction
        InventoryTransaction::create([
            'tenant_id' => config('tenant_id'),
            'product_id' => $product->id,
            'type' => 'return',
            'quantity' => $return->quantity,
            'reference_type' => 'Return',
            'reference_id' => $return->id,
            'notes' => $return->type === 'customer' 
                ? "إرجاع من زبون - مرتجع رقم: {$return->id}" 
                : "إرجاع لمورّد - مرتجع رقم: {$return->id}",
        ]);
    }
}
