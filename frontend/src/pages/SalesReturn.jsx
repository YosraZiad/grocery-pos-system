import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "../context/I18nContext";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faBox,
  faMoneyBillWave,
  faCreditCard,
  faBuildingColumns,
  faWallet,
  faUndo,
  faKeyboard,
  faSpinner,
  faChevronLeft,
  faPrint,
  faExchangeAlt,
  faCoins,
  faExclamationTriangle,
  faUser,
  faHistory,
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import ConfirmationModal from "../components/ConfirmationModal";

function SalesReturn() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [returnCart, setReturnCart] = useState([]);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("");
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // حقول بيانات عميل الاستبدال وقائمة التحقق
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [checkBranch, setCheckBranch] = useState(false);
  const [checkDate, setCheckDate] = useState(false);
  const [checkCondition, setCheckCondition] = useState(false);
  const [printedVoucher, setPrintedVoucher] = useState(null);

  // التبويبات وسجل المرتجعات العكسية
  const [activeTab, setActiveTab] = useState("new_return"); // "new_return" or "returns_list"
  const [listSearch, setListSearch] = useState("");
  const [listPage, setListPage] = useState(1);
  const [selectedReturnDetails, setSelectedReturnDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // باركود القارئ المباشر
  const barcodeBufferRef = useRef("");
  const barcodeTimeoutRef = useRef(null);

  // حساب ملخص المرتجع الحالي
  const returnSummary = returnCart.reduce(
    (acc, item) => {
      const itemSubtotal = item.price * item.return_qty;
      return {
        subtotal: acc.subtotal + itemSubtotal,
        refund_total: acc.refund_total + itemSubtotal,
      };
    },
    { subtotal: 0, refund_total: 0 }
  );

  // حساب الخصم النسبي للفاتورة المستردة
  let proportionalDiscount = 0;
  let finalRefundTotal = returnSummary.refund_total;

  if (activeInvoice && activeInvoice.discount > 0) {
    const originalSubtotal = activeInvoice.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    if (originalSubtotal > 0) {
      const discountRatio = activeInvoice.discount / originalSubtotal;
      proportionalDiscount = returnSummary.refund_total * discountRatio;
      finalRefundTotal = returnSummary.refund_total - proportionalDiscount;
    }
  }

  // استعلام جلب قائمة الفواتير المرتجعة
  const { data: returnsListData, isLoading: isLoadingList } = useQuery({
    queryKey: ["salesReturnsList", listPage, listSearch],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: listPage.toString(),
        per_page: "15",
      });
      if (listSearch) params.append("search", listSearch);
      const response = await api.get(`/sales-returns?${params.toString()}`);
      return response.data;
    },
    enabled: activeTab === "returns_list",
  });

  const handleViewDetails = async (id) => {
    try {
      const response = await api.get(`/sales-returns/${id}`);
      setSelectedReturnDetails(response.data.data);
      setShowDetailsModal(true);
    } catch (err) {
      toast.error("فشل تحميل تفاصيل الفاتورة العكسية.");
    }
  };

  // حساب مدة الفاتورة وسياسة الإرجاع
  const invoiceAgeDays = activeInvoice
    ? Math.floor((new Date() - new Date(activeInvoice.created_at)) / (1000 * 60 * 60 * 24))
    : 0;
  const isWithinPolicy = invoiceAgeDays <= 14;

  // 1. التحقق من رقم الفاتورة وجلب بياناتها
  const handleVerifyInvoice = async (e) => {
    if (e) e.preventDefault();
    if (!invoiceNumber.trim()) return;

    setIsVerifying(true);
    setActiveInvoice(null);
    setReturnCart([]);

    try {
      const response = await api.post("/sales-returns/verify", {
        invoice_number: invoiceNumber.trim(),
      });
      
      if (response.data?.success) {
        setActiveInvoice(response.data.data);
        toast.success("تم التحقق من الفاتورة وجلب عناصرها.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "رقم الفاتورة غير صحيح أو غير مؤهل للاسترجاع.");
    } finally {
      setIsVerifying(false);
    }
  };

  // 2. تفعيل / تعطيل بند في قائمة المرتجعات
  const handleToggleItem = (saleItem) => {
    const exists = returnCart.find((c) => c.sale_item_id === saleItem.id);
    const remainingQty = saleItem.quantity - saleItem.previously_returned_qty;

    if (exists) {
      setReturnCart(returnCart.filter((c) => c.sale_item_id !== saleItem.id));
    } else {
      if (remainingQty <= 0) return;
      setReturnCart([
        ...returnCart,
        {
          sale_item_id: saleItem.id,
          product_id: saleItem.product_id,
          name: saleItem.product.name,
          barcode: saleItem.product.barcode,
          sku: saleItem.product.sku,
          price: parseFloat(saleItem.price),
          sold_qty: saleItem.quantity,
          previously_returned_qty: saleItem.previously_returned_qty,
          remaining_qty: remainingQty,
          return_qty: 1,
        },
      ]);
    }
  };

  // 3. تعديل كمية الاسترجاع لبند معين
  const handleQtyChange = (saleItemId, qty) => {
    setReturnCart(
      returnCart
        .map((item) => {
          if (item.sale_item_id === saleItemId) {
            const cleanQty = Math.max(0, Math.min(item.remaining_qty, qty));
            return { ...item, return_qty: cleanQty };
          }
          return item;
        })
        .filter((item) => item.return_qty > 0)
    );
  };

  // 4. معالجة الباركود الممسوح برمجياً
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // تجاهل إذا كان التركيز في حقل إدخال (ما عدا الباركود)
      const activeEl = document.activeElement;
      if (
        activeEl &&
        activeEl.tagName === "INPUT" &&
        activeEl.id !== "invoiceInput"
      ) {
        // دعه يكتب طبيعي
        return;
      }

      if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);

      if (e.key === "Enter") {
        const barcode = barcodeBufferRef.current.trim();
        if (barcode.length >= 3 && activeInvoice) {
          handleBarcodeScanned(barcode);
        }
        barcodeBufferRef.current = "";
        return;
      }

      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }

      barcodeTimeoutRef.current = setTimeout(() => {
        barcodeBufferRef.current = "";
      }, 200);
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      if (barcodeTimeoutRef.current) clearTimeout(barcodeTimeoutRef.current);
    };
  }, [activeInvoice, returnCart]);

  const handleBarcodeScanned = (barcode) => {
    if (!activeInvoice) return;

    // البحث عن المنتج المطابق في الفاتورة المفتوحة
    const matchedSaleItem = activeInvoice.items.find(
      (item) => item.product.barcode === barcode
    );

    if (!matchedSaleItem) {
      toast.error(`المنتج ذو الباركود (${barcode}) غير موجود في هذه الفاتورة!`);
      return;
    }

    const remainingQty = matchedSaleItem.quantity - matchedSaleItem.previously_returned_qty;
    if (remainingQty <= 0) {
      toast.error(`تم استرجاع كامل كمية هذا المنتج مسبقاً.`);
      return;
    }

    const existItem = returnCart.find((c) => c.sale_item_id === matchedSaleItem.id);
    if (existItem) {
      if (existItem.return_qty >= remainingQty) {
        toast.error(`لا يمكن تجاوز الكمية المتاحة للاسترجاع.`);
        return;
      }
      handleQtyChange(matchedSaleItem.id, existItem.return_qty + 1);
      toast.success(`تم زيادة كمية استرجاع ${matchedSaleItem.product.name}`);
    } else {
      setReturnCart([
        ...returnCart,
        {
          sale_item_id: matchedSaleItem.id,
          product_id: matchedSaleItem.product_id,
          name: matchedSaleItem.product.name,
          barcode: matchedSaleItem.product.barcode,
          sku: matchedSaleItem.product.sku,
          price: parseFloat(matchedSaleItem.price),
          sold_qty: matchedSaleItem.quantity,
          previously_returned_qty: matchedSaleItem.previously_returned_qty,
          remaining_qty: remainingQty,
          return_qty: 1,
        },
      ]);
      toast.success(`تم إضافة ${matchedSaleItem.product.name} لقائمة المرتجعات.`);
    }
  };

  // 5. إرسال عملية المرتجع إلى السيرفر
  const submitReturnMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await api.post("/sales-returns", payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`تم إصدار فاتورة المرتجع رقم: ${data.return_number}`);
      if (data.voucher) {
        setPrintedVoucher({
          ...data.voucher,
          return_id: data.data.id
        });
      } else {
        // إعادة تصفير الحقول
        setActiveInvoice(null);
        setReturnCart([]);
        setInvoiceNumber("");
        setReason("");
        navigate(`/sales-returns/${data.data.id}/invoice`, { state: { autoPrint: true } });
      }
      setCustomerName("");
      setCustomerPhone("");
      setCheckBranch(false);
      setCheckDate(false);
      setCheckCondition(false);
      setShowConfirmModal(false);
      
      // تحديث الكاش
      queryClient.invalidateQueries(["returns"]);
      queryClient.invalidateQueries(["sales"]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["inventory"]);
      queryClient.invalidateQueries(["salesReturnsList"]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "فشل إصدار الفاتورة العكسية.");
    },
  });

  const handleConfirmReturn = () => {
    if (returnCart.length === 0) return;
    
    const payload = {
      sale_id: activeInvoice.id,
      refund_method: refundMethod,
      reason: reason.trim() || null,
      customer_name: refundMethod === "replacement" ? customerName.trim() || null : null,
      customer_phone: refundMethod === "replacement" ? customerPhone.trim() || null : null,
      items: returnCart.map((item) => ({
        sale_item_id: item.sale_item_id,
        return_qty: item.return_qty,
      })),
    };

    submitReturnMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      {/* الترويسة والعنوان */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faUndo} className="text-amber-500" />
            <span>{t("salesReturns") || "مرتجع المبيعات (الفاتورة العكسية)"}</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            البحث عن الفاتورة، التحقق من البنود القابلة للاسترجاع، وإصدار إشعار دائن للعميل
          </p>
        </div>

        {/* أزرار التبويبات للتنقل */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("new_return")}
            className={`py-1.5 px-4 font-bold text-xs rounded-lg transition-all ${
              activeTab === "new_return"
                ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faUndo} />
              <span>إجراء مرتجع</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("returns_list")}
            className={`py-1.5 px-4 font-bold text-xs rounded-lg transition-all ${
              activeTab === "returns_list"
                ? "bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faHistory} />
              <span>سجل المرتجعات</span>
            </span>
          </button>
        </div>

        {/* نموذج البحث السريع */}
        {activeTab === "new_return" && (
        <form onSubmit={handleVerifyInvoice} className="flex gap-2 w-full md:max-w-md">
          <input
            id="invoiceInput"
            type="text"
            placeholder="أدخل رقم الفاتورة (مثال: INV-20260630-0001)"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="input focus:ring-2 focus:ring-amber-500 focus:border-transparent flex-1"
          />
          <button
            type="submit"
            disabled={isVerifying || !invoiceNumber.trim()}
            className="btn btn-primary min-w-[100px] flex items-center justify-center gap-1.5"
          >
            {isVerifying ? (
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
            ) : (
              <>
                <FontAwesomeIcon icon={faSearch} />
                <span>تحقق</span>
              </>
            )}
          </button>
        </form>
        )}
      </div>

      {/* قسم إجراء المرتجعات الجديد */}
      {activeTab === "new_return" && (
        <>
          {/* الحالة الافتراضية عند عدم تحديد فاتورة */}
          {!activeInvoice ? (
        <div className="card flex flex-col items-center justify-center text-center py-20 bg-gray-50 dark:bg-gray-850 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-3xl mb-4">
            <FontAwesomeIcon icon={faSearch} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            بانتظار رقم الفاتورة
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md text-sm">
            الرجاء إدخال رقم الفاتورة في حقل البحث بالأعلى للتحقق منها وعرض محتوياتها المؤهلة للإرجاع.
          </p>
        </div>
      ) : (
        /* المخطط المشترك ثنائي الأعمدة */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* العمود الأيسر (الرئيسي): معلومات البنود وتحديد كميات المرتجع */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ملخص الفاتورة الأصلية */}
            <div className="card p-5 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-800 dark:to-gray-800/80 border-l-4 border-amber-500">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <span>📄</span> بيانات الفاتورة الأصلية
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-gray-700 dark:text-gray-300">
                <div>
                  <span className="text-gray-400 block">رقم الفاتورة:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{activeInvoice.invoice_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">الكاشير:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{activeInvoice.user?.name || "غير معروف"}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">طريقة الدفع:</span>
                  <span className="font-semibold text-gray-900 dark:text-white inline-flex items-center gap-1">
                    {activeInvoice.payment_method === "cash" && (
                      <>
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                        <span>نقدي</span>
                      </>
                    )}
                    {activeInvoice.payment_method === "card" && (
                      <>
                        <FontAwesomeIcon icon={faCreditCard} className="text-blue-500" />
                        <span>بطاقة</span>
                      </>
                    )}
                    {activeInvoice.payment_method === "transfer" && (
                      <>
                        <FontAwesomeIcon icon={faBuildingColumns} className="text-cyan-500" />
                        <span>تحويل بنكي</span>
                      </>
                    )}
                    {activeInvoice.payment_method === "hybrid" && (
                      <>
                        <FontAwesomeIcon icon={faWallet} className="text-purple-500" />
                        <span>مختلط</span>
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">إجمالي القيمة الأصلية:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">{parseFloat(activeInvoice.total).toFixed(2)} ر.س</span>
                </div>
              </div>
            </div>

            {/* قائمة التحقق الإلزامية لمسؤول المرتجعات */}
            <div className="card p-5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-900 rounded-3xl space-y-3">
              <h3 className="text-md font-bold text-amber-800 dark:text-amber-450 flex items-center gap-1.5">
                <span>📋</span> قائمة التحقق الإلزامية لمسؤول الاسترجاع (Checklist)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                يرجى التحقق يدويًا وتأكيد استيفاء الشروط التالية مع السلع لاعتماد المرتجع:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-amber-400 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={checkBranch}
                    onChange={(e) => setCheckBranch(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    الفاتورة تخص هذا الفرع
                  </span>
                </label>

                <label className={`flex items-center gap-2.5 cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-2xl border hover:border-amber-400 transition-all select-none ${
                  !isWithinPolicy ? "border-red-350 dark:border-red-900 bg-red-500/5" : "border-gray-200 dark:border-gray-700"
                }`}>
                  <input
                    type="checkbox"
                    checked={checkDate}
                    onChange={(e) => setCheckDate(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <div className="text-xs font-bold text-gray-700 dark:text-gray-300 flex flex-col">
                    <span>المدة مسموحة للإرجاع</span>
                    <span className={`text-[10px] ${isWithinPolicy ? "text-gray-400" : "text-red-500 font-bold"}`}>
                      {invoiceAgeDays} يوم مضى (سياسة الـ 14 يوم)
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-amber-400 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={checkCondition}
                    onChange={(e) => setCheckCondition(e.target.checked)}
                    className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    البضاعة غير تالفة وسليمة
                  </span>
                </label>
              </div>
            </div>

            {/* جدول المنتجات وبنود الفاتورة */}
            <div className="card p-5 overflow-hidden">
              <div className="pb-3 border-b border-gray-150 dark:border-gray-700 mb-4 flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📦</span> عناصر الفاتورة والكميات
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                  يمكنك تمرير باركود المنتجات مباشرةً لإضافتها
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-sm text-gray-700 dark:text-gray-300">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-slate-100 font-bold text-xs tracking-wider">
                      <th className="py-3 px-4 text-center w-12">تحديد</th>
                      <th className="py-3 px-4 text-start">المنتج</th>
                      <th className="py-3 px-4 text-center">الكمية المباعة</th>
                      <th className="py-3 px-4 text-center">المرتجعة سابقاً</th>
                      <th className="py-3 px-4 text-center">المتبقي المتاح</th>
                      <th className="py-3 px-4 text-center w-28">كمية المرتجع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-750">
                    {activeInvoice.items.map((item) => {
                      const remaining = item.quantity - item.previously_returned_qty;
                      const cartItem = returnCart.find((c) => c.sale_item_id === item.id);
                      const isSelected = !!cartItem;
                      const isFullyReturned = remaining <= 0;

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${
                            isFullyReturned ? "opacity-50 bg-gray-100/40 dark:bg-gray-800/10" : ""
                          }`}
                        >
                          <td className="py-4 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isFullyReturned}
                              onChange={() => handleToggleItem(item)}
                              className="w-4 h-4 text-amber-500 bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-700 rounded focus:ring-amber-500 cursor-pointer disabled:cursor-not-allowed"
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-900 dark:text-white">{item.product.name}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              SKU: {item.product.sku} | Barcode: {item.product.barcode}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-gray-950 dark:text-slate-100">
                            {item.quantity}
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-red-500">
                            {item.previously_returned_qty}
                          </td>
                          <td className="py-4 px-4 text-center font-mono font-bold text-emerald-600 dark:text-emerald-450">
                            {remaining}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                min="0"
                                max={remaining}
                                value={cartItem?.return_qty || ""}
                                disabled={!isSelected}
                                placeholder="0"
                                onChange={(e) =>
                                  handleQtyChange(item.id, parseInt(e.target.value) || 0)
                                }
                                className="w-20 text-center bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-amber-500 focus:border-transparent rounded-lg py-1 px-2 font-mono font-bold text-gray-900 dark:text-white disabled:opacity-40"
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* العمود الأيمن: ملخص قيمة المرتجعات، طريقة الدفع والتعليق والاعتماد */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* ملخص المبالغ المستردة */}
            <div className="card p-6 bg-slate-50 dark:bg-gray-800 space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faCoins} className="text-amber-500" />
                <span>ملخص المرتجع والرد المالي</span>
              </h3>

              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-350">
                <div className="flex justify-between">
                  <span>إجمالي قيمة المرتجعات:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{returnSummary.refund_total.toFixed(2)} ر.س</span>
                </div>
                
                {proportionalDiscount > 0 && (
                  <div className="flex justify-between text-red-500 font-medium">
                    <span>خصم مسترجع نسبي:</span>
                    <span>-{proportionalDiscount.toFixed(2)} ر.س</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-black text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span>المبلغ الصافي المسترد:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-black">{finalRefundTotal.toFixed(2)} ر.س</span>
                </div>
              </div>

              {/* اختيار وسيلة الرد المالي */}
              <div className="space-y-2">
                <label className="label font-bold">وسيلة رد الأموال:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "cash", label: "نقدي", icon: faMoneyBillWave },
                    { value: "card", label: "شبكة/كارت", icon: faCreditCard },
                    { value: "transfer", label: "تحويل", icon: faBuildingColumns },
                    { value: "hybrid", label: "مختلط", icon: faWallet },
                    { value: "replacement", label: "استبدال / رصيد عميل", icon: faUndo },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setRefundMethod(method.value)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        refundMethod === method.value
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 col-span-2 py-3"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                      } ${method.value === 'replacement' ? 'col-span-2' : ''}`}
                    >
                      <FontAwesomeIcon icon={method.icon} />
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* بيانات العميل في حال الاستبدال */}
              {refundMethod === "replacement" && (
                <div className="space-y-3 p-3 bg-amber-500/5 rounded-2xl border border-amber-500/20 pt-2 animate-fadeIn">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-450 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faUser} />
                    <span>بيانات العميل لسند الاستبدال:</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="اسم العميل (مثال: محمد أحمد)"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="input w-full text-xs"
                    />
                    <input
                      type="text"
                      placeholder="رقم الهاتف (مثال: 0501234567)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* ملاحظة أو سبب الاسترجاع */}
              <div className="space-y-2">
                <label className="label font-bold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faKeyboard} className="text-gray-400" />
                  <span>سبب الاسترجاع (اختياري):</span>
                </label>
                <textarea
                  rows="3"
                  maxLength="200"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: منتج تالف، رغبة العميل، مقاس غير مناسب..."
                  className="textarea w-full text-sm"
                />
              </div>

              {/* زر الإصدار النهائي */}
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={returnCart.length === 0 || submitReturnMutation.isPending || !checkBranch || !checkDate || !checkCondition}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-750 text-white rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitReturnMutation.isPending ? (
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faUndo} />
                )}
                <span>تأكيد وإصدار المرتجع</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* نافذة التأكيد المنبثقة */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmReturn}
        title="تأكيد فاتورة المرتجع"
        message={`هل أنت متأكد من رغبتك في إصدار فاتورة مرتجع المبيعات (الفاتورة العكسية)؟ سيتم رد مبلغ بقيمة (${finalRefundTotal.toFixed(2)} ر.س) للعميل وسيلة (${
          refundMethod === "cash" ? "نقداً" :
          refundMethod === "card" ? "عن طريق كارت شبكة" :
          refundMethod === "transfer" ? "بتحويل بنكي" :
          refundMethod === "replacement" ? "سند استبدال مبيعات" : "بطريقة دفع مقسمة"
        }) وإعادة إدراج السلع المسترجعة في المخازن.`}
        confirmText="نعم، اعتمد المرتجع"
        cancelText="تراجع"
        type="warning"
      />
        </>
      )}

      {/* سند استبدال المبيعات (طباعة السند) */}
      {printedVoucher && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* الجزء القابل للطباعة */}
            <div id="printable-voucher-receipt" className="p-6 bg-white text-gray-900 border-b border-dashed border-gray-300 font-mono text-xs">
              <div className="text-center space-y-1 mb-4">
                <h3 className="text-lg font-black tracking-wider">سند استبدال مبيعات</h3>
                <p className="text-[10px] text-gray-500">فاتورة مرتجع مبيعات عكسية</p>
                <div className="border-t border-b border-black py-1 font-bold">
                  {printedVoucher.customer_name}
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between">
                  <span>التاريخ:</span>
                  <span>{new Date().toLocaleDateString('ar-SA')}</span>
                </div>
                {printedVoucher.customer_phone && (
                  <div className="flex justify-between">
                    <span>الهاتف:</span>
                    <span>{printedVoucher.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-black pt-1">
                  <span>رمز الكوبون:</span>
                  <span className="font-mono text-sm tracking-wider">{printedVoucher.code}</span>
                </div>
              </div>

              <div className="text-center py-4 bg-gray-100 rounded-xl my-4 border border-dashed border-gray-400">
                <div className="text-xs text-gray-500">رصيد الاستبدال المستحق</div>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {parseFloat(printedVoucher.amount).toFixed(2)} ر.س
                </div>
              </div>

              {/* باركود توضيحي */}
              <div className="flex flex-col items-center justify-center py-2 space-y-1">
                <div className="w-full h-8 bg-[repeating-linear-gradient(90deg,black,black_2px,transparent_2px,transparent_6px)] opacity-80" />
                <div className="text-[10px] font-mono tracking-widest">{printedVoucher.code}</div>
              </div>

              <div className="text-center text-[10px] text-gray-500 mt-4 border-t border-gray-200 pt-2 leading-relaxed">
                يرجى تقديم هذا السند لمسؤول الكاشير عند إتمام عملية الشراء الجديدة لخصم رصيد الاستبدال المتاح.
              </div>
            </div>

            {/* أزرار التحكم بالنافذة */}
            <div className="p-4 bg-gray-50 dark:bg-gray-750 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const printContents = document.getElementById("printable-voucher-receipt").innerHTML;
                  const originalContents = document.body.innerHTML;
                  document.body.innerHTML = printContents;
                  window.print();
                  document.body.innerHTML = originalContents;
                  window.location.reload();
                }}
                className="btn btn-primary flex-1 font-bold py-2.5 flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faPrint} />
                <span>طباعة السند</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const returnId = printedVoucher?.return_id;
                  setPrintedVoucher(null);
                  setActiveInvoice(null);
                  setReturnCart([]);
                  setInvoiceNumber("");
                  setReason("");
                  if (returnId) {
                    navigate(`/sales-returns/${returnId}/invoice`, { state: { autoPrint: true } });
                  }
                }}
                className="btn btn-secondary py-2.5 font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* قسم سجل المرتجعات */}
      {activeTab === "returns_list" && (
        <div className="space-y-4">
          <div className="card p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="ابحث برقم المرتجع أو رقم الفاتورة الأصلية..."
                  value={listSearch}
                  onChange={(e) => {
                    setListSearch(e.target.value);
                    setListPage(1);
                  }}
                  className="input w-full"
                />
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-150 dark:border-gray-700 overflow-hidden">
            {isLoadingList ? (
              <div className="flex justify-center py-12">
                <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl text-amber-500" />
              </div>
            ) : !returnsListData?.data || returnsListData.data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                لا توجد فواتير مرتجعة مطابقة للبحث.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-slate-100 font-bold text-xs">
                      <th className="py-3 px-4 text-start">رقم المرتجع</th>
                      <th className="py-3 px-4 text-start">رقم الفاتورة الأصلية</th>
                      <th className="py-3 px-4 text-start">مسؤول المرتجع</th>
                      <th className="py-3 px-4 text-center">المبلغ المسترد</th>
                      <th className="py-3 px-4 text-center">طريقة الرد</th>
                      <th className="py-3 px-4 text-center">تاريخ المرتجع</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 dark:divide-gray-750">
                    {returnsListData.data.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                          {item.return_number}
                        </td>
                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400">
                          {item.sale?.invoice_number || "غير معروف"}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.user?.name || "غير معروف"}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-amber-600 dark:text-amber-400">
                          {parseFloat(item.refund_total).toFixed(2)} ر.س
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 rounded-full text-xs font-bold">
                            {item.refund_method === "cash" && (
                              <>
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500 text-[10px]" />
                                <span>نقدي</span>
                              </>
                            )}
                            {item.refund_method === "card" && (
                              <>
                                <FontAwesomeIcon icon={faCreditCard} className="text-blue-500 text-[10px]" />
                                <span>بطاقة/شبكة</span>
                              </>
                            )}
                            {item.refund_method === "transfer" && (
                              <>
                                <FontAwesomeIcon icon={faBuildingColumns} className="text-cyan-500 text-[10px]" />
                                <span>تحويل</span>
                              </>
                            )}
                            {item.refund_method === "hybrid" && (
                              <>
                                <FontAwesomeIcon icon={faWallet} className="text-purple-500 text-[10px]" />
                                <span>مختلط</span>
                              </>
                            )}
                            {item.refund_method === "replacement" && (
                              <>
                                <FontAwesomeIcon icon={faExchangeAlt} className="text-indigo-500 text-[10px]" />
                                <span>سند استبدال</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center text-gray-500">
                          {new Date(item.created_at).toLocaleDateString('ar-SA', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(item.id)}
                            className="text-xs font-bold text-amber-600 hover:text-amber-800 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-250/20"
                          >
                            عرض التفاصيل
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* التنقل بين الصفحات */}
                {returnsListData.last_page > 1 && (
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700 mt-4 text-xs font-bold">
                    <button
                      disabled={listPage === 1}
                      onClick={() => setListPage(prev => Math.max(1, prev - 1))}
                      className="btn btn-secondary py-1 px-3 disabled:opacity-40"
                    >
                      السابق
                    </button>
                    <span className="text-gray-500">
                      صفحة {returnsListData.current_page} من {returnsListData.last_page}
                    </span>
                    <button
                      disabled={listPage === returnsListData.last_page}
                      onClick={() => setListPage(prev => prev + 1)}
                      className="btn btn-secondary py-1 px-3 disabled:opacity-40"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* نافذة تفاصيل المرتجع المنبثقة */}
      {showDetailsModal && selectedReturnDetails && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-150 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FontAwesomeIcon icon={faBox} className="text-primary-500" />
                <span>تفاصيل إشعار دائن رقم: {selectedReturnDetails.return_number}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-750 p-4 rounded-2xl">
                <div>
                  <span className="text-gray-400 text-xs block">الفاتورة الأصلية:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedReturnDetails.sale?.invoice_number || "غير معروف"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">المسؤول:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {selectedReturnDetails.user?.name || "غير معروف"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">طريقة الرد المالي:</span>
                  <span className="font-bold text-gray-900 dark:text-white inline-flex items-center gap-1.5">
                    {selectedReturnDetails.refund_method === "cash" && (
                      <>
                        <FontAwesomeIcon icon={faMoneyBillWave} className="text-green-500" />
                        <span>نقدي</span>
                      </>
                    )}
                    {selectedReturnDetails.refund_method === "card" && (
                      <>
                        <FontAwesomeIcon icon={faCreditCard} className="text-blue-500" />
                        <span>بطاقة/شبكة</span>
                      </>
                    )}
                    {selectedReturnDetails.refund_method === "transfer" && (
                      <>
                        <FontAwesomeIcon icon={faBuildingColumns} className="text-cyan-500" />
                        <span>تحويل</span>
                      </>
                    )}
                    {selectedReturnDetails.refund_method === "replacement" && (
                      <>
                        <FontAwesomeIcon icon={faExchangeAlt} className="text-indigo-500" />
                        <span>سند استبدال</span>
                      </>
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-xs block">تاريخ الإرجاع:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {new Date(selectedReturnDetails.created_at).toLocaleString('ar-SA')}
                  </span>
                </div>
              </div>

              {selectedReturnDetails.reason && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border-r-4 border-amber-500 rounded text-xs text-amber-800 dark:text-amber-300">
                  <strong>سبب المرتجع:</strong> {selectedReturnDetails.reason}
                </div>
              )}

              {/* عناصر المرتجع */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 dark:text-white">📦 البنود المسترجعة:</h4>
                <div className="border border-gray-150 dark:border-gray-700 rounded-xl overflow-hidden animate-fadeIn">
                  <table className="w-full text-start text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-750 border-b border-gray-150 dark:border-gray-700 font-bold">
                        <th className="py-2.5 px-3 text-start">المنتج</th>
                        <th className="py-2.5 px-3 text-center">الكمية المسترجعة</th>
                        <th className="py-2.5 px-3 text-center">السعر الفردي</th>
                        <th className="py-2.5 px-3 text-center">المجموع الفرعي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 dark:divide-gray-700">
                      {selectedReturnDetails.items?.map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold block">{item.product?.name}</span>
                            <span className="text-[10px] text-gray-400">SKU: {item.product?.sku}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{item.return_quantity}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{parseFloat(item.price).toFixed(2)} ر.س</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                            {parseFloat(item.subtotal).toFixed(2)} ر.س
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* الملخص المالي للمرتجع */}
              <div className="flex justify-end pt-3 border-t border-gray-150 dark:border-gray-700">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-500">
                    <span>المجموع الإجمالي للمرتجع:</span>
                    <span>{parseFloat(selectedReturnDetails.subtotal).toFixed(2)} ر.س</span>
                  </div>
                  {parseFloat(selectedReturnDetails.discount_amount) > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>خصم نسبي مستقطع:</span>
                      <span>-{parseFloat(selectedReturnDetails.discount_amount).toFixed(2)} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-sm border-t border-gray-200 dark:border-gray-700 pt-2 text-gray-900 dark:text-white">
                    <span>الصافي المسترد:</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {parseFloat(selectedReturnDetails.refund_total).toFixed(2)} ر.س
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-750 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDetailsModal(false);
                  navigate(`/sales-returns/${selectedReturnDetails.id}/invoice`, { state: { autoPrint: true } });
                }}
                className="btn btn-primary py-2 px-6 font-bold flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faPrint} />
                <span>طباعة فاتورة المرتجع</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-secondary py-2 px-6 font-bold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesReturn;
