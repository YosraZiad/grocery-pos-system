<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Collection;

class CategoryService
{
    protected const MAX_CATEGORY_LEVEL = 3;

    /**
     * Get all categories as flat list plus tree structure
     *
     * @return array{data: Collection, tree: Collection}
     */
    public function index(): array
    {
        $categories = Category::withCount('products')
            ->with(['products:id,category_id,name,barcode,sale_price,quantity'])
            ->orderBy('name')
            ->get();

        return [
            'data' => $categories,
            'tree' => $this->buildTree($categories),
        ];
    }

    /**
     * Create a new category
     *
     * @param array $data
     * @return Category
     */
    public function create(array $data): Category
    {
        $this->validateHierarchyForCreate($data['parent_id'] ?? null);

        return Category::create($data);
    }

    /**
     * Show single category
     *
     * @param string $id
     * @return Category
     */
    public function show(string $id): Category
    {
        return Category::with([
            'products:id,category_id,name,barcode,sale_price,quantity',
            'parent:id,name,parent_id',
            'children:id,name,parent_id',
        ])->findOrFail($id);
    }

    /**
     * Update category
     *
     * @param string $id
     * @param array $data
     * @return Category
     */
    public function update(string $id, array $data): Category
    {
        $category = Category::findOrFail($id);

        $this->validateHierarchyForUpdate($category, $data['parent_id'] ?? null);

        $category->update($data);

        return $category;
    }

    /**
     * Delete category
     *
     * @param string $id
     * @return void
     * @throws \RuntimeException if category has products
     */
    public function delete(string $id): void
    {
        $category = Category::findOrFail($id);

        if ($category->children()->count() > 0) {
            throw new \RuntimeException('Cannot delete category with existing subcategories');
        }

        if ($category->products()->count() > 0) {
            throw new \RuntimeException('Cannot delete category with existing products');
        }

        $category->delete();
    }

    /**
     * Build nested categories tree with products for easy UI tree rendering.
     */
    protected function buildTree(Collection $categories): Collection
    {
        $groupedByParent = $categories->groupBy('parent_id');

        $buildNodes = function ($parentId) use (&$buildNodes, $groupedByParent) {
            return ($groupedByParent->get($parentId, collect()))
                ->map(function (Category $category) use (&$buildNodes) {
                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'description' => $category->description,
                        'parent_id' => $category->parent_id,
                        'products_count' => $category->products_count,
                        'products' => $category->products,
                        'children' => $buildNodes($category->id)->values(),
                    ];
                })
                ->values();
        };

        return $buildNodes(null);
    }

    protected function validateHierarchyForCreate(?int $parentId): void
    {
        if (!$parentId) {
            return;
        }

        $newLevel = $this->getLevelById($parentId) + 1;

        if ($newLevel > self::MAX_CATEGORY_LEVEL) {
            throw new \RuntimeException('Only 3 category levels are allowed');
        }
    }

    protected function validateHierarchyForUpdate(Category $category, ?int $parentId): void
    {
        if (!$parentId) {
            $targetLevel = 1;
        } else {
            if ($this->isDescendantOf($parentId, $category->id)) {
                throw new \RuntimeException('Invalid parent category selection');
            }

            $targetLevel = $this->getLevelById($parentId) + 1;
        }

        $subtreeHeight = $this->getSubtreeHeight($category);
        $deepestLevel = $targetLevel + $subtreeHeight - 1;

        if ($deepestLevel > self::MAX_CATEGORY_LEVEL) {
            throw new \RuntimeException('Only 3 category levels are allowed');
        }
    }

    protected function getLevelById(int $categoryId): int
    {
        $current = Category::findOrFail($categoryId);
        $level = 1;

        while ($current->parent_id) {
            $current = Category::findOrFail($current->parent_id);
            $level++;
        }

        return $level;
    }

    protected function isDescendantOf(int $candidateParentId, int $categoryId): bool
    {
        $current = Category::find($candidateParentId);

        while ($current) {
            if ($current->id === $categoryId) {
                return true;
            }

            if (!$current->parent_id) {
                return false;
            }

            $current = Category::find($current->parent_id);
        }

        return false;
    }

    protected function getSubtreeHeight(Category $category): int
    {
        $children = $category->children()->get();

        if ($children->isEmpty()) {
            return 1;
        }

        $maxChildHeight = $children
            ->map(fn (Category $child) => $this->getSubtreeHeight($child))
            ->max();

        return 1 + $maxChildHeight;
    }
}
