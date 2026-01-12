<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * عرض جميع المنتجات (مع pagination & search)
     */
    public function index(Request $request)
    {
        $query = Product::with('category');

        // البحث بالاسم أو الباركود
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // الفلترة حسب القسم
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Pagination
        $perPage = $request->get('per_page', 20);
        $products = $query->paginate($perPage);

        return response()->json($products, 200);
    }

    /**
     * إضافة منتج جديد
     */
    public function store(StoreProductRequest $request)
    {
        $product = Product::create([
            'tenant_id' => config('tenant_id'),
            'category_id' => $request->category_id,
            'name' => $request->name,
            'barcode' => $request->barcode,
            'purchase_price' => $request->purchase_price,
            'sale_price' => $request->sale_price,
            'quantity' => $request->quantity,
            'expiry_date' => $request->expiry_date,
            'min_stock_alert' => $request->min_stock_alert ?? 5,
            'min_expiry_alert' => $request->min_expiry_alert ?? 7,
        ]);

        return response()->json([
            'message' => 'Product created successfully',
            'data' => $product->load('category'),
        ], 201);
    }

    /**
     * عرض منتج واحد
     */
    public function show(string $id)
    {
        $product = Product::with('category')->findOrFail($id);

        return response()->json([
            'data' => $product,
        ], 200);
    }

    /**
     * تعديل منتج
     */
    public function update(UpdateProductRequest $request, string $id)
    {
        $product = Product::findOrFail($id);

        $product->update($request->all());

        return response()->json([
            'message' => 'Product updated successfully',
            'data' => $product->load('category'),
        ], 200);
    }

    /**
     * حذف منتج
     */
    public function destroy(string $id)
    {
        $product = Product::findOrFail($id);
        $product->delete();

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

        $query = $request->q;
        $products = Product::with('category')
            ->where('name', 'like', "%{$query}%")
            ->orWhere('barcode', 'like', "%{$query}%")
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $products,
        ], 200);
    }
}
