<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\SalesReturn;
use App\Models\SalesReturnItem;
use Spatie\Permission\Models\Permission;
use Laravel\Sanctum\Sanctum;

class SalesReturnTest extends TestCase
{
    protected Product $product1;
    protected Product $product2;
    protected Sale $sale;

    protected function setUp(): void
    {
        parent::setUp();

        // إنشاء الصلاحيات الناقصة في الـ setup الافتراضي
        Permission::firstOrCreate(['name' => 'view returns', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'create returns', 'guard_name' => 'sanctum']);

        // إسناد الصلاحيات لمستخدم الكاشير
        $this->cashierUser->givePermissionTo(['view returns', 'create returns']);

        // إنشاء منتجات تجريبية
        $this->product1 = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Product 1',
            'sale_price' => 10.00,
            'quantity' => 100,
        ]);

        $this->product2 = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Product 2',
            'sale_price' => 20.00,
            'quantity' => 50,
        ]);

        // إنشاء فاتورة مبيعات مكتملة
        $this->sale = Sale::create([
            'tenant_id' => $this->tenant->id,
            'invoice_number' => 'INV-TEST-0001',
            'user_id' => $this->cashierUser->id,
            'total' => 50.00,
            'discount' => 10.00,
            'discount_type' => 'fixed',
            'payment_method' => 'cash',
            'status' => 'completed',
        ]);

        // بنود الفاتورة
        SaleItem::create([
            'sale_id' => $this->sale->id,
            'product_id' => $this->product1->id,
            'quantity' => 2,
            'price' => 10.00,
            'subtotal' => 20.00,
        ]);

        SaleItem::create([
            'sale_id' => $this->sale->id,
            'product_id' => $this->product2->id,
            'quantity' => 2,
            'price' => 20.00,
            'subtotal' => 40.00,
        ]);
    }

    public function test_cashier_can_verify_invoice_successfully()
    {
        $this->actingAsCashier();

        $response = $this->postJson('/api/sales-returns/verify', [
            'invoice_number' => 'INV-TEST-0001',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'invoice_number' => 'INV-TEST-0001',
                ]
            ]);
    }

    public function test_cashier_cannot_verify_invalid_invoice()
    {
        $this->actingAsCashier();

        $response = $this->postJson('/api/sales-returns/verify', [
            'invoice_number' => 'INV-NON-EXISTENT',
        ]);

        $response->assertStatus(422);
    }

    public function test_cashier_can_process_partial_return()
    {
        $this->actingAsCashier();

        $saleItem1 = $this->sale->items()->first();

        // إرجاع عنصر واحد من المنتج الأول
        $response = $this->postJson('/api/sales-returns', [
            'sale_id' => $this->sale->id,
            'refund_method' => 'cash',
            'is_not_damaged' => true,
            'reason' => 'Customer request',
            'items' => [
                [
                    'sale_item_id' => $saleItem1->id,
                    'return_qty' => 1,
                ]
            ]
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'تم معالجة وإصدار فاتورة المرتجع بنجاح.'
            ]);

        // التحقق من بقاء حالة الفاتورة مكتملة التزاماً بالمبادئ المحاسبية
        $this->sale->refresh();
        $this->assertEquals('completed', $this->sale->status);

        // التحقق من تحديث المخزون
        $this->product1->refresh();
        $this->assertEquals(101, $this->product1->quantity);

        // التحقق من حساب الخصم النسبي
        // الفاتورة الأصلية: subtotal = 60.00، الخصم = 10.00 (نسبة الخصم = 10 / 60 = 16.666%)
        // المرتجع: قيمة العنصر المرتجع = 10.00. الخصم النسبي = 10 * (10 / 60) = 1.67 ر.س.
        // صافي الرد المالي = 10.00 - 1.67 = 8.33 ر.س.
        $salesReturn = SalesReturn::first();
        $this->assertEquals(10.00, $salesReturn->subtotal);
        $this->assertEquals(1.67, round($salesReturn->discount_amount, 2));
        $this->assertEquals(8.33, round($salesReturn->refund_total, 2));
    }

    public function test_cashier_can_process_full_return()
    {
        $this->actingAsCashier();

        $saleItem1 = $this->sale->items()->where('product_id', $this->product1->id)->first();
        $saleItem2 = $this->sale->items()->where('product_id', $this->product2->id)->first();

        // إرجاع كافة البنود بالكامل
        $response = $this->postJson('/api/sales-returns', [
            'sale_id' => $this->sale->id,
            'refund_method' => 'cash',
            'is_not_damaged' => true,
            'reason' => 'Full refund request',
            'items' => [
                [
                    'sale_item_id' => $saleItem1->id,
                    'return_qty' => 2,
                ],
                [
                    'sale_item_id' => $saleItem2->id,
                    'return_qty' => 2,
                ]
            ]
        ]);

        $response->assertStatus(201);

        // التحقق من بقاء حالة الفاتورة مكتملة التزاماً بالمبادئ المحاسبية
        $this->sale->refresh();
        $this->assertEquals('completed', $this->sale->status);

        // التحقق من تحديث المخزون
        $this->product1->refresh();
        $this->product2->refresh();
        $this->assertEquals(102, $this->product1->quantity);
        $this->assertEquals(52, $this->product2->quantity);

        // التحقق من صحة إجمالي المرتجعات
        $salesReturn = SalesReturn::first();
        $this->assertEquals(60.00, $salesReturn->subtotal);
        $this->assertEquals(10.00, $salesReturn->discount_amount);
        $this->assertEquals(50.00, $salesReturn->refund_total);
    }

    public function test_cashier_cannot_return_more_than_remaining()
    {
        $this->actingAsCashier();

        $saleItem1 = $this->sale->items()->first();

        // محاولة إرجاع 3 عناصر بينما الكمية المباعة هي 2 فقط
        $response = $this->postJson('/api/sales-returns', [
            'sale_id' => $this->sale->id,
            'refund_method' => 'cash',
            'is_not_damaged' => true,
            'reason' => 'Error request',
            'items' => [
                [
                    'sale_item_id' => $saleItem1->id,
                    'return_qty' => 3,
                ]
            ]
        ]);

        $response->assertStatus(500); // تسبب في حدوث Exception تراجع عن العملية
    }

    public function test_cash_refund_does_not_issue_voucher()
    {
        $this->actingAsCashier();

        $saleItem1 = $this->sale->items()->where('product_id', $this->product1->id)->first();

        $response = $this->postJson('/api/sales-returns', [
            'sale_id' => $this->sale->id,
            'refund_method' => 'cash',
            'is_not_damaged' => true,
            'reason' => 'Customer request',
            'items' => [
                [
                    'sale_item_id' => $saleItem1->id,
                    'return_qty' => 1,
                ]
            ]
        ]);

        $response->assertStatus(201);

        // Verify that NO voucher was created for this sales return
        $this->assertDatabaseMissing('vouchers', [
            'sales_return_id' => $response->json('data.id')
        ]);
    }
}
