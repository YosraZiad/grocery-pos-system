import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faSearch, faSpinner, faTimes, faExclamationTriangle, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";

function CustomerSelector({ selectedCustomer, onSelectCustomer, defaultCustomerName }) {
  const [searchPhone, setSearchPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [showAddBox, setShowAddBox] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [duplicateCustomer, setDuplicateCustomer] = useState(null);

  // 1. البحث التلقائي برقم الهاتف (Debounced) من شاشة البحث الرئيسية
  useEffect(() => {
    const trimmed = searchPhone.trim();
    if (trimmed.length < 3) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await api.get(`/customers/search?phone=${trimmed}`);
        if (response.data?.success && response.data?.data) {
          onSelectCustomer(response.data.data);
          setSearchPhone("");
          setShowAddBox(false);
          toast.success(`تم اختيار العميل: ${response.data.data.name}`);
        }
      } catch (err) {
        // لم يتم العثور على العميل
        console.log("Customer search did not return a match");
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchPhone, onSelectCustomer]);

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

  const handleCreateCustomer = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!newName.trim()) {
      toast.error("يرجى إدخال اسم العميل الجديد");
      return;
    }
    if (!newPhone.trim()) {
      toast.error("يرجى إدخال رقم هاتف العميل");
      return;
    }

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
        toast.success("تم تسجيل واختيار العميل الجديد بنجاح.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "حدث خطأ أثناء تسجيل العميل.");
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-2xl border border-gray-150 dark:border-gray-700 w-full space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5 rtl:space-x-reverse text-sm font-bold text-gray-800 dark:text-gray-200">
          <FontAwesomeIcon icon={faUser} className="text-primary-500 text-base" />
          <span>العميل:</span>
          {selectedCustomer ? (
            <span className="text-primary-600 dark:text-primary-400 font-black">
              {selectedCustomer.name} 
              {parseFloat(selectedCustomer.balance) > 0 && 
                ` (الرصيد: ${parseFloat(selectedCustomer.balance).toFixed(2)} ر.س)`}
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 font-medium">
              {defaultCustomerName || "العميل الافتراضي"}
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
            title="إلغاء اختيار العميل"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {/* حقل البحث بالهاتف */}
      {!selectedCustomer && !showAddBox && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="البحث برقم الهاتف (مثال: 0512345678)..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className="input pr-9 py-2 text-xs w-full focus:ring-2 focus:ring-primary-500"
            />
            <span className="absolute right-3 top-3 text-gray-400">
              {isSearching ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xs" />
              ) : (
                <FontAwesomeIcon icon={faSearch} className="text-xs" />
              )}
            </span>
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
            <span>إضافة عميل</span>
          </button>
        </div>
      )}

      {/* نموذج إضافة عميل جديد (تم استبدال Form بـ Div لتجنب تعارض تداخل النماذج وإغلاق المودال) */}
      {showAddBox && (
        <div className="space-y-3 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUserPlus} />
            <span>إضافة عميل جديد:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">رقم الهاتف</label>
              <input
                type="text"
                placeholder="رقم الهاتف..."
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="input py-2 px-3 text-xs w-full focus:ring-2 focus:ring-primary-500 font-mono"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 block">اسم العميل</label>
              <input
                type="text"
                placeholder="اسم العميل الجديد..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input py-2 px-3 text-xs w-full focus:ring-2 focus:ring-primary-500"
                required
                autoFocus
              />
            </div>
          </div>

          {/* تنبيه إذا كان العميل مكرراً وتم العثور عليه أثناء الكتابة */}
          {duplicateCustomer && (
            <div className="text-xs text-amber-700 dark:text-amber-400 font-bold flex items-center justify-between p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl space-x-2 rtl:space-x-reverse animate-pulse">
              <span className="flex items-center space-x-1 rtl:space-x-reverse">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>رقم الهاتف هذا مسجل بالفعل لـ: <strong>{duplicateCustomer.name}</strong></span>
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
                  toast.success(`تم اختيار العميل: ${duplicateCustomer.name}`);
                }}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm"
              >
                اختيار هذا العميل
              </button>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleCreateCustomer}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all shadow-sm"
            >
              حفظ العميل
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
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSelector;
