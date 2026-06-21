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

function ProductSearch({ onSelectProduct, onUpdateLatestQuantity }) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef(null);

  // بحث المنتجات العادي (تعبئة القائمة المنسدلة تلقائياً)
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["products", "search", searchQuery],
    queryFn: async () => {
      // إذا كان هناك نمط كمية (مثل 5* أو *5)، فلن نقوم بالبحث العادي لتفادي تشتيت الكاشير
      const cleanedQuery = searchQuery.trim();
      if (
        !cleanedQuery || 
        cleanedQuery.length < 2 || 
        cleanedQuery.match(/^[*xX](\d+)$/) ||
        cleanedQuery.match(/^\+(\d+)$/) ||
        cleanedQuery.match(/^\-(\d+)$/)
      ) {
        return [];
      }

      // إذا كان نمط Qty + Scan (مثلاً 5*كوكا)، نبحث عن الجزء بعد النجمة
      const qtyScanMatch = cleanedQuery.match(/^(\d+)[*xX](.+)$/);
      const query = qtyScanMatch ? qtyScanMatch[2].trim() : cleanedQuery;

      if (query.length < 2) return [];

      const response = await api.get(`/products/search?q=${query}`);
      return response.data.data || [];
    },
    enabled: searchQuery.trim().length >= 2,
  });

  // إعادة تعيين المؤشر النشط عند تغير نتائج البحث
  useEffect(() => {
    setFocusedIndex(-1);
  }, [searchResults]);

  // مستمع عالمي للتركيز التلقائي عند النقر أو الضغط على لوحة المفاتيح (Autofocus)
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

    const handleGlobalKeyDown = (e) => {
      // اختصار F4: تفريغ حقل البحث ونقل التركيز إليه فوراً للبحث اليدوي
      if (e.key === "F4") {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchQuery("");
        setShowResults(false);
        setFocusedIndex(-1);
        return;
      }

      const activeElement = document.activeElement;
      
      // إذا كان المستخدم يركز بالفعل على حقل إدخال آخر، دعه يكتب بحرية
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      // مطابقة الأحرف والأرقام فقط (التي يتكون منها الباركود عادةً)
      const isAlphanumeric = /^[a-zA-Z0-9]$/.test(e.key);
      if (isAlphanumeric && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        inputRef.current?.focus();
        setSearchQuery((prev) => prev + e.key);
      }
    };


    document.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      document.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);


  const handleSelect = (product, quantity = 1) => {
    onSelectProduct(product, quantity);
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
    const query = searchQuery.trim();
    if (!query) return;

    // 1. فحص أنماط تعديل كمية آخر منتج بالسلة (مثال: *5 أو x5 أو +3 أو -2)
    const setQtyMatch = query.match(/^[*xX](\d+)$/);
    const addQtyMatch = query.match(/^\+(\d+)$/);
    const subQtyMatch = query.match(/^\-(\d+)$/);

    if (setQtyMatch) {
      const qty = parseInt(setQtyMatch[1], 10);
      onUpdateLatestQuantity("set", qty);
      setSearchQuery("");
      setShowResults(false);
      playSuccessBeep();
      return;
    }
    if (addQtyMatch) {
      const qty = parseInt(addQtyMatch[1], 10);
      onUpdateLatestQuantity("add", qty);
      setSearchQuery("");
      setShowResults(false);
      playSuccessBeep();
      return;
    }
    if (subQtyMatch) {
      const qty = parseInt(subQtyMatch[1], 10);
      onUpdateLatestQuantity("subtract", qty);
      setSearchQuery("");
      setShowResults(false);
      playSuccessBeep();
      return;
    }

    // 2. فحص نمط Qty + Scan (مثال: 5*barcode أو 5xbarcode)
    const qtyScanMatch = query.match(/^(\d+)[*xX](.+)$/);
    let targetQuery = query;
    let targetQty = 1;

    if (qtyScanMatch) {
      targetQty = parseInt(qtyScanMatch[1], 10);
      targetQuery = qtyScanMatch[2].trim();
    }

    try {
      const response = await api.get(`/products/search?q=${targetQuery}`);
      const products = response.data.data || [];

      if (products.length > 0) {
        // 1. البحث أولاً عن باركود مطابق تماماً
        const exactBarcodeMatch = products.find(
          (p) => p.barcode === targetQuery
        );
        if (exactBarcodeMatch) {
          handleSelect(exactBarcodeMatch, targetQty);
          playSuccessBeep();
          return;
        }

        // 2. البحث عن اسم مطابق تماماً
        const exactNameMatch = products.find(
          (p) => p.name.toLowerCase() === targetQuery.toLowerCase()
        );
        if (exactNameMatch) {
          handleSelect(exactNameMatch, targetQty);
          playSuccessBeep();
          return;
        }

        // 3. إذا كان هناك خيار وحيد فقط، يتم إضافته تلقائياً لتسهيل العمل
        if (products.length === 1) {
          handleSelect(products[0], targetQty);
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
        // التحقق مما إذا كان هناك ضرب مسبق للكمية (مثال: 5*c)
        const qtyScanMatch = searchQuery.trim().match(/^(\d+)[*xX](.+)$/);
        const targetQty = qtyScanMatch ? parseInt(qtyScanMatch[1], 10) : 1;
        
        handleSelect(searchResults[focusedIndex], targetQty);
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

