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
  const { t } = useI18n();
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
      if (showConfirmModal || showDiscountModal || showAdminAuthModal || showDeleteItemConfirmModal || showCashPaymentModal || showCardPaymentModal || showHybridPaymentModal) return;

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
  }, [items, isLoading, showConfirmModal, showDiscountModal, showAdminAuthModal, showDeleteItemConfirmModal, showCashPaymentModal, showCardPaymentModal, showHybridPaymentModal, paymentMethod]);

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

  const handleCheckout = () => {
    if (paymentMethod === "cash") {
      setShowCashPaymentModal(true);
    } else if (paymentMethod === "card") {
      setShowCardPaymentModal(true);
    } else if (paymentMethod === "hybrid") {
      setShowHybridPaymentModal(true);
    } else {
      setShowConfirmModal(true);
    }
  };

  const confirmCheckout = (amountReceived = null, changeAmount = null, paymentDetails = null) => {
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
              {subtotal.toFixed(2)} ر.س
            </span>
          </div>

          {/* الخصم */}
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-600 dark:text-gray-400">
                {t("discount")}:
              </span>
              <button
                onClick={() => setShowDiscountModal(true)}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold px-2 py-0.5 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                {discount > 0
                  ? discountType === "percentage"
                    ? `${discount}%`
                    : `${discount.toFixed(2)} ر.س`
                  : `+ ${t("addDiscount")}`}
              </button>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400 font-semibold">
                <span>{t("discount")}:</span>
                <span>-{discountAmount.toFixed(2)} ر.س</span>
              </div>
            )}
          </div>

          {/* الإجمالي */}
          <div className="flex justify-between items-center text-lg font-bold text-gray-900 dark:text-white border-t border-primary-200 dark:border-primary-800 pt-2 mt-1">
            <span>{t("total")}:</span>
            <span className="text-primary-600 dark:text-primary-400 text-2xl font-extrabold">
              {total.toFixed(2)} ر.س
            </span>
          </div>

          {/* طريقة الدفع */}
          <PaymentMethod
            value={paymentMethod}
            onChange={setPaymentMethod}
            disabled={isLoading}
          />

          {/* زر البيع */}
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
        onConfirm={(received, change) => confirmCheckout(received, change)}
        totalDue={total}
      />

      {/* Card Payment Modal */}
      <CardPaymentModal
        isOpen={showCardPaymentModal}
        onClose={() => setShowCardPaymentModal(false)}
        onConfirm={confirmCheckout}
        totalDue={total}
      />

      {/* Hybrid Payment Modal */}
      <HybridPaymentModal
        isOpen={showHybridPaymentModal}
        onClose={() => setShowHybridPaymentModal(false)}
        onConfirm={(amountReceived, changeAmount, paymentDetails) => 
          confirmCheckout(amountReceived, changeAmount, paymentDetails)
        }
        totalDue={total}
      />

    </div>
  );
}

export default Cart;
