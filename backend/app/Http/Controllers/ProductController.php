<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Services\ProductService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    protected ProductService $service;

    public function __construct(ProductService $service)
    {
        $this->service = $service;
    }

    /**
     * عرض جميع المنتجات (مع pagination & search)
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'category_id', 'per_page']);
        $products = $this->service->index($filters);

        return response()->json($products, 200);
    }

    /**
     * إضافة منتج جديد
     */
    public function store(StoreProductRequest $request)
    {
        $data = $request->validated();
        $data['tenant_id'] = config('tenant_id');
        $data['min_stock_alert'] = $request->min_stock_alert ?? 5;
        $data['min_expiry_alert'] = $request->min_expiry_alert ?? 7;

        $product = $this->service->create($data);

        return response()->json([
            'message' => 'Product created successfully',
            'data' => $product,
        ], 201);
    }

    /**
     * عرض منتج واحد
     */
    public function show(string $id)
    {
        $product = $this->service->show($id);

        return response()->json([
            'data' => $product,
        ], 200);
    }

    /**
     * تعديل منتج
     */
    public function update(UpdateProductRequest $request, string $id)
    {
        $data = $request->validated();
        $product = $this->service->update($id, $data);

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => $product,
        ], 200);
    }

    /**
     * حذف منتج
     */
    public function destroy(string $id)
    {
        $this->service->delete($id);

        return response()->json([
            'message' => 'Product deleted successfully',
        ], 200);
    }

    /**
     * بحث سريع (اسم/باركود)
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'q' => 'required|string|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $products = $this->service->search($request->q);

        return response()->json([
            'data' => $products,
        ], 200);
    }
}
