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
            
            // Purchases
            'view purchases',
            'create purchases',
            'edit purchases',
            'delete purchases',
            
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
            
            // Roles & Permissions
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // إنشاء الأدوار
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $managerRole = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'sanctum']);
        $inventoryManagerRole = Role::firstOrCreate(['name' => 'inventory_manager', 'guard_name' => 'sanctum']);
        $cashierRole = Role::firstOrCreate(['name' => 'cashier', 'guard_name' => 'sanctum']);

        // تعيين جميع الصلاحيات للمدير (فقط صلاحيات guard 'sanctum')
        $sanctumPermissions = Permission::where('guard_name', 'sanctum')->get();
        $adminRole->syncPermissions($sanctumPermissions);

        // تعيين صلاحيات المشرف (manager)
        $managerPermissions = [
            'view products', 'create products', 'edit products', 'delete products',
            'view sales', 'create sales', 'edit sales', 'delete sales',
            'view inventory', 'manage inventory',
            'view returns', 'create returns', 'edit returns',
            'view suppliers', 'create suppliers', 'edit suppliers', 'delete suppliers',
            'view purchases', 'create purchases', 'edit purchases', 'delete purchases',
            'view expenses', 'create expenses', 'edit expenses', 'delete expenses',
            'view reports', 'export reports',
            'view settings'
        ];
        $managerPermissionModels = Permission::where('guard_name', 'sanctum')
            ->whereIn('name', $managerPermissions)
            ->get();
        $managerRole->syncPermissions($managerPermissionModels);

        // تعيين صلاحيات أمين المخزن (inventory_manager)
        $inventoryManagerPermissions = [
            'view products', 'create products', 'edit products',
            'view inventory', 'manage inventory',
            'view suppliers', 'create suppliers', 'edit suppliers',
            'view purchases', 'create purchases', 'edit purchases',
            'view returns', 'create returns'
        ];
        $inventoryManagerPermissionModels = Permission::where('guard_name', 'sanctum')
            ->whereIn('name', $inventoryManagerPermissions)
            ->get();
        $inventoryManagerRole->syncPermissions($inventoryManagerPermissionModels);

        // تعيين صلاحيات الكاشير
        $cashierPermissions = [
            'view products',
            'view sales',
            'create sales',
            'view inventory',
            'view returns',
            'create returns',
        ];
        $cashierPermissionModels = Permission::where('guard_name', 'sanctum')
            ->whereIn('name', $cashierPermissions)
            ->get();
        $cashierRole->syncPermissions($cashierPermissionModels);
    }
}
