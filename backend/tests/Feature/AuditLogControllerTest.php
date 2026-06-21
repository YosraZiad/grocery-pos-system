<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

class AuditLogControllerTest extends TestCase
{
    use RefreshDatabase;

    /**
     * اختبار التحقق الناجح من صلاحيات المدير باستخدام البريد الإلكتروني وكلمة المرور
     */
    public function test_cashier_can_verify_admin_credentials_successfully()
    {
        $cashier = $this->actingAsCashier();

        // تحديث كلمة مرور المدير التجريبي لتكون معروفة للاختبار
        $this->adminUser->update([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/verify-admin', [
            'identifier' => 'admin@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'admin' => [
                    'id',
                    'name',
                ]
            ]);
    }

    /**
     * اختبار التحقق من المدير باستخدام الباركود الخاص بالمدير
     */
    public function test_cashier_can_verify_admin_by_barcode_successfully()
    {
        $cashier = $this->actingAsCashier();

        // تعيين باركود للمدير التجريبي
        $this->adminUser->update([
            'employee_barcode' => 'EMP-ADMIN001',
        ]);

        $response = $this->postJson('/api/auth/verify-admin', [
            'identifier' => 'EMP-ADMIN001',
        ]);

        $response->assertStatus(200)
            ->assertJsonFragment([
                'success' => true,
            ])
            ->assertJsonStructure([
                'success',
                'admin' => [
                    'id',
                    'name',
                ]
            ]);
    }

    /**
     * اختبار فشل التحقق عند كتابة كلمة مرور خاطئة للمدير
     */
    public function test_cashier_cannot_verify_admin_with_wrong_password()
    {
        $cashier = $this->actingAsCashier();

        $this->adminUser->update([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/auth/verify-admin', [
            'identifier' => 'admin@test.com',
            'password' => 'wrong_password',
        ]);

        $response->assertStatus(401)
            ->assertJsonFragment([
                'message' => 'Invalid password',
            ]);
    }

    /**
     * اختبار فشل التحقق عند محاولة التحقق من مستخدم يملك دور كاشير فقط كمدير
     */
    public function test_cashier_cannot_verify_cashier_as_admin()
    {
        $cashier = $this->actingAsCashier();

        $cashier->update([
            'password' => Hash::make('cashier123'),
        ]);

        $response = $this->postJson('/api/auth/verify-admin', [
            'identifier' => 'cashier@test.com',
            'password' => 'cashier123',
        ]);

        $response->assertStatus(403)
            ->assertJsonFragment([
                'message' => 'User is not an authorized admin',
            ]);
    }

    /**
     * اختبار نجاح تسجيل وتخزين سجل تدقيق أمني جديد
     */
    public function test_authenticated_user_can_store_audit_log_successfully()
    {
        $cashier = $this->actingAsCashier();

        $response = $this->postJson('/api/audit-logs', [
            'action' => 'cart_item_deletion',
            'description' => 'Deleted product Pepsi 330ml (Qty: 2) from cart.',
            'admin_user_id' => $this->adminUser->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonFragment([
                'message' => 'Audit log recorded successfully',
            ]);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $cashier->id,
            'action' => 'cart_item_deletion',
            'admin_user_id' => $this->adminUser->id,
        ]);
    }
}
