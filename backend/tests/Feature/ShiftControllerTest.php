<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Shift;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ShiftControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_cashier_can_start_shift_successfully()
    {
        $user = $this->actingAsCashier();

        $response = $this->postJson('/api/shifts/start', [
            'opening_float' => 150.00,
            'device_number' => 'POS-01',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'shift' => [
                    'id',
                    'shift_number',
                    'device_number',
                    'opening_float',
                    'opened_at',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('shifts', [
            'user_id' => $user->id,
            'device_number' => 'POS-01',
            'opening_float' => 150.00,
            'status' => 'open',
        ]);
    }

    public function test_cashier_cannot_start_multiple_shifts()
    {
        $user = $this->actingAsCashier();
        $this->createOpenShift($user);

        $response = $this->postJson('/api/shifts/start', [
            'opening_float' => 200.00,
            'device_number' => 'POS-02',
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'You already have an open shift. | لديك وردية مفتوحة بالفعل.',
            ]);
    }

    public function test_cashier_can_get_active_shift()
    {
        $user = $this->actingAsCashier();
        
        // No active shift initially
        $response = $this->getJson('/api/shifts/active');
        $response->assertStatus(200)
            ->assertJson([
                'active' => false,
            ]);

        // Start a shift
        $shift = $this->createOpenShift($user);

        $response = $this->getJson('/api/shifts/active');
        $response->assertStatus(200)
            ->assertJson([
                'active' => true,
                'shift' => [
                    'id' => $shift->id,
                    'shift_number' => $shift->shift_number,
                    'status' => 'open',
                ],
            ]);
    }

    public function test_cashier_can_end_shift()
    {
        $user = $this->actingAsCashier();
        $shift = $this->createOpenShift($user);

        $response = $this->postJson('/api/shifts/end', [
            'closing_float' => 350.50,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'shift' => [
                    'id',
                    'closing_float',
                    'closed_at',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('shifts', [
            'id' => $shift->id,
            'closing_float' => 350.50,
            'status' => 'closed',
        ]);
    }

    public function test_sale_creation_is_prevented_without_active_shift()
    {
        $user = $this->actingAsCashier();

        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'tenant_id' => $this->tenant->id,
            'quantity' => 10,
            'sale_price' => 5.00,
        ]);

        // Post sale without open shift
        $response = $this->postJson('/api/sales', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'price' => 5.00,
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'Cannot start a sale without an open shift. | لا يمكنك بدء عملية بيع دون فتح وردية.',
            ]);
    }

    public function test_sale_creation_succeeds_with_active_shift()
    {
        $user = $this->actingAsCashier();
        $this->createOpenShift($user);

        $category = Category::factory()->create(['tenant_id' => $this->tenant->id]);
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'tenant_id' => $this->tenant->id,
            'quantity' => 10,
            'sale_price' => 5.00,
        ]);

        $response = $this->postJson('/api/sales', [
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'price' => 5.00,
                ],
            ],
            'payment_method' => 'cash',
        ]);

        $response->assertStatus(201);
    }
}
