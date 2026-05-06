<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;

class CategoryControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_permission_can_view_categories()
    {
        $this->actingAsAdmin();

        Category::factory()->count(5)->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'products_count',
                    ],
                ],
                'tree' => [
                    '*' => [
                        'id',
                        'name',
                        'products',
                        'children',
                    ],
                ],
            ]);
    }

    public function test_categories_index_returns_multilevel_tree_with_products()
    {
        $this->actingAsAdmin();

        $parent = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Beverages',
        ]);

        $child = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Soft Drinks',
            'parent_id' => $parent->id,
        ]);

        Product::factory()->create([
            'tenant_id' => $this->tenant->id,
            'category_id' => $child->id,
            'name' => 'Cola',
        ]);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonPath('tree.0.id', $parent->id)
            ->assertJsonPath('tree.0.children.0.id', $child->id)
            ->assertJsonPath('tree.0.children.0.products.0.name', 'Cola');
    }

    public function test_user_with_permission_can_create_category()
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/categories', [
            'name' => 'New Category',
            'description' => 'Category description',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'name',
                ],
            ]);

        $this->assertDatabaseHas('categories', [
            'name' => 'New Category',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_user_can_create_subcategory()
    {
        $this->actingAsAdmin();

        $parent = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->postJson('/api/categories', [
            'name' => 'Sub Category',
            'parent_id' => $parent->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.parent_id', $parent->id);

        $this->assertDatabaseHas('categories', [
            'name' => 'Sub Category',
            'tenant_id' => $this->tenant->id,
            'parent_id' => $parent->id,
        ]);
    }

    public function test_user_can_view_single_category()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson("/api/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'products',
                ],
            ]);
    }

    public function test_user_with_permission_can_update_category()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->putJson("/api/categories/{$category->id}", [
            'name' => 'Updated Category',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Category updated successfully',
            ]);

        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Updated Category',
        ]);
    }

    public function test_user_cannot_set_category_as_its_own_parent()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->putJson("/api/categories/{$category->id}", [
            'name' => $category->name,
            'parent_id' => $category->id,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['parent_id']);
    }

    public function test_user_with_permission_can_delete_category()
    {
        $this->actingAsAdmin();

        $category = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Category deleted successfully',
            ]);

        $this->assertDatabaseMissing('categories', [
            'id' => $category->id,
        ]);
    }

    public function test_category_creation_requires_valid_data()
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/categories', [
            'name' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_cannot_delete_category_with_subcategories()
    {
        $this->actingAsAdmin();

        $parent = Category::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        Category::factory()->create([
            'tenant_id' => $this->tenant->id,
            'parent_id' => $parent->id,
        ]);

        $response = $this->deleteJson("/api/categories/{$parent->id}");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Cannot delete category with existing subcategories',
            ]);
    }
}
