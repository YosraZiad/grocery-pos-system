<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // إنشاء الصلاحيات
        $permissions = [
            // Products
            'view products',
            'create products',
            'edit products',
            'delete products',
            
            // Sales
            'view sales',
            'create sales',
            'edit sales',
            'delete sales',
            
            // Inventory
            'view inventory',
            'manage inventory',
            
            // Returns
            'view returns',
            'create returns',
            'edit returns',
            
            // Suppliers
            'view suppliers',
            'create suppliers',
            'edit suppliers',
            'delete suppliers',
            
            // Expenses
            'view expenses',
            'create expenses',
            'edit expenses',
            'delete expenses',
            
            // Reports
            'view reports',
            'export reports',
            
            // Settings
            'view settings',
            'edit settings',
            
            // Users
            'view users',
            'create users',
            'edit users',
            'delete users',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // إنشاء الأدوار
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $cashierRole = Role::firstOrCreate(['name' => 'cashier', 'guard_name' => 'sanctum']);

        // تعيين جميع الصلاحيات للمدير
        $adminRole->givePermissionTo(Permission::all());

        // تعيين صلاحيات محدودة للكاشير
        $cashierPermissions = [
            'view products',
            'view sales',
            'create sales',
            'view inventory',
            'view returns',
            'create returns',
        ];

        $cashierRole->givePermissionTo($cashierPermissions);
    }
}
