<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\User;
use App\Models\Tenant;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

abstract class TestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected $tenant;
    protected $adminUser;
    protected $cashierUser;
    protected $adminRole;
    protected $cashierRole;

    protected function setUp(): void
    {
        parent::setUp();
        
        // إنشاء Tenant
        $this->tenant = Tenant::factory()->create();
        config(['tenant_id' => $this->tenant->id]);

        // إنشاء الأدوار والصلاحيات
        $this->createRolesAndPermissions();

        // إنشاء المستخدمين
        $this->createUsers();
    }

    protected function createRolesAndPermissions(): void
    {
        // إنشاء الصلاحيات الأساسية
        $permissions = [
            'view products', 'create products', 'edit products', 'delete products',
            'view sales', 'create sales', 'edit sales', 'delete sales',
            'view inventory', 'manage inventory',
            'view users', 'create users', 'edit users', 'delete users',
            'view roles', 'create roles', 'edit roles', 'delete roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'sanctum'
            ]);
        }

        // إنشاء الأدوار
        $this->adminRole = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'sanctum'
        ]);
        $this->adminRole->givePermissionTo(Permission::where('guard_name', 'sanctum')->get());

        $this->cashierRole = Role::firstOrCreate([
            'name' => 'cashier',
            'guard_name' => 'sanctum'
        ]);
        $this->cashierRole->givePermissionTo([
            'view products', 'view sales', 'create sales', 'view inventory'
        ]);
    }

    protected function createUsers(): void
    {
        $this->adminUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'admin@test.com',
        ]);
        $this->adminUser->assignRole($this->adminRole);

        $this->cashierUser = User::factory()->create([
            'tenant_id' => $this->tenant->id,
            'email' => 'cashier@test.com',
        ]);
        $this->cashierUser->assignRole($this->cashierRole);
    }

    protected function actingAsAdmin(): User
    {
        $this->actingAs($this->adminUser, 'sanctum');
        return $this->adminUser;
    }

    protected function actingAsCashier(): User
    {
        $this->actingAs($this->cashierUser, 'sanctum');
        return $this->cashierUser;
    }

    protected function createOpenShift(User $user): \App\Models\Shift
    {
        return \App\Models\Shift::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $user->id,
            'shift_number' => 'SHFT-' . str_pad(rand(1, 999999), 6, '0', STR_PAD_LEFT),
            'device_number' => 'POS-TEST',
            'opening_float' => 100.00,
            'opened_at' => now(),
            'status' => 'open',
        ]);
    }
}
