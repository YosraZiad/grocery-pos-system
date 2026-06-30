import { useState, useEffect, useRef } from "react";
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
} from "@fortawesome/free-solid-svg-icons";
import api from "../services/api";
import ConfirmationModal from "../components/ConfirmationModal";

function SalesReturn() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [returnCart, setReturnCart] = useState([]);
  const [refundMethod, setRefundMethod] = useState("cash");
  const [reason, setReason] = useState("");
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
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
      // إعادة تصفير الحقول
      setActiveInvoice(null);
      setReturnCart([]);
      setInvoiceNumber("");
      setReason("");
      setShowConfirmModal(false);
      
      // تحديث الكاش
      queryClient.invalidateQueries(["returns"]);
      queryClient.invalidateQueries(["sales"]);
      queryClient.invalidateQueries(["products"]);
      queryClient.invalidateQueries(["inventory"]);
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
            <span>↩️</span> {t("salesReturns") || "مرتجع المبيعات (الفاتورة العكسية)"}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            البحث عن الفاتورة، التحقق من البنود القابلة للاسترجاع، وإصدار إشعار دائن للعميل
          </p>
        </div>

        {/* نموذج البحث السريع */}
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
      </div>

      {/* الحالة الافتراضية عند عدم تحديد فاتورة */}
      {!activeInvoice ? (
        <div className="card flex flex-col items-center justify-center text-center py-20 bg-gray-50 dark:bg-gray-850 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-3xl">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center text-4xl mb-4">
            <span>🔍</span>
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
                  <span className="font-medium text-gray-900 dark:text-white">
                    {activeInvoice.payment_method === "cash" && "نقدي 💵"}
                    {activeInvoice.payment_method === "card" && "بطاقة/شبكة 💳"}
                    {activeInvoice.payment_method === "transfer" && "تحويل بنكي 🏦"}
                    {activeInvoice.payment_method === "hybrid" && "مختلط/مقسم 🔗"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block">إجمالي القيمة الأصلية:</span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400">{parseFloat(activeInvoice.total).toFixed(2)} ر.س</span>
                </div>
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
              <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                💵 ملخص المرتجع والرد المالي
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
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setRefundMethod(method.value)}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                        refundMethod === method.value
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300"
                          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900"
                      }`}
                    >
                      <FontAwesomeIcon icon={method.icon} />
                      <span>{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

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
                disabled={returnCart.length === 0 || submitReturnMutation.isPending}
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
          refundMethod === "transfer" ? "بتحويل بنكي" : "بطريقة دفع مقسمة"
        }) وإعادة إدراج السلع المسترجعة في المخازن.`}
        confirmText="نعم، اعتمد المرتجع"
        cancelText="تراجع"
        type="warning"
      />
    </div>
  );
}

export default SalesReturn;
