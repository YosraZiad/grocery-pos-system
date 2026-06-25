<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // إنشاء tenant تجريبي
        $tenant = Tenant::firstOrCreate(
            ['domain' => 'localhost'],
            ['name' => 'متجر تجريبي']
        );

        // إنشاء مدير
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'مدير النظام',
                'username' => 'admin_main',
                'employee_barcode' => 'EMP-000001',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
            ]
        );
        // تعيين الدور مع guard_name صحيح
        $admin->assignRole(\Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'sanctum'
        ]));

        // إنشاء كاشير
        $cashier = User::firstOrCreate(
            ['email' => 'cashier@example.com'],
            [
                'name' => 'كاشير سارة',
                'username' => 'cashier_main',
                'employee_barcode' => 'EMP-000002',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
            ]
        );
        // تعيين الدور مع guard_name صحيح
        $cashier->assignRole(\Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'cashier',
            'guard_name' => 'sanctum'
        ]));

        // إنشاء مشرف متجر (manager)
        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'مشرف خالد',
                'username' => 'manager_main',
                'employee_barcode' => 'EMP-000003',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
            ]
        );
        $manager->assignRole(\Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'manager',
            'guard_name' => 'sanctum'
        ]));

        // إنشاء أمين مستودع (inventory_manager)
        $inventoryManager = User::firstOrCreate(
            ['email' => 'inventory@example.com'],
            [
                'name' => 'أمين المخزن رائد',
                'username' => 'inventory_main',
                'employee_barcode' => 'EMP-000004',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
            ]
        );
        $inventoryManager->assignRole(\Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'inventory_manager',
            'guard_name' => 'sanctum'
        ]));
    }
}
