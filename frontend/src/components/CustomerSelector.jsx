import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSearch, faSpinner, faTimes, faExclamationTriangle, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";
import { useI18n } from "../context/I18nContext";

function CustomerSelector({ selectedCustomer, onSelectCustomer, defaultCustomerName }) {
  const { t, language } = useI18n();
  const [searchPhone, setSearchPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showAddBox, setShowAddBox] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [duplicateCustomer, setDuplicateCustomer] = useState(null);

  // 1. البحث التلقائي بالاسم أو الهاتف (Debounced) من شاشة البحث الرئيسية
  useEffect(() => {
    const trimmed = searchPhone.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        // البحث العادي عن العملاء بالاسم أو الهاتف
        const response = await api.get(`/customers?search=${trimmed}`);
        if (response.data && response.data.data) {
          // Response represents a paginated list of customers, check data array
          setSearchResults(response.data.data || response.data.data.data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.log("Customer search did not return a match");
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchPhone]);

  // 2. البحث التلقائي برقم الهاتف المكتوب في نموذج الإضافة للتحقق من عدم تكراره
  useEffect(() => {
    const trimmed = newPhone.trim();
    if (trimmed.length < 3) {
      setDuplicateCustomer(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const response = await api.get(`/customers/search?phone=${trimmed}`);
        if (response.data?.success && response.data?.data) {
          setDuplicateCustomer(response.data.data);
        } else {
          setDuplicateCustomer(null);
        }
      } catch (err) {
        setDuplicateCustomer(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [newPhone]);

  const [isSaving, setIsSaving] = useState(false);

  const handleCreateCustomer = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isSaving) return;

    if (!newName.trim()) {
      toast.error(t("pleaseFillFields") || "يرجى إدخال اسم العميل الجديد");
      return;
    }
    if (!newPhone.trim()) {
      toast.error(t("pleaseFillFields") || "يرجى إدخال رقم هاتف العميل");
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post("/customers", {
        name: newName.trim(),
        phone: newPhone.trim(),
      });
      if (response.data?.success && response.data?.data) {
        onSelectCustomer(response.data.data);
        setSearchPhone("");
        setNewName("");
        setNewPhone("");
        setDuplicateCustomer(null);
        setShowAddBox(false);
        toast.success(t("customerAddedSuccessfully") || "تم تسجيل واختيار العميل الجديد بنجاح.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t("errorCreatingCustomer") || "حدث خطأ أثناء تسجيل العميل.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-150 dark:border-gray-700 w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse text-sm font-bold text-gray-800 dark:text-gray-200">
          <FontAwesomeIcon icon={faUser} className="text-primary-500 text-base" />
          <span>{t("customer")}:</span>
          {selectedCustomer ? (
            <span className="text-primary-600 dark:text-primary-400 font-black">
              {selectedCustomer.name} 
              {parseFloat(selectedCustomer.balance) > 0 && 
                ` (${t("availableBalance")}: ${parseFloat(selectedCustomer.balance).toFixed(2)} ${t("sar") || "ر.س"})`}
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 font-medium">
              {defaultCustomerName || t("defaultCustomer") || "العميل الافتراضي"}
            </span>
          )}
        </div>
        {selectedCustomer && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelectCustomer(null);
            }}
            className="text-red-500 hover:text-red-700 p-1 text-xs"
            title={t("cancel") || "إلغاء اختيار العميل"}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {/* حقل البحث بالهاتف والاسم */}
      {!selectedCustomer && !showAddBox && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={language === "en" ? "Search customer by name or phone..." : "ابحث بالاسم أو رقم الهاتف..."}
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (searchResults.length === 1) {
                    const cust = searchResults[0];
                    onSelectCustomer(cust);
                    setSearchPhone("");
                    setSearchResults([]);
                    toast.success(language === "en" ? `Customer selected: ${cust.name}` : `تم اختيار العميل: ${cust.name}`);
                  }
                }
              }}
              className="input pr-9 py-2 text-xs w-full focus:ring-2 focus:ring-primary-500 font-sans"
            />
            <span className="absolute right-3 top-3 text-gray-400">
              {isSearching ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
              ) : (
                <FontAwesomeIcon icon={faSearch} className="text-xs" />
              )}
            </span>

            {/* قائمة نتائج البحث المنبثقة */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-750 animate-fadeIn">
                {searchResults.map((cust) => (
                  <button
                    key={cust.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectCustomer(cust);
                      setSearchPhone("");
                      setSearchResults([]);
                      toast.success(language === "en" ? `Customer selected: ${cust.name}` : `تم اختيار العميل: ${cust.name}`);
                    }}
                    className="w-full text-start px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-750 text-xs text-gray-700 dark:text-gray-300 transition-all font-semibold flex flex-col"
                  >
                    <span className="text-gray-900 dark:text-white font-bold">{cust.name}</span>
                    <span className="text-[10px] text-gray-500 font-mono mt-0.5">{cust.phone}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setNewName("");
              setNewPhone(searchPhone);
              setDuplicateCustomer(null);
              setShowAddBox(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm active:scale-95 transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
          >
            <FontAwesomeIcon icon={faUserPlus} />
            <span>{t("addCustomer")}</span>
          </button>
        </div>
      )}

      {/* نموذج إضافة عميل جديد */}
      {showAddBox && (
        <div className="space-y-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUserPlus} />
            <span>{t("addCustomer")}:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">{t("phone")}</label>
              <input
                type="text"
                placeholder={t("phone") + "..."}
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="input py-2 px-3 text-xs w-full focus:ring-2 focus:ring-primary-500 font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">{t("customerName")}</label>
              <input
                type="text"
                placeholder={t("customerName") + "..."}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input py-2 px-3 text-xs w-full focus:ring-2 focus:ring-primary-500"
                required
                autoFocus
              />
            </div>
          </div>

          {/* تنبيه إذا كان العميل مكرراً */}
          {duplicateCustomer && (
            <div className="text-xs text-amber-700 dark:text-amber-400 font-bold flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl space-x-2 rtl:space-x-reverse animate-pulse">
              <span className="flex items-center space-x-1 rtl:space-x-reverse">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>{t("phoneAlreadyRegistered") || "رقم الهاتف هذا مسجل بالفعل لـ:"} <strong>{duplicateCustomer.name}</strong></span>
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectCustomer(duplicateCustomer);
                  setSearchPhone("");
                  setNewName("");
                  setNewPhone("");
                  setDuplicateCustomer(null);
                  setShowAddBox(false);
                  toast.success(t("customerSelected") ? `${t("customerSelected")}: ${duplicateCustomer.name}` : `تم اختيار العميل: ${duplicateCustomer.name}`);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
              >
                {t("selectThisCustomer") || "اختيار هذا العميل"}
              </button>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCreateCustomer}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (t("saving") || "جاري الحفظ...") : (t("saveCustomer") || "حفظ العميل")}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAddBox(false);
                setNewName("");
                setNewPhone("");
                setDuplicateCustomer(null);
              }}
              className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 px-3 rounded-xl transition-all"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSelector;
