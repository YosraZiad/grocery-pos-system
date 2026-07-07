import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../context/I18nContext";
import { toast } from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faEye,
  faTrashCan,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmationModal from "../components/ConfirmationModal";
import api from "../services/api";
import ProtectedComponent from "../components/ProtectedComponent";

function SalesList() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState(null);

  // جلب المبيعات والمرتجعات الموحدة
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["salesUnified", page, search, fromDate, toDate, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "10",
      });
      if (search) params.append("search", search);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter);

      const response = await api.get(`/sales/unified?${params}`);
      return response.data;
    },
  });

  // إلغاء البيع
  const cancelSaleMutation = useMutation({
    mutationFn: async (saleId) => {
      const response = await api.put(`/sales/${saleId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["sales"]);
      toast.success(t("saleCancelledSuccessfully"));
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || t("error"));
    },
  });

  const handleCancelSale = (saleId) => {
    setSaleToCancel(saleId);
    setShowCancelModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toFixed(2)} ر.س`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  const sales = salesData?.data || [];
  const pagination = salesData || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t("salesList")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t("viewAndManageSales")}
          </p>
        </div>
        <ProtectedComponent permission="create sales">
          <button onClick={() => navigate("/sales")} className="btn-primary">
            {t("newSale")}
          </button>
        </ProtectedComponent>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="label">{t("search") || "بحث"}</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t("searchByInvoiceNumber") || "ابحث برقم الفاتورة..."}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("type") || "النوع"}</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="input w-full"
            >
              <option value="all">{t("all") || "الكل"}</option>
              <option value="sale">{t("sales") || "المبيعات"}</option>
              <option value="return">{t("returns") || "المرتجعات"}</option>
            </select>
          </div>
          <div>
            <label className="label">{t("fromDate") || "من تاريخ"}</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="input"
            />
          </div>
          <div>
            <label className="label">{t("toDate") || "إلى تاريخ"}</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearch("");
                setFromDate("");
                setToDate("");
                setTypeFilter("all");
                setPage(1);
              }}
              className="btn-secondary w-full"
            >
              {t("clearFilters") || "مسح الفلاتر"}
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("invoiceNumber") || "رقم الفاتورة"}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("type") || "النوع"}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("date") || "التاريخ"}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("user") || "المستخدم"}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("items") || "البنود"}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("total") || "الإجمالي"}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("paymentMethod") || "طريقة الدفع/الرد"}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("status") || "الحالة"}
                </th>
                <th className="px-6 py-3 text-right rtl:text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t("actions") || "الإجراءات"}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <div className="text-gray-500 dark:text-gray-400">
                      <div className="text-4xl mb-4">
                        <FontAwesomeIcon icon={faClipboardList} />
                      </div>
                      <p className="text-lg">{t("noSalesFound") || "لا توجد معاملات بعد."}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={`${sale.type}-${sale.id}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                        {sale.number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sale.type === "sale" ? (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400">
                          {t("sale") || "مبيعات"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400">
                          {t("return") || "مرتجع مبيعات"}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(sale.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {sale.user_name || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {sale.items_count || 0} {t("items") || "بنود"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-black text-gray-900 dark:text-white">
                        {sale.type === "return" ? "-" : ""}{formatCurrency(sale.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {sale.payment_method === "cash" ? (t("cash") || "نقدي") :
                         sale.payment_method === "card" ? (t("card") || "بطاقة") :
                         sale.payment_method === "transfer" ? (t("transfer") || "تحويل") :
                         sale.payment_method === "replacement" ? (t("replacement") || "سند استبدال") :
                         sale.payment_method === "hybrid" ? (t("hybrid") || "مختلط") :
                         t(sale.payment_method)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sale.status === "completed"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                        }`}
                      >
                        {sale.status === "completed" ? (t("completed") || "مكتمل") :
                         sale.status === "cancelled" ? (t("cancelled") || "ملغي") :
                         t(sale.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        {sale.type === "sale" ? (
                          <>
                            <button
                              onClick={() => navigate(`/sales/${sale.id}`)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                              title={t("viewDetails") || "عرض التفاصيل"}
                            >
                              <FontAwesomeIcon icon={faClipboardList} />
                            </button>
                            <button
                              onClick={() => navigate(`/sales/${sale.id}/invoice`)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                              title={t("viewInvoice") || "عرض الفاتورة"}
                            >
                              <FontAwesomeIcon icon={faEye} />
                            </button>
                            {sale.status === "completed" && (
                              <ProtectedComponent permission="edit sales">
                                <button
                                  onClick={() => handleCancelSale(sale.id)}
                                  disabled={cancelSaleMutation.isPending}
                                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50"
                                  title={t("cancelSale") || "إلغاء الفاتورة"}
                                >
                                  <FontAwesomeIcon icon={faTrashCan} />
                                </button>
                              </ProtectedComponent>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => navigate(`/sales-returns/${sale.id}/invoice`)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                            title={t("viewInvoice") || "عرض فاتورة المرتجع"}
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.last_page > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {t("showing")} {pagination.from} {t("to")} {pagination.to}{" "}
              {t("of")} {pagination.total} {t("results")}
            </div>
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold transition-all"
              >
                {t("previous") || "السابق"}
              </button>

              {/* أرقام الصفحات التفاعلية */}
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((pageNum) => {
                const isNearCurrent = Math.abs(pageNum - page) <= 1;
                const isFirstOrLast = pageNum === 1 || pageNum === pagination.last_page;

                if (!isNearCurrent && !isFirstOrLast) {
                  if (pageNum === 2 || pageNum === pagination.last_page - 1) {
                    return <span key={pageNum} className="text-gray-400 dark:text-gray-500 px-1 text-xs">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-black transition-all border ${
                      page === pageNum
                        ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                        : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.last_page}
                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold transition-all"
              >
                {t("next") || "التالي"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSaleToCancel(null);
        }}
        onConfirm={() => {
          if (saleToCancel) {
            cancelSaleMutation.mutate(saleToCancel);
          }
          setShowCancelModal(false);
          setSaleToCancel(null);
        }}
        title={t("confirmAction")}
        message={t("confirmCancelSale")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        type="warning"
      />
    </div>
  );
}

export default SalesList;
