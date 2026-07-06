import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faUserPlus,
  faPenToSquare,
  faTrashCan,
  faXmark,
  faUser,
  faPhone,
  faWallet,
  faSpinner,
  faClock,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import ConfirmationModal from "../components/ConfirmationModal";
import api from "../services/api";
import ProtectedComponent from "../components/ProtectedComponent";

function Customers() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    balance: 0.00,
  });

  const protectedPhones = ["0500000000", "0500000001", "0500000002", "0500050000"];

  // جلب العملاء
  const { data: customersData, isLoading } = useQuery({
    queryKey: ["customers", search, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "15",
      });
      if (search) params.append("search", search);
      const response = await api.get(`/customers?${params.toString()}`);
      return response.data;
    },
  });

  // إضافة عميل
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.post("/customers", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      setShowModal(false);
      setFormData({ name: "", phone: "", balance: 0.00 });
      setEditingCustomer(null);
      toast.success(t("customerAddedSuccessfully"));
    },
    onError: (error) => {
      const message = error.response?.data?.message || t("errorCreatingCustomer") || "فشل إضافة العميل.";
      toast.error(message);
    },
  });

  // تحديث عميل
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await api.put(`/customers/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      setShowModal(false);
      setFormData({ name: "", phone: "", balance: 0.00 });
      setEditingCustomer(null);
      toast.success(t("customerUpdatedSuccessfully"));
    },
    onError: (error) => {
      const message = error.response?.data?.message || t("errorUpdatingCustomer") || "فشل تحديث بيانات العميل.";
      toast.error(message);
    },
  });

  // حذف عميل
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const response = await api.delete(`/customers/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["customers"]);
      toast.success(t("customerDeletedSuccessfully"));
    },
    onError: (error) => {
      const message = error.response?.data?.message || t("errorDeletingCustomer") || "فشل حذف العميل.";
      toast.error(message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error(t("pleaseFillFields"));
      return;
    }

    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || "",
      balance: parseFloat(customer.balance) || 0.00,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (customer) => {
    if (protectedPhones.includes(customer.phone)) {
      toast.error(t("cannotDeleteDefaultCustomer"));
      return;
    }
    setCustomerToDelete(customer.id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!customerToDelete) return;

    toast.promise(
      new Promise((resolve, reject) => {
        deleteMutation.mutate(customerToDelete, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error),
        });
      }),
      {
        loading: t("deletingCustomer") || "جاري حذف العميل...",
        success: t("customerDeletedSuccessfully") || "تم الحذف بنجاح.",
        error: t("errorDeletingCustomer") || "فشل حذف العميل.",
      }
    );
    setShowDeleteModal(false);
    setCustomerToDelete(null);
  };

  const customers = customersData?.data || [];
  const totalPages = customersData?.last_page || 1;

  return (
    <div className="space-y-6">
      {/* الترويسة والعنوان */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faUser} className="text-primary-500" />
            <span>{t("customersManagement")}</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t("manageCustomers")}
          </p>
        </div>

        <ProtectedComponent permission="create sales">
          <button
            onClick={() => {
              setEditingCustomer(null);
              setFormData({ name: "", phone: "", balance: 0.00 });
              setShowModal(true);
            }}
            className="btn btn-primary flex items-center justify-center gap-2 font-bold py-2.5 px-4 shadow-md hover:shadow-lg transition-all"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>{t("addCustomer")}</span>
          </button>
        </ProtectedComponent>
      </div>

      {/* شريط البحث والفلترة */}
      <div className="card p-4 flex flex-col md:flex-row gap-3 items-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-150 dark:border-gray-700">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder={t("searchCustomers")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pr-10 w-full focus:ring-2 focus:ring-primary-500"
          />
          <span className="absolute right-3 top-3 text-gray-400">
            <FontAwesomeIcon icon={faSearch} />
          </span>
        </div>
      </div>

      {/* قائمة العملاء */}
      <div className="card overflow-hidden bg-white dark:bg-gray-850 rounded-2xl border border-gray-150 dark:border-gray-700">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} className="animate-spin text-4xl mb-4 text-primary-500" />
            <span>{t("loadingCustomers")}</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <div className="text-6xl mb-4 opacity-40">👤</div>
            <h3 className="text-lg font-bold">{t("noCustomersFound")}</h3>
            <p className="text-sm mt-1">{t("checkSearchInput")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm text-gray-700 dark:text-gray-300">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-slate-100 font-bold text-xs tracking-wider">
                  <th className="py-4 px-5 text-start">{t("customer")}</th>
                  <th className="py-4 px-5 text-start">{t("phone")}</th>
                  <th className="py-4 px-5 text-center">{t("type")}</th>
                  <th className="py-4 px-5 text-center">{t("availableBalance")}</th>
                  <th className="py-4 px-5 text-center w-28">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-750">
                {customers.map((customer) => {
                  const isDefault = protectedPhones.includes(customer.phone);
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-55 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                            customer.is_temporary
                              ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                              : isDefault
                              ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                              : "bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400"
                          }`}>
                            {isDefault ? <FontAwesomeIcon icon={faShieldHalved} /> : <FontAwesomeIcon icon={faUser} />}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                              {customer.name}
                              {isDefault && (
                                <span className="px-1.5 py-0.5 text-[9px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded font-bold border border-blue-200 dark:border-blue-800">
                                  {t("defaultSystem")}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                              <FontAwesomeIcon icon={faClock} />
                              <span>{t("registeredSince")} {new Date(customer.created_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5 font-mono text-gray-900 dark:text-white">
                        {customer.phone || "—"}
                      </td>
                      <td className="py-4 px-5 text-center">
                        {customer.is_temporary ? (
                          <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-900/40">
                            {t("temporaryReturn")}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-200 dark:border-green-900/40">
                            {t("permanent")}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center font-mono font-bold">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg ${
                          parseFloat(customer.balance) > 0
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900"
                            : "text-gray-400"
                        }`}>
                          <FontAwesomeIcon icon={faWallet} />
                          <span>{parseFloat(customer.balance).toFixed(2)} {t("sar") || "ر.س"}</span>
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="flex justify-center gap-2">
                          <ProtectedComponent permission="create sales">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-primary-100 dark:bg-gray-700 dark:hover:bg-primary-950/40 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center justify-center transition-all duration-200"
                              title={t("edit") || "تعديل"}
                            >
                              <FontAwesomeIcon icon={faPenToSquare} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(customer)}
                              disabled={isDefault}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                                isDefault
                                  ? "bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-700 cursor-not-allowed"
                                  : "bg-gray-100 hover:bg-red-100 dark:bg-gray-700 dark:hover:bg-red-950/40 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              }`}
                              title={isDefault ? t("cannotDeleteDefaultCustomer") : (t("delete") || "حذف")}
                            >
                              <FontAwesomeIcon icon={faTrashCan} />
                            </button>
                          </ProtectedComponent>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* أزرار الصفحات */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-850/50 border-t border-gray-150 dark:border-gray-750 flex items-center justify-between flex-wrap gap-2 text-xs font-bold text-gray-500 dark:text-gray-400">
            <div>
              {t("page")} {page} {t("of")} {totalPages}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary px-3 py-1.5 disabled:opacity-50 text-xs font-bold"
              >
                {t("previous")}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary px-3 py-1.5 disabled:opacity-50 text-xs font-bold"
              >
                {t("next")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal إضافة/تعديل عميل */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="modal-content w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-250 dark:border-gray-700 animate-scaleUp">
            <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-750">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FontAwesomeIcon icon={editingCustomer ? faPenToSquare : faUserPlus} className="text-primary-500" />
                <span>{editingCustomer ? t("editCustomer") : t("addCustomer")}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="label font-bold flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                    <span>{t("customerName")} <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "ar" ? "مثال: محمد علي" : "e.g. John Doe"}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="label font-bold flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faPhone} className="text-gray-400" />
                    <span>{t("phone")} <span className="text-red-500">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={language === "ar" ? "مثال: 0501234567" : "e.g. 0501234567"}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input w-full font-mono"
                  />
                </div>

                {editingCustomer && (
                  <div className="space-y-1">
                    <label className="label font-bold flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faWallet} className="text-gray-400" />
                      <span>{t("balanceSAR")} <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0.00 })}
                      className="input w-full font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-750 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary font-bold py-2 px-4 text-xs"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn btn-primary font-bold py-2 px-5 text-xs flex items-center gap-1.5"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  ) : null}
                  <span>{editingCustomer ? t("updateAccount") : t("addAccount")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة التأكيد لحذف عميل */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setCustomerToDelete(null);
        }}
        onConfirm={confirmDelete}
        title={t("deleteCustomer")}
        message={t("deleteCustomerConfirm")}
        confirmText={t("yesDelete")}
        cancelText={t("cancel")}
        type="danger"
      />
    </div>
  );
}

export default Customers;
