import { useState } from 'react';
import { useI18n } from '../context/I18nContext';
import CartItem from './CartItem';

function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, isLoading }) {
  const { t } = useI18n();
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  // حساب الإجمالي
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // حساب الخصم
  const discountAmount = discountType === 'percentage' 
    ? (subtotal * discount) / 100 
    : discount;
  
  const total = subtotal - discountAmount;

  const handleCheckout = () => {
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
    <div className="card sticky top-20 h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('cart')}
        </h3>
        <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-semibold">
          {items.length}
        </span>
      </div>

      {/* قائمة المنتجات */}
      <div className="flex-1 overflow-y-auto mb-4 -mx-6 px-6">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {t('emptyCart')}
            </p>
          </div>
        ) : (
          <div className="space-y-0">
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
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
          {/* الإجمالي الفرعي */}
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>{t('subtotal')}:</span>
            <span className="font-medium">{subtotal.toFixed(2)} ر.س</span>
          </div>

          {/* الخصم */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="fixed">{t('fixed')}</option>
                <option value="percentage">{t('percentage')}</option>
              </select>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                placeholder={t('discount')}
                className="flex-1 input text-sm"
              />
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600 dark:text-red-400 font-medium">
                <span>{t('discount')}:</span>
                <span>-{discountAmount.toFixed(2)} ر.س</span>
              </div>
            )}
          </div>

          {/* الإجمالي */}
          <div className="flex justify-between text-2xl font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-4">
            <span>{t('total')}:</span>
            <span className="text-primary-600 dark:text-primary-400">
              {total.toFixed(2)} ر.س
            </span>
          </div>

          {/* طريقة الدفع */}
          <div>
            <label className="label mb-2">
              {t('paymentMethod')}
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input w-full"
            >
              <option value="cash">{t('cash')}</option>
              <option value="card">{t('card')}</option>
              <option value="transfer">{t('transfer')}</option>
            </select>
          </div>

          {/* زر البيع */}
          <button
            onClick={handleCheckout}
            disabled={isLoading || items.length === 0}
            className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          >
            {isLoading ? t('processing') : t('completeSale')}
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
