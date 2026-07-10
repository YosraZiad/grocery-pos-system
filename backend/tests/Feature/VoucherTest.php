<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\SalesReturn;
use App\Models\Voucher;
use App\Models\Customer;
use Spatie\Permission\Models\Permission;
use Laravel\Sanctum\Sanctum;

class VoucherTest extends TestCase
{
    protected Product $product;
    protected Sale $sale;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate(['name' => 'view returns', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'create returns', 'guard_name' => 'sanctum']);
        Permission::firstOrCreate(['name' => 'create sales', 'guard_name' => 'sanctum']);

        $this->cashierUser->givePermissionTo(['view returns', 'create returns', 'create sales']);

        // Create shift for sales
        $this->createOpenShift($this->cashierUser);

        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test Product',
            'sale_price' => 50.00,
            'quantity' => 10,
        ]);

        $this->sale = Sale::create([
            'tenant_id' => $this->tenant->id,
            'invoice_number' => 'INV-TEST-VOUCHER',
            'user_id' => $this->cashierUser->id,
            'total' => 100.00,
            'discount' => 0.00,
            'discount_type' => 'fixed',
            'payment_method' => 'cash',
            'status' => 'completed',
        ]);

        SaleItem::create([
            'sale_id' => $this->sale->id,
            'product_id' => $this->product->id,
            'quantity' => 2,
            'price' => 50.00,
            'subtotal' => 100.00,
        ]);
    }

    public function test_can_create_replacement_return_and_issue_voucher()
    {
        $this->actingAsCashier();

        $saleItem = $this->sale->items()->first();

        $response = $this->postJson('/api/sales-returns', [
            'sale_id' => $this->sale->id,
            'refund_method' => 'replacement',
            'is_not_damaged' => true,
            'customer_name' => 'John Doe',
            'customer_phone' => '0501234567',
            'reason' => 'Exchange request',
            'items' => [
                [
                    'sale_item_id' => $saleItem->id,
                    'return_qty' => 1,
                ]
            ]
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'return_number',
                'voucher' => [
                    'code',
                    'amount',
                    'customer_name',
                    'customer_phone',
                ]
            ]);

        $this->assertDatabaseHas('customers', [
            'name' => 'John Doe',
            'phone' => '0501234567',
            'balance' => 50.00,
        ]);

        $this->assertDatabaseHas('vouchers', [
            'amount' => 50.00,
            'status' => 'active',
        ]);
    }

    public function test_can_verify_voucher_code()
    {
        $this->actingAsCashier();

        $customer = Customer::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Jane Doe',
            'balance' => 30.00,
        ]);

        $voucher = Voucher::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'code' => 'VCH-TEST-VERIFY',
            'amount' => 30.00,
            'status' => 'active',
        ]);

        $response = $this->getJson('/api/vouchers/verify?code=VCH-TEST-VERIFY');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'code' => 'VCH-TEST-VERIFY',
                    'amount' => 30.00,
                    'customer_name' => 'Jane Doe',
                ]
            ]);
    }

    public function test_can_checkout_using_voucher_code()
    {
        $this->actingAsCashier();

        $customer = Customer::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Voucher User',
            'balance' => 40.00,
        ]);

        $voucher = Voucher::create([
            'tenant_id' => $this->tenant->id,
            'customer_id' => $customer->id,
            'code' => 'VCH-TEST-CHECKOUT',
            'amount' => 40.00,
            'status' => 'active',
        ]);

        // Create new purchase of 50.00 (1 quantity of Test Product)
        $response = $this->postJson('/api/sales', [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                ]
            ],
            'payment_method' => 'cash',
            'voucher_code' => 'VCH-TEST-CHECKOUT',
            'amount_received' => 10.00,
            'change_amount' => 0.00,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('sales', [
            'total' => 10.00, // 50.00 - 40.00 voucher = 10.00 total due
            'voucher_code' => 'VCH-TEST-CHECKOUT',
            'voucher_amount' => 40.00,
        ]);

        $customer->refresh();
        $this->assertEquals(0.00, $customer->balance);

        $voucher->refresh();
        $this->assertEquals('redeemed', $voucher->status);
        $this->assertEquals(0.00, $voucher->amount);
    }
}
