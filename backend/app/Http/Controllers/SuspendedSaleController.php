<?php

namespace App\Http\Controllers;

use App\Models\SuspendedSale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SuspendedSaleController extends Controller
{
    /**
     * عرض قائمة العمليات المعلقة للمستأجر الحالي
     */
    public function index(Request $request)
    {
        $tenantId = config('tenant_id');

        $query = SuspendedSale::orderBy('id', 'desc');

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $suspendedSales = $query->get();

        return response()->json([
            'success' => true,
            'data' => $suspendedSales,
        ], 200);
    }

    /**
     * تعليق عملية بيع جديدة
     */
    public function store(Request $request)
    {
        $tenantId = config('tenant_id');
        $userId = $request->user()->id;

        if (!$tenantId) {
            return response()->json(['message' => 'Tenant ID is required'], 400);
        }

        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'total' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:percentage,fixed',
            'note' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $suspendId = SuspendedSale::generateSuspendId();

            $suspendedSale = SuspendedSale::create([
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'suspend_id' => $suspendId,
                'note' => $request->note,
                'total' => $request->total,
                'discount' => $request->discount ?? 0,
                'discount_type' => $request->discount_type ?? 'fixed',
                'items' => $request->items,
            ]);

            return response()->json([
                'message' => 'Sale suspended successfully',
                'data' => $suspendedSale,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to suspend sale: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * حذف فاتورة معلقة (عند استعادتها أو إلغائها)
     */
    public function destroy($id)
    {
        $tenantId = config('tenant_id');

        $query = SuspendedSale::where('id', $id);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $suspendedSale = $query->first();

        if (!$suspendedSale) {
            return response()->json([
                'message' => 'Suspended sale not found',
            ], 404);
        }

        $suspendedSale->delete();

        return response()->json([
            'success' => true,
            'message' => 'Suspended sale deleted successfully',
        ], 200);
    }
}
