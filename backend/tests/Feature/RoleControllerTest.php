<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RoleControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_all_roles()
    {
        $this->actingAsAdmin();

        $response = $this->getJson('/api/roles');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'guard_name',
                        'permissions',
                        'users_count',
                    ],
                ],
                'count',
            ]);
    }

    public function test_cashier_cannot_view_roles()
    {
        $this->actingAsCashier();

        $response = $this->getJson('/api/roles');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_new_role()
    {
        $this->actingAsAdmin();

        $permission = Permission::where('guard_name', 'sanctum')->first();

        $response = $this->postJson('/api/roles', [
            'name' => 'manager',
            'permissions' => [$permission->id],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'name',
                    'permissions',
                ],
            ]);

        $this->assertDatabaseHas('roles', [
            'name' => 'manager',
            'guard_name' => 'sanctum',
        ]);
    }

    public function test_admin_can_update_role()
    {
        $this->actingAsAdmin();

        $role = Role::where('guard_name', 'sanctum')->first();
        $permission = Permission::where('guard_name', 'sanctum')->first();

        $response = $this->putJson("/api/roles/{$role->id}", [
            'name' => 'updated_role',
            'permissions' => [$permission->id],
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Role updated successfully',
            ]);

        $this->assertDatabaseHas('roles', [
            'id' => $role->id,
            'name' => 'updated_role',
        ]);
    }

    public function test_admin_can_view_single_role()
    {
        $this->actingAsAdmin();

        $role = Role::where('guard_name', 'sanctum')->first();

        $response = $this->getJson("/api/roles/{$role->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'guard_name',
                    'permissions',
                ],
            ]);
    }

    public function test_admin_can_delete_role()
    {
        $this->actingAsAdmin();

        // إنشاء role بدون ربطه بأي مستخدم لتجنب مشاكل Spatie Permission
        $role = Role::create([
            'name' => 'test_role_' . time(),
            'guard_name' => 'sanctum',
        ]);

        // التأكد من عدم وجود مستخدمين مرتبطين بهذا الدور
        \DB::table('model_has_roles')
            ->where('role_id', $role->id)
            ->delete();

        $response = $this->deleteJson("/api/roles/{$role->id}");

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Role deleted successfully',
            ]);

        $this->assertDatabaseMissing('roles', [
            'id' => $role->id,
        ]);
    }

    public function test_admin_cannot_delete_system_roles()
    {
        $this->actingAsAdmin();

        $adminRole = Role::where('name', 'admin')
            ->where('guard_name', 'sanctum')
            ->first();

        $response = $this->deleteJson("/api/roles/{$adminRole->id}");

        $response->assertStatus(422)
            ->assertJson([
                'message' => 'Cannot delete system roles',
            ]);
    }

    public function test_admin_can_view_permissions()
    {
        $this->actingAsAdmin();

        $response = $this->getJson('/api/permissions');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'count',
            ]);
    }

    public function test_role_creation_requires_unique_name()
    {
        $this->actingAsAdmin();

        $existingRole = Role::where('guard_name', 'sanctum')->first();

        $response = $this->postJson('/api/roles', [
            'name' => $existingRole->name,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }
}
