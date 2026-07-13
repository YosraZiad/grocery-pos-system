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

        $sale = Sale::with(['items.product', 'user', 'customer'])
            ->where('invoice_number', $request->invoice_number)
            ->firstOrFail();

        // 0. التحقق من فترة السماح بالإرجاع
        $returnPeriodDays = (int)\App\Models\Setting::get('return_period_days', 14);
        if ($sale->created_at->diffInDays(now()) > $returnPeriodDays) {
            return response()->json([
                'message' => "انتهت فترة السماح بالإرجاع لهذه الفاتورة (فترة السماح المتاحة: {$returnPeriodDays} يوماً). تاريخ الفاتورة: " . $sale->created_at->format('Y-m-d'),
            ], 422);
        }

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
            'refund_method' => 'required|in:cash,card,transfer,hybrid,replacement',
            'reason' => 'nullable|string|max:500',
            'customer_name' => 'nullable|string|max:100',
            'customer_phone' => 'nullable|string|max:20',
            'is_not_damaged' => 'required|accepted',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.return_qty' => 'required|integer|min:1',
        ], [
            'is_not_damaged.accepted' => 'يجب تأكيد أن البضاعة المرتجعة سليمة وغير تالفة لإتمام العملية.',
            'is_not_damaged.required' => 'يجب تأكيد أن البضاعة المرتجعة سليمة وغير تالفة لإتمام العملية.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first() ?? 'تأكد من صحة المدخلات واختيار منتج واحد على الأقل.',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $sale = Sale::with('items.product')->findOrFail($request->sale_id);
            
            // التحقق من فترة السماح بالإرجاع
            $returnPeriodDays = (int)\App\Models\Setting::get('return_period_days', 14);
            if ($sale->created_at->diffInDays(now()) > $returnPeriodDays) {
                return response()->json([
                    'message' => "انتهت فترة السماح بالإرجاع لهذه الفاتورة (فترة السماح المتاحة: {$returnPeriodDays} يوماً).",
                ], 422);
            }

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

            $activeShift = \App\Models\Shift::where('user_id', $request->user()->id)
                ->where('status', 'open')
                ->first();
            $shiftId = $activeShift ? $activeShift->id : null;

            // إنشاء رأس المرتجع
            $salesReturn = SalesReturn::create([
                'tenant_id' => $sale->tenant_id,
                'return_number' => $returnNumber,
                'sale_id' => $sale->id,
                'user_id' => $request->user()->id,
                'shift_id' => $shiftId,
                'subtotal' => 0.00, // سيتم تحديثه
                'discount_amount' => 0.00, // سيتم تحديثه
                'refund_total' => 0.00, // سيتم تحديثه
                'refund_method' => $request->refund_method,
                'status' => 'completed',
                'reason' => $request->reason,
                'customer_name' => $request->customer_name,
                'customer_phone' => $request->customer_phone,
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

            // تحديد العميل المرتبط بالمرتجع لإضافة الرصيد إلى حسابه
            $customer = null;

            // 1. محاولة الحصول على العميل من الفاتورة الأصلية أولاً
            if ($sale->customer_id) {
                $customer = \App\Models\Customer::find($sale->customer_id);
            }

            // 2. إذا لم يتوفر عميل في الفاتورة الأصلية، نبحث عنه برقم الهاتف المدخل في المرتجع أو ننشئه
            if (!$customer) {
                $customerPhone = $request->customer_phone;
                
                // توليد هاتف افتراضي فريد للعميل المؤقت إذا لم يتوفر هاتف مدخل
                if (!$customerPhone) {
                    $randomId = rand(1000, 9999);
                    $customerPhone = "0500000" . $randomId;
                    while (\App\Models\Customer::where('phone', $customerPhone)->exists()) {
                        $randomId = rand(1000, 9999);
                        $customerPhone = "0500000" . $randomId;
                    }
                }

                $customer = \App\Models\Customer::where('phone', $customerPhone)->first();

                if (!$customer) {
                    $customerName = $request->customer_name ?? "عميل ارجاع فاتورة {$sale->invoice_number}";
                    $customer = \App\Models\Customer::create([
                        'tenant_id' => $sale->tenant_id,
                        'name' => $customerName,
                        'phone' => $customerPhone,
                        'balance' => 0.00,
                        'is_temporary' => true,
                    ]);
                }
            }

            $voucher = null;
            if ($salesReturn->refund_method === 'replacement') {
                // إضافة الرصيد إلى حساب العميل المسجل بالنظام مباشرة عند إرجاع أي منتج كـ رصيد بديل
                $customer->increment('balance', $refundTotal);

                // إنشاء سند استبدال (Voucher) نشط باستخدام رقم فاتورة المرتجع نفسه كـ كود للسند
                $voucher = \App\Models\Voucher::create([
                    'tenant_id' => $sale->tenant_id,
                    'customer_id' => $customer->id,
                    'sales_return_id' => $salesReturn->id,
                    'code' => $returnNumber, // رقم فاتورة المرتجع نفسه هو كود السند!
                    'amount' => $refundTotal,
                    'status' => 'active',
                ]);
            }

            // لا يتم تعديل حالة الفاتورة الأصلية أبداً التزاماً بالمبادئ المحاسبية (تبقى مكتملة كما هي)

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'تم معالجة وإصدار فاتورة المرتجع بنجاح.',
                'return_number' => $returnNumber,
                'data' => $salesReturn->load('items.product'),
                'voucher' => $voucher ? [
                    'code' => $voucher->code,
                    'amount' => $voucher->amount,
                    'customer_name' => $customer->name,
                    'customer_phone' => $customer->phone,
                ] : null,
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'حدث خطأ أثناء معالجة المرتجع.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * عرض فاتورة المرتجع كـ HTML للطباعة
     */
    public function invoice(Request $request, string $id)
    {
        $salesReturn = SalesReturn::with(['user', 'sale', 'items.product.category'])
            ->findOrFail($id);
        $lang = $request->get('lang', 'ar');

        $html = view('sales_return_invoice', compact('salesReturn', 'lang'))->render();

        return response($html)->header('Content-Type', 'text/html');
    }
}
