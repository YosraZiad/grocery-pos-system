<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\Customer;
use Spatie\Permission\Models\Permission;
use Laravel\Sanctum\Sanctum;

class CustomerPaymentTest extends TestCase
{
    protected Product $product;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        Permission::firstOrCreate(['name' => 'create sales', 'guard_name' => 'sanctum']);
        $this->cashierUser->givePermissionTo(['create sales']);

        // Create open shift for sales
        $this->createOpenShift($this->cashierUser);

        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Test POS Product',
            'sale_price' => 50.00,
            'quantity' => 100,
        ]);

        $this->customer = Customer::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Sale Customer',
            'phone' => '0512345678',
            'balance' => 100.00,
            'is_temporary' => false,
        ]);
    }

    /**
     * Test searching for customer by phone number
     */
    public function test_can_search_customer_by_phone(): void
    {
        Sanctum::actingAs($this->cashierUser);

        $response = $this->getJson("/api/customers/search?phone=0512345678");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Sale Customer')
            ->assertJsonPath('data.balance', '100.00');
    }

    /**
     * Test adding a new customer
     */
    public function test_can_store_new_customer(): void
    {
        Sanctum::actingAs($this->cashierUser);

        $response = $this->postJson("/api/customers", [
            'name' => 'New POS Client',
            'phone' => '0599999999',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'New POS Client')
            ->assertJsonPath('data.phone', '0599999999');

        $this->assertDatabaseHas('customers', [
            'name' => 'New POS Client',
            'phone' => '0599999999',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    /**
     * Test successful sale paid via account
     */
    public function test_can_checkout_using_account_balance(): void
    {
        Sanctum::actingAs($this->cashierUser);

        $response = $this->postJson("/api/sales", [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1, // 50.00
                ]
            ],
            'payment_method' => 'account',
            'customer_id' => $this->customer->id,
        ]);

        $response->assertStatus(201);
        
        // Assert customer balance decremented from 100 to 50
        $this->customer->refresh();
        $this->assertEquals(50.00, $this->customer->balance);

        $this->assertDatabaseHas('sales', [
            'customer_id' => $this->customer->id,
            'payment_method' => 'account',
            'total' => 50.00,
        ]);
    }

    /**
     * Test successful hybrid sale (cash + account)
     */
    public function test_can_checkout_using_hybrid_with_account(): void
    {
        Sanctum::actingAs($this->cashierUser);

        // Update customer balance to 30.00
        $this->customer->update(['balance' => 30.00]);

        $response = $this->postJson("/api/sales", [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1, // 50.00
                ]
            ],
            'payment_method' => 'hybrid',
            'customer_id' => $this->customer->id,
            'payment_details' => [
                [
                    'method' => 'account',
                    'amount' => 30.00,
                ],
                [
                    'method' => 'cash',
                    'amount' => 20.00,
                ]
            ]
        ]);

        $response->assertStatus(201);

        // Customer balance should be 0 now
        $this->customer->refresh();
        $this->assertEquals(0.00, $this->customer->balance);
    }

    /**
     * Test rejection when customer balance is insufficient
     */
    public function test_rejects_checkout_if_balance_insufficient(): void
    {
        Sanctum::actingAs($this->cashierUser);

        // Set customer balance to 10.00
        $this->customer->update(['balance' => 10.00]);

        $response = $this->postJson("/api/sales", [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1, // 50.00
                ]
            ],
            'payment_method' => 'account',
            'customer_id' => $this->customer->id,
        ]);

        // Expect Exception
        $response->assertStatus(422);
        $this->assertStringContainsString('رصيد العميل غير كافٍ', $response->json('message'));
    }
}
