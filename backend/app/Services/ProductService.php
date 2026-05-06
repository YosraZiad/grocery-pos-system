<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    /**
     * Get all products with filters and pagination
     *
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function index(array $filters): LengthAwarePaginator
    {
        $query = Product::with('category');

        // Search by name or barcode
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%");
            });
        }

        // Filter by category
        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        $perPage = $filters['per_page'] ?? 20;
        return $query->paginate($perPage);
    }

    /**
     * Create a new product
     *
     * @param array $data
     * @return Product
     */
    public function create(array $data): Product
    {
        $product = Product::create($data);
        return $product->load('category');
    }

    /**
     * Show single product
     *
     * @param string $id
     * @return Product
     */
    public function show(string $id): Product
    {
        return Product::with('category')->findOrFail($id);
    }

    /**
     * Update product
     *
     * @param string $id
     * @param array $data
     * @return Product
     */
    public function update(string $id, array $data): Product
    {
        $product = Product::findOrFail($id);
        $product->update($data);
        return $product->load('category');
    }

    /**
     * Delete product
     *
     * @param string $id
     * @return void
     */
    public function delete(string $id): void
    {
        $product = Product::findOrFail($id);
        $product->delete();
    }

    /**
     * Quick search products
     *
     * @param string $query
     * @return Collection
     */
    public function search(string $query): Collection
    {
        return Product::with('category')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('barcode', 'like', "%{$query}%");
            })
            ->limit(20)
            ->get();
    }
}
