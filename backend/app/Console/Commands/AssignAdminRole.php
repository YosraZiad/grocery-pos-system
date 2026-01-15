<?php

namespace App\Console\Commands;

use App\Models\User;
use Spatie\Permission\Models\Role;
use Illuminate\Console\Command;

class AssignAdminRole extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:assign-admin {email?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Assign admin role to a user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        if (!$email) {
            $email = $this->ask('Enter user email');
        }

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email {$email} not found!");
            return 1;
        }

        // التأكد من وجود دور admin
        $adminRole = Role::where('name', 'admin')
            ->where('guard_name', 'sanctum')
            ->first();

        if (!$adminRole) {
            $this->error("Admin role not found! Please run: php artisan db:seed --class=RolePermissionSeeder");
            return 1;
        }

        // تعيين دور admin
        $user->assignRole($adminRole);

        $this->info("Admin role assigned successfully to {$user->name} ({$user->email})");
        
        // عرض الصلاحيات
        $permissions = $user->getAllPermissions();
        $this->info("User now has " . $permissions->count() . " permissions:");
        foreach ($permissions as $permission) {
            $this->line("  - {$permission->name}");
        }

        return 0;
    }
}
