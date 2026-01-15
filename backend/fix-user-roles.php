<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;

$email = $argv[1] ?? 'admin@example.com';

echo "Fixing roles for: {$email}\n\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "Error: User not found!\n";
    exit(1);
}

// حذف جميع الأدوار القديمة
$user->roles()->detach();

// إضافة دور admin من guard 'sanctum' فقط
$adminRole = Role::where('name', 'admin')
    ->where('guard_name', 'sanctum')
    ->first();

if ($adminRole) {
    $user->assignRole($adminRole);
    echo "✓ Assigned admin role (sanctum guard)\n";
} else {
    echo "✗ Admin role not found!\n";
    exit(1);
}

// عرض الأدوار الحالية
$roles = $user->fresh()->roles;
echo "\nCurrent roles:\n";
foreach ($roles as $role) {
    echo "  - {$role->name} (guard: {$role->guard_name})\n";
}

// التحقق من الصلاحية
$hasPermission = $user->hasPermissionTo('view roles', 'sanctum');
echo "\nHas 'view roles' permission: " . ($hasPermission ? 'YES ✓' : 'NO ✗') . "\n";

echo "\nDone! Please logout and login again to refresh your token.\n";
