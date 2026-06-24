<?php

namespace Database\Seeders;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class FastLoginTestCasesSeeder extends Seeder
{
    /**
     * Seed users that cover all Fast Login test scenarios.
     */
    public function run(): void
    {
        $tenant = Tenant::firstOrCreate(
            ['domain' => 'localhost'],
            ['name' => 'متجر تجريبي']
        );

        $adminRole = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'sanctum',
        ]);

        $cashierRole = Role::firstOrCreate([
            'name' => 'cashier',
            'guard_name' => 'sanctum',
        ]);

        // Case 1: Active user for username/password success.
        $this->upsertUser(
            ['email' => 'fastlogin.active@example.com'],
            [
                'name' => 'Fast Login Active',
                'username' => 'fast_active',
                'employee_barcode' => 'EMP-100001',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'last_login_at' => null,
            ],
            $cashierRole
        );

        // Case 2: Active user for barcode auto-login success.
        $this->upsertUser(
            ['email' => 'fastlogin.barcode@example.com'],
            [
                'name' => 'Fast Login Barcode',
                'username' => 'fast_barcode',
                'employee_barcode' => 'EMP-100002',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'last_login_at' => null,
            ],
            $cashierRole
        );

        // Case 3: User with 2 failed attempts (next failure should lock).
        $this->upsertUser(
            ['email' => 'fastlogin.twofails@example.com'],
            [
                'name' => 'Fast Login Two Fails',
                'username' => 'fast_twofails',
                'employee_barcode' => 'EMP-100003',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
                'failed_login_attempts' => 2,
                'locked_until' => null,
                'last_login_at' => null,
            ],
            $cashierRole
        );

        // Case 4: Already locked user (should return 423 immediately).
        $this->upsertUser(
            ['email' => 'fastlogin.locked@example.com'],
            [
                'name' => 'Fast Login Locked',
                'username' => 'fast_locked',
                'employee_barcode' => 'EMP-100004',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
                'failed_login_attempts' => 3,
                'locked_until' => now()->addMinutes(15),
                'last_login_at' => null,
            ],
            $cashierRole
        );

        // Case 5: Lock expired user (should be able to login, then reset attempts).
        $this->upsertUser(
            ['email' => 'fastlogin.expiredlock@example.com'],
            [
                'name' => 'Fast Login Expired Lock',
                'username' => 'fast_expired',
                'employee_barcode' => 'EMP-100005',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
                'failed_login_attempts' => 3,
                'locked_until' => now()->subMinutes(5),
                'last_login_at' => null,
            ],
            $cashierRole
        );

        // Case 6: Admin account to validate role payload remains correct.
        $this->upsertUser(
            ['email' => 'fastlogin.admin@example.com'],
            [
                'name' => 'Fast Login Admin',
                'username' => 'fast_admin',
                'employee_barcode' => 'EMP-100006',
                'password' => Hash::make('password'),
                'pin' => Hash::make('1234'),
                'tenant_id' => $tenant->id,
                'failed_login_attempts' => 0,
                'locked_until' => null,
                'last_login_at' => null,
            ],
            $adminRole
        );
    }

    private function upsertUser(array $identity, array $attributes, Role $role): void
    {
        $user = User::updateOrCreate($identity, $attributes);
        $user->syncRoles([$role]);
    }
}
