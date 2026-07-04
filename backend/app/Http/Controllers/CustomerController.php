<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CustomerController extends Controller
{
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
}
