<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
    /**
     * عرض جميع العملاء
     */
    public function index(Request $request)
    {
        $query = Customer::query();
        
        $tenantId = config('tenant_id');
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 20);
        $customers = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($customers, 200);
    }

    /**
     * البحث عن عميل برقم الهاتف
     */
    public function search(Request $request)
    {
        $request->validate([
            'phone' => 'required|string|min:3',
        ]);

        $customer = Customer::where('phone', $request->phone)->first();

        if (!$customer) {
            return response()->json([
                'success' => false,
                'message' => 'العميل غير مسجل بالنظام.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $customer,
        ], 200);
    }

    /**
     * إضافة عميل جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'required|string|min:7|max:15',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'تأكد من صحة البيانات المدخلة.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // التحقق من تكرار الهاتف لنفس الـ Tenant
        $tenantId = config('tenant_id');
        $exists = Customer::where('phone', $request->phone);
        if ($tenantId) {
            $exists->where('tenant_id', $tenantId);
        }
        
        if ($exists->exists()) {
            return response()->json([
                'message' => 'رقم الهاتف مسجل بالفعل لعميل آخر.',
            ], 422);
        }

        $customer = Customer::create([
            'tenant_id' => $tenantId ?? 1,
            'name' => $request->name,
            'phone' => $request->phone,
            'balance' => 0.00,
            'is_temporary' => false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل العميل بنجاح.',
            'data' => $customer,
        ], 201);
    }

    /**
     * تعديل بيانات عميل
     */
    public function update(Request $request, string $id)
    {
        $customer = Customer::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'phone' => 'required|string|min:7|max:15',
            'balance' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'تأكد من صحة البيانات المدخلة.',
                'errors' => $validator->errors(),
            ], 422);
        }

        // التحقق من تكرار الهاتف لنفس الـ Tenant باستثناء العميل الحالي
        $tenantId = config('tenant_id');
        $exists = Customer::where('phone', $request->phone)
            ->where('id', '!=', $customer->id);
        if ($tenantId) {
            $exists->where('tenant_id', $tenantId);
        }
        
        if ($exists->exists()) {
            return response()->json([
                'message' => 'رقم الهاتف مسجل بالفعل لعميل آخر.',
            ], 422);
        }

        $customer->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'balance' => $request->balance,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات العميل بنجاح.',
            'data' => $customer,
        ], 200);
    }

    /**
     * حذف عميل
     */
    public function destroy(string $id)
    {
        $customer = Customer::findOrFail($id);

        // حماية عملاء النظام الافتراضيين من الحذف
        $protectedPhones = ['0500000000', '0500000001', '0500000002', '0500050000'];
        if (in_array($customer->phone, $protectedPhones)) {
            return response()->json([
                'message' => 'لا يمكن حذف العميل الافتراضي الخاص بالنظام.',
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف العميل بنجاح.',
        ], 200);
    }
}
