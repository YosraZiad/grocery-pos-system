<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SupplierController extends Controller
{
    /**
     * عرض جميع الموردين
     */
    public function index(Request $request)
    {
        $query = Supplier::withCount('purchaseInvoices');

        // البحث
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $suppliers = $query->orderBy('name')->get();

        // حساب إجمالي الديون لكل مورد
        foreach ($suppliers as $supplier) {
            $supplier->total_balance = $supplier->calculateTotalBalance();
        }

        return response()->json([
            'data' => $suppliers,
        ], 200);
    }

    /**
     * إضافة مورد جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $supplier = Supplier::create([
            'tenant_id' => config('tenant_id'),
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
            'balance' => 0,
        ]);

        return response()->json([
            'message' => 'Supplier created successfully',
            'data' => $supplier,
        ], 201);
    }

    /**
     * عرض مورد واحد
     */
    public function show(string $id)
    {
        $supplier = Supplier::with(['purchaseInvoices.items.product'])
            ->findOrFail($id);

        $supplier->total_balance = $supplier->calculateTotalBalance();

        return response()->json([
            'data' => $supplier,
        ], 200);
    }

    /**
     * تعديل مورد
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $supplier = Supplier::findOrFail($id);

        $supplier->update([
            'name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
        ]);

        return response()->json([
            'message' => 'Supplier updated successfully',
            'data' => $supplier,
        ], 200);
    }

    /**
     * حذف مورد
     */
    public function destroy(string $id)
    {
        $supplier = Supplier::findOrFail($id);

        // التحقق من وجود فواتير شراء
        if ($supplier->purchaseInvoices()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete supplier with existing purchase invoices',
            ], 422);
        }

        $supplier->delete();

        return response()->json([
            'message' => 'Supplier deleted successfully',
        ], 200);
    }

    /**
     * رصيد المورد
     */
    public function balance(string $id)
    {
        $supplier = Supplier::findOrFail($id);

        $totalBalance = $supplier->calculateTotalBalance();
        $totalInvoices = $supplier->purchaseInvoices()->count();
        $paidInvoices = $supplier->purchaseInvoices()->where('balance', 0)->count();
        $unpaidInvoices = $supplier->purchaseInvoices()->where('balance', '>', 0)->count();

        return response()->json([
            'data' => [
                'supplier' => $supplier,
                'total_balance' => $totalBalance,
                'total_invoices' => $totalInvoices,
                'paid_invoices' => $paidInvoices,
                'unpaid_invoices' => $unpaidInvoices,
            ],
        ], 200);
    }
}
