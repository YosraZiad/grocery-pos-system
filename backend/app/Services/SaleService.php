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

            $total = $subtotal - $discountAmount;

            // Create sale
            $sale = Sale::create([
                'tenant_id' => $tenantId,
                'invoice_number' => Sale::generateInvoiceNumber(),
                'user_id' => $userId,
                'total' => $total,
                'discount' => $discountAmount,
                'discount_type' => $discountType,
                'payment_method' => $data['payment_method'],
                'amount_received' => $data['amount_received'] ?? null,
                'change_amount' => $data['change_amount'] ?? null,
                'payment_details' => $data['payment_details'] ?? null,
                'status' => 'completed',
            ]);

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
