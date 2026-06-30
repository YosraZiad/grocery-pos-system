<?php

namespace App\Http\Controllers;

use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class SalesReturnController extends Controller
{
    /**
     * عرض جميع فواتير المرتجعات
     */
    public function index(Request $request)
    {
        $query = SalesReturn::with(['sale', 'user']);

        if ($request->has('search')) {
            $query->where('return_number', 'like', "%{$request->search}%")
                  ->orWhereHas('sale', function ($q) use ($request) {
                      $q->where('invoice_number', 'like', "%{$request->search}%");
                  });
        }

        $perPage = $request->get('per_page', 20);
        $returns = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($returns, 200);
    }

    /**
     * عرض تفاصيل مرتجع مبيعات محدد
     */
    public function show(string $id)
    {
        $return = SalesReturn::with(['sale.items.product', 'items.product', 'user'])
            ->findOrFail($id);

        return response()->json([
            'data' => $return,
        ], 200);
    }

    /**
     * التحقق من أهلية الفاتورة للاسترجاع
     */
    public function verify(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'invoice_number' => 'required|string|exists:sales,invoice_number',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'رقم الفاتورة غير موجود بالنظام.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $sale = Sale::with(['items.product', 'user'])
            ->where('invoice_number', $request->invoice_number)
            ->firstOrFail();

        // 1. التحقق من حالة الفاتورة
        if ($sale->status !== 'completed' && $sale->status !== 'partially_refunded') {
            return response()->json([
                'message' => 'يمكن فقط عمل مرتجع للفواتير المكتملة أو المرتجعة جزئياً.',
            ], 422);
        }

        // 2. التحقق من توفر كميات قابلة للاسترجاع
        $hasReturnableQty = false;
        foreach ($sale->items as $item) {
            $remaining = $item->quantity - $item->previously_returned_qty;
            if ($remaining > 0) {
                $hasReturnableQty = true;
                break;
            }
        }

        if (!$hasReturnableQty) {
            return response()->json([
                'message' => 'تم استرجاع كافة عناصر هذه الفاتورة بالكامل مسبقاً.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $sale,
        ], 200);
    }

    /**
     * حفظ عملية المرتجع وتعديل المخازن والحسابات
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sale_id' => 'required|exists:sales,id',
            'refund_method' => 'required|in:cash,card,transfer,hybrid',
            'reason' => 'nullable|string|max:500',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.return_qty' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'تأكد من صحة المدخلات واختيار منتج واحد على الأقل.',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $sale = Sale::with('items.product')->findOrFail($request->sale_id);
            
            // التحقق من حالة الفاتورة
            if ($sale->status !== 'completed' && $sale->status !== 'partially_refunded') {
                return response()->json([
                    'message' => 'الفاتورة الأصلية غير مؤهلة للاسترجاع حالياً.',
                ], 422);
            }

            // توليد رقم فاتورة المرتجع
            $date = now()->format('Ymd');
            $random = strtoupper(bin2hex(random_bytes(3)));
            $returnNumber = "RTN-{$date}-{$random}";

            // إنشاء رأس المرتجع
            $salesReturn = SalesReturn::create([
                'tenant_id' => $sale->tenant_id,
                'return_number' => $returnNumber,
                'sale_id' => $sale->id,
                'user_id' => $request->user()->id,
                'subtotal' => 0.00, // سيتم تحديثه
                'discount_amount' => 0.00, // سيتم تحديثه
                'refund_total' => 0.00, // سيتم تحديثه
                'refund_method' => $request->refund_method,
                'status' => 'completed',
                'reason' => $request->reason,
            ]);

            $subtotalSum = 0.00;

            foreach ($request->items as $itemData) {
                $saleItem = SaleItem::where('sale_id', $sale->id)
                    ->where('id', $itemData['sale_item_id'])
                    ->firstOrFail();

                $remainingQty = $saleItem->quantity - $saleItem->previously_returned_qty;

                if ($itemData['return_qty'] > $remainingQty) {
                    throw new \Exception("الكمية المراد إرجاعها ({$itemData['return_qty']}) تتجاوز الكمية المتبقية للمنتج: {$saleItem->product->name}");
                }

                // إنشاء عنصر المرتجع
                $itemSubtotal = $saleItem->price * $itemData['return_qty'];
                SalesReturnItem::create([
                    'sales_return_id' => $salesReturn->id,
                    'product_id' => $saleItem->product_id,
                    'sale_item_id' => $saleItem->id,
                    'return_quantity' => $itemData['return_qty'],
                    'price' => $saleItem->price,
                    'subtotal' => $itemSubtotal,
                ]);

                $subtotalSum += $itemSubtotal;

                // تحديث المخزون
                $product = $saleItem->product;
                $product->increment('quantity', $itemData['return_qty']);

                // إضافة حركة للمخازن
                InventoryTransaction::create([
                    'tenant_id' => $sale->tenant_id,
                    'product_id' => $product->id,
                    'type' => 'return',
                    'quantity' => $itemData['return_qty'],
                    'reference_type' => 'SalesReturn',
                    'reference_id' => $salesReturn->id,
                    'notes' => "مرتجع مبيعات للفاتورة الأصلية رقم: {$sale->invoice_number}",
                ]);
            }

            // حساب الخصم النسبي المسترد
            // إذا كان هناك خصم إجمالي على الفاتورة الأصلية، نقوم بحساب نسبته لتخفيض إجمالي المرتجع
            $originalSaleSubtotal = $sale->items->sum(function ($item) {
                return $item->price * $item->quantity;
            });

            $proportionalDiscount = 0.00;
            if ($originalSaleSubtotal > 0 && $sale->discount > 0) {
                $discountRatio = $sale->discount / $originalSaleSubtotal;
                $proportionalDiscount = $subtotalSum * $discountRatio;
            }

            $refundTotal = $subtotalSum - $proportionalDiscount;

            // تحديث قيم رأس الفاتورة
            $salesReturn->update([
                'subtotal' => $subtotalSum,
                'discount_amount' => $proportionalDiscount,
                'refund_total' => $refundTotal,
            ]);

            // تحديث حالة الفاتورة الأصلية
            // حساب إجمالي الكميات المسترجعة الآن بعد إدخال حركة المرتجع
            $totalOriginalQty = $sale->items->sum('quantity');
            $totalReturnedQty = 0;
            
            // نقوم بإعادة تحميل عناصر البيع لحساب الكمية المرتجعة المحدثة
            $sale->load('items.returnItems');
            foreach ($sale->items as $item) {
                $totalReturnedQty += $item->previously_returned_qty;
            }

            if ($totalReturnedQty >= $totalOriginalQty) {
                $sale->update(['status' => 'refunded']);
            } else {
                $sale->update(['status' => 'partially_refunded']);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم معالجة وإصدار فاتورة المرتجع بنجاح.',
                'return_number' => $returnNumber,
                'data' => $salesReturn->load('items.product'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'حدث خطأ أثناء معالجة المرتجع.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
