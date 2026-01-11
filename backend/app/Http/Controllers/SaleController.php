<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    /**
     * عرض جميع المبيعات
     */
    public function index(Request $request)
    {
        $query = Sale::with(['user', 'items.product']);

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
        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
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
            // التحقق من توفر الكمية
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->quantity < $item['quantity']) {
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
                'tenant_id' => config('tenant_id'),
                'invoice_number' => Sale::generateInvoiceNumber(),
                'user_id' => $request->user()->id,
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
                    'tenant_id' => config('tenant_id'),
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
            return response()->json([
                'message' => 'Error creating sale',
                'error' => $e->getMessage(),
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
}
