<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ShiftController extends Controller
{
    /**
     * بدء وردية جديدة
     */
    public function start(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'opening_float' => 'required|numeric|min:0',
            'device_number' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // التحقق مما إذا كان لدى الكاشير وردية مفتوحة بالفعل
        $hasOpenShift = Shift::where('user_id', auth()->id())
            ->where('status', 'open')
            ->exists();

        if ($hasOpenShift) {
            return response()->json([
                'message' => 'You already have an open shift. | لديك وردية مفتوحة بالفعل.',
            ], 422);
        }

        // توليد رقم وردية تلقائي فريد
        $lastShiftId = DB::table('shifts')->max('id') ?? 0;
        $shiftNumber = 'SHFT-' . str_pad($lastShiftId + 1, 6, '0', STR_PAD_LEFT);

        $shift = Shift::create([
            'tenant_id' => config('tenant_id') ?? auth()->user()->tenant_id,
            'user_id' => auth()->id(),
            'shift_number' => $shiftNumber,
            'device_number' => $request->device_number,
            'opening_float' => $request->opening_float,
            'opened_at' => now(),
            'status' => 'open',
        ]);

        return response()->json([
            'message' => 'Shift started successfully',
            'shift' => $shift,
        ], 201);
    }

    /**
     * الحصول على الوردية النشطة للمستخدم الحالي
     */
    public function active()
    {
        $shift = Shift::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return response()->json([
                'active' => false,
            ], 200);
        }

        return response()->json([
            'active' => true,
            'shift' => $shift,
        ], 200);
    }

    /**
     * إنهاء الوردية النشطة
     */
    public function end(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'closing_float' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $shift = Shift::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return response()->json([
                'message' => 'No active shift found. | لا توجد وردية نشطة حالياً.',
            ], 400);
        }

        $shift->update([
            'closing_float' => $request->closing_float,
            'closed_at' => now(),
            'status' => 'closed',
        ]);

        return response()->json([
            'message' => 'Shift ended successfully',
            'shift' => $shift,
        ], 200);
    }
}
