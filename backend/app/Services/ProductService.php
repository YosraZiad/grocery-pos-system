<?php

namespace App\Services;

use App\Models\Category;
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

        // Filter by multiple categories (used for parent category selection with descendants)
        if (!empty($filters['category_ids'])) {
            $rawCategoryIds = is_array($filters['category_ids'])
                ? $filters['category_ids']
                : explode(',', (string) $filters['category_ids']);

            $categoryIds = collect($rawCategoryIds)
                ->map(fn ($id) => (int) $id)
                ->filter(fn ($id) => $id > 0)
                ->unique()
                ->values()
                ->all();

            if (!empty($categoryIds)) {
                $query->whereIn('category_id', $categoryIds);
            }
        }

        // Filter by category
        if (isset($filters['category_id']) && empty($filters['category_ids'])) {
            $categoryId = (int) $filters['category_id'];
            if ($categoryId > 0) {
                if ($this->shouldIncludeDescendants($filters['include_descendants'] ?? false)) {
                    $query->whereIn('category_id', $this->getDescendantCategoryIds($categoryId));
                } else {
                    $query->where('category_id', $categoryId);
                }
            }
        }

        if (!empty($filters['created_from'])) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (!empty($filters['created_to'])) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        if (isset($filters['min_quantity']) && $filters['min_quantity'] !== '') {
            $query->where('quantity', '>=', (int) $filters['min_quantity']);
        }

        if (isset($filters['max_quantity']) && $filters['max_quantity'] !== '') {
            $query->where('quantity', '<=', (int) $filters['max_quantity']);
        }

        if (isset($filters['min_price']) && $filters['min_price'] !== '') {
            $query->where('sale_price', '>=', (float) $filters['min_price']);
        }

        if (isset($filters['max_price']) && $filters['max_price'] !== '') {
            $query->where('sale_price', '<=', (float) $filters['max_price']);
        }

        $allowedSorts = ['name', 'purchase_price', 'sale_price', 'quantity', 'created_at'];
        $sortBy = $filters['sort_by'] ?? 'name';
        $sortDirection = strtolower($filters['sort_direction'] ?? 'asc');

        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'name';
        }

        if (!in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'asc';
        }

        $query->orderBy($sortBy, $sortDirection);

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

    private function shouldIncludeDescendants(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_numeric($value)) {
            return (int) $value === 1;
        }

        if (!is_string($value)) {
            return false;
        }

        return in_array(strtolower(trim($value)), ['1', 'true', 'yes', 'on'], true);
    }

    /**
     * Return root category id + all nested descendants ids.
     */
    private function getDescendantCategoryIds(int $rootCategoryId): array
    {
        $categories = Category::query()->select(['id', 'parent_id'])->get();

        $childrenByParent = [];
        foreach ($categories as $category) {
            $parentId = $category->parent_id;
            if (!array_key_exists($parentId, $childrenByParent)) {
                $childrenByParent[$parentId] = [];
            }
            $childrenByParent[$parentId][] = (int) $category->id;
        }

        $result = [];
        $queue = [$rootCategoryId];

        while (!empty($queue)) {
            $currentId = array_shift($queue);
            if (in_array($currentId, $result, true)) {
                continue;
            }

            $result[] = $currentId;

            $children = $childrenByParent[$currentId] ?? [];
            foreach ($children as $childId) {
                $queue[] = $childId;
            }
        }

        return $result;
    }
}
