<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\ExpenseCategory;
use App\Models\Expense;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RealisticDataSeeder extends Seeder
{
    /**
     * إنشاء بيانات واقعية للمتجر
     */
    public function run(): void
    {
        // الحصول على Tenant الأول
        $tenant = Tenant::first();
        if (!$tenant) {
            $tenant = Tenant::create([
                'name' => 'متجر البقالة الحديث',
                'domain' => 'modern-grocery.local',
            ]);
        }

        // تعيين tenant_id في config
        config(['tenant_id' => $tenant->id]);

        // إنشاء الأدوار والصلاحيات (إذا لم تكن موجودة)
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'sanctum']);
        $cashierRole = Role::firstOrCreate(['name' => 'cashier', 'guard_name' => 'sanctum']);

        // إنشاء المستخدمين
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'أحمد محمد',
                'email' => 'admin@example.com',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
            ]
        );
        $admin->assignRole($adminRole);

        $cashier = User::firstOrCreate(
            ['email' => 'cashier@example.com'],
            [
                'name' => 'سارة علي',
                'email' => 'cashier@example.com',
                'password' => Hash::make('password'),
                'tenant_id' => $tenant->id,
            ]
        );
        $cashier->assignRole($cashierRole);

        // إنشاء الأقسام
        $categories = [
            [
                'name' => 'المشروبات',
                'description' => 'مشروبات غازية وعصائر ومياه',
            ],
            [
                'name' => 'المواد الغذائية',
                'description' => 'أرز وسكر وزيت ومعكرونة',
            ],
            [
                'name' => 'منتجات الألبان',
                'description' => 'حليب وجبن ولبن وزبادي',
            ],
            [
                'name' => 'الخضروات والفواكه',
                'description' => 'خضروات وفواكه طازجة',
            ],
            [
                'name' => 'المواد التنظيفية',
                'description' => 'منظفات وصابون ومطهرات',
            ],
        ];

        $categoryIds = [];
        foreach ($categories as $cat) {
            $category = Category::firstOrCreate(
                ['name' => $cat['name'], 'tenant_id' => $tenant->id],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'tenant_id' => $tenant->id,
                ]
            );
            $categoryIds[$cat['name']] = $category->id;
        }

        // شجرة أقسام 3 مستويات للاختبار
        $snacksCategory = Category::updateOrCreate(
            ['name' => 'السناكس', 'tenant_id' => $tenant->id],
            [
                'description' => 'سناكس خفيفة',
                'tenant_id' => $tenant->id,
                'parent_id' => $categoryIds['المواد الغذائية'],
            ]
        );

        $chipsCategory = Category::updateOrCreate(
            ['name' => 'الشيبس', 'tenant_id' => $tenant->id],
            [
                'description' => 'شيبس بنكهات مختلفة',
                'tenant_id' => $tenant->id,
                'parent_id' => $snacksCategory->id,
            ]
        );

        $biscuitsCategory = Category::updateOrCreate(
            ['name' => 'البسكويت', 'tenant_id' => $tenant->id],
            [
                'description' => 'بسكويت بأنواع متعددة',
                'tenant_id' => $tenant->id,
                'parent_id' => $snacksCategory->id,
            ]
        );

        $coldDrinksCategory = Category::updateOrCreate(
            ['name' => 'المشروبات الباردة', 'tenant_id' => $tenant->id],
            [
                'description' => 'مشروبات باردة متنوعة',
                'tenant_id' => $tenant->id,
                'parent_id' => $categoryIds['المشروبات'],
            ]
        );

        $energyDrinksCategory = Category::updateOrCreate(
            ['name' => 'مشروبات الطاقة', 'tenant_id' => $tenant->id],
            [
                'description' => 'مشروبات الطاقة',
                'tenant_id' => $tenant->id,
                'parent_id' => $coldDrinksCategory->id,
            ]
        );

        $categoryIds['الشيبس'] = $chipsCategory->id;
        $categoryIds['البسكويت'] = $biscuitsCategory->id;
        $categoryIds['مشروبات الطاقة'] = $energyDrinksCategory->id;

        // إنشاء المنتجات
        $products = [
            // المشروبات
            [
                'name' => 'كوكاكولا 330 مل',
                'category_id' => $categoryIds['المشروبات'],
                'sale_price' => 3.50,
                'purchase_price' => 2.50,
                'quantity' => 50,
                'min_stock_alert' => 10,
                'expiry_date' => '2026-12-31',
                'barcode' => '6224007710101',
            ],
            [
                'name' => 'بيبسي 330 مل',
                'category_id' => $categoryIds['المشروبات'],
                'sale_price' => 3.50,
                'purchase_price' => 2.50,
                'quantity' => 45,
                'min_stock_alert' => 10,
                'expiry_date' => '2026-12-31',
                'barcode' => '6224007710102',
            ],
            [
                'name' => 'ماء معدني 1.5 لتر',
                'category_id' => $categoryIds['المشروبات'],
                'sale_price' => 2.00,
                'purchase_price' => 1.20,
                'quantity' => 100,
                'min_stock_alert' => 20,
                'expiry_date' => '2027-12-31',
                'barcode' => '6224007710110',
            ],
            // المواد الغذائية
            [
                'name' => 'أرز بسمتي 5 كيلو',
                'category_id' => $categoryIds['المواد الغذائية'],
                'sale_price' => 45.00,
                'purchase_price' => 35.00,
                'quantity' => 30,
                'min_stock_alert' => 5,
                'expiry_date' => '2027-06-30',
                'barcode' => '6224007710103',
            ],
            [
                'name' => 'سكر أبيض 2 كيلو',
                'category_id' => $categoryIds['المواد الغذائية'],
                'sale_price' => 12.00,
                'purchase_price' => 9.00,
                'quantity' => 40,
                'min_stock_alert' => 10,
                'expiry_date' => '2027-12-31',
                'barcode' => '6224007710104',
            ],
            [
                'name' => 'زيت دوار الشمس 5 لتر',
                'category_id' => $categoryIds['المواد الغذائية'],
                'sale_price' => 55.00,
                'purchase_price' => 42.00,
                'quantity' => 25,
                'min_stock_alert' => 5,
                'expiry_date' => '2026-08-15', // قريب من الانتهاء
                'barcode' => '6224007710105',
            ],
            [
                'name' => 'معكرونة 500 جرام',
                'category_id' => $categoryIds['المواد الغذائية'],
                'sale_price' => 4.50,
                'purchase_price' => 3.00,
                'quantity' => 8, // منخفض المخزون
                'min_stock_alert' => 10,
                'expiry_date' => '2027-12-31',
                'barcode' => '6224007710108',
            ],
            // منتجات الألبان
            [
                'name' => 'حليب طازج 1 لتر',
                'category_id' => $categoryIds['منتجات الألبان'],
                'sale_price' => 8.50,
                'purchase_price' => 6.50,
                'quantity' => 60,
                'min_stock_alert' => 15,
                'expiry_date' => '2026-01-20', // قريب من الانتهاء
                'barcode' => '6224007710106',
            ],
            [
                'name' => 'جبنة بيضاء 500 جرام',
                'category_id' => $categoryIds['منتجات الألبان'],
                'sale_price' => 15.00,
                'purchase_price' => 11.00,
                'quantity' => 35,
                'min_stock_alert' => 10,
                'expiry_date' => '2026-01-25',
                'barcode' => '6224007710107',
            ],
            // المواد التنظيفية
            [
                'name' => 'صابون سائل 1 لتر',
                'category_id' => $categoryIds['المواد التنظيفية'],
                'sale_price' => 18.00,
                'purchase_price' => 13.00,
                'quantity' => 20,
                'min_stock_alert' => 5,
                'expiry_date' => '2028-12-31',
                'barcode' => '6224007710109',
            ],
            // بيانات أقسام المستوى الثالث
            [
                'name' => 'شيبس ملح البحر 40 جرام',
                'category_id' => $categoryIds['الشيبس'],
                'sale_price' => 6.00,
                'purchase_price' => 4.00,
                'quantity' => 70,
                'min_stock_alert' => 15,
                'expiry_date' => '2027-08-30',
                'barcode' => '6224007710201',
            ],
            [
                'name' => 'بسكويت بالشوكولاتة 12 قطعة',
                'category_id' => $categoryIds['البسكويت'],
                'sale_price' => 10.00,
                'purchase_price' => 7.25,
                'quantity' => 55,
                'min_stock_alert' => 10,
                'expiry_date' => '2027-10-12',
                'barcode' => '6224007710202',
            ],
            [
                'name' => 'مشروب طاقة 250 مل',
                'category_id' => $categoryIds['مشروبات الطاقة'],
                'sale_price' => 12.00,
                'purchase_price' => 8.75,
                'quantity' => 40,
                'min_stock_alert' => 8,
                'expiry_date' => '2027-04-20',
                'barcode' => '6224007710203',
            ],
        ];

        foreach ($products as $prod) {
            Product::firstOrCreate(
                ['barcode' => $prod['barcode'], 'tenant_id' => $tenant->id],
                array_merge($prod, ['tenant_id' => $tenant->id])
            );
        }

        // إنشاء الموردين
        $suppliers = [
            [
                'name' => 'شركة المشروبات المتحدة',
                'phone' => '0501234567',
                'email' => 'info@beverages.com',
                'address' => 'الرياض، حي العليا',
                'balance' => 0,
            ],
            [
                'name' => 'مصنع الألبان الحديث',
                'phone' => '0507654321',
                'email' => 'sales@dairy.com',
                'address' => 'الرياض، حي النرجس',
                'balance' => 0,
            ],
        ];

        foreach ($suppliers as $sup) {
            Supplier::firstOrCreate(
                ['name' => $sup['name'], 'tenant_id' => $tenant->id],
                array_merge($sup, ['tenant_id' => $tenant->id])
            );
        }

        // إنشاء أقسام المصروفات
        $expenseCategories = [
            ['name' => 'إيجار', 'description' => 'إيجار المحل'],
            ['name' => 'رواتب', 'description' => 'رواتب الموظفين'],
            ['name' => 'مرافق', 'description' => 'كهرباء وماء'],
            ['name' => 'صيانة', 'description' => 'صيانة المعدات'],
        ];

        foreach ($expenseCategories as $cat) {
            ExpenseCategory::firstOrCreate(
                ['name' => $cat['name'], 'tenant_id' => $tenant->id],
                array_merge($cat, ['tenant_id' => $tenant->id])
            );
        }

        // إنشاء الإعدادات الافتراضية
        \App\Models\Setting::firstOrCreate(
            ['key' => 'return_period_days', 'tenant_id' => $tenant->id],
            ['value' => '14']
        );

        // إنشاء العملاء الافتراضيين
        $defaultCustomers = [
            [
                'name' => 'العميل الافتراضي - كاش',
                'phone' => '0500000000',
                'balance' => 0.00,
                'is_temporary' => false,
            ],
            [
                'name' => 'العميل الافتراضي - شبكة',
                'phone' => '0500000001',
                'balance' => 0.00,
                'is_temporary' => false,
            ],
            [
                'name' => 'العميل الافتراضي - تحويل',
                'phone' => '0500000002',
                'balance' => 0.00,
                'is_temporary' => false,
            ],
            [
                'name' => 'العميل الافتراضي - دفع مختلط',
                'phone' => '0500050000',
                'balance' => 0.00,
                'is_temporary' => false,
            ],
        ];

        foreach ($defaultCustomers as $cust) {
            \App\Models\Customer::firstOrCreate(
                ['phone' => $cust['phone'], 'tenant_id' => $tenant->id],
                array_merge($cust, ['tenant_id' => $tenant->id])
            );
        }

        $this->command->info('✅ تم إنشاء البيانات الواقعية بنجاح!');
        $this->command->info('📧 المدير: admin@example.com / password');
        $this->command->info('📧 الكاشير: cashier@example.com / password');
    }
}
