<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class TerminalController extends Controller
{
    /**
     * إرسال مبلغ للماكينة الشبكية لبدء الدفع
     */
    public function charge(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:0.01',
        ]);

        // حفظ تفاصيل العملية بالذاكرة المؤقتة لمدة 5 دقائق
        Cache::put('terminal_amount', (float) $request->amount, 300);
        Cache::put('terminal_status', 'waiting_for_card', 300);
        Cache::put('terminal_result', null, 300);

        return response()->json([
            'success' => true,
            'message' => 'Charge amount sent to terminal successfully',
        ], 200);
    }

    /**
     * التحقق من حالة الماكينة الحالية ومبلغها المعلق
     */
    public function status()
    {
        return response()->json([
            'amount' => Cache::get('terminal_amount'),
            'status' => Cache::get('terminal_status', 'idle'),
            'result' => Cache::get('terminal_result'),
        ], 200);
    }

    /**
     * محاكاة العميل وتمرير الكارت لإصدار قرار القبول أو الرفض
     */
    public function action(Request $request)
    {
        $request->validate([
            'result' => 'required|in:approved,declined,timeout',
        ]);

        $result = $request->result;

        Cache::put('terminal_status', 'processing', 300);

        // إتاحة فرصة معالجة بسيطة في السيرفر وتحديث النتيجة
        Cache::put('terminal_result', $result, 300);
        
        if ($result === 'approved') {
            Cache::put('terminal_status', 'approved', 300);
        } elseif ($result === 'declined') {
            Cache::put('terminal_status', 'declined', 300);
        } else {
            Cache::put('terminal_status', 'timeout', 300);
        }

        return response()->json([
            'success' => true,
            'status' => Cache::get('terminal_status'),
            'result' => Cache::get('terminal_result'),
        ], 200);
    }

    /**
     * تصفير الجلسة وإعادة الماكينة لوضع الخمول (Idle)
     */
    public function reset()
    {
        Cache::forget('terminal_amount');
        Cache::forget('terminal_status');
        Cache::forget('terminal_result');

        return response()->json([
            'success' => true,
            'message' => 'Terminal reset successful',
        ], 200);
    }
}
