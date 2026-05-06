<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class CreateDatabase extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'db:create';

    /**
     * The console command description.
     */
    protected $description = 'Create the MySQL database if it does not already exist';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $database = config('database.connections.mysql.database');

        if (empty($database)) {
            $this->error('No database name found in .env (DB_DATABASE).');
            return;
        }

        // ── الخطوة الأهم ─────────────────────────────────────────────────────
        // نتصل بـ MySQL بدون تحديد اسم قاعدة البيانات حتى لا تحدث أخطاء
        // ─────────────────────────────────────────────────────────────────────
        Config::set('database.connections.mysql.database', null);
        DB::purge('mysql');
        DB::reconnect('mysql');

        // إنشاء قاعدة البيانات إن لم تكن موجودة
        DB::statement(
            "CREATE DATABASE IF NOT EXISTS `{$database}` 
             CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        );

        // نُعيد الإعداد الأصلي
        Config::set('database.connections.mysql.database', $database);
        DB::purge('mysql');
        DB::reconnect('mysql');

        $this->info("✅ Database [{$database}] created successfully (or already exists).");
    }
}
