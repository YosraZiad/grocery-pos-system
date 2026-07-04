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
}
