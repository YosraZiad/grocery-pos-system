import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faUser,
  faLaptop,
  faCalendarDays,
  faCircleNotch,
  faFileCircleCheck,
  faFilter,
  faChevronLeft,
  faChevronRight,
  faXmark,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";

export default function ShiftsManagement() {
  const { t, language } = useI18n();
  const navigate = useNavigate();

  // Filters state
  const [viewingShift, setViewingShift] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [deviceNumber, setDeviceNumber] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Get Cashiers list
  const { data: usersData } = useQuery({
    queryKey: ["users-list"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data;
    },
  });

  // Get Shifts list
  const { data: shiftsData, isLoading } = useQuery({
    queryKey: [
      "shifts-list",
      page,
      selectedUser,
      selectedStatus,
      deviceNumber,
      fromDate,
      toDate,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      if (selectedUser) params.append("user_id", selectedUser);
      if (selectedStatus) params.append("status", selectedStatus);
      if (deviceNumber) params.append("device_number", deviceNumber);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const response = await api.get(`/shifts?${params.toString()}`);
      return response.data;
    },
  });

  const shifts = shiftsData?.data || [];
  const totalPages = shiftsData?.last_page || 1;

  const handleResetFilters = () => {
    setSelectedUser("");
    setSelectedStatus("");
    setDeviceNumber("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-4 border-b border-gray-200 dark:border-gray-700 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
            <FontAwesomeIcon icon={faClock} className="text-primary-500" />
            <span>{t("shiftsManagement") || "إدارة شفتات الموظفين"}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {language === "ar"
              ? "مراقبة وتتبع جميع شفتات الكاشيرية، تسويات الخزن، الفروقات الحسابية، والتقارير المالية للورديات."
              : "Monitor cashier shifts, safe reconciliation, drawer differences, and shift financial reports."}
          </p>
        </div>
        <div className="flex-shrink-0">
          <button
            onClick={() => navigate("/start-shift")}
            className="btn btn-primary px-5 py-2.5 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:shadow-primary-500/20 transition-all text-xs"
          >
            <span>+</span>
            <span>{language === "ar" ? "فتح وردية جديدة" : "Open New Shift"}</span>
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-700 p-6 shadow-sm">
        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faFilter} className="text-primary-500" />
          <span>{t("filters") || "فلترة واستعلام"}</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* User Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUser} />
              <span>{t("cashier") || "الكاشير"}</span>
            </label>
            <select
              value={selectedUser}
              onChange={(e) => {
                setSelectedUser(e.target.value);
                setPage(1);
              }}
              className="input w-full text-xs font-bold"
            >
              <option value="">{t("allCashiers") || "كل الكاشيرية"}</option>
              {(usersData?.data || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faClock} />
              <span>{t("status") || "حالة الوردية"}</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="input w-full text-xs font-bold"
            >
              <option value="">{t("allStatuses") || "كل الحالات"}</option>
              <option value="open">{language === "ar" ? "مفتوحة" : "Open"}</option>
              <option value="closed">{language === "ar" ? "مغلقة" : "Closed"}</option>
            </select>
          </div>

          {/* Device Number Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLaptop} />
              <span>{t("device") || "رقم الجهاز"}</span>
            </label>
            <input
              type="text"
              placeholder={language === "ar" ? "مثال: POS-01" : "e.g. POS-01"}
              value={deviceNumber}
              onChange={(e) => {
                setDeviceNumber(e.target.value);
                setPage(1);
              }}
              className="input w-full text-xs font-bold"
            />
          </div>

          {/* Date From Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendarDays} />
              <span>{language === "ar" ? "من تاريخ" : "From Date"}</span>
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="input w-full text-xs font-bold"
            />
          </div>

          {/* Date To Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendarDays} />
              <span>{language === "ar" ? "إلى تاريخ" : "To Date"}</span>
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="input w-full text-xs font-bold"
            />
          </div>
        </div>

        {/* Reset filters button */}
        {(selectedUser || selectedStatus || deviceNumber || fromDate || toDate) && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleResetFilters}
              className="btn btn-ghost text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            >
              {language === "ar" ? "إعادة تعيين الفلاتر" : "Reset Filters"}
            </button>
          </div>
        )}
      </div>

      {/* Shifts Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-150 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-150 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faFileCircleCheck} className="text-primary-500" />
            <span>{t("shiftsList") || "سجل شفتات النظام"}</span>
          </h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-4xl text-primary-500" />
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              {language === "ar" ? "جاري جلب بيانات الورديات..." : "Fetching shifts records..."}
            </p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">📂</span>
            <h3 className="text-lg font-bold text-gray-950 dark:text-white">
              {language === "ar" ? "لا توجد شفتات مطابقة" : "No matching shifts found"}
            </h3>
            <p className="text-gray-550 dark:text-gray-400 text-sm mt-1 max-w-sm">
              {language === "ar"
                ? "تأكد من صحة الفلاتر المختارة أو أعد البحث لاكتشاف الورديات."
                : "Verify your filters or reset search settings to view shift entries."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-gray-750 dark:text-gray-300 text-xs">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 text-start">{t("shiftNumber") || "رقم الشفت"}</th>
                  <th className="py-4 px-6 text-start">{t("cashier") || "الموظف"}</th>
                  <th className="py-4 px-6 text-start">{t("device") || "الجهاز"}</th>
                  <th className="py-4 px-6 text-center">{language === "ar" ? "الافتتاحية" : "Opening"}</th>
                  <th className="py-4 px-6 text-center">{language === "ar" ? "الفعلي (كاش/شبكة)" : "Actual (Cash/Card)"}</th>
                  <th className="py-4 px-6 text-center">{language === "ar" ? "المتوقع (كاش/شبكة)" : "Expected (Cash/Card)"}</th>
                  <th className="py-4 px-6 text-center">{t("difference") || "الفارق"}</th>
                  <th className="py-4 px-6 text-center">{t("status") || "الحالة"}</th>
                  <th className="py-4 px-6 text-center">{t("openedAt") || "تاريخ الفتح"}</th>
                  <th className="py-4 px-6 text-center">{language === "ar" ? "الإجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
                {shifts.map((shift) => {
                  const actualCash = parseFloat(shift.actual_cash ?? 0);
                  const actualCard = parseFloat(shift.actual_card ?? 0);
                  const expectedCash = parseFloat(shift.expected_cash ?? 0);
                  const expectedCard = parseFloat(shift.expected_card ?? 0);
                  const difference = parseFloat(shift.difference ?? 0);

                  const isClosed = shift.status === "closed";

                  return (
                    <tr
                      key={shift.id}
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-900/10 transition-colors"
                    >
                      <td className="py-4 px-6 font-bold text-gray-950 dark:text-white">
                        {shift.shift_number}
                      </td>
                      <td className="py-4 px-6 font-bold">
                        {shift.user?.name || `User #${shift.user_id}`}
                      </td>
                      <td className="py-4 px-6 font-bold">
                        {shift.device_number || "-"}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-gray-900 dark:text-white">
                        {parseFloat(shift.opening_float).toFixed(2)}
                      </td>
                      <td className="py-4 px-6 text-center font-mono">
                        {isClosed ? (
                          <div className="flex flex-col text-[10px] font-bold">
                            <span className="text-gray-900 dark:text-white">{actualCash.toFixed(2)} ر.س</span>
                            <span className="text-gray-400 font-medium">/{actualCard.toFixed(2)} ر.س</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-mono">
                        {isClosed ? (
                          <div className="flex flex-col text-[10px] font-bold">
                            <span className="text-gray-900 dark:text-white">{expectedCash.toFixed(2)} ر.س</span>
                            <span className="text-gray-400 font-medium">/{expectedCard.toFixed(2)} ر.س</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold">
                        {isClosed ? (
                          <span
                            className={
                              difference < -0.01
                                ? "text-red-500"
                                : difference > 0.01
                                ? "text-amber-500"
                                : "text-green-500"
                            }
                          >
                            {difference > 0.01 ? "+" : ""}
                            {difference.toFixed(2)} ر.س
                          </span>
                        ) : (
                          <span className="text-gray-400 font-semibold">-</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {isClosed ? (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-black text-[9px] uppercase border border-gray-200 dark:border-gray-600">
                            {language === "ar" ? "مغلقة" : "Closed"}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 rounded-full font-black text-[9px] uppercase border border-green-200 dark:border-green-900/30 animate-pulse">
                            {language === "ar" ? "نشطة" : "Active"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center font-mono font-bold text-gray-500 dark:text-gray-400">
                        {new Date(shift.opened_at).toLocaleString(
                          language === "ar" ? "ar-SA" : "en-US",
                          { dateStyle: "short", timeStyle: "short" }
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <button
                            onClick={() => setViewingShift(shift)}
                            className="btn btn-ghost text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950/20 px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] flex items-center gap-1"
                            title={language === "ar" ? "عرض التفاصيل" : "View Details"}
                          >
                            <FontAwesomeIcon icon={faEye} />
                            <span>{language === "ar" ? "عرض" : "View"}</span>
                          </button>
                          {isClosed && (
                            <button
                              onClick={() => navigate(`/shifts/${shift.id}/z-report`)}
                              className="btn btn-ghost text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-xl font-bold transition-all text-[11px]"
                            >
                              Z-Report
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-150 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {language === "ar"
                ? `صفحة ${page} من ${totalPages}`
                : `Page ${page} of ${totalPages}`}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={language === "ar" ? faChevronRight : faChevronLeft} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-900 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={language === "ar" ? faChevronLeft : faChevronRight} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shift Details Modal */}
      {viewingShift && (
        <div className="fixed inset-0 z-50 overflow-y-auto modal">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setViewingShift(null)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full border-2 border-primary-500 overflow-hidden transition-all duration-300">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-750">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{language === "ar" ? `تفاصيل الوردية: ${viewingShift.shift_number}` : `Shift Details: ${viewingShift.shift_number}`}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setViewingShift(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-750 transition-all"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* General Info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-primary-600 dark:text-primary-400 pb-1 border-b border-gray-100 dark:border-gray-700">
                      {language === "ar" ? "المعلومات العامة" : "General Info"}
                    </h4>
                    <div className="space-y-2 text-xs text-start rtl:text-right">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "الكاشير / الموظف:" : "Cashier:"}</span>
                        <span className="font-bold text-gray-850 dark:text-gray-200">{viewingShift.user?.name || `User #${viewingShift.user_id}`}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "رقم الجهاز:" : "Device Number:"}</span>
                        <span className="font-bold text-gray-850 dark:text-gray-200">{viewingShift.device_number || "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "الحالة:" : "Status:"}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          viewingShift.status === "open" 
                            ? "bg-green-100 text-green-800 dark:bg-green-950/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}>
                          {viewingShift.status === "open" ? (language === "ar" ? "نشطة" : "Active") : (language === "ar" ? "مغلقة" : "Closed")}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "تاريخ الفتح:" : "Opened At:"}</span>
                        <span className="font-mono text-gray-850 dark:text-gray-200">
                          {new Date(viewingShift.opened_at).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                        </span>
                      </div>
                      {viewingShift.closed_at && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">{language === "ar" ? "تاريخ الإغلاق:" : "Closed At:"}</span>
                          <span className="font-mono text-gray-850 dark:text-gray-200">
                            {new Date(viewingShift.closed_at).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Info */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-primary-600 dark:text-primary-400 pb-1 border-b border-gray-100 dark:border-gray-700">
                      {language === "ar" ? "التسوية المالية" : "Financial Reconciliation"}
                    </h4>
                    <div className="space-y-2 text-xs text-start rtl:text-right">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "العهدة الافتتاحية:" : "Opening Float:"}</span>
                        <span className="font-mono font-bold">{parseFloat(viewingShift.opening_float).toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "الكاش الفعلي:" : "Actual Cash:"}</span>
                        <span className="font-mono font-bold text-gray-850 dark:text-gray-250">
                          {viewingShift.status === "closed" ? `${parseFloat(viewingShift.actual_cash || 0).toFixed(2)} ر.س` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{language === "ar" ? "الشبكة الفعلي:" : "Actual Card:"}</span>
                        <span className="font-mono font-bold text-gray-850 dark:text-gray-250">
                          {viewingShift.status === "closed" ? `${parseFloat(viewingShift.actual_card || 0).toFixed(2)} ر.س` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 font-bold">
                        <span className="text-gray-700 dark:text-gray-300">{language === "ar" ? "إجمالي الفعلي:" : "Total Actual:"}</span>
                        <span className="font-mono">
                          {viewingShift.status === "closed" ? `${(parseFloat(viewingShift.actual_cash || 0) + parseFloat(viewingShift.actual_card || 0)).toFixed(2)} ر.س` : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-700 dark:text-gray-300">{language === "ar" ? "إجمالي المتوقع:" : "Total Expected:"}</span>
                        <span className="font-mono">
                          {viewingShift.status === "closed" ? `${(parseFloat(viewingShift.expected_cash || 0) + parseFloat(viewingShift.expected_card || 0)).toFixed(2)} ر.س` : "-"}
                        </span>
                      </div>
                      {viewingShift.status === "closed" && (
                        <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-2 font-black">
                          <span className="text-gray-900 dark:text-white">{language === "ar" ? "الفارق:" : "Difference:"}</span>
                          <span className={`font-mono ${
                            parseFloat(viewingShift.difference || 0) < -0.01 
                              ? "text-red-500" 
                              : parseFloat(viewingShift.difference || 0) > 0.01 
                              ? "text-amber-500" 
                              : "text-green-500"
                          }`}>
                            {parseFloat(viewingShift.difference || 0) > 0.01 ? "+" : ""}
                            {parseFloat(viewingShift.difference || 0).toFixed(2)} ر.س
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {viewingShift.justification_notes && (
                  <div className="space-y-2 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 text-start rtl:text-right">
                    <span className="text-xs text-gray-500 font-bold block">{language === "ar" ? "تبرير الفوارق / الملاحظات:" : "Justification Notes:"}</span>
                    <p className="text-xs text-gray-750 dark:text-gray-300 leading-relaxed font-semibold italic">"{viewingShift.justification_notes}"</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end p-5 bg-gray-50 dark:bg-gray-850 border-t border-gray-200 dark:border-gray-750 gap-3">
                {viewingShift.status === "closed" && (
                  <button
                    onClick={() => {
                      const id = viewingShift.id;
                      setViewingShift(null);
                      navigate(`/shifts/${id}/z-report`);
                    }}
                    className="btn btn-primary text-xs font-bold"
                  >
                    {language === "ar" ? "طباعة Z-Report" : "Print Z-Report"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingShift(null)}
                  className="btn btn-secondary text-xs font-bold"
                >
                  {language === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
