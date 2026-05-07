<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use PDO;
use PDOException;

class InstallApplication extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:install
                            {--fresh : Drop all tables and re-run all migrations}
                            {--seed : Seed the database after migrating}
                            {--no-seed : Skip seeding even if seeders are defined}';

    /**
     * The console command description.
     */
    protected $description = 'Create the database (if not exists), run migrations, and seed data automatically';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('');
        $this->info('╔══════════════════════════════════════════╗');
        $this->info('║     Grocery POS — Auto Setup             ║');
        $this->info('╚══════════════════════════════════════════╝');
        $this->info('');

        // Step 1: Create the database if it doesn't exist
        if (! $this->createDatabase()) {
            return self::FAILURE;
        }

        // Step 2: Run migrations
        if (! $this->runMigrations()) {
            return self::FAILURE;
        }

        // Step 3: Seed the database (unless --no-seed flag is passed)
        if (! $this->option('no-seed')) {
            if (! $this->runSeeders()) {
                return self::FAILURE;
            }
        }

        $this->info('');
        $this->info('✅  Setup complete! Your database is ready.');
        $this->info('');

        return self::SUCCESS;
    }

    /**
     * Create the MySQL database if it does not already exist.
     */
    protected function createDatabase(): bool
    {
        $connection = Config::get('database.default');
        $driver     = Config::get("database.connections.{$connection}.driver");

        // Only auto-create for MySQL/MariaDB; SQLite creates its file automatically.
        if ($driver !== 'mysql') {
            $this->warn("Auto database creation is only supported for MySQL. Skipping for driver: {$driver}");
            return true;
        }

        $host     = Config::get("database.connections.{$connection}.host");
        $port     = Config::get("database.connections.{$connection}.port");
        $database = Config::get("database.connections.{$connection}.database");
        $username = Config::get("database.connections.{$connection}.username");
        $password = Config::get("database.connections.{$connection}.password");
        $charset  = Config::get("database.connections.{$connection}.charset", 'utf8mb4');
        $collation = Config::get("database.connections.{$connection}.collation", 'utf8mb4_unicode_ci');

        $this->line("  → Connecting to MySQL at <comment>{$host}:{$port}</comment> as <comment>{$username}</comment>...");

        try {
            $pdo = new PDO(
                "mysql:host={$host};port={$port}",
                $username,
                $password,
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
            );

            // Check if the database already exists
            $stmt = $pdo->query("SHOW DATABASES LIKE '{$database}'");

            if ($stmt->rowCount() > 0) {
                $this->line("  ✔ Database <info>{$database}</info> already exists. Skipping creation.");
            } else {
                $pdo->exec(
                    "CREATE DATABASE `{$database}` CHARACTER SET {$charset} COLLATE {$collation}"
                );
                $this->line("  ✔ Database <info>{$database}</info> created successfully.");
            }

            return true;

        } catch (PDOException $e) {
            $this->error("  ✘ Could not connect to MySQL: " . $e->getMessage());
            $this->error('    Make sure WAMP / MySQL is running and your .env credentials are correct.');
            return false;
        }
    }

    /**
     * Run Laravel migrations.
     */
    protected function runMigrations(): bool
    {
        $this->info('');
        $this->info('  Running migrations...');

        try {
            if ($this->option('fresh')) {
                $this->warn('  ⚠  --fresh flag detected: all tables will be dropped first.');
                $exitCode = $this->call('migrate:fresh', ['--force' => true]);
            } else {
                $exitCode = $this->call('migrate', ['--force' => true]);
            }

            if ($exitCode !== 0) {
                $this->error('  ✘ Migration failed.');
                return false;
            }

            $this->line('  ✔ Migrations completed.');
            return true;

        } catch (\Exception $e) {
            $this->error('  ✘ Migration error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Run database seeders.
     */
    protected function runSeeders(): bool
    {
        $this->info('');
        $this->info('  Seeding database...');

        try {
            $exitCode = $this->call('db:seed', ['--force' => true]);

            if ($exitCode !== 0) {
                $this->error('  ✘ Seeding failed.');
                return false;
            }

            $this->line('  ✔ Database seeded successfully.');
            return true;

        } catch (\Exception $e) {
            $this->error('  ✘ Seeder error: ' . $e->getMessage());
            return false;
        }
    }
}
