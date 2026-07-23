<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // الحصول على أو إنشاء tenant تجريبي
        $tenant = Tenant::firstOrCreate(
            ['domain' => 'localhost'],
            ['name' => 'متجر تجريبي']
        );

        // قائمة المستخدمين والأدوار المطابقة
        $testUsers = [
            [
                'email' => 'admin@example.com',
                'name' => 'مدير النظام الرئيسي',
                'username' => 'admin_main',
                'barcode' => 'EMP-000001',
                'role' => 'admin',
            ],
            [
                'email' => 'cashier@example.com',
                'name' => 'كاشير سارة',
                'username' => 'cashier_main',
                'barcode' => 'EMP-000002',
                'role' => 'cashier',
            ],
            [
                'email' => 'manager@example.com',
                'name' => 'مشرف عام خالد',
                'username' => 'manager_main',
                'barcode' => 'EMP-000003',
                'role' => 'manager',
            ],
            [
                'email' => 'branchmanager@example.com',
                'name' => 'مدير الفرع فهد',
                'username' => 'branch_manager',
                'barcode' => 'EMP-000004',
                'role' => 'branch_manager',
            ],
            [
                'email' => 'storemanager@example.com',
                'name' => 'مدير الصالة طارق',
                'username' => 'store_manager',
                'barcode' => 'EMP-000005',
                'role' => 'store_manager',
            ],
            [
                'email' => 'shift_supervisor@example.com',
                'name' => 'مشرف الوردية ياسر',
                'username' => 'shift_supervisor',
                'barcode' => 'EMP-000006',
                'role' => 'shift_supervisor',
            ],
            [
                'email' => 'return_officer@example.com',
                'name' => 'موظف المرتجعات هشام',
                'username' => 'return_officer',
                'barcode' => 'EMP-000007',
                'role' => 'return_officer',
            ],
            [
                'email' => 'warehouse_manager@example.com',
                'name' => 'أمين المستودع رائد',
                'username' => 'warehouse_manager',
                'barcode' => 'EMP-000008',
                'role' => 'warehouse_manager',
            ],
            [
                'email' => 'inventory_auditor@example.com',
                'name' => 'مدقق المخزون عادل',
                'username' => 'inventory_auditor',
                'barcode' => 'EMP-000009',
                'role' => 'inventory_auditor',
            ],
            [
                'email' => 'purchasing_officer@example.com',
                'name' => 'موظف المشتريات ماجد',
                'username' => 'purchasing_officer',
                'barcode' => 'EMP-000010',
                'role' => 'purchasing_officer',
            ],
            [
                'email' => 'customer_service@example.com',
                'name' => 'خدمة العملاء منى',
                'username' => 'customer_service',
                'barcode' => 'EMP-000011',
                'role' => 'customer_service',
            ],
            [
                'email' => 'guest@example.com',
                'name' => 'حساب زائر مؤقت',
                'username' => 'guest_user',
                'barcode' => 'EMP-000012',
                'role' => 'guest',
            ],
        ];

        foreach ($testUsers as $userData) {
            $user = User::firstOrCreate(
                ['email' => $userData['email']],
                [
                    'name' => $userData['name'],
                    'username' => $userData['username'],
                    'employee_barcode' => $userData['barcode'],
                    'password' => Hash::make('password'),
                    'pin' => Hash::make('1234'),
                    'tenant_id' => $tenant->id,
                ]
            );

            // الحصول على الدور من قاعدة البيانات وتعيينه للموظف
            $role = Role::where('name', $userData['role'])->where('guard_name', 'sanctum')->first();
            if ($role) {
                $user->syncRoles([$role]);
            }
        }
    }
}
