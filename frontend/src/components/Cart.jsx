import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import CartItem from './CartItem';
import DiscountModal from './DiscountModal';
import PaymentMethod from './PaymentMethod';
import ConfirmationModal from './ConfirmationModal';

function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, isLoading }) {
  const { t } = useI18n();
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // حساب الإجمالي
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // حساب الخصم
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : discount;
  
  const total = subtotal - discountAmount;

  const handleCheckout = () => {
    setShowConfirmModal(true);
  };

  const confirmCheckout = () => {
    const saleData = {
      items: items.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
      discount: discount,
      discount_type: discountType,
      payment_method: paymentMethod,
    };
    onCheckout(saleData);
  };

  return (
    <div className="card sticky top-20 h-[calc(100vh-8rem)] flex flex-col shadow-lg border-2 border-primary-200 dark:border-primary-800">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🛒</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('cart')}
          </h3>
        </div>
        <span className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-bold">
          {items.length} {t('items') || 'items'}
        </span>
      </div>

      {/* قائمة المنتجات */}
      <div className="flex-1 overflow-y-auto mb-4 -mx-6 px-6 scrollbar-thin scrollbar-thumb-primary-300 dark:scrollbar-thumb-primary-700 scrollbar-track-transparent">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-7xl mb-4 opacity-50">🛒</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
              {t('emptyCart')}
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              {t('addProductsToCart') || 'Search and add products to get started'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <CartItem
                key={index}
                item={item}
                onUpdateQuantity={(qty) => onUpdateQuantity(index, qty)}
                onRemove={() => onRemoveItem(index)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ملخص الطلب */}
      {items.length > 0 && (
        <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 space-y-3 bg-gray-50 dark:bg-gray-900/50 -mx-6 px-6 pb-4 rounded-b-lg">
          {/* الإجمالي الفرعي */}
          <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
            <span className="font-medium">{t('subtotal')}:</span>
            <span className="font-semibold text-lg">{subtotal.toFixed(2)} ر.س</span>
          </div>

          {/* الخصم */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t('discount')}:
              </span>
              <button
                onClick={() => setShowDiscountModal(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 font-semibold px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
              >
                {discount > 0 
                  ? discountType === 'percentage' 
                    ? `${discount}%` 
                    : `${discount.toFixed(2)} ر.س`
                  : `+ ${t('addDiscount')}`
                }
              </button>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400 font-semibold">
                <span>{t('discount')}:</span>
                <span>-{discountAmount.toFixed(2)} ر.س</span>
              </div>
            )}
          </div>

          {/* الإجمالي */}
          <div className="flex justify-between items-center text-2xl font-bold text-gray-900 dark:text-white border-t-2 border-primary-200 dark:border-primary-800 pt-3 mt-2">
            <span>{t('total')}:</span>
            <span className="text-primary-600 dark:text-primary-400 text-3xl">
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
            className="w-full py-5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 rtl:space-x-reverse"
          >
            <span>{isLoading ? '⏳' : '💰'}</span>
            <span>{isLoading ? t('processing') : t('completeSale')}</span>
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
        title={t('confirmSale')}
        message={t('confirmSaleMessage')}
        confirmText={t('completeSale')}
        cancelText={t('cancel')}
        type="info"
      />
    </div>
  );
}

export default Cart;
