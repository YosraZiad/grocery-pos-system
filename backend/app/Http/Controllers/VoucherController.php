<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherController extends Controller
{
    /**
     * التحقق من السند بالرمز
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
        ]);

        $voucher = Voucher::with('customer')
            ->where('code', $request->code)
            ->first();

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'سند الاستبدال غير موجود أو غير صالح.',
            ], 404);
        }

        if ($voucher->status !== 'active' || $voucher->amount <= 0) {
            return response()->json([
                'success' => false,
                'message' => 'تم استهلاك أو استخدام هذا السند مسبقاً بالكامل.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $voucher->code,
                'amount' => (float)$voucher->amount,
                'customer_name' => $voucher->customer ? $voucher->customer->name : 'عميل افتراضي',
                'customer_phone' => $voucher->customer ? $voucher->customer->phone : null,
            ]
        ], 200);
    }

    /**
     * التحقق من رصيد فاتورة المرتجع أو كود السند لاستخدامه في الدفع الهجين
     */
    public function verifyReturnBalance(Request $request)
    {
        $request->validate([
            'query' => 'required|string',
        ]);

        $query = trim($request->get('query'));

        // 1. البحث برمز السند مباشرة
        $voucher = Voucher::with('customer')
            ->where('code', $query)
            ->where('status', 'active')
            ->first();

        // 2. إذا لم يعثر عليه، نبحث برقم فاتورة المرتجع المرتبطة بالسند
        if (!$voucher) {
            $salesReturn = \App\Models\SalesReturn::where('return_number', $query)->first();
            if ($salesReturn) {
                $voucher = Voucher::with('customer')
                    ->where('sales_return_id', $salesReturn->id)
                    ->where('status', 'active')
                    ->first();
            }
        }

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم العثور على رصيد نشط أو سند استبدال صالح لهذا المدخل.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'code' => $voucher->code,
                'amount' => (float)$voucher->amount,
                'customer_id' => $voucher->customer_id,
                'customer_name' => $voucher->customer ? $voucher->customer->name : 'عميل عام',
                'customer_phone' => $voucher->customer ? $voucher->customer->phone : null,
                'customer_balance' => $voucher->customer ? (float)$voucher->customer->balance : 0.00,
            ]
        ], 200);
    }
}
