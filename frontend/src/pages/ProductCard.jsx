import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import api from "../services/api";

function ProductCard() {
  const { id } = useParams();
  const { t } = useI18n();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data?.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
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

  if (isError || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-600 dark:text-gray-400">{t("error")}</p>
        <Link to="/products" className="btn-secondary mt-4 inline-flex">
          {t("back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t("productCard")}
        </h2>
        <Link to="/products" className="btn-secondary">
          {t("back")}
        </Link>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("productName")}
            </p>
            <p className="text-lg font-semibold">{data.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("barcode")}
            </p>
            <p className="text-lg font-semibold">{data.barcode || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("category")}
            </p>
            <p className="text-lg font-semibold">
              {data.category?.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("unitId")}
            </p>
            <p className="text-lg font-semibold">{data.unit_id || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("provider")}
            </p>
            <p className="text-lg font-semibold">{data.provider || "-"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("productDescription")}
            </p>
            <p className="text-lg font-semibold">{data.description || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("purchasePrice")}
            </p>
            <p className="text-lg font-semibold">
              {Number(data.purchase_price || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("salePrice")}
            </p>
            <p className="text-lg font-semibold">
              {Number(data.sale_price || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("quantity")}
            </p>
            <p className="text-lg font-semibold">{data.quantity ?? 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("expiryDate")}
            </p>
            <p className="text-lg font-semibold">{data.expiry_date || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("createdAt")}
            </p>
            <p className="text-lg font-semibold">
              {data.created_at
                ? new Date(data.created_at).toLocaleString()
                : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
