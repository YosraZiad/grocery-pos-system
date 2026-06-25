<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\SuspendedSale;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

class SuspendedSaleControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_cashier_can_suspend_sale()
    {
        $user = $this->actingAsCashier();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'tenant_id' => $this->tenant->id,
            'quantity' => 10,
            'sale_price' => 12.50,
        ]);

        $items = [
            [
                'product' => [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sale_price' => 12.50,
                    'quantity' => 10,
                ],
                'quantity' => 2,
                'price' => 12.50,
            ]
        ];

        $response = $this->postJson('/api/suspended-sales', [
            'items' => $items,
            'total' => 25.00,
            'discount' => 0.00,
            'discount_type' => 'fixed',
            'note' => 'العميل بالسيارة',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'suspend_id',
                    'total',
                    'note',
                    'items',
                ],
            ]);

        $this->assertDatabaseHas('suspended_sales', [
            'tenant_id' => $this->tenant->id,
            'user_id' => $user->id,
            'note' => 'العميل بالسيارة',
            'total' => 25.00,
        ]);
    }

    public function test_cashier_can_list_suspended_sales()
    {
        $user = $this->actingAsCashier();

        SuspendedSale::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $user->id,
            'suspend_id' => 'SUS-230623-0001',
            'note' => 'طاولة 3',
            'total' => 45.00,
            'discount' => 0,
            'discount_type' => 'fixed',
            'items' => [['product_id' => 1, 'quantity' => 2]],
        ]);

        $response = $this->getJson('/api/suspended-sales');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment([
                'suspend_id' => 'SUS-230623-0001',
                'note' => 'طاولة 3',
            ]);
    }

    public function test_cashier_can_delete_suspended_sale()
    {
        $user = $this->actingAsCashier();

        $suspended = SuspendedSale::create([
            'tenant_id' => $this->tenant->id,
            'user_id' => $user->id,
            'suspend_id' => 'SUS-230623-0002',
            'note' => 'للإزالة',
            'total' => 15.00,
            'discount' => 0,
            'discount_type' => 'fixed',
            'items' => [['product_id' => 2, 'quantity' => 1]],
        ]);

        $response = $this->deleteJson("/api/suspended-sales/{$suspended->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('suspended_sales', [
            'id' => $suspended->id,
        ]);
    }
}
