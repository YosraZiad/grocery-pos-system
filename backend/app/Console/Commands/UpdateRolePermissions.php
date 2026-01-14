<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UpdateRolePermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'roles:update-permissions';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update role permissions - Add missing permissions to admin role';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Updating role permissions...');

        // إنشاء الصلاحيات المفقودة
        $permissions = [
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'sanctum'
            ]);
            $this->info("✓ Permission '{$permission}' created/verified");
        }

        // تحديث صلاحيات المدير
        $adminRole = Role::where('name', 'admin')
            ->where('guard_name', 'sanctum')
            ->first();

        if ($adminRole) {
            // إعطاء جميع الصلاحيات للمدير
            $allPermissions = Permission::where('guard_name', 'sanctum')->get();
            $adminRole->syncPermissions($allPermissions);
            
            $this->info("✓ Admin role updated with all permissions (" . $allPermissions->count() . " permissions)");
        } else {
            $this->warn("⚠ Admin role not found!");
        }

        $this->info('Done!');
        return 0;
    }
}
