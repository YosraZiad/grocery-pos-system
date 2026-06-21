<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AuditLogController extends Controller
{
    /**
     * حفظ سجل تدقيق أمني جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'action' => 'required|string|max:255',
            'description' => 'required|string',
            'admin_user_id' => 'nullable|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $auditLog = AuditLog::create([
            'tenant_id' => config('tenant_id') ?? auth()->user()->tenant_id,
            'user_id' => auth()->id(),
            'action' => $request->action,
            'description' => $request->description,
            'admin_user_id' => $request->admin_user_id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'Audit log recorded successfully',
            'audit_log' => $auditLog,
        ], 201);
    }
}
