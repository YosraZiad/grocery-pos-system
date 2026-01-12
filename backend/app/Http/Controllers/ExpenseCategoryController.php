<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseCategoryController extends Controller
{
    /**
     * عرض جميع أقسام المصروفات
     */
    public function index()
    {
        $categories = ExpenseCategory::withCount('expenses')->get();

        return response()->json([
            'data' => $categories,
        ], 200);
    }

    /**
     * إضافة قسم مصروفات جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $category = ExpenseCategory::create([
            'tenant_id' => config('tenant_id'),
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Expense category created successfully',
            'data' => $category,
        ], 201);
    }

    /**
     * عرض قسم مصروفات واحد
     */
    public function show(string $id)
    {
        $category = ExpenseCategory::with('expenses')->findOrFail($id);

        return response()->json([
            'data' => $category,
        ], 200);
    }

    /**
     * تعديل قسم مصروفات
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $category = ExpenseCategory::findOrFail($id);

        $category->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Expense category updated successfully',
            'data' => $category,
        ], 200);
    }

    /**
     * حذف قسم مصروفات
     */
    public function destroy(string $id)
    {
        $category = ExpenseCategory::findOrFail($id);

        // التحقق من وجود مصروفات في القسم
        if ($category->expenses()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing expenses',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Expense category deleted successfully',
        ], 200);
    }
}
