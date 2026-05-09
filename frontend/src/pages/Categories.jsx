import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import toast from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";
import api from "../services/api";

const MAX_LEVEL = 3;

function findTreeNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }

    if (node.children?.length) {
      const found = findTreeNodeById(node.children, id);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function flattenTree(nodes, level = 1, accumulator = []) {
  nodes.forEach((node) => {
    accumulator.push({ ...node, level });

    if (node.children?.length) {
      flattenTree(node.children, level + 1, accumulator);
    }
  });

  return accumulator;
}

function collectDescendantIds(node, set = new Set()) {
  if (!node?.children?.length) {
    return set;
  }

  node.children.forEach((child) => {
    set.add(child.id);
    collectDescendantIds(child, set);
  });

  return set;
}

function Categories() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [productForm, setProductForm] = useState({
    name: "",
    barcode: "",
    purchase_price: "",
    sale_price: "",
    quantity: "",
  });

  const queryClient = useQueryClient();
  const { t } = useI18n();

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data;
    },
  });

  const categories = data?.data || [];
  const categoryTree = data?.tree || [];

  const categoriesMap = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => map.set(category.id, category));
    return map;
  }, [categories]);

  const flattenedTree = useMemo(
    () => flattenTree(categoryTree),
    [categoryTree],
  );

  useEffect(() => {
    if (!selectedCategoryId && categoryTree.length > 0) {
      setSelectedCategoryId(categoryTree[0].id);
    }
  }, [categoryTree, selectedCategoryId]);

  useEffect(() => {
    if (!categoryTree.length) {
      return;
    }

    setExpandedIds((previous) => {
      if (previous.size > 0) {
        return previous;
      }

      const initial = new Set();
      categoryTree.forEach((node) => initial.add(node.id));
      return initial;
    });
  }, [categoryTree]);

  const selectedTreeNode = selectedCategoryId
    ? findTreeNodeById(categoryTree, selectedCategoryId)
    : null;

  const selectedCategory = selectedTreeNode
    ? categoriesMap.get(selectedTreeNode.id)
    : null;

  const editingNode = editingId
    ? findTreeNodeById(categoryTree, editingId)
    : null;
  const editingDescendants = useMemo(
    () => collectDescendantIds(editingNode),
    [editingNode],
  );

  const parentOptions = useMemo(() => {
    return flattenedTree.filter((node) => {
      if (node.level >= MAX_LEVEL) {
        return false;
      }

      if (editingId && node.id === editingId) {
        return false;
      }

      if (editingId && editingDescendants.has(node.id)) {
        return false;
      }

      return true;
    });
  }, [flattenedTree, editingId, editingDescendants]);

  const createCategoryMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/categories", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeCategoryModal();
      toast.success(t("categoryCreatedSuccessfully"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("errorCreatingCategory"));
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/categories/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeCategoryModal();
      toast.success(t("categoryUpdatedSuccessfully"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("errorUpdatingCategory"));
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(t("categoryDeletedSuccessfully"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("errorDeletingCategory"));
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/products", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeProductModal();
      toast.success(t("productCreatedSuccessfully"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("errorCreatingProduct"));
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await api.put(`/products/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      closeProductModal();
      toast.success(t("productUpdatedSuccessfully"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("errorUpdatingProduct"));
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowDeleteProductModal(false);
      setProductToDelete(null);
      toast.success(t("productDeletedSuccessfully"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("errorDeletingProduct"));
    },
  });

  function closeCategoryModal() {
    setShowCategoryModal(false);
    setEditingId(null);
    setName("");
    setDescription("");
    setParentId("");
  }

  function closeProductModal() {
    setShowProductModal(false);
    setEditingProductId(null);
    setProductForm({
      name: "",
      barcode: "",
      purchase_price: "",
      sale_price: "",
      quantity: "",
    });
  }

  function openCreateCategoryModal() {
    closeCategoryModal();
    setShowCategoryModal(true);
  }

  function openEditCategoryModal(category) {
    if (!category) {
      return;
    }

    setEditingId(category.id);
    setName(category.name || "");
    setDescription(category.description || "");
    setParentId(category.parent_id ? String(category.parent_id) : "");
    setShowCategoryModal(true);
  }

  function submitCategory(event) {
    event.preventDefault();

    const payload = {
      name,
      description,
      parent_id: parentId ? Number(parentId) : null,
    };

    if (editingId) {
      updateCategoryMutation.mutate({ id: editingId, payload });
      return;
    }

    createCategoryMutation.mutate(payload);
  }

  function requestDeleteCategory(id) {
    const node = findTreeNodeById(categoryTree, id);

    if (node?.children?.length) {
      toast.error(t("cannotDeleteCategoryWithChildren"));
      return;
    }

    if ((node?.products_count || 0) > 0) {
      toast.error(t("cannotDeleteCategoryWithProducts"));
      return;
    }

    setCategoryToDelete(id);
    setShowDeleteCategoryModal(true);
  }

  function confirmDeleteCategory() {
    if (!categoryToDelete) {
      return;
    }

    deleteCategoryMutation.mutate(categoryToDelete);
    setShowDeleteCategoryModal(false);
    setCategoryToDelete(null);
  }

  function openCreateProductModal() {
    if (!selectedTreeNode) {
      toast.error(t("selectCategoryFirst"));
      return;
    }

    closeProductModal();
    setShowProductModal(true);
  }

  function openEditProductModal(product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name || "",
      barcode: product.barcode || "",
      purchase_price: String(product.purchase_price || ""),
      sale_price: String(product.sale_price || ""),
      quantity: String(product.quantity || 0),
    });
    setShowProductModal(true);
  }

  function submitProduct(event) {
    event.preventDefault();

    if (!selectedTreeNode) {
      toast.error(t("selectCategoryFirst"));
      return;
    }

    const payload = {
      category_id: selectedTreeNode.id,
      name: productForm.name,
      barcode: productForm.barcode || null,
      purchase_price: Number(productForm.purchase_price),
      sale_price: Number(productForm.sale_price),
      quantity: Number(productForm.quantity),
      min_stock_alert: 5,
      min_expiry_alert: 7,
    };

    if (editingProductId) {
      updateProductMutation.mutate({ id: editingProductId, payload });
      return;
    }

    createProductMutation.mutate(payload);
  }

  function requestDeleteProduct(id) {
    setProductToDelete(id);
    setShowDeleteProductModal(true);
  }

  function confirmDeleteProduct() {
    if (!productToDelete) {
      return;
    }

    deleteProductMutation.mutate(productToDelete);
  }

  function toggleExpand(id) {
    setExpandedIds((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }

  function renderTree(nodes, level = 1) {
    return nodes.map((node) => {
      const hasChildren = node.children?.length > 0;
      const isExpanded = expandedIds.has(node.id);
      const isSelected = selectedCategoryId === node.id;

      return (
        <div key={node.id} className="space-y-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryId(node.id)}
            className={`w-full rounded-xl px-3 py-2 text-start transition-all border ${
              isSelected
                ? "border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700"
                : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
            style={{ marginInlineStart: `${(level - 1) * 12}px` }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <span
                  className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700 text-xs"
                  onClick={(event) => {
                    event.stopPropagation();

                    if (hasChildren) {
                      toggleExpand(node.id);
                    }
                  }}
                >
                  {hasChildren ? (isExpanded ? "-" : "+") : "•"}
                </span>
                <span className="truncate font-semibold text-gray-800 dark:text-gray-100">
                  {node.name}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  {t("level")} {Math.min(level, MAX_LEVEL)}
                </span>
                <span className="text-[11px] px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-200">
                  {node.products_count || 0}
                </span>
              </div>
            </div>
          </button>

          {hasChildren && isExpanded && (
            <div className="space-y-1">
              {renderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("manageCategories")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {categories.length} {t("categories")}
          </p>
        </div>
        <button
          onClick={openCreateCategoryModal}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span>
          <span>{t("addCategory")}</span>
        </button>
      </div>

      {categoryTree.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="card xl:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("categoryTree")}
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                {MAX_LEVEL} {t("levels")}
              </span>
            </div>

            <div className="max-h-[620px] overflow-auto pe-1 space-y-1">
              {renderTree(categoryTree)}
            </div>
          </div>

          <div className="card xl:col-span-8 space-y-4">
            {selectedTreeNode ? (
              <>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedTreeNode.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedTreeNode.description || t("description")} -{" "}
                      {t("productsCount")}:{" "}
                      {selectedTreeNode.products_count || 0}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-secondary"
                      onClick={() => openEditCategoryModal(selectedCategory)}
                    >
                      {t("editCategory")}
                    </button>
                    <button
                      className="btn-secondary text-red-600"
                      onClick={() => requestDeleteCategory(selectedTreeNode.id)}
                    >
                      {t("delete")}
                    </button>
                    <button
                      className="btn-primary"
                      onClick={openCreateProductModal}
                    >
                      {t("addProduct")}
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-start font-semibold">
                            {t("productName")}
                          </th>
                          <th className="px-4 py-3 text-start font-semibold">
                            {t("barcode")}
                          </th>
                          <th className="px-4 py-3 text-start font-semibold">
                            {t("purchasePrice")}
                          </th>
                          <th className="px-4 py-3 text-start font-semibold">
                            {t("salePrice")}
                          </th>
                          <th className="px-4 py-3 text-start font-semibold">
                            {t("quantity")}
                          </th>
                          <th className="px-4 py-3 text-start font-semibold">
                            {t("actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTreeNode.products?.length > 0 ? (
                          selectedTreeNode.products.map((product) => (
                            <tr
                              key={product.id}
                              className="border-t border-gray-200 dark:border-gray-700"
                            >
                              <td className="px-4 py-3 font-medium">
                                {product.name}
                              </td>
                              <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                {product.barcode || "-"}
                              </td>
                              <td className="px-4 py-3">
                                {Number(product.purchase_price || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                {Number(product.sale_price || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                {product.quantity || 0}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                                    onClick={() =>
                                      openEditProductModal(product)
                                    }
                                  >
                                    {t("edit")}
                                  </button>
                                  <button
                                    className="px-3 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                                    onClick={() =>
                                      requestDeleteProduct(product.id)
                                    }
                                  >
                                    {t("delete")}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                            >
                              {t("noProductsInCategory")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
                {t("selectCategoryHint")}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            {t("noCategories")}
          </p>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingId ? t("editCategory") : t("addCategory")}
              </h3>
              <button onClick={closeCategoryModal} className="text-gray-500">
                X
              </button>
            </div>

            <form onSubmit={submitCategory} className="space-y-4">
              <div>
                <label className="label">{t("categoryName")}</label>
                <input
                  className="input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">{t("description")}</label>
                <textarea
                  className="input resize-none"
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>

              <div>
                <label className="label">{t("parentCategory")}</label>
                <select
                  className="input"
                  value={parentId}
                  onChange={(event) => setParentId(event.target.value)}
                >
                  <option value="">{t("noParentRoot")}</option>
                  {parentOptions.map((node) => {
                    const indent = "- ".repeat(Math.max(0, node.level - 1));
                    return (
                      <option key={node.id} value={node.id}>
                        {indent}
                        {node.name}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t("maxThreeLevelsMessage")}
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeCategoryModal}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    createCategoryMutation.isPending ||
                    updateCategoryMutation.isPending
                  }
                >
                  {editingId ? t("update") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showProductModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProductId ? t("editProduct") : t("addProduct")}
              </h3>
              <button onClick={closeProductModal} className="text-gray-500">
                X
              </button>
            </div>

            <form onSubmit={submitProduct} className="space-y-4">
              <div>
                <label className="label">{t("productName")}</label>
                <input
                  className="input"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="label">{t("barcode")}</label>
                <input
                  className="input"
                  value={productForm.barcode}
                  onChange={(event) =>
                    setProductForm((previous) => ({
                      ...previous,
                      barcode: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="label">{t("purchasePrice")}</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.purchase_price}
                    onChange={(event) =>
                      setProductForm((previous) => ({
                        ...previous,
                        purchase_price: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">{t("salePrice")}</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={productForm.sale_price}
                    onChange={(event) =>
                      setProductForm((previous) => ({
                        ...previous,
                        sale_price: event.target.value,
                      }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="label">{t("quantity")}</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={productForm.quantity}
                    onChange={(event) =>
                      setProductForm((previous) => ({
                        ...previous,
                        quantity: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={closeProductModal}
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    createProductMutation.isPending ||
                    updateProductMutation.isPending
                  }
                >
                  {editingProductId ? t("update") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteCategoryModal}
        onClose={() => {
          setShowDeleteCategoryModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDeleteCategory}
        title={t("confirmDelete")}
        message={t("confirmDeleteCategory")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        type="danger"
      />

      <ConfirmationModal
        isOpen={showDeleteProductModal}
        onClose={() => {
          setShowDeleteProductModal(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDeleteProduct}
        title={t("confirmDelete")}
        message={t("confirmDeleteProduct")}
        confirmText={t("delete")}
        cancelText={t("cancel")}
        type="danger"
      />
    </div>
  );
}

export default Categories;
