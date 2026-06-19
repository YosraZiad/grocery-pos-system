import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import toast from "react-hot-toast";

// توليد صوت نجاح القراءة برمجياً باستخدام Web Audio API لمنع تأخير الشبكة أو فشل تحميل الصوت
const playSuccessBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(1300, audioCtx.currentTime); // تردد النغمة (1300Hz) ليكون واضحاً وحاداً
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // مستوى الصوت

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08); // مدة النغمة 80ms
  } catch (e) {
    console.error("Audio Context beep failed:", e);
  }
};

function ProductSearch({ onSelectProduct }) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);

  // بحث المنتجات العادي (تعبئة القائمة المنسدلة تلقائياً)
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["products", "search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await api.get(`/products/search?q=${searchQuery}`);
      return response.data.data || [];
    },
    enabled: searchQuery.length >= 2,
  });

  // إعادة تعيين المؤشر النشط عند تغير نتائج البحث
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchResults]);

  // مستمع عالمي للتركيز التلقائي (Autofocus)
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // تجنب سرقة التركيز إذا نقر المستخدم على حقول أخرى أو أزرار أو نوافذ منبثقة
      const interactiveTags = ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"];
      if (
        interactiveTags.includes(e.target.tagName) ||
        e.target.closest(".modal") ||
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest("input") ||
        e.target.closest("select") ||
        e.target.closest("textarea")
      ) {
        return;
      }
      inputRef.current?.focus();
    };

    document.addEventListener("click", handleGlobalClick);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const handleSelect = (product) => {
    onSelectProduct(product);
    setSearchQuery("");
    setShowResults(false);
    setFocusedIndex(-1);
    // إعادة التركيز فوراً للحقل
    setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
  };

  // معالجة البحث المباشر السريع (مثلاً عند ضغط Enter أو مسح باركود)
  const handleSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const response = await api.get(`/products/search?q=${searchQuery}`);
      const products = response.data.data || [];

      if (products.length > 0) {
        // 1. البحث أولاً عن باركود مطابق تماماً
        const exactBarcodeMatch = products.find(
          (p) => p.barcode === searchQuery.trim()
        );
        if (exactBarcodeMatch) {
          handleSelect(exactBarcodeMatch);
          playSuccessBeep();
          return;
        }

        // 2. البحث عن اسم مطابق تماماً
        const exactNameMatch = products.find(
          (p) => p.name.toLowerCase() === searchQuery.trim().toLowerCase()
        );
        if (exactNameMatch) {
          handleSelect(exactNameMatch);
          playSuccessBeep();
          return;
        }

        // 3. إذا كان هناك خيار وحيد فقط، يتم إضافته تلقائياً لتسهيل العمل
        if (products.length === 1) {
          handleSelect(products[0]);
          playSuccessBeep();
          return;
        }

        // 4. إذا وجدت نتائج متعددة، افتح القائمة وركز على العنصر الأول
        setFocusedIndex(0);
        setShowResults(true);
      } else {
        toast.error(t("productNotFound") || "المنتج غير موجود في النظام");
      }
    } catch (err) {
      console.error("Direct barcode query error:", err);
      toast.error(t("searchError") || "حدث خطأ أثناء الاتصال بقاعدة البيانات");
    }
  };

  // التحكم بالأسهم ومفتاح Enter
  const handleKeyDown = (e) => {
    if (!showResults || !searchResults || searchResults.length === 0) {
      if (e.key === "Enter") {
        handleSearchSubmit(e);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (focusedIndex >= 0 && searchResults[focusedIndex]) {
        handleSelect(searchResults[focusedIndex]);
        playSuccessBeep();
      } else {
        handleSearchSubmit(e);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowResults(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none rtl:left-auto rtl:right-0 rtl:pl-0 rtl:pr-4">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="h-6 w-6 text-gray-400"
        />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setShowResults(true);
        }}
        onFocus={() => setShowResults(true)}
        onKeyDown={handleKeyDown}
        placeholder={t("searchPlaceholder") || "ابحث بالاسم أو امسح الباركود..."}
        className="w-full px-4 py-4 pl-12 rtl:pl-4 rtl:pr-12 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
        autoFocus
      />

      {/* نتائج البحث */}
      {showResults && searchQuery.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {t("loading") || "جاري التحميل..."}
            </div>
          ) : searchResults?.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map((product, idx) => (
                <li
                  key={product.id}
                  onClick={() => {
                    handleSelect(product);
                    playSuccessBeep();
                  }}
                  className={`p-4 cursor-pointer transition-colors duration-150 ${
                    idx === focusedIndex
                      ? "bg-primary-50 dark:bg-primary-900/40 border-l-4 border-primary-500 rtl:border-l-0 rtl:border-r-4"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-white text-lg">
                        {product.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {product.category?.name} | {product.sale_price} ر.س |{" "}
                        {t("quantity") || "الكمية"}: {product.quantity}
                      </div>
                      {product.barcode && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {t("barcode") || "الباركود"}: {product.barcode}
                        </div>
                      )}
                    </div>
                    {product.quantity <= product.min_stock_alert && (
                      <span className="px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-full">
                        {t("lowStock") || "مخزون منخفض"}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {t("noResultsFound") || "لا توجد نتائج مطابقة"}
            </div>
          )}
        </div>
      )}

      {/* إغلاق النتائج عند النقر خارجها */}
      {showResults && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
}

export default ProductSearch;

