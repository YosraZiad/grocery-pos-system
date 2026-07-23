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
        // 1. القائمة القديمة للصلاحيات لتجنب كسر أي اختبارات
        $legacyPermissions = [
            'view products', 'create products', 'edit products', 'delete products',
            'view sales', 'create sales', 'edit sales', 'delete sales',
            'view inventory', 'manage inventory',
            'view returns', 'create returns', 'edit returns',
            'view suppliers', 'create suppliers', 'edit suppliers', 'delete suppliers',
            'view purchases', 'create purchases', 'edit purchases', 'delete purchases',
            'view expenses', 'create expenses', 'edit expenses', 'delete expenses',
            'view reports', 'export reports',
            'view settings', 'edit settings',
            'view users', 'create users', 'edit users', 'delete users',
            'view roles', 'create roles', 'edit roles', 'delete roles',
        ];

        // 2. القائمة الجديدة الاحترافية بالنقطة للتحكم التفصيلي بالوصول
        $enterprisePermissions = [
            // موديول الأساسيات والأمن
            'auth.login', 'auth.lock', 'auth.bypass_shift',
            'branches.view', 'branches.create', 'branches.update',
            'users.view', 'users.create', 'users.update', 'users.reset_pin',
            'roles.view', 'roles.create', 'roles.update', 'roles.assign',

            // موديول الكتالوج والمنتجات
            'products.view', 'products.create', 'products.update', 'products.change_price',
            'products.barcodes.manage', 'products.categories.manage', 'products.brands.manage',
            'products.units.manage', 'products.taxes.manage',
            'pricelists.view', 'pricelists.manage',

            // موديول المبيعات ونقاط البيع
            'sales.pos.access', 'sales.invoice.create', 'sales.invoice.void',
            'sales.invoice.reprint', 'sales.discount.apply', 'sales.discount.override_limit',
            'sales.payment.hybrid', 'sales.suspend', 'sales.resume',

            // موديول المرتجعات
            'returns.view', 'returns.create', 'returns.approve', 'returns.override_threshold',

            // موديول المشتريات والتوريد
            'purchase.orders.view', 'purchase.orders.create',
            'warehouse.receive', 'warehouse.issue',

            // موديول المخزون والجرد
            'inventory.stock.view', 'inventory.adjust.create', 'inventory.adjust.approve',
            'inventory.count.create', 'inventory.transfer.create', 'inventory.transfer.approve',

            // موديول الورديات
            'shifts.open', 'shifts.close', 'shifts.reconcile', 'shifts.emergency_close',
            'shifts.drawer.transfer', 'shifts.bypass_difference',

            // موديول التقارير والتدقيق
            'reports.sales.view', 'reports.profit.view', 'reports.export',
            'settings.update', 'audit.logs.view',
        ];

        $allPermissions = array_merge($legacyPermissions, $enterprisePermissions);

        foreach ($allPermissions as $permName) {
            Permission::firstOrCreate(['name' => $permName, 'guard_name' => 'sanctum']);
        }

        // 3. إنشاء الأدوار الاحترافية
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'sanctum']); // المشرف العام / مشرف الفرع
        $branchManager = Role::firstOrCreate(['name' => 'branch_manager', 'guard_name' => 'sanctum']);
        $storeManager = Role::firstOrCreate(['name' => 'store_manager', 'guard_name' => 'sanctum']);
        $shiftSupervisor = Role::firstOrCreate(['name' => 'shift_supervisor', 'guard_name' => 'sanctum']);
        $cashier = Role::firstOrCreate(['name' => 'cashier', 'guard_name' => 'sanctum']);
        $returnOfficer = Role::firstOrCreate(['name' => 'return_officer', 'guard_name' => 'sanctum']);
        $warehouseManager = Role::firstOrCreate(['name' => 'warehouse_manager', 'guard_name' => 'sanctum']);
        $inventoryAuditor = Role::firstOrCreate(['name' => 'inventory_auditor', 'guard_name' => 'sanctum']);
        $purchasingOfficer = Role::firstOrCreate(['name' => 'purchasing_officer', 'guard_name' => 'sanctum']);
        $customerService = Role::firstOrCreate(['name' => 'customer_service', 'guard_name' => 'sanctum']);
        $guest = Role::firstOrCreate(['name' => 'guest', 'guard_name' => 'sanctum']);

        // تعيين جميع الصلاحيات للأدمن
        $admin->syncPermissions(Permission::where('guard_name', 'sanctum')->get());

        // تعيين صلاحيات مدير الفرع
        $branchManagerPermissions = array_merge($legacyPermissions, $enterprisePermissions);
        // باستثناء سجل التدقيق الحساس للمدير العام فقط
        $branchManagerPermissions = array_diff($branchManagerPermissions, ['audit.logs.view']);
        $branchManager->syncPermissions(Permission::whereIn('name', $branchManagerPermissions)->where('guard_name', 'sanctum')->get());

        // تعيين صلاحيات مشرف الصالة
        $storeManagerPermissions = [
            'view products', 'create products', 'edit products',
            'view sales', 'create sales', 'edit sales',
            'view inventory', 'view returns', 'create returns', 'edit returns',
            'view suppliers', 'view purchases', 'view expenses', 'view reports', 'export reports',
            'auth.login', 'auth.lock', 'branches.view', 'users.view',
            'products.view', 'products.create', 'products.update',
            'products.categories.manage', 'products.brands.manage', 'products.units.manage',
            'sales.pos.access', 'sales.invoice.create', 'sales.invoice.reprint', 'sales.discount.apply',
            'sales.suspend', 'sales.resume', 'returns.view', 'returns.create', 'returns.approve',
            'inventory.stock.view', 'shifts.open', 'shifts.close', 'shifts.reconcile', 'shifts.emergency_close',
            'shifts.drawer.transfer', 'reports.sales.view'
        ];
        $storeManager->syncPermissions(Permission::whereIn('name', $storeManagerPermissions)->where('guard_name', 'sanctum')->get());

        // تعيين صلاحيات المشرف الكلاسيكي (manager)
        $manager->syncPermissions(Permission::whereIn('name', $storeManagerPermissions)->where('guard_name', 'sanctum')->get());

        // تعيين صلاحيات مشرف الوردية
        $shiftSupervisorPermissions = [
            'view products', 'view sales', 'create sales', 'view inventory', 'view returns', 'create returns',
            'auth.login', 'auth.lock', 'products.view', 'sales.pos.access', 'sales.invoice.create',
            'sales.invoice.reprint', 'sales.discount.apply', 'sales.suspend', 'sales.resume',
            'returns.view', 'returns.create', 'shifts.open', 'shifts.close', 'shifts.reconcile',
            'shifts.drawer.transfer', 'reports.sales.view'
        ];
        $shiftSupervisor->syncPermissions(Permission::whereIn('name', $shiftSupervisorPermissions)->where('guard_name', 'sanctum')->get());

        // تعيين صلاحيات الكاشير
        $cashierPermissions = [
            'view products', 'view sales', 'create sales', 'view inventory',
            'auth.login', 'auth.lock', 'products.view', 'sales.pos.access', 'sales.invoice.create',
            'sales.invoice.reprint', 'sales.suspend', 'sales.resume', 'shifts.open', 'shifts.close'
        ];
        $cashier->syncPermissions(Permission::whereIn('name', $cashierPermissions)->where('guard_name', 'sanctum')->get());

        // تعيين صلاحيات موظف المرتجعات
        $returnOfficerPermissions = [
            'view products', 'view sales', 'view returns', 'create returns', 'edit returns',
            'auth.login', 'auth.lock', 'products.view', 'returns.view', 'returns.create'
        ];
        $returnOfficer->syncPermissions(Permission::whereIn('name', $returnOfficerPermissions)->where('guard_name', 'sanctum')->get());

        // تعيين صلاحيات أمين المخزن
        $warehouseManagerPermissions = [
            'view products', 'create products', 'edit products', 'view inventory', 'manage inventory',
            'view suppliers', 'view purchases', 'create purchases', 'edit purchases', 'view returns', 'create returns',
            'auth.login', 'auth.lock', 'products.view', 'warehouse.receive', 'warehouse.issue',
            'inventory.stock.view', 'inventory.adjust.create', 'inventory.count.create',
            'inventory.transfer.create', 'inventory.transfer.approve'
        ];
        $warehouseManager->syncPermissions(Permission::whereIn('name', $warehouseManagerPermissions)->where('guard_name', 'sanctum')->get());

        // تعيين صلاحيات مدقق المخزن
        $inventoryAuditorPermissions = [
            'view products', 'view inventory', 'manage inventory', 'view reports',
            'auth.login', 'auth.lock', 'products.view', 'inventory.stock.view',
            'inventory.count.create', 'reports.sales.view'
        ];
        $inventoryAuditor->syncPermissions(Permission::whereIn('name', $inventoryAuditorPermissions)->where('guard_name', 'sanctum')->get());
    }
}
