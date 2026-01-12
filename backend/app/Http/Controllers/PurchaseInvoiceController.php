<?php

namespace App\Http\Controllers;

use App\Models\PurchaseInvoice;
use App\Models\PurchaseItem;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PurchaseInvoiceController extends Controller
{
    /**
     * عرض جميع فواتير الشراء
     */
    public function index(Request $request)
    {
        $query = PurchaseInvoice::with(['supplier', 'user', 'items.product']);

        // فلترة حسب المورّد
        if ($request->has('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        // فلترة حسب التاريخ
        if ($request->has('from')) {
            $query->whereDate('date', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->whereDate('date', '<=', $request->to);
        }

        // فلترة حسب الحالة (مدفوع/غير مدفوع)
        if ($request->has('status')) {
            if ($request->status === 'paid') {
                $query->where('balance', 0);
            } elseif ($request->status === 'unpaid') {
                $query->where('balance', '>', 0);
            }
        }

        $perPage = $request->get('per_page', 20);
        $invoices = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($invoices, 200);
    }

    /**
     * عرض فاتورة شراء واحدة
     */
    public function show(string $id)
    {
        $invoice = PurchaseInvoice::with(['supplier', 'user', 'items.product.category'])
            ->findOrFail($id);

        return response()->json([
            'data' => $invoice,
        ], 200);
    }

    /**
     * إضافة فاتورة شراء جديدة
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'date' => 'required|date',
            'paid_amount' => 'nullable|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            // حساب الإجمالي
            $total = 0;
            foreach ($request->items as $item) {
                $total += $item['quantity'] * $item['price'];
            }

            $paidAmount = $request->paid_amount ?? 0;
            $balance = $total - $paidAmount;

            // إنشاء فاتورة الشراء
            $invoice = PurchaseInvoice::create([
                'tenant_id' => config('tenant_id'),
                'supplier_id' => $request->supplier_id,
                'invoice_number' => PurchaseInvoice::generateInvoiceNumber(),
                'total' => $total,
                'paid_amount' => $paidAmount,
                'balance' => $balance,
                'date' => $request->date,
                'user_id' => $request->user()->id,
            ]);

            // إنشاء عناصر الفاتورة وتحديث المخزون
            foreach ($request->items as $item) {
                $product = Product::findOrFail($item['product_id']);
                $quantity = $item['quantity'];
                $price = $item['price'];
                $subtotal = $quantity * $price;

                // إنشاء عنصر الفاتورة
                PurchaseItem::create([
                    'purchase_invoice_id' => $invoice->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'subtotal' => $subtotal,
                ]);

                // تحديث سعر الشراء للمنتج (اختياري - يمكن تحديثه أو تركه كما هو)
                // $product->update(['purchase_price' => $price]);

                // إضافة الكمية للمخزون
                $product->increment('quantity', $quantity);

                // إنشاء Inventory Transaction
                InventoryTransaction::create([
                    'tenant_id' => config('tenant_id'),
                    'product_id' => $product->id,
                    'type' => 'in',
                    'quantity' => $quantity,
                    'reference_type' => 'Purchase',
                    'reference_id' => $invoice->id,
                    'notes' => "شراء - فاتورة رقم: {$invoice->invoice_number}",
                ]);
            }

            // تحديث رصيد المورّد
            $supplier = Supplier::findOrFail($request->supplier_id);
            $supplier->increment('balance', $balance);

            DB::commit();

            return response()->json([
                'message' => 'Purchase invoice created successfully',
                'data' => $invoice->load(['supplier', 'user', 'items.product']),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error creating purchase invoice',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * دفع جزء من الدين
     */
    public function pay(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|numeric|min:0.01',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        DB::beginTransaction();
        try {
            $invoice = PurchaseInvoice::with('supplier')->findOrFail($id);

            // التحقق من أن المبلغ لا يتجاوز المتبقي
            if ($request->amount > $invoice->balance) {
                return response()->json([
                    'message' => 'Payment amount cannot exceed the remaining balance',
                    'remaining_balance' => $invoice->balance,
                ], 422);
            }

            // تحديث المبلغ المدفوع والمتبقي
            $invoice->increment('paid_amount', $request->amount);
            $invoice->decrement('balance', $request->amount);

            // تحديث رصيد المورّد
            $invoice->supplier->decrement('balance', $request->amount);

            DB::commit();

            return response()->json([
                'message' => 'Payment processed successfully',
                'data' => $invoice->load(['supplier', 'user', 'items.product']),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Error processing payment',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
