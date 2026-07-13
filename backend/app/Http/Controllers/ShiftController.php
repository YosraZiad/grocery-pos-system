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
        if (!auth()->user()->hasRole('admin')) {
            return response()->json([
                'message' => 'Only administrators can open new shifts. | يسمح فقط لمدير النظام بفتح الوردية.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
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
        $hasOpenShift = Shift::where('user_id', $request->user_id)
            ->where('status', 'open')
            ->exists();

        if ($hasOpenShift) {
            return response()->json([
                'message' => 'The selected cashier already has an active open shift. | الموظف المختار لديه وردية مفتوحة بالفعل.',
            ], 422);
        }

        // توليد رقم وردية تلقائي فريد
        $lastShiftId = DB::table('shifts')->max('id') ?? 0;
        $shiftNumber = 'SHFT-' . str_pad($lastShiftId + 1, 6, '0', STR_PAD_LEFT);

        $shift = Shift::create([
            'tenant_id' => config('tenant_id') ?? auth()->user()->tenant_id,
            'user_id' => $request->user_id,
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

        $isExpired = \Carbon\Carbon::parse($shift->opened_at)->setTimezone('UTC')->diffInHours(now()->setTimezone('UTC')) >= 12;

        return response()->json([
            'active' => true,
            'expired' => $isExpired,
            'shift' => $shift,
        ], 200);
    }

    /**
     * الحصول على معاينة لتسوية العهدة للوردية النشطة
     */
    public function reconciliation()
    {
        $shift = Shift::where('user_id', auth()->id())
            ->where('status', 'open')
            ->first();

        if (!$shift) {
            return response()->json([
                'message' => 'No active shift found. | لا توجد وردية نشطة حالياً.',
            ], 400);
        }

        // احتساب المبالغ المتوقعة
        $expectedCash = floatval($shift->opening_float);
        $expectedCard = 0.00;
        $totalSales = 0.00;
        $totalReturns = 0.00;

        // مبيعات الوردية
        $sales = \App\Models\Sale::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->get();

        foreach ($sales as $sale) {
            $totalSales += floatval($sale->total);
            if ($sale->payment_method === 'cash') {
                $expectedCash += floatval($sale->total);
            } elseif ($sale->payment_method === 'card') {
                $expectedCard += floatval($sale->total);
            } elseif ($sale->payment_method === 'hybrid') {
                if (is_array($sale->payment_details)) {
                    foreach ($sale->payment_details as $detail) {
                        $method = $detail['method'] ?? ($detail['payment_method'] ?? null);
                        $amount = floatval($detail['amount'] ?? 0);
                        if ($method === 'cash') {
                            $expectedCash += $amount;
                        } elseif ($method === 'card') {
                            $expectedCard += $amount;
                        }
                    }
                }
            }
        }

        // مرتجعات الوردية
        $returns = \App\Models\SalesReturn::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->get();

        foreach ($returns as $ret) {
            $totalReturns += floatval($ret->refund_total);
            if ($ret->refund_method === 'cash') {
                $expectedCash -= floatval($ret->refund_total);
            } elseif ($ret->refund_method === 'card') {
                $expectedCard -= floatval($ret->refund_total);
            }
        }

        $hasSuspendedSales = \App\Models\SuspendedSale::where('user_id', auth()->id())->exists();

        return response()->json([
            'expected_cash' => $expectedCash,
            'expected_card' => $expectedCard,
            'total_sales' => $totalSales,
            'total_returns' => $totalReturns,
            'has_suspended_sales' => $hasSuspendedSales,
            'opening_float' => floatval($shift->opening_float),
        ], 200);
    }

    /**
     * إنهاء الوردية النشطة
     */
    public function end(Request $request)
    {
        // 1. التحقق من وجود فواتير معلقة
        $hasSuspended = \App\Models\SuspendedSale::where('user_id', auth()->id())->exists();
        if ($hasSuspended) {
            return response()->json([
                'message' => 'لا يمكن إغلاق الوردية، يرجى إنهاء أو إلغاء الفواتير المعلقة. | Cannot close shift, please complete or cancel suspended sales.'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'actual_cash' => 'required|numeric|min:0',
            'actual_card' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
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

        // 2. احتساب المبالغ المتوقعة
        $expectedCash = floatval($shift->opening_float);
        $expectedCard = 0.00;
        $totalSales = 0.00;
        $totalReturns = 0.00;

        // مبيعات الوردية
        $sales = \App\Models\Sale::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->get();

        foreach ($sales as $sale) {
            $totalSales += floatval($sale->total);
            if ($sale->payment_method === 'cash') {
                $expectedCash += floatval($sale->total);
            } elseif ($sale->payment_method === 'card') {
                $expectedCard += floatval($sale->total);
            } elseif ($sale->payment_method === 'hybrid') {
                if (is_array($sale->payment_details)) {
                    foreach ($sale->payment_details as $detail) {
                        $method = $detail['method'] ?? ($detail['payment_method'] ?? null);
                        $amount = floatval($detail['amount'] ?? 0);
                        if ($method === 'cash') {
                            $expectedCash += $amount;
                        } elseif ($method === 'card') {
                            $expectedCard += $amount;
                        }
                    }
                }
            }
        }

        // مرتجعات الوردية
        $returns = \App\Models\SalesReturn::where('shift_id', $shift->id)
            ->where('status', 'completed')
            ->get();

        foreach ($returns as $ret) {
            $totalReturns += floatval($ret->refund_total);
            if ($ret->refund_method === 'cash') {
                $expectedCash -= floatval($ret->refund_total);
            } elseif ($ret->refund_method === 'card') {
                $expectedCard -= floatval($ret->refund_total);
            }
        }

        $actualCash = floatval($request->actual_cash);
        $actualCard = floatval($request->actual_card);

        $difference = ($actualCash + $actualCard) - ($expectedCash + $expectedCard);

        // 3. التحقق من كتابة التبرير عند وجود فروقات (عجز أو زيادة)
        $hasDifference = (abs($actualCash - $expectedCash) >= 0.01) || (abs($actualCard - $expectedCard) >= 0.01);
        if ($hasDifference && empty(trim($request->notes ?? ''))) {
            return response()->json([
                'message' => 'يجب تقديم تبرير لوجود فروقات في الوردية. | Justification is required for shift differences.',
                'errors' => [
                    'notes' => ['يجب تقديم تبرير لوجود فروقات في الوردية.']
                ]
            ], 422);
        }

        // 4. تحديث الوردية وإقفالها
        $shift->update([
            'closing_float' => $actualCash,
            'actual_cash' => $actualCash,
            'actual_card' => $actualCard,
            'expected_cash' => $expectedCash,
            'expected_card' => $expectedCard,
            'difference' => $difference,
            'total_sales' => $totalSales,
            'total_returns' => $totalReturns,
            'notes' => $request->notes,
            'closed_at' => now(),
            'status' => 'closed',
        ]);

        return response()->json([
            'message' => 'Shift ended successfully',
            'shift' => $shift,
        ], 200);
    }

    /**
     * عرض تقرير Z-Report كـ HTML للطباعة
     */
    public function zReport(Request $request, string $id)
    {
        $shift = Shift::with('user')->findOrFail($id);
        $lang = $request->get('lang', 'ar');

        $tenantName = $shift->tenant_id ? \App\Models\Tenant::find($shift->tenant_id)?->name : null;
        if (!$tenantName) {
            $tenantName = auth()->user()->tenant?->name ?? 'Grocery POS';
        }

        $html = view('z_report', compact('shift', 'lang', 'tenantName'))->render();

        return response($html)->header('Content-Type', 'text/html');
    }

    /**
     * عرض وإدارة الشفتات مع الفلترة
     */
    public function index(Request $request)
    {
        $query = Shift::with('user');

        // تصفية حسب المستأجر (tenant_id)
        $tenantId = config('tenant_id') ?? auth()->user()->tenant_id;
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        // الكاشير العادي يعرض شفتاته الشخصية فقط، بينما المسؤول يعرض الجميع
        if (!auth()->user()->hasRole('admin')) {
            $query->where('user_id', auth()->id());
        } else {
            if ($request->has('user_id') && !empty($request->user_id)) {
                $query->where('user_id', $request->user_id);
            }
        }

        // الفلترة حسب الحالة
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        // الفلترة حسب رقم الجهاز
        if ($request->has('device_number') && !empty($request->device_number)) {
            $query->where('device_number', 'like', "%{$request->device_number}%");
        }

        // الفلترة بالتاريخ
        if ($request->has('from') && !empty($request->from)) {
            $query->where('opened_at', '>=', $request->from . ' 00:00:00');
        }
        if ($request->has('to') && !empty($request->to)) {
            $query->where('opened_at', '<=', $request->to . ' 23:59:59');
        }

        $query->orderBy('opened_at', 'desc');

        $perPage = $request->get('per_page', 10);
        $shifts = $query->paginate($perPage);

        return response()->json($shifts, 200);
    }
}
