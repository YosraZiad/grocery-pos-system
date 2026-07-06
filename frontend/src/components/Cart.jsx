import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCartShopping,
  faCashRegister,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../context/I18nContext";
import CartItem from "./CartItem";
import DiscountModal from "./DiscountModal";
import PaymentMethod from "./PaymentMethod";
import ConfirmationModal from "./ConfirmationModal";
import AdminAuthModal from "./AdminAuthModal";
import CashPaymentModal from "./CashPaymentModal";
import CardPaymentModal from "./CardPaymentModal";
import HybridPaymentModal from "./HybridPaymentModal";
import TransferPaymentModal from "./TransferPaymentModal";
import api from "../services/api";
import toast from "react-hot-toast";

function Cart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isLoading,
  latestAddedId,
  itemIndexToDelete,
  onClearDeleteIndex,
  onClearCart,
  onRestoreCart,
  discount,
  setDiscount,
  discountType,
  setDiscountType,
}) {
  const { t, language } = useI18n();
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showAdminAuthModal, setShowAdminAuthModal] = useState(false);
  const [adminAuthTargetIndex, setAdminAuthTargetIndex] = useState(null);
  const [showDeleteItemConfirmModal, setShowDeleteItemConfirmModal] = useState(false);
  const [deleteItemTargetIndex, setDeleteItemTargetIndex] = useState(null);
  const [showCashPaymentModal, setShowCashPaymentModal] = useState(false);
  const [showCardPaymentModal, setShowCardPaymentModal] = useState(false);
  const [showHybridPaymentModal, setShowHybridPaymentModal] = useState(false);
  const [showTransferPaymentModal, setShowTransferPaymentModal] = useState(false);

  const [voucherCodeInput, setVoucherCodeInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // إزالة السند عند إفراغ السلة تلقائياً
  useEffect(() => {
    if (items.length === 0) {
      setAppliedVoucher(null);
      setVoucherCodeInput("");
    }
  }, [items]);

  const handleApplyVoucher = async () => {
    const code = voucherCodeInput.trim();
    if (!code) return;

    try {
      const response = await api.get(`/vouchers/verify?code=${code}`);
      if (response.data?.success && response.data?.data) {
        setAppliedVoucher(response.data.data);
        setVoucherCodeInput("");
        toast.success(
          language === "ar"
            ? `تم تطبيق سند الاستبدال بقيمة ${response.data.data.amount.toFixed(2)} ر.س للعميل: ${response.data.data.customer_name}`
            : `Voucher of ${response.data.data.amount.toFixed(2)} SAR applied for customer: ${response.data.data.customer_name}`
        );
      }
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message ||
          t("invalidVoucher") ||
          (language === "ar" ? "سند الاستبدال غير صالح أو تم استخدامه مسبقاً." : "Invalid voucher or already used.")
      );
    }
  };

  // مراقبة طلبات الحذف القادمة من الأب (مثلاً عند تقليل الكمية في حقل البحث لأقل من 1)
  useEffect(() => {
    if (itemIndexToDelete !== null && itemIndexToDelete !== undefined) {
      triggerItemDeletion(itemIndexToDelete);
      onClearDeleteIndex();
    }
  }, [itemIndexToDelete]);

  // مستمع اختصارات لوحة المفاتيح للسلة (F2 لإتمام الدفع، F3 لإضافة خصم)
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // تجنب تفعيل الاختصارات إذا كانت هناك نافذة منبثقة مفتوحة بالفعل لمنع التعارض
      if (showConfirmModal || showDiscountModal || showAdminAuthModal || showDeleteItemConfirmModal || showCashPaymentModal || showCardPaymentModal || showHybridPaymentModal || showTransferPaymentModal) return;

      if (e.key === "F2") {
        if (items.length > 0 && !isLoading) {
          e.preventDefault();
          handleCheckout();
        }
      } else if (e.key === "F3") {
        if (items.length > 0 && !isLoading) {
          e.preventDefault();
          setShowDiscountModal(true);
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [items, isLoading, showConfirmModal, showDiscountModal, showAdminAuthModal, showDeleteItemConfirmModal, showCashPaymentModal, showCardPaymentModal, showHybridPaymentModal, showTransferPaymentModal, paymentMethod]);

  const triggerItemDeletion = (index) => {
    const item = items[index];
    if (!item) return;
    const itemTotal = item.price * item.quantity;
    if (itemTotal > 100) {
      setAdminAuthTargetIndex(index);
      setShowAdminAuthModal(true);
    } else {
      setDeleteItemTargetIndex(index);
      setShowDeleteItemConfirmModal(true);
    }
  };

  const confirmItemDeletion = () => {
    if (deleteItemTargetIndex === null) return;
    const item = items[deleteItemTargetIndex];
    if (!item) return;
    const itemTotal = item.price * item.quantity;

    api.post("/audit-logs", {
      action: "cart_item_deletion",
      description: `Deleted item: ${item.product.name} (Qty: ${item.quantity}) with total value: ${itemTotal.toFixed(2)} SAR. Confirmed by cashier.`,
    })
    .then(() => {
      onRemoveItem(deleteItemTargetIndex);
    })
    .catch((err) => {
      console.error("Error logging cashier deletion:", err);
      onRemoveItem(deleteItemTargetIndex);
    })
    .finally(() => {
      setDeleteItemTargetIndex(null);
      setShowDeleteItemConfirmModal(false);
    });
  };

  const handleAdminAuthSuccess = (admin) => {
    if (adminAuthTargetIndex === null) return;
    const item = items[adminAuthTargetIndex];
    if (!item) return;
    const itemTotal = item.price * item.quantity;

    api.post("/audit-logs", {
      action: "cart_item_deletion",
      description: `Deleted item: ${item.product.name} (Qty: ${item.quantity}) with total value: ${itemTotal.toFixed(2)} SAR. Authorized by admin: ${admin.name} (ID: ${admin.id}).`,
      admin_user_id: admin.id,
    })
    .then(() => {
      onRemoveItem(adminAuthTargetIndex);
    })
    .catch((err) => {
      console.error("Error logging admin-authorized deletion:", err);
      onRemoveItem(adminAuthTargetIndex);
    })
    .finally(() => {
      setAdminAuthTargetIndex(null);
      setShowAdminAuthModal(false);
    });
  };

  const handleUpdateQuantityWithLogging = (index, newQty) => {
    const item = items[index];
    if (!item) return;
    const oldQty = item.quantity;
    if (newQty < oldQty) {
      const valDiff = ((oldQty - newQty) * item.price).toFixed(2);
      api.post("/audit-logs", {
        action: "cart_item_quantity_update",
        description: `Reduced quantity of ${item.product.name} from ${oldQty} to ${newQty} (Value difference: ${valDiff} SAR)`,
      }).catch(err => console.error("Error logging quantity reduction:", err));
    }
    onUpdateQuantity(index, newQty);
  };


  // حساب الإجمالي
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // حساب الخصم
  const discountAmount =
    discountType === "percentage" ? (subtotal * discount) / 100 : discount;

  const total = subtotal - discountAmount;
  const remainingTotal = Math.max(0, total - (appliedVoucher ? appliedVoucher.amount : 0));

  const handleCheckout = () => {
    if (remainingTotal === 0 && appliedVoucher) {
      confirmCheckout(0, 0, null, null);
      return;
    }
    if (paymentMethod === "cash") {
      setShowCashPaymentModal(true);
    } else if (paymentMethod === "card") {
      setShowCardPaymentModal(true);
    } else if (paymentMethod === "transfer") {
      setShowTransferPaymentModal(true);
    } else if (paymentMethod === "hybrid") {
      setShowHybridPaymentModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const confirmCheckout = (amountReceived = null, changeAmount = null, paymentDetails = null, customerId = null) => {
    const saleData = {
      items: items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      discount: discount,
      discount_type: discountType,
      payment_method: paymentDetails ? 'hybrid' : paymentMethod,
      amount_received: amountReceived,
      change_amount: changeAmount,
      payment_details: paymentDetails,
      customer_id: customerId,
      voucher_code: appliedVoucher ? appliedVoucher.code : null,
    };
    onCheckout(saleData);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl h-full flex flex-col shadow-lg border border-gray-200 dark:border-gray-700 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon
              icon={faCartShopping}
              className="text-white text-xl"
            />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("cart")}
          </h3>
        </div>
        <span className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold">
          {items.length} {t("items") || "items"}
        </span>
      </div>




      {/* قائمة المنتجات */}
      <div className="flex-1 overflow-y-auto mb-3 -mx-4 px-4 scrollbar-thin scrollbar-thumb-primary-300 dark:scrollbar-thumb-primary-700 scrollbar-track-transparent">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-7xl mb-4 opacity-50">
              <FontAwesomeIcon icon={faCartShopping} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              {t("emptyCart")}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {t("addProductsToCart") ||
                "Search and add products to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <CartItem
                key={index}
                item={item}
                onUpdateQuantity={(qty) => handleUpdateQuantityWithLogging(index, qty)}
                onRemove={() => triggerItemDeletion(index)}
                latestAddedId={latestAddedId}
              />
            ))}
          </div>
        )}
      </div>

      {/* ملخص الطلب */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-2 bg-gray-50 dark:bg-gray-900/50 -mx-4 px-4 pb-3 rounded-b-3xl">
          {/* الإجمالي الفرعي */}
          <div className="flex justify-between items-center text-gray-700 dark:text-gray-300 text-sm">
            <span className="font-medium">{t("subtotal")}:</span>
            <span className="font-semibold text-base">
              {subtotal.toFixed(2)} {t("sar") || "ر.س"}
            </span>
          </div>

          {/* الخصم */}
          <div className="space-y-1 text-sm pb-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                {t("discount")}:
              </span>
              <button
                type="button"
                onClick={() => setShowDiscountModal(true)}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold px-2 py-0.5 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                {discount > 0
                  ? discountType === "percentage"
                    ? `${discount}%`
                    : `${discount.toFixed(2)} ${t("sar") || "ر.س"}`
                  : `+ ${t("addDiscount")}`}
              </button>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400 font-semibold">
                <span>{t("discount")}:</span>
                <span>-{discountAmount.toFixed(2)} {t("sar") || "ر.س"}</span>
              </div>
            )}
          </div>

          {/* حقل إدخال ومسح سند الاستبدال (الكوبون) */}
          <div className="border-t border-gray-200 dark:border-gray-700/60 pt-2 space-y-1">
            <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block">
              {t("voucherLabel") || "سند الاستبدال (كوبون المرتجع):"}
            </label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder={t("voucherPlaceholder") || "مسح بالباركود أو اكتب VCH-..."}
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyVoucher();
                  }
                }}
                className="input py-1.5 px-2 text-xs w-full font-mono"
                disabled={!!appliedVoucher}
              />
              <button
                type="button"
                onClick={handleApplyVoucher}
                disabled={!voucherCodeInput.trim() || !!appliedVoucher}
                className="btn btn-primary py-1 px-3 text-xs shrink-0"
              >
                {t("apply") || "تطبيق"}
              </button>
            </div>
          </div>

          {/* معلومات السند النشط */}
          {appliedVoucher && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
              <div className="space-y-0.5 text-emerald-800 dark:text-emerald-300">
                <div className="font-bold flex items-center gap-1">
                  <span>🎟️</span>
                  <span>{t("activeVoucher") || "سند استبدال نشط:"}</span>
                  <span className="font-mono bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">{appliedVoucher.code}</span>
                </div>
                <div className="text-[10px] text-gray-600 dark:text-gray-400">
                  {t("customer")}: <strong className="text-gray-800 dark:text-gray-200">{appliedVoucher.customer_name}</strong>
                </div>
                <div className="font-bold text-[11px]">
                  {t("value") || "القيمة"}: <span className="font-mono text-emerald-600 dark:text-emerald-400">{appliedVoucher.amount.toFixed(2)} {t("sar") || "ر.س"}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppliedVoucher(null)}
                className="text-red-500 hover:text-red-700 font-bold px-2 py-1 text-xs"
              >
                {t("cancel")}
              </button>
            </div>
          )}

          {/* الإجمالي */}
          <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white border-t border-primary-200 dark:border-primary-800 pt-2 mt-1">
            <span>{t("total")}:</span>
            <span className="text-primary-600 dark:text-primary-400 text-2xl font-extrabold">
              {total.toFixed(2)} {t("sar") || "ر.س"}
            </span>
          </div>

          {appliedVoucher && (
            <div className="flex justify-between items-center text-sm font-bold text-gray-700 dark:text-gray-300 pt-1 border-t border-dashed border-gray-200 dark:border-gray-700">
              <span>{t("remainingToPay") || "المتبقي للسداد:"}</span>
              <span className="font-mono text-amber-600 dark:text-amber-450 text-base">{remainingTotal.toFixed(2)} {t("sar") || "ر.س"}</span>
            </div>
          )}

          {/* طريقة الدفع */}
          {remainingTotal > 0 && (
            <PaymentMethod
              value={paymentMethod}
              onChange={setPaymentMethod}
              disabled={isLoading}
            />
          )}

          {/* زر البيع */}
          {remainingTotal === 0 && appliedVoucher ? (
            <button
              onClick={handleCheckout}
              disabled={isLoading || items.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
              <span>
                <FontAwesomeIcon
                  icon={isLoading ? faSpinner : faCashRegister}
                  className={isLoading ? "animate-spin" : ""}
                />
              </span>
              <span>{isLoading ? t("processing") : (t("finishSaleVoucher") || "إنهاء البيع (سداد كامل بالسند)")}</span>
            </button>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={isLoading || items.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 rtl:space-x-reverse"
            >
              <span>
                <FontAwesomeIcon
                  icon={isLoading ? faSpinner : faCashRegister}
                  className={isLoading ? "animate-spin" : ""}
                />
              </span>
              <span>{isLoading ? t("processing") : t("completeSale")}</span>
            </button>
          )}
        </div>
      )}


      {/* Discount Modal */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApply={(disc, type) => {
          setDiscount(disc);
          setDiscountType(type);
        }}
        currentDiscount={discount}
        currentDiscountType={discountType}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmCheckout}
        title={t("confirmSale")}
        message={t("confirmSaleMessage")}
        confirmText={t("completeSale")}
        cancelText={t("cancel")}
        type="info"
      />

      {/* Delete Item Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteItemConfirmModal}
        onClose={() => {
          setShowDeleteItemConfirmModal(false);
          setDeleteItemTargetIndex(null);
        }}
        onConfirm={confirmItemDeletion}
        title={t("confirmDelete") || "تأكيد الحذف"}
        message={`${t("confirmDeleteMessage") || "هل أنت متأكد من رغبتك في حذف المنتج"} "${deleteItemTargetIndex !== null ? items[deleteItemTargetIndex]?.product?.name : ''}"؟`}
        confirmText={t("delete") || "حذف"}
        cancelText={t("cancel") || "إلغاء"}
        type="danger"
      />

      {/* Admin Auth Modal for High-Value Deletion */}
      <AdminAuthModal
        isOpen={showAdminAuthModal}
        onClose={() => {
          setShowAdminAuthModal(false);
          setAdminAuthTargetIndex(null);
        }}
        onSuccess={handleAdminAuthSuccess}
        itemName={adminAuthTargetIndex !== null ? items[adminAuthTargetIndex]?.product?.name : ""}
        itemTotal={adminAuthTargetIndex !== null ? items[adminAuthTargetIndex]?.price * items[adminAuthTargetIndex]?.quantity : 0}
      />

      {/* Cash Payment Modal */}
      <CashPaymentModal
        isOpen={showCashPaymentModal}
        onClose={() => setShowCashPaymentModal(false)}
        onConfirm={(received, change, customerId) => confirmCheckout(received, change, null, customerId)}
        totalDue={remainingTotal}
      />

      {/* Card Payment Modal */}
      <CardPaymentModal
        isOpen={showCardPaymentModal}
        onClose={() => setShowCardPaymentModal(false)}
        onConfirm={(customerId) => confirmCheckout(null, null, null, customerId)}
        totalDue={remainingTotal}
      />

      {/* Hybrid Payment Modal */}
      <HybridPaymentModal
        isOpen={showHybridPaymentModal}
        onClose={() => setShowHybridPaymentModal(false)}
        onConfirm={(amountReceived, changeAmount, paymentDetails, customerId) => 
          confirmCheckout(amountReceived, changeAmount, paymentDetails, customerId)
        }
        totalDue={remainingTotal}
      />

      {/* Transfer Payment Modal */}
      <TransferPaymentModal
        isOpen={showTransferPaymentModal}
        onClose={() => setShowTransferPaymentModal(false)}
        onConfirm={(amountReceived, changeAmount, paymentDetails, customerId) =>
          confirmCheckout(amountReceived, changeAmount, paymentDetails, customerId)
        }
        totalDue={remainingTotal}
      />

    </div>
  );
}

export default Cart;
