<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $tenantId = 1;

        // Clear existing categories and reset auto-increment
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('categories')->truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ─────────────────────────────────────────
        // Level 1 — الأقسام الرئيسية
        // ─────────────────────────────────────────
        $mainCategories = [
            ['id' => 1, 'name' => 'المواد الغذائية',      'description' => 'كل ما يتعلق بالأكل والشرب'],
            ['id' => 2, 'name' => 'المنظفات والمنزل',     'description' => 'أدوات التنظيف والعناية المنزلية'],
            ['id' => 3, 'name' => 'العناية الشخصية',      'description' => 'الشامبو، الصابون، ومنتجات التجميل'],
        ];

        foreach ($mainCategories as $cat) {
            DB::table('categories')->insert([
                'id'          => $cat['id'],
                'tenant_id'   => $tenantId,
                'name'        => $cat['name'],
                'description' => $cat['description'],
                'parent_id'   => null,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        // ─────────────────────────────────────────
        // Level 2 — الأقسام الفرعية
        // ─────────────────────────────────────────
        $subCategories = [
            // تحت المواد الغذائية (id=1)
            ['id' => 4, 'parent_id' => 1, 'name' => 'الألبان والأجبان'],
            ['id' => 5, 'parent_id' => 1, 'name' => 'المعلبات والجاف'],
            ['id' => 6, 'parent_id' => 1, 'name' => 'المشروبات'],
            // تحت المنظفات (id=2)
            ['id' => 7, 'parent_id' => 2, 'name' => 'غسيل الملابس'],
            ['id' => 8, 'parent_id' => 2, 'name' => 'مطهرات الأسطح'],
        ];

        foreach ($subCategories as $sub) {
            DB::table('categories')->insert([
                'id'          => $sub['id'],
                'tenant_id'   => $tenantId,
                'name'        => $sub['name'],
                'description' => null,
                'parent_id'   => $sub['parent_id'],
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        // ─────────────────────────────────────────
        // Level 3 — مستويات التخصص (Leaf)
        // ─────────────────────────────────────────
        $leafCategories = [
            // تحت الألبان (id=4)
            ['parent_id' => 4, 'name' => 'أجبان مغلفة'],
            ['parent_id' => 4, 'name' => 'حليب طويل الأمد'],
            // تحت المعلبات (id=5)
            ['parent_id' => 5, 'name' => 'زيوت وسمن'],
            ['parent_id' => 5, 'name' => 'بقوليات معلبة'],
            // تحت المشروبات (id=6)
            ['parent_id' => 6, 'name' => 'مياه معدنية'],
            ['parent_id' => 6, 'name' => 'عصائر طبيعية'],
            // تحت غسيل الملابس (id=7)
            ['parent_id' => 7, 'name' => 'مساحيق أوتوماتيك'],
            ['parent_id' => 7, 'name' => 'منعمات أقمشة'],
        ];

        foreach ($leafCategories as $leaf) {
            DB::table('categories')->insert([
                'tenant_id'  => $tenantId,
                'name'       => $leaf['name'],
                'parent_id'  => $leaf['parent_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $this->command->info('Categories seeded successfully (3 levels).');
    }
}
