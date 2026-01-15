<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

$email = $argv[1] ?? 'admin@example.com';

echo "Checking permissions for: {$email}\n\n";

$user = User::where('email', $email)->first();

if (!$user) {
    echo "Error: User not found!\n";
    exit(1);
}

echo "User: {$user->name} ({$user->email})\n";
echo "Guard name: {$user->guardName()}\n\n";

// التحقق من الأدوار
$roles = $user->roles;
echo "Roles (" . $roles->count() . "):\n";
foreach ($roles as $role) {
    echo "  - {$role->name} (guard: {$role->guard_name})\n";
}

echo "\n";

// التحقق من الصلاحيات
$permissions = $user->getAllPermissions();
echo "Total permissions: " . $permissions->count() . "\n";

// التحقق من صلاحية محددة
$testPermission = 'view roles';
$hasPermission = $user->hasPermissionTo($testPermission, 'sanctum');
echo "\nHas '{$testPermission}' permission: " . ($hasPermission ? 'YES ✓' : 'NO ✗') . "\n";

// التحقق من الدور
$hasRole = $user->hasRole('admin', 'sanctum');
echo "Has 'admin' role: " . ($hasRole ? 'YES ✓' : 'NO ✗') . "\n";

// التحقق من وجود الصلاحية في قاعدة البيانات
$permissionExists = Permission::where('name', $testPermission)
    ->where('guard_name', 'sanctum')
    ->exists();
echo "\nPermission '{$testPermission}' exists in DB: " . ($permissionExists ? 'YES ✓' : 'NO ✗') . "\n";

// التحقق من أن دور admin لديه الصلاحية
$adminRole = Role::where('name', 'admin')->where('guard_name', 'sanctum')->first();
if ($adminRole) {
    $roleHasPermission = $adminRole->hasPermissionTo($testPermission, 'sanctum');
    echo "Admin role has '{$testPermission}': " . ($roleHasPermission ? 'YES ✓' : 'NO ✗') . "\n";
}

echo "\n";
