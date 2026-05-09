import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";

function ProductForm({
  product,
  onSubmit,
  onCancel,
  isLoading,
  defaultCategoryId,
  lockCategory = false,
  hidePricingQuantity = false,
  showAdvancedFields = false,
}) {
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    barcode: "",
    purchase_price: "",
    sale_price: "",
    quantity: "",
    expiry_date: "",
    min_stock_alert: "5",
    min_expiry_alert: "7",
    description: "",
    unit_id: "",
    provider: "",
  });

  // جلب الأقسام
  const { data: categoriesPayload } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await api.get("/categories");
      return response.data;
    },
  });

  const categories = useMemo(() => {
    if (Array.isArray(categoriesPayload)) {
      return categoriesPayload;
    }

    if (Array.isArray(categoriesPayload?.data)) {
      return categoriesPayload.data;
    }

    if (Array.isArray(categoriesPayload?.data?.data)) {
      return categoriesPayload.data.data;
    }

    return [];
  }, [categoriesPayload]);

  useEffect(() => {
    if (product) {
      setFormData({
        category_id: product.category_id || "",
        name: product.name || "",
        barcode: product.barcode || "",
        purchase_price: product.purchase_price || "",
        sale_price: product.sale_price || "",
        quantity: product.quantity || "",
        expiry_date: product.expiry_date || "",
        min_stock_alert: product.min_stock_alert || "5",
        min_expiry_alert: product.min_expiry_alert || "7",
        description: product.description || "",
        unit_id: product.unit_id || "",
        provider: product.provider || "",
      });
      return;
    }

    setFormData((previous) => ({
      ...previous,
      category_id: defaultCategoryId
        ? String(defaultCategoryId)
        : previous.category_id,
      purchase_price: hidePricingQuantity ? "0" : previous.purchase_price,
      sale_price: hidePricingQuantity ? "0" : previous.sale_price,
      quantity: hidePricingQuantity ? "0" : previous.quantity,
    }));
  }, [product, defaultCategoryId, hidePricingQuantity]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">{t("categories")} *</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            required
            disabled={lockCategory}
            className="input"
          >
            <option value="">{t("allCategories")}</option>
            {categories?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">{t("productName")} *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input"
            placeholder={t("productName")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">{t("barcode")}</label>
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="input"
            placeholder={t("barcode")}
          />
        </div>

        {!hidePricingQuantity && (
          <div>
            <label className="label">{t("quantity")} *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="0"
              className="input"
              placeholder={t("quantity")}
            />
          </div>
        )}
      </div>

      {!hidePricingQuantity && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t("purchasePrice")} *</label>
            <input
              type="number"
              step="0.01"
              name="purchase_price"
              value={formData.purchase_price}
              onChange={handleChange}
              required
              min="0"
              className="input"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="label">{t("salePrice")} *</label>
            <input
              type="number"
              step="0.01"
              name="sale_price"
              value={formData.sale_price}
              onChange={handleChange}
              required
              min="0"
              className="input"
              placeholder="0.00"
            />
          </div>
        </div>
      )}

      {showAdvancedFields && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t("productDescription")}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input min-h-[90px]"
              placeholder={t("productDescription")}
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="label">{t("unitId")}</label>
              <input
                type="text"
                name="unit_id"
                value={formData.unit_id}
                onChange={handleChange}
                className="input"
                placeholder={t("unitId")}
              />
            </div>
            <div>
              <label className="label">{t("provider")}</label>
              <input
                type="text"
                name="provider"
                value={formData.provider}
                onChange={handleChange}
                className="input"
                placeholder={t("provider")}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Expiry Date</label>
          <input
            type="date"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="label">Min Stock Alert</label>
          <input
            type="number"
            name="min_stock_alert"
            value={formData.min_stock_alert}
            onChange={handleChange}
            min="0"
            className="input"
            placeholder="5"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 rtl:space-x-reverse pt-4 border-t border-gray-200 dark:border-gray-700">
        <button type="button" onClick={onCancel} className="btn-secondary">
          {t("cancel")}
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary disabled:opacity-50"
        >
          {product ? t("update") : t("save")}
        </button>
      </div>
    </form>
  );
}

export default ProductForm;
