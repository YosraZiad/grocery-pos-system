<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ProductControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_permission_can_view_products()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        Product::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
        ]);

        $response = $this->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'barcode',
                        'purchase_price',
                        'sale_price',
                        'quantity',
                    ],
                ],
            ]);
    }

    public function test_user_can_search_products()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        Product::factory()->create([
            'name' => 'Test Product',
            'barcode' => '123456',
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
        ]);

        $response = $this->getJson('/api/products?search=Test');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'Test Product',
            ]);
    }

    public function test_user_can_filter_products_by_category()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        Product::factory()->create([
            'category_id' => $category->id,
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson("/api/products?category_id={$category->id}");

        $response->assertStatus(200);
    }

    public function test_user_with_permission_can_create_product()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->postJson('/api/products', [
            'category_id' => $category->id,
            'name' => 'New Product',
            'barcode' => '123456789',
            'purchase_price' => 10.00,
            'sale_price' => 15.00,
            'quantity' => 100,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'name',
                    'barcode',
                ],
            ]);

        $this->assertDatabaseHas('products', [
            'name' => 'New Product',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_user_can_view_single_product()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
        ]);

        $response = $this->getJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'category',
                ],
            ]);
    }

    public function test_user_with_permission_can_update_product()
    {
        $this->actingAsAdmin();

        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->putJson("/api/products/{$product->id}", [
            'name' => 'Updated Product',
            'sale_price' => 20.00,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Product updated successfully',
            ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product',
        ]);
    }

    public function test_user_with_permission_can_delete_product()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $product = Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $category->id,
        ]);

        $response = $this->deleteJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Product deleted successfully',
            ]);

        $this->assertDatabaseMissing('products', [
            'id' => $product->id,
        ]);
    }

    public function test_user_without_permission_cannot_create_product()
    {
        $cashier = $this->actingAsCashier();
        $cashier->revokePermissionTo('create products');

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->postJson('/api/products', [
            'category_id' => $category->id,
            'name' => 'New Product',
            'barcode' => '123456789',
            'purchase_price' => 10.00,
            'sale_price' => 15.00,
            'quantity' => 100,
        ]);

        $response->assertStatus(403);
    }
}
