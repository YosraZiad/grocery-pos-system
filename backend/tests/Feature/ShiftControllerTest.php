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
            'actual_cash' => 350.50,
            'actual_card' => 0.00,
            'notes' => 'Matching shift totals.',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'shift' => [
                    'id',
                    'actual_cash',
                    'actual_card',
                    'expected_cash',
                    'expected_card',
                    'difference',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('shifts', [
            'id' => $shift->id,
            'actual_cash' => 350.50,
            'actual_card' => 0.00,
            'status' => 'closed',
        ]);
    }

    public function test_cashier_cannot_close_shift_with_suspended_sales()
    {
        $user = $this->actingAsCashier();
        $shift = $this->createOpenShift($user);

        // Create a suspended sale
        \App\Models\SuspendedSale::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'suspend_id' => 'SUS-001',
            'customer_name' => 'General Customer',
            'items' => [],
            'subtotal' => 0,
            'discount' => 0,
            'total' => 0,
        ]);

        $response = $this->postJson('/api/shifts/end', [
            'actual_cash' => 150.00,
            'actual_card' => 0.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'لا يمكن إغلاق الوردية، يرجى إنهاء أو إلغاء الفواتير المعلقة. | Cannot close shift, please complete or cancel suspended sales.'
            ]);
    }

    public function test_cashier_close_shift_with_difference_requires_notes()
    {
        $user = $this->actingAsCashier();
        $shift = $this->createOpenShift($user); // opening float is 100.00 by default in test helper

        // Send ended shift with difference but no notes
        $response = $this->postJson('/api/shifts/end', [
            'actual_cash' => 150.00, // 50.00 overage difference
            'actual_card' => 0.00,
        ]);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'يجب تقديم تبرير لوجود فروقات في الوردية. | Justification is required for shift differences.'
            ]);

        // Submit with notes, should succeed
        $response = $this->postJson('/api/shifts/end', [
            'actual_cash' => 150.00,
            'actual_card' => 0.00,
            'notes' => 'Overage due to tips/extra float.',
        ]);

        $response->assertStatus(200);
    }

    public function test_cashier_can_get_z_report()
    {
        $user = $this->actingAsCashier();
        $shift = $this->createOpenShift($user);

        $this->postJson('/api/shifts/end', [
            'actual_cash' => 100.00,
            'actual_card' => 0.00,
        ]);

        $response = $this->getJson("/api/shifts/{$shift->id}/z-report");
        $response->assertStatus(200)
            ->assertHeader('Content-Type', 'text/html; charset=utf-8');
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

    public function test_active_shift_expires_after_12_hours()
    {
        $user = $this->actingAsCashier();
        $shift = $this->createOpenShift($user);
        
        // Manually update opened_at to 13 hours ago
        $shift->update(['opened_at' => now()->subHours(13)]);

        $response = $this->getJson('/api/shifts/active');
        $response->assertStatus(200)
            ->assertJson([
                'active' => true,
                'expired' => true,
            ]);
    }

    public function test_cannot_create_sale_if_active_shift_expired()
    {
        $user = $this->actingAsCashier();
        $shift = $this->createOpenShift($user);
        
        // Manually update opened_at to 13 hours ago
        $shift->update(['opened_at' => now()->subHours(13)]);

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

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'لقد انتهت صلاحية الوردية (الحد الأقصى 12 ساعة). يرجى إقفال الوردية الحالية وبدء وردية جديدة. | Active shift has expired (max 12 hours). Please close the active shift and start a new one.'
            ]);
    }
}
