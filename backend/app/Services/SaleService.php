<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SaleService
{
    /**
     * Get all sales with filters
     *
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function index(array $filters): LengthAwarePaginator
    {
        $query = Sale::with(['user', 'items.product']);

        // Search by invoice number
        if (isset($filters['search'])) {
            $query->where('invoice_number', 'like', "%{$filters['search']}%");
        }

        // Filter by date range
        if (isset($filters['from'])) {
            $query->whereDate('created_at', '>=', $filters['from']);
        }
        if (isset($filters['to'])) {
            $query->whereDate('created_at', '<=', $filters['to']);
        }

        $perPage = $filters['per_page'] ?? 20;
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Create a new sale
     *
     * @param array $data
     * @param int $userId
     * @param int $tenantId
     * @return Sale
     * @throws \Exception
     */
    public function create(array $data, int $userId, int $tenantId): Sale
    {
        DB::beginTransaction();
        try {
            // Verify stock availability
            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                if ($product->quantity < $item['quantity']) {
                    throw new \RuntimeException(
                        "الكمية المتاحة غير كافية للمنتج: {$product->name}. متاح: {$product->quantity}, مطلوب: {$item['quantity']}"
                    );
                }
            }

            // Calculate totals
            $subtotal = 0;
            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $subtotal += $product->sale_price * $item['quantity'];
            }

            // Calculate discount
            $discount = $data['discount'] ?? 0;
            $discountType = $data['discount_type'] ?? 'fixed';
            
            if ($discountType === 'percentage') {
                $discountAmount = ($subtotal * $discount) / 100;
            } else {
                $discountAmount = $discount;
            }

            $totalBeforeVoucher = $subtotal - $discountAmount;

            $voucherCode = null;
            $voucherAmount = 0.00;
            $voucher = null;
            if (isset($data['voucher_code']) && !empty($data['voucher_code'])) {
                $voucher = \App\Models\Voucher::where('code', $data['voucher_code'])
                    ->where('status', 'active')
                    ->first();
                if ($voucher) {
                    $voucherCode = $voucher->code;
                    if ($voucher->amount > $totalBeforeVoucher) {
                        $voucherAmount = $totalBeforeVoucher;
                        $voucher->decrement('amount', $totalBeforeVoucher);
                        if ($voucher->customer) {
                            $voucher->customer->decrement('balance', $totalBeforeVoucher);
                        }
                    } else {
                        $voucherAmount = $voucher->amount;
                        $voucher->update([
                            'status' => 'redeemed',
                            'amount' => 0.00,
                            'redeemed_at' => now(),
                        ]);
                        if ($voucher->customer) {
                            $voucher->customer->decrement('balance', $voucherAmount);
                        }
                    }
                }
            }

            $total = max(0.00, $totalBeforeVoucher - $voucherAmount);

            $customerId = isset($data['customer_id']) && !empty($data['customer_id']) ? $data['customer_id'] : null;
            if (!$customerId) {
                $paymentMethod = $data['payment_method'] ?? 'cash';
                $defaultNames = [
                    'cash' => 'العميل الافتراضي - كاش',
                    'card' => 'العميل الافتراضي - شبكة',
                    'transfer' => 'العميل الافتراضي - تحويل',
                    'hybrid' => 'العميل الافتراضي - دفع مختلط',
                ];
                $defaultPhones = [
                    'cash' => '0500000000',
                    'card' => '0500000001',
                    'transfer' => '0500000002',
                    'hybrid' => '0500050000',
                ];
                $name = $defaultNames[$paymentMethod] ?? 'العميل الافتراضي - كاش';
                $phone = $defaultPhones[$paymentMethod] ?? '0500000000';

                $defaultCustomer = \App\Models\Customer::where('tenant_id', $tenantId)
                    ->where('phone', $phone)
                    ->first();

                if (!$defaultCustomer) {
                    $defaultCustomer = \App\Models\Customer::create([
                        'tenant_id' => $tenantId,
                        'name' => $name,
                        'phone' => $phone,
                        'balance' => 0.00,
                        'is_temporary' => false
                    ]);
                }
                $customerId = $defaultCustomer->id;
            }

            $customer = \App\Models\Customer::findOrFail($customerId);

            // Calculate account deduction amount
            $accountDeduction = 0.00;
            $appliedVoucher = null;
            if ($data['payment_method'] === 'account') {
                $accountDeduction = $total;
            } elseif ($data['payment_method'] === 'hybrid' && isset($data['payment_details']) && is_array($data['payment_details'])) {
                foreach ($data['payment_details'] as $detail) {
                    $methodName = $detail['method'] ?? ($detail['payment_method'] ?? null);
                    if ($methodName === 'account') {
                        $accountDeduction += $detail['amount'] ?? 0;
                        if (isset($detail['voucher_code']) && !empty($detail['voucher_code'])) {
                            $appliedVoucher = \App\Models\Voucher::where('code', $detail['voucher_code'])->first();
                        }
                    }
                }
            }

            if ($accountDeduction > 0) {
                if (!$customer) {
                    throw new \RuntimeException("يجب اختيار عميل مسجل بالنظام لإجراء عملية الخصم من الحساب.");
                }

                if ($appliedVoucher) {
                    if ($appliedVoucher->status !== 'active') {
                        throw new \RuntimeException("سند الاستبدال غير نشط أو تم استخدامه مسبقاً. | The voucher is inactive or already redeemed.");
                    }
                    if ($appliedVoucher->amount < $accountDeduction) {
                        throw new \RuntimeException("رصيد السند غير كافٍ. الرصيد المتاح بالسند: {$appliedVoucher->amount} ر.س، المطلوب خصمه: {$accountDeduction} ر.س.");
                    }

                    // خصم المبلغ من السند
                    if ($appliedVoucher->amount > $accountDeduction) {
                        $appliedVoucher->decrement('amount', $accountDeduction);
                    } else {
                        $appliedVoucher->update([
                            'status' => 'redeemed',
                            'amount' => 0.00,
                            'redeemed_at' => now(),
                        ]);
                    }

                    // تحديث رصيد العميل بشكل آمن للمزامنة
                    if ($customer->balance >= $accountDeduction) {
                        $customer->decrement('balance', $accountDeduction);
                    } else {
                        $customer->update(['balance' => 0.00]);
                    }
                } else {
                    if ($customer->balance < $accountDeduction) {
                        throw new \RuntimeException("رصيد العميل غير كافٍ. الرصيد المتاح: {$customer->balance} ر.س، المطلوب خصمه: {$accountDeduction} ر.س.");
                    }
                    $customer->decrement('balance', $accountDeduction);
                }
            }

            $activeShift = \App\Models\Shift::where('user_id', $userId)
                ->where('status', 'open')
                ->first();
            $shiftId = $activeShift ? $activeShift->id : null;

            // Create sale
            $sale = Sale::create([
                'tenant_id' => $tenantId,
                'invoice_number' => Sale::generateInvoiceNumber(),
                'user_id' => $userId,
                'shift_id' => $shiftId,
                'total' => $total,
                'discount' => $discountAmount,
                'discount_type' => $discountType,
                'payment_method' => $data['payment_method'],
                'voucher_code' => $voucherCode,
                'voucher_amount' => $voucherAmount,
                'amount_received' => $data['amount_received'] ?? null,
                'change_amount' => $data['change_amount'] ?? null,
                'payment_details' => $data['payment_details'] ?? null,
                'customer_id' => $customerId,
                'status' => 'completed',
            ]);

            if ($voucher) {
                $voucher->update(['redeemed_sale_id' => $sale->id]);
            }

            // Create sale items and update inventory
            foreach ($data['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                $price = $product->sale_price;
                $quantity = $item['quantity'];
                $itemSubtotal = $price * $quantity;

                // Create sale item
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'price' => $price,
                    'subtotal' => $itemSubtotal,
                ]);

                // Decrement stock
                $product->decrement('quantity', $quantity);

                // Create inventory transaction
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
            return $sale->load(['user', 'items.product']);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Show single sale
     *
     * @param string $id
     * @return Sale
     */
    public function show(string $id): Sale
    {
        return Sale::with(['user', 'items.product'])->findOrFail($id);
    }

    /**
     * Get invoice details
     *
     * @param string $id
     * @return Sale
     */
    public function invoice(string $id): Sale
    {
        return Sale::with(['user', 'items.product', 'items.product.category'])->findOrFail($id);
    }

    /**
     * Cancel a sale
     *
     * @param string $id
     * @return Sale
     * @throws \Exception
     */
    public function cancel(string $id): Sale
    {
        DB::beginTransaction();
        try {
            $sale = Sale::with('items')->findOrFail($id);

            if ($sale->status === 'cancelled') {
                throw new \RuntimeException('Sale is already cancelled');
            }

            // Return items to stock
            foreach ($sale->items as $item) {
                $product = Product::findOrFail($item->product_id);
                $product->increment('quantity', $item->quantity);

                // Create inventory transaction
                InventoryTransaction::create([
                    'tenant_id' => $sale->tenant_id,
                    'product_id' => $product->id,
                    'type' => 'in',
                    'quantity' => $item->quantity,
                    'reference_type' => 'Sale',
                    'reference_id' => $sale->id,
                    'notes' => "إلغاء بيع - فاتورة رقم: {$sale->invoice_number}",
                ]);
            }

            $sale->update(['status' => 'cancelled']);

            DB::commit();
            return $sale->load(['user', 'items.product']);

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
