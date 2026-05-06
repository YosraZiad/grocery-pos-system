<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use Illuminate\Http\Request;
use App\Services\CategoryService;

class CategoryController extends Controller
{
    protected CategoryService $service;

    public function __construct(CategoryService $service)
    {
        $this->service = $service;
    }
    /**
     * عرض جميع الأقسام
     */
    public function index()
    {
        $categories = $this->service->index();

        return response()->json($categories, 200);
    }

    /**
     * إضافة قسم جديد
     */
    public function store(StoreCategoryRequest $request)
    {
        $data = $request->only(['name', 'description', 'parent_id']);
        $data['tenant_id'] = config('tenant_id');

        try {
            $category = $this->service->create($data);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

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
        $category = $this->service->show($id);

        return response()->json([ 'data' => $category ], 200);
    }

    /**
     * تعديل قسم
     */
    public function update(UpdateCategoryRequest $request, string $id)
    {
        $data = $request->only(['name', 'description', 'parent_id']);

        try {
            $category = $this->service->update($id, $data);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

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
        try {
            $this->service->delete($id);
            return response()->json([ 'message' => 'Category deleted successfully' ], 200);
        } catch (\RuntimeException $e) {
            return response()->json([ 'message' => $e->getMessage() ], 422);
        }
    }
}
