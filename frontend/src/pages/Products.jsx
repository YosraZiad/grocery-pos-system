import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ConfirmationModal from "../components/ConfirmationModal";
import ProductForm from "../components/ProductForm";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";

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

function findPathToCategory(nodes, id, path = []) {
  for (const node of nodes) {
    const nextPath = [...path, node];
    if (node.id === id) {
      return nextPath;
    }

    if (node.children?.length) {
      const found = findPathToCategory(node.children, id, nextPath);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [openActionMenuCategoryId, setOpenActionMenuCategoryId] =
    useState(null);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showDeleteProductModal, setShowDeleteProductModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    parent_id: "",
  });

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");

  const [createdFrom, setCreatedFrom] = useState("");
  const [createdTo, setCreatedTo] = useState("");
  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { data: categoriesResponse, isLoading: loadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data;
    },
  });

  const categoryTree = categoriesResponse?.tree || [];

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

  const selectedNode = selectedCategoryId
    ? findTreeNodeById(categoryTree, selectedCategoryId)
    : null;

  const isLeafCategory =
    Boolean(selectedNode) && (selectedNode.children?.length || 0) === 0;

  const selectedCategoryPath = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }

    return findPathToCategory(categoryTree, selectedCategoryId) || [];
  }, [categoryTree, selectedCategoryId]);

  const { data: productsResponse, isLoading: loadingProducts } = useQuery({
    queryKey: [
      "products",
      selectedCategoryId,
      page,
      perPage,
      searchTerm,
      createdFrom,
      createdTo,
      minQty,
      maxQty,
      minPrice,
      maxPrice,
      sortBy,
      sortDirection,
    ],
    queryFn: async () => {
      const response = await api.get("/products", {
        params: {
          category_id: selectedCategoryId || undefined,
          search: searchTerm || undefined,
          per_page: perPage,
          page,
          created_from: createdFrom || undefined,
          created_to: createdTo || undefined,
          min_quantity: minQty !== "" ? Number(minQty) : undefined,
          max_quantity: maxQty !== "" ? Number(maxQty) : undefined,
          min_price: minPrice !== "" ? Number(minPrice) : undefined,
          max_price: maxPrice !== "" ? Number(maxPrice) : undefined,
          sort_by: sortBy,
          sort_direction: sortDirection,
        },
      });
      return response.data;
    },
    enabled: !!selectedCategoryId,
  });

  const paginatedProducts = productsResponse?.data || [];
  const displayedProducts = paginatedProducts;

  const allCategoryProductsCount = useMemo(() => {
    const walk = (nodes) =>
      nodes.reduce((sum, node) => {
        return sum + (node.products_count || 0) + walk(node.children || []);
      }, 0);

    return walk(categoryTree);
  }, [categoryTree]);

  const hasActiveProductFilters =
    Boolean(searchTerm) ||
    Boolean(createdFrom) ||
    Boolean(createdTo) ||
    minQty !== "" ||
    maxQty !== "" ||
    minPrice !== "" ||
    maxPrice !== "";

  const createProductMutation = useMutation({
    mutationFn: async (rawData) => {
      const payload = {
        category_id: Number(rawData.category_id),
        name: rawData.name,
        barcode: rawData.barcode || null,
        description: rawData.description || null,
        unit_id: rawData.unit_id ? Number(rawData.unit_id) : null,
        provider: rawData.provider || null,
        purchase_price: Number(rawData.purchase_price || 0),
        sale_price: Number(rawData.sale_price || 0),
        quantity: Number(rawData.quantity || 0),
        expiry_date: rawData.expiry_date || null,
        min_stock_alert: Number(rawData.min_stock_alert || 5),
        min_expiry_alert: Number(rawData.min_expiry_alert || 7),
      };

      const response = await api.post("/products", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowProductModal(false);
      setEditingProduct(null);
      toast.success(t("productCreatedSuccessfully"));
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : null) ||
        t("errorCreatingProduct");
      toast.error(message);
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, rawData }) => {
      const payload = {
        category_id: Number(rawData.category_id),
        name: rawData.name,
        barcode: rawData.barcode || null,
        description: rawData.description || null,
        unit_id: rawData.unit_id ? Number(rawData.unit_id) : null,
        provider: rawData.provider || null,
        purchase_price: Number(rawData.purchase_price || 0),
        sale_price: Number(rawData.sale_price || 0),
        quantity: Number(rawData.quantity || 0),
        expiry_date: rawData.expiry_date || null,
        min_stock_alert: Number(rawData.min_stock_alert || 5),
        min_expiry_alert: Number(rawData.min_expiry_alert || 7),
      };

      const response = await api.put(`/products/${id}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setShowProductModal(false);
      setEditingProduct(null);
      toast.success(t("productUpdatedSuccessfully"));
    },
    onError: (error) => {
      const message =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? Object.values(error.response.data.errors).flat().join(", ")
          : null) ||
        t("errorUpdatingProduct");
      toast.error(message);
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/products/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("productDeletedSuccessfully"));
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || t("errorDeletingProduct");
      toast.error(message);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/categories", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", parent_id: "" });
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
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: "", description: "", parent_id: "" });
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

  const handleProductSubmit = (formData) => {
    if (editingProduct) {
      updateProductMutation.mutate({
        id: editingProduct.id,
        rawData: formData,
      });
      return;
    }

    createProductMutation.mutate(formData);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = (id) => {
    setProductToDelete(id);
    setShowDeleteProductModal(true);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) {
      return;
    }

    deleteProductMutation.mutate(productToDelete);
    setShowDeleteProductModal(false);
    setProductToDelete(null);
  };

  const handleCloseProductModal = () => {
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleSelectCategory = (id) => {
    setSelectedCategoryId(id);
    setSearchTerm("");
    setPage(1);
  };

  const openCreateCategory = (parentCategoryId) => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      parent_id: parentCategoryId ? String(parentCategoryId) : "",
    });
    setShowCategoryModal(true);
    setOpenActionMenuCategoryId(null);
  };

  const openEditCategory = (categoryId) => {
    const node = findTreeNodeById(categoryTree, categoryId);
    if (!node) {
      return;
    }

    setEditingCategory(node);
    setCategoryForm({
      name: node.name || "",
      description: node.description || "",
      parent_id: node.parent_id ? String(node.parent_id) : "",
    });
    setShowCategoryModal(true);
    setOpenActionMenuCategoryId(null);
  };

  const openDeleteCategory = (categoryId) => {
    setCategoryToDelete(categoryId);
    setShowDeleteCategoryModal(true);
    setOpenActionMenuCategoryId(null);
  };

  const confirmDeleteCategory = () => {
    if (!categoryToDelete) {
      return;
    }

    const node = findTreeNodeById(categoryTree, categoryToDelete);

    if (node?.children?.length) {
      toast.error(t("cannotDeleteCategoryWithChildren"));
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      return;
    }

    if ((node?.products_count || 0) > 0) {
      toast.error(t("cannotDeleteCategoryWithProducts"));
      setShowDeleteCategoryModal(false);
      setCategoryToDelete(null);
      return;
    }

    deleteCategoryMutation.mutate(categoryToDelete);
    setShowDeleteCategoryModal(false);
    setCategoryToDelete(null);
  };

  const submitCategory = (event) => {
    event.preventDefault();

    const payload = {
      name: categoryForm.name,
      description: categoryForm.description || null,
      parent_id: categoryForm.parent_id ? Number(categoryForm.parent_id) : null,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, payload });
      return;
    }

    createCategoryMutation.mutate(payload);
  };

  const openCreateProductForCategory = (categoryId) => {
    const node = findTreeNodeById(categoryTree, categoryId);
    if (!node) {
      return;
    }

    if ((node.children?.length || 0) > 0) {
      toast.error(t("leafOnlyProducts"));
      setOpenActionMenuCategoryId(null);
      return;
    }

    setSelectedCategoryId(node.id);
    setEditingProduct(null);
    setShowProductModal(true);
    setOpenActionMenuCategoryId(null);
  };

  const getStockStatus = (product) => {
    if (Number(product.quantity) <= Number(product.min_stock_alert || 0)) {
      return {
        text: t("lowStock"),
        color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      };
    }

    return {
      text: t("available"),
      color:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    };
  };

  const toggleExpand = (id) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderTree = (nodes, level = 1) => {
    return nodes.map((node) => {
      const hasChildren = node.children?.length > 0;
      const isExpanded = expandedIds.has(node.id);
      const isSelected = selectedCategoryId === node.id;

      return (
        <div key={node.id} className="space-y-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => handleSelectCategory(node.id)}
              className={`w-full rounded-xl px-3 py-2 text-start transition-all border ${
                isSelected
                  ? "border-primary-300 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-700"
                  : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
              style={{ marginInlineStart: `${(level - 1) * 16}px` }}
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
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-200">
                    {node.products_count || 0}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-gray-300 dark:border-gray-700 text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      setOpenActionMenuCategoryId((previous) =>
                        previous === node.id ? null : node.id,
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpenActionMenuCategoryId((previous) =>
                          previous === node.id ? null : node.id,
                        );
                      }
                    }}
                  >
                    ...
                  </span>
                </div>
              </div>
            </button>

            {openActionMenuCategoryId === node.id && (
              <div className="absolute z-20 mt-1 end-0 w-44 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-1">
                <button
                  type="button"
                  className="w-full text-start px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  onClick={() => openCreateCategory(node.id)}
                >
                  {t("addCategory")}
                </button>
                <button
                  type="button"
                  className="w-full text-start px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  onClick={() => openEditCategory(node.id)}
                >
                  {t("editCategory")}
                </button>
                <button
                  type="button"
                  className="w-full text-start px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  onClick={() => openDeleteCategory(node.id)}
                >
                  {t("delete")}
                </button>
                <button
                  type="button"
                  className="w-full text-start px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  onClick={() => openCreateProductForCategory(node.id)}
                >
                  {t("addProduct")}
                </button>
              </div>
            )}
          </div>

          {hasChildren && isExpanded && (
            <div className="ms-2 ps-3 border-s-2 border-dashed border-gray-300 dark:border-gray-700 space-y-1">
              {renderTree(node.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loadingCategories) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("manageProducts")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {allCategoryProductsCount} {t("products").toLowerCase()}
          </p>
        </div>
        <button
          onClick={() => {
            if (!selectedNode) {
              toast.error(t("selectCategoryFirst"));
              return;
            }

            if (!isLeafCategory) {
              toast.error(t("leafOnlyProducts"));
              return;
            }

            setEditingProduct(null);
            setShowProductModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <span>+</span>
          <span>{t("addProduct")}</span>
        </button>
      </div>

      {categoryTree.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="card xl:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t("categoryTree")}
              </h3>
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => openCreateCategory(null)}
              >
                {t("addCategory")}
              </button>
            </div>
            <div className="max-h-[620px] overflow-auto pe-1 space-y-1">
              {renderTree(categoryTree)}
            </div>
          </div>

          <div className="card xl:col-span-8 space-y-4">
            {selectedNode ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedNode.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedNode.description || t("description")} -{" "}
                      {t("productsCount")}: {selectedNode.products_count || 0}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {selectedCategoryPath.map((category, index) => (
                        <span
                          key={category.id}
                          className="inline-flex items-center gap-2"
                        >
                          {index > 0 && <span>/</span>}
                          <span className="rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1">
                            {category.name}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!isLeafCategory) {
                        toast.error(t("leafOnlyProducts"));
                        return;
                      }

                      setEditingProduct(null);
                      setShowProductModal(true);
                    }}
                    className="btn-primary"
                  >
                    {t("addProduct")}
                  </button>
                </div>

                {!isLeafCategory && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
                    {t("leafOnlyProducts")}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) => {
                        setSearchTerm(event.target.value);
                        setPage(1);
                      }}
                      placeholder={t("searchPlaceholder")}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={sortBy}
                      onChange={(event) => {
                        setSortBy(event.target.value);
                        setPage(1);
                      }}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                    >
                      <option value="name">{t("productName")}</option>
                      <option value="purchase_price">
                        {t("purchasePrice")}
                      </option>
                      <option value="sale_price">{t("salePrice")}</option>
                      <option value="quantity">{t("quantity")}</option>
                      <option value="created_at">{t("createdAt")}</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setSortDirection((previous) =>
                          previous === "asc" ? "desc" : "asc",
                        );
                        setPage(1);
                      }}
                      className="rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm font-semibold"
                    >
                      {sortDirection === "asc" ? "A-Z" : "Z-A"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="date"
                    value={createdFrom}
                    onChange={(event) => {
                      setCreatedFrom(event.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                  <input
                    type="date"
                    value={createdTo}
                    onChange={(event) => {
                      setCreatedTo(event.target.value);
                      setPage(1);
                    }}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                  <select
                    value={perPage}
                    onChange={(event) => {
                      setPerPage(Number(event.target.value));
                      setPage(1);
                    }}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  >
                    <option value={10}>10 / page</option>
                    <option value={20}>20 / page</option>
                    <option value={50}>50 / page</option>
                  </select>
                  <input
                    type="number"
                    value={minQty}
                    onChange={(event) => {
                      setMinQty(event.target.value);
                      setPage(1);
                    }}
                    placeholder={t("minQuantity")}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={maxQty}
                    onChange={(event) => {
                      setMaxQty(event.target.value);
                      setPage(1);
                    }}
                    placeholder={t("maxQuantity")}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={minPrice}
                    onChange={(event) => {
                      setMinPrice(event.target.value);
                      setPage(1);
                    }}
                    placeholder={t("minPrice")}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={maxPrice}
                    onChange={(event) => {
                      setMaxPrice(event.target.value);
                      setPage(1);
                    }}
                    placeholder={t("maxPrice")}
                    className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
                  />
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
                            {t("status")}
                          </th>
                          <th className="px-4 py-3 text-start font-semibold">
                            {t("actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingProducts ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                            >
                              {t("loading")}
                            </td>
                          </tr>
                        ) : displayedProducts.length > 0 ? (
                          displayedProducts.map((product) => {
                            const stockStatus = getStockStatus(product);
                            return (
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
                                  {Number(product.purchase_price || 0).toFixed(
                                    2,
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {Number(product.sale_price || 0).toFixed(2)}
                                </td>
                                <td className="px-4 py-3">
                                  {product.quantity || 0}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${stockStatus.color}`}
                                  >
                                    {stockStatus.text}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <button
                                      className="px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                      onClick={() =>
                                        navigate(`/products/${product.id}`)
                                      }
                                    >
                                      {t("view")}
                                    </button>
                                    <button
                                      className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                                      onClick={() => handleEditProduct(product)}
                                    >
                                      {t("edit")}
                                    </button>
                                    <button
                                      className="px-3 py-1 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200"
                                      onClick={() =>
                                        handleDeleteProduct(product.id)
                                      }
                                    >
                                      {t("delete")}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={7}
                              className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                            >
                              {hasActiveProductFilters
                                ? t("noResultsFound")
                                : t("noProductsInCategory")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t("showing")} {productsResponse?.from || 0} -{" "}
                    {productsResponse?.to || 0} {t("of")}{" "}
                    {productsResponse?.total || 0}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!productsResponse?.prev_page_url}
                      onClick={() =>
                        setPage((previous) => Math.max(previous - 1, 1))
                      }
                      className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                    >
                      {t("previous")}
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {productsResponse?.current_page || 1} /{" "}
                      {productsResponse?.last_page || 1}
                    </span>
                    <button
                      type="button"
                      disabled={!productsResponse?.next_page_url}
                      onClick={() =>
                        setPage((previous) =>
                          Math.min(
                            previous + 1,
                            productsResponse?.last_page || previous + 1,
                          ),
                        )
                      }
                      className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 disabled:opacity-50"
                    >
                      {t("next")}
                    </button>
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

      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingProduct ? t("editProduct") : t("addProduct")}
              </h3>
              <button
                onClick={handleCloseProductModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                x
              </button>
            </div>
            <ProductForm
              product={editingProduct}
              defaultCategoryId={selectedCategoryId}
              lockCategory={!editingProduct}
              onSubmit={handleProductSubmit}
              onCancel={handleCloseProductModal}
              isLoading={
                createProductMutation.isPending ||
                updateProductMutation.isPending
              }
              hidePricingQuantity
              showAdvancedFields
            />
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingCategory ? t("editCategory") : t("addCategory")}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                x
              </button>
            </div>
            <form className="space-y-4" onSubmit={submitCategory}>
              <div>
                <label className="label">{t("categoryName")} *</label>
                <input
                  className="input"
                  value={categoryForm.name}
                  onChange={(event) =>
                    setCategoryForm((previous) => ({
                      ...previous,
                      name: event.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div>
                <label className="label">{t("description")}</label>
                <textarea
                  className="input min-h-[88px]"
                  value={categoryForm.description}
                  onChange={(event) =>
                    setCategoryForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <label className="label">{t("parentCategory")}</label>
                <select
                  className="input"
                  value={categoryForm.parent_id}
                  onChange={(event) =>
                    setCategoryForm((previous) => ({
                      ...previous,
                      parent_id: event.target.value,
                    }))
                  }
                >
                  <option value="">{t("noParentRoot")}</option>
                  {categoriesResponse?.data?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowCategoryModal(false);
                    setEditingCategory(null);
                  }}
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
                  {editingCategory ? t("update") : t("save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteProductModal}
        onClose={() => {
          setShowDeleteProductModal(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDeleteProduct}
        title={t("confirmDelete") || "Confirm Delete"}
        message={
          t("confirmDeleteProduct") ||
          "Are you sure you want to delete this product?"
        }
        confirmText={t("delete") || "Delete"}
        cancelText={t("cancel") || "Cancel"}
        type="danger"
      />

      <ConfirmationModal
        isOpen={showDeleteCategoryModal}
        onClose={() => {
          setShowDeleteCategoryModal(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDeleteCategory}
        title={t("confirmDeleteCategory") || "Confirm Delete"}
        message={
          t("confirmDeleteCategory") ||
          "Are you sure you want to delete this category?"
        }
        confirmText={t("delete") || "Delete"}
        cancelText={t("cancel") || "Cancel"}
        type="danger"
      />
    </div>
  );
}

export default Products;
