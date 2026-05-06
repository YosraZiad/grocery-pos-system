# Frontend Category Tree Test Guide

هذا الدليل لاختبار ميزة:

- عرض التصنيفات متعددة المستويات كشجرة
- عرض منتجات التصنيف عند الضغط عليه

## 1) المتطلبات قبل الاختبار

1. تشغيل Backend API:
   - افتحي Terminal داخل مجلد backend
   - شغلي:

```bash
php artisan serve
```

2. تشغيل Frontend:
   - افتحي Terminal داخل مجلد frontend
   - شغلي:

```bash
npm install
npm run dev
```

3. تأكدي من ضبط عنوان الـ API في frontend `.env` (إن وجد):

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

4. تأكدي أن قاعدة البيانات migrated:

```bash
php artisan migrate
```

## 2) بيانات تجريبية سريعة (اختياري لكن مهم)

من backend terminal افتحي tinker:

```bash
php artisan tinker
```

ثم نفذي المثال التالي (عدلي `tenant_id` حسب بياناتك):

```php
$tenantId = 1;

$parent = \App\Models\Category::create([
  'tenant_id' => $tenantId,
  'name' => 'Beverages',
  'description' => 'Main beverages category',
  'parent_id' => null,
]);

$child = \App\Models\Category::create([
  'tenant_id' => $tenantId,
  'name' => 'Soft Drinks',
  'description' => 'Soda and fizzy drinks',
  'parent_id' => $parent->id,
]);

\App\Models\Product::create([
  'tenant_id' => $tenantId,
  'category_id' => $child->id,
  'name' => 'Cola 330ml',
  'barcode' => '1234567890123',
  'purchase_price' => 5,
  'sale_price' => 7.5,
  'quantity' => 100,
  'min_stock_alert' => 5,
  'min_expiry_alert' => 7,
]);
```

اكتبي `exit` للخروج من tinker.

## 3) خطوات الاختبار من الواجهة

1. سجلي الدخول بحساب يملك صلاحية عرض/إدارة المنتجات.
2. افتحي صفحة `Categories` من القائمة.
3. تأكدي من ظهور قسم الشجرة (Category Tree).
4. اضغطي على تصنيف رئيسي مثل `Beverages`:
   - يجب أن يتم تحديده في الشجرة.
   - يجب أن تظهر لوحة التفاصيل في اليمين.
5. وسعي التصنيف (expand) واضغطي على التصنيف الفرعي `Soft Drinks`.
6. راقبي قائمة المنتجات:
   - يجب أن يظهر `Cola 330ml` ضمن المنتجات.
7. جربي إضافة تصنيف جديد من زر `Add Category`:
   - اختاري `Parent Category` (لإنشاء subcategory).
   - بعد الحفظ، يجب أن يظهر في الشجرة تحت الأب الصحيح.
8. جربي تعديل تصنيف موجود:
   - غيري الاسم أو الوصف أو الـ parent.
   - بعد الحفظ، تأكدي من تحديث مكانه/بياناته في الشجرة.
9. جربي الحذف:
   - تصنيف فيه منتجات: يجب ظهور رسالة منع الحذف.
   - تصنيف فيه subcategories: يجب ظهور رسالة منع الحذف.
   - تصنيف فارغ بدون أبناء: يجب أن يُحذف بنجاح.

## 4) النتائج المتوقعة (Acceptance Checklist)

- [ ] الشجرة تعرض مستويات متعددة بدون كسر.
- [ ] النقر على أي تصنيف يعرض منتجاته المرتبطة فقط.
- [ ] expand/collapse يعمل على جميع المستويات.
- [ ] إنشاء subcategory يظهر مباشرة تحت الأب.
- [ ] لا يمكن حذف تصنيف يحتوي منتجات.
- [ ] لا يمكن حذف تصنيف يحتوي subcategories.
- [ ] لا يحدث أخطاء Console أو فشل API عند الاستخدام الطبيعي.

## 5) اختبار API سريع للتأكيد (اختياري)

افتحي endpoint التالي بعد تسجيل الدخول (أو عبر Postman بنفس التوكن):

`GET /api/categories`

المتوقع:

- حقل `data`: قائمة flat
- حقل `tree`: قائمة nested بها `children` و `products`

## 6) مشاكل شائعة وحلولها

1. الشجرة لا تظهر:
   - تأكدي أن backend يعمل وأن التوكن صحيح.
   - افحصي Network: هل `/api/categories` يرجع 200؟

2. المنتجات لا تظهر عند الضغط:
   - تأكدي أن المنتج مربوط بنفس `category_id` للتصنيف المختار.

3. خطأ صلاحيات (403):
   - الحساب الحالي يحتاج صلاحيات عرض المنتجات على الأقل.

4. البيانات لا تتحدث بعد الإضافة/التعديل:
   - اعملي refresh للصفحة.
   - تأكدي من نجاح response (200/201).

## 7) سيناريو قبول سريع (3 دقائق)

1. افتحي Categories.
2. اختاري أي parent category.
3. افتحي child category.
4. تأكدي من ظهور المنتجات.
5. أضيفي subcategory جديدة تحت parent.
6. تأكدي أنها ظهرت في الشجرة مباشرة.

إذا نجحت الخطوات السابقة، الميزة تعتبر **مقبولة وظيفيًا** من الواجهة.
