import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
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
  faMoneyBillWave,
  faDoorOpen,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";

export default function ShiftsManagement() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Filters state
  const [viewingShift, setViewingShift] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [deviceNumber, setDeviceNumber] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Start shift form states
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [openingFloat, setOpeningFloat] = useState("");
  const [startShiftDeviceNumber, setStartShiftDeviceNumber] = useState(
    localStorage.getItem("device_number") || ""
  );
  const [startShiftLoading, setStartShiftLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock updating
  useEffect(() => {
    let timer;
    if (isStartShiftOpen) {
      timer = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isStartShiftOpen]);

  const handleStartShiftSubmit = async (e) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error(
        language === "en" ? "Please select a cashier" : "الرجاء اختيار الموظف/الكاشير"
      );
      return;
    }

    if (!openingFloat || isNaN(openingFloat) || Number(openingFloat) < 0) {
      toast.error(
        language === "en"
          ? "Please enter a valid trust amount"
          : "الرجاء إدخال قيمة عهدة صالحة"
      );
      return;
    }

    if (!startShiftDeviceNumber.trim()) {
      toast.error(
        language === "en"
          ? "Please enter a device/register number"
          : "الرجاء إدخال رقم الجهاز أو الكاشير"
      );
      return;
    }

    setStartShiftLoading(true);
    try {
      await api.post("/shifts/start", {
        user_id: Number(selectedUserId),
        opening_float: Number(openingFloat),
        device_number: startShiftDeviceNumber.trim(),
      });

      // Save device number in local storage
      localStorage.setItem("device_number", startShiftDeviceNumber.trim());

      // Sound effect
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(880, ctx.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.12);
          gain1.gain.setValueAtTime(0.15, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(987, ctx.currentTime + 0.06);
          osc2.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.22);
          gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.06);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);

          osc1.start();
          osc1.stop(ctx.currentTime + 0.2);
          osc2.start(ctx.currentTime + 0.06);
          osc2.stop(ctx.currentTime + 0.3);
        }
      } catch (audioErr) {
        console.warn(audioErr);
      }

      toast.success(
        language === "en" ? "Shift opened successfully!" : "تم فتح الوردية بنجاح!"
      );

      setIsStartShiftOpen(false);
      setSelectedUserId("");
      setOpeningFloat("");
      queryClient.invalidateQueries(["shifts-list"]);
    } catch (error) {
      const errMsg =
        error.response?.data?.message ||
        (language === "en" ? "Failed to open shift." : "فشل فتح الوردية.");
      toast.error(errMsg);
    } finally {
      setStartShiftLoading(false);
    }
  };

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
            onClick={() => setIsStartShiftOpen(true)}
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
      {/* Start Shift Modal */}
      {isStartShiftOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto modal">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm" onClick={() => setIsStartShiftOpen(false)}></div>
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full border-2 border-primary-500 overflow-hidden transition-all duration-300">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FontAwesomeIcon icon={faDoorOpen} />
                  <span>{language === "ar" ? "بدء وردية جديدة" : "Open New Shift"}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsStartShiftOpen(false)}
                  className="text-white/80 hover:text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleStartShiftSubmit} className="p-6 space-y-5">
                {/* Simple displays */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl text-sm border border-gray-150 dark:border-gray-700">
                  <div className="flex items-center space-x-2.5 rtl:space-x-reverse text-gray-700 dark:text-gray-300">
                    <FontAwesomeIcon icon={faUser} className="text-primary-500" />
                    <div>
                      <span className="block text-[10px] uppercase text-gray-400">
                        {language === "ar" ? "مدير النظام" : "Admin"}
                      </span>
                      <span className="font-semibold">{user?.name || "Admin"}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 rtl:space-x-reverse text-gray-700 dark:text-gray-300">
                    <FontAwesomeIcon icon={faClock} className="text-primary-500" />
                    <div>
                      <span className="block text-[10px] uppercase text-gray-400">
                        {language === "ar" ? "تاريخ البدء" : "Shift Time"}
                      </span>
                      <span className="font-semibold text-xs">
                        {currentTime.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}{" "}
                        {currentTime.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Cashier Selection */}
                  <div>
                    <label htmlFor="modalUserId" className="label text-xs font-bold text-gray-700 dark:text-gray-300">
                      {language === "ar" ? "اختر الموظف / الكاشير *" : "Select Cashier *"}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 rtl:left-auto rtl:right-0 rtl:pr-3.5">
                        <FontAwesomeIcon icon={faUser} />
                      </span>
                      <select
                        id="modalUserId"
                        required
                        value={selectedUserId}
                        onChange={(e) => setSelectedUserId(e.target.value)}
                        className="input min-h-12 pl-10 rtl:pl-3 rtl:pr-10 text-base font-bold w-full"
                      >
                        <option value="">
                          {language === "ar" ? "-- اختر الكاشير --" : "-- Choose Cashier --"}
                        </option>
                        {(usersData?.data || []).map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Device Number Input */}
                  <div>
                    <label htmlFor="modalDeviceNumber" className="label text-xs font-bold text-gray-700 dark:text-gray-300">
                      {language === "ar" ? "رقم الجهاز / نقطة البيع *" : "Device/Register Number *"}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 rtl:left-auto rtl:right-0 rtl:pr-3.5">
                        <FontAwesomeIcon icon={faLaptop} />
                      </span>
                      <input
                        id="modalDeviceNumber"
                        type="text"
                        required
                        placeholder={language === "ar" ? "مثال: POS-01" : "e.g. POS-01"}
                        className="input min-h-12 pl-10 rtl:pl-3 rtl:pr-10 text-base w-full"
                        value={startShiftDeviceNumber}
                        onChange={(e) => setStartShiftDeviceNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Opening Float Input */}
                  <div>
                    <label htmlFor="modalOpeningFloat" className="label text-xs font-bold text-gray-700 dark:text-gray-300">
                      {language === "ar" ? "مبلغ العهدة الافتتاحية *" : "Trust Amount / Opening Float *"}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 rtl:left-auto rtl:right-0 rtl:pr-3.5">
                        <FontAwesomeIcon icon={faMoneyBillWave} />
                      </span>
                      <input
                        id="modalOpeningFloat"
                        type="number"
                        step="0.01"
                        required
                        min="0"
                        placeholder={language === "ar" ? "مثال: 150.00" : "e.g. 150.00"}
                        className="input min-h-12 pl-10 rtl:pl-3 rtl:pr-10 text-base font-bold text-emerald-600 w-full"
                        value={openingFloat}
                        onChange={(e) => setOpeningFloat(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150 dark:border-gray-750">
                  <button
                    type="button"
                    onClick={() => setIsStartShiftOpen(false)}
                    className="btn btn-secondary text-xs font-bold px-4 py-2"
                  >
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={startShiftLoading}
                    className="btn btn-primary text-xs font-bold px-5 py-2 flex items-center gap-2"
                  >
                    {startShiftLoading ? (
                      <>
                        <FontAwesomeIcon icon={faCircleNotch} className="animate-spin" />
                        <span>{language === "ar" ? "جاري التأكيد..." : "Confirming..."}</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <span>{language === "ar" ? "تأكيد" : "Confirm"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
