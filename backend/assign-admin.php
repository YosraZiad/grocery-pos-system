<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;

// الحصول على email من command line argument أو استخدام admin@example.com كافتراضي
$email = $argv[1] ?? 'admin@example.com';

echo "Looking for user: {$email}\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "Error: User with email {$email} not found!\n";
    exit(1);
}

echo "Found user: {$user->name} ({$user->email})\n";

// التأكد من وجود دور admin
$adminRole = Role::where('name', 'admin')
    ->where('guard_name', 'sanctum')
    ->first();

if (!$adminRole) {
    echo "Error: Admin role not found! Please run: php artisan db:seed --class=RolePermissionSeeder\n";
    exit(1);
}

// عرض الأدوار الحالية
$currentRoles = $user->roles->pluck('name')->toArray();
echo "Current roles: " . (empty($currentRoles) ? 'None' : implode(', ', $currentRoles)) . "\n";

// تعيين دور admin
$user->assignRole($adminRole);

echo "✓ Admin role assigned successfully!\n";

// عرض الصلاحيات
$permissions = $user->getAllPermissions();
echo "User now has " . $permissions->count() . " permissions\n";

echo "\nDone! You can now login with {$email} and access the roles page.\n";
