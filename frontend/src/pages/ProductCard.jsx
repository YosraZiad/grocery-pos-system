import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAlignLeft,
  faBarcode,
  faBoxOpen,
  faCalendarDays,
  faChartLine,
  faFolder,
  faHashtag,
  faMoneyBillWave,
  faTag,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";

function InfoTile({ label, value, icon, tone = "indigo" }) {
  const toneClasses = {
    indigo:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-200",
    rose: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200",
    slate: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

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

  const quantity = Number(data.quantity ?? 0);
  const minStockAlert = Number(data.min_stock_alert ?? 0);
  const purchasePrice = Number(data.purchase_price || 0);
  const salePrice = Number(data.sale_price || 0);
  const isLowStock = quantity <= minStockAlert;
  const stockRatio =
    minStockAlert > 0
      ? Math.min(100, Math.round((quantity / minStockAlert) * 100))
      : 100;
  const margin =
    purchasePrice > 0
      ? (((salePrice - purchasePrice) / purchasePrice) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-gradient-to-r from-slate-50 via-white to-sky-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-950 p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-200">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white">
                <FontAwesomeIcon icon={faBoxOpen} className="h-3 w-3" />
              </span>
              {t("productCard")}
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                {data.name}
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {data.category?.name || "-"}
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {t("back")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8 space-y-6">
          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              {t("details")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoTile
                label={t("productName")}
                value={data.name}
                tone="slate"
                icon={
                  <FontAwesomeIcon icon={faAlignLeft} className="h-5 w-5" />
                }
              />
              <InfoTile
                label={t("barcode")}
                value={data.barcode || "-"}
                tone="slate"
                icon={<FontAwesomeIcon icon={faBarcode} className="h-5 w-5" />}
              />
              <InfoTile
                label={t("category")}
                value={data.category?.name || "-"}
                tone="indigo"
                icon={<FontAwesomeIcon icon={faFolder} className="h-5 w-5" />}
              />
              <InfoTile
                label={t("provider")}
                value={data.provider || "-"}
                tone="sky"
                icon={<FontAwesomeIcon icon={faUser} className="h-5 w-5" />}
              />
              <InfoTile
                label={t("unitId")}
                value={data.unit_id || "-"}
                tone="amber"
                icon={<FontAwesomeIcon icon={faHashtag} className="h-5 w-5" />}
              />
              <InfoTile
                label={t("expiryDate")}
                value={data.expiry_date || "-"}
                tone="slate"
                icon={
                  <FontAwesomeIcon icon={faCalendarDays} className="h-5 w-5" />
                }
              />
            </div>
            <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800/50 p-4">
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t("productDescription")}
              </p>
              <p className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                {data.description || "-"}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">
              {t("pricing")}
            </h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <InfoTile
                label={t("purchasePrice")}
                value={purchasePrice.toFixed(2)}
                tone="amber"
                icon={
                  <FontAwesomeIcon icon={faMoneyBillWave} className="h-5 w-5" />
                }
              />
              <InfoTile
                label={t("salePrice")}
                value={salePrice.toFixed(2)}
                tone="emerald"
                icon={<FontAwesomeIcon icon={faTag} className="h-5 w-5" />}
              />
              <InfoTile
                label={t("marginPercent")}
                value={`${margin}%`}
                tone="indigo"
                icon={
                  <FontAwesomeIcon icon={faChartLine} className="h-5 w-5" />
                }
              />
            </div>
          </div>
        </div>

        <div className="xl:col-span-4">
          <div className="space-y-4 xl:sticky xl:top-6">
            <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                {t("status")}
              </p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isLowStock
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
                  }`}
                >
                  {isLowStock ? t("lowStock") : t("available")}
                </span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {quantity}
                </span>
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-2 rounded-full ${
                    isLowStock ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.max(8, Math.min(stockRatio, 100))}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t("minimumStockAlert")}: {minStockAlert}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
              <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
                {t("inventoryInfo")}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("quantity")}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {quantity}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("minimumExpiryAlert")}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {data.min_expiry_alert ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("createdAt")}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {data.created_at
                      ? new Date(data.created_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    {t("updatedAt")}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {data.updated_at
                      ? new Date(data.updated_at).toLocaleDateString()
                      : "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
