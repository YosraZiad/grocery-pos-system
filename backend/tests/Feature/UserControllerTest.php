<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class UserControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_all_users()
    {
        $admin = $this->actingAsAdmin();

        $response = $this->getJson('/api/users');

        $response->assertStatus(200);

        $data = $response->json('data');
        $this->assertIsArray($data);

        $returnedIds = array_column($data, 'id');
        $this->assertNotContains($admin->id, $returnedIds);

        $response->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'roles',
                    ],
                ],
            ]);
    }

    public function test_admin_can_search_users()
    {
        $this->actingAsAdmin();

        User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson('/api/users?search=John');

        $response->assertStatus(200)
            ->assertJsonFragment([
                'name' => 'John Doe',
            ]);
    }

    public function test_admin_can_view_single_user()
    {
        $this->actingAsAdmin();

        $user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->getJson("/api/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'email',
                    'roles',
                    'permissions',
                ],
            ]);
    }

    public function test_admin_can_create_user()
    {
        $this->actingAsAdmin();

        $role = Role::where('guard_name', 'sanctum')->first();

        $response = $this->postJson('/api/users', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'role' => $role->name,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'name',
                    'email',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'tenant_id' => $this->tenant->id,
        ]);
    }

    public function test_admin_can_update_user()
    {
        $this->actingAsAdmin();

        $user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->putJson("/api/users/{$user->id}", [
            'name' => 'Updated Name',
            'email' => $user->email,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User updated successfully',
            ]);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_admin_can_delete_user()
    {
        $this->actingAsAdmin();

        $user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        $response = $this->deleteJson("/api/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'User deleted successfully',
            ]);

        $this->assertDatabaseMissing('users', [
            'id' => $user->id,
        ]);
    }

    public function test_cashier_cannot_view_users()
    {
        $this->actingAsCashier();

        $response = $this->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_user_creation_requires_valid_data()
    {
        $this->actingAsAdmin();

        $response = $this->postJson('/api/users', [
            'name' => '',
            'email' => 'invalid-email',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
    }
}
