<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * عرض جميع الأقسام
     */
    public function index()
    {
        $categories = Category::withCount('products')->get();

        return response()->json([
            'data' => $categories,
        ], 200);
    }

    /**
     * إضافة قسم جديد
     */
    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create([
            'tenant_id' => config('tenant_id'),
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Category created successfully',
            'data' => $category,
        ], 201);
    }

    /**
     * عرض قسم واحد
     */
    public function show(string $id)
    {
        $category = Category::with('products')->findOrFail($id);

        return response()->json([
            'data' => $category,
        ], 200);
    }

    /**
     * تعديل قسم
     */
    public function update(UpdateCategoryRequest $request, string $id)
    {
        $category = Category::findOrFail($id);

        $category->update([
            'name' => $request->name,
            'description' => $request->description,
        ]);

        return response()->json([
            'message' => 'Category updated successfully',
            'data' => $category,
        ], 200);
    }

    /**
     * حذف قسم
     */
    public function destroy(string $id)
    {
        $category = Category::findOrFail($id);

        // التحقق من وجود منتجات في القسم
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with existing products',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully',
        ], 200);
    }
}
