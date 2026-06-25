<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Sale;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

class SaleControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_permission_can_view_sales()
    {
        $user = $this->actingAsAdmin();

        Sale::factory()->count(5)->create([
            'user_id' => $user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson('/api/sales');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'invoice_number',
                        'total',
                        'user',
                    ],
                ],
            ]);
    }

    public function test_user_with_permission_can_create_sale()
    {
        $user = $this->actingAsAdmin();
        $this->createOpenShift($user);

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'tenant_id' => $this->tenant->id,
            'quantity' => 100,
            'sale_price' => 10.00,
        ]);

        $response = $this->postJson('/api/sales', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'price' => 10.00,
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'invoice_number',
                    'total',
                ],
            ]);

        $this->assertDatabaseHas('sales', [
            'user_id' => $user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        // التحقق من تحديث كمية المنتج
        $product->refresh();
        $this->assertEquals(98, $product->quantity);
    }

    public function test_sale_creation_fails_with_insufficient_stock()
    {
        $user = $this->actingAsAdmin();
        $this->createOpenShift($user);

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'tenant_id' => $this->tenant->id,
            'quantity' => 5,
            'sale_price' => 10.00,
        ]);

        $response = $this->postJson('/api/sales', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 10, // أكثر من المتاح
                    'price' => 10.00,
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(422);
    }

    public function test_user_can_view_single_sale()
    {
        $user = $this->actingAsAdmin();

        $sale = Sale::factory()->create([
            'user_id' => $user->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson("/api/sales/{$sale->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'invoice_number',
                    'items',
                ],
            ]);
    }

    public function test_sale_creation_requires_valid_data()
    {
        $user = $this->actingAsAdmin();
        $this->createOpenShift($user);

        $response = $this->postJson('/api/sales', [
            'items' => [],
            'payment_method' => 'invalid',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items', 'payment_method']);
    }

    public function test_user_can_search_sales_by_invoice_number()
    {
        $user = $this->actingAsAdmin();

        $sale = Sale::factory()->create([
            'user_id' => $user->id,
            'tenant_id' => $this->tenant->id,
            'invoice_number' => 'INV-12345',
        ]);

        $response = $this->getJson('/api/sales?search=INV-12345');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'invoice_number' => 'INV-12345',
            ]);
    }

    public function test_user_can_create_sale_with_hybrid_payment()
    {
        $user = $this->actingAsAdmin();
        $this->createOpenShift($user);

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'tenant_id' => $this->tenant->id,
            'quantity' => 100,
            'sale_price' => 10.00,
        ]);

        $paymentDetails = [
            ['method' => 'cash', 'amount' => 8.00],
            ['method' => 'card', 'amount' => 12.00],
        ];

        $response = $this->postJson('/api/sales', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                    'price' => 10.00,
                ],
            ],
            'payment_method' => 'hybrid',
            'amount_received' => 20.00,
            'change_amount' => 0.00,
            'payment_details' => $paymentDetails,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('sales', [
            'user_id' => $user->id,
            'tenant_id' => $this->tenant->id,
            'payment_method' => 'hybrid',
        ]);

        // التحقق من صحة تفاصيل الدفع المخزنة كـ JSON/Array
        $sale = Sale::where('payment_method', 'hybrid')->first();
        $this->assertNotNull($sale);
        $this->assertEquals($paymentDetails, $sale->payment_details);
    }
}
