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
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
            ]
        );
        $admin->assignRole('admin');

        // إنشاء كاشير
        $cashier = User::firstOrCreate(
            ['email' => 'cashier@example.com'],
            [
                'name' => 'كاشير',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
            ]
        );
        $cashier->assignRole('cashier');
    }
}
