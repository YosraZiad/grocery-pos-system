import { useState } from 'react';
import CartItem from './CartItem';

function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, isLoading }) {
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">سلة المشتريات</h3>

      {/* قائمة المنتجات */}
      <div className="max-h-96 overflow-y-auto mb-4">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            السلة فارغة
          </div>
        ) : (
          items.map((item, index) => (
            <CartItem
              key={index}
              item={item}
              onUpdateQuantity={(qty) => onUpdateQuantity(index, qty)}
              onRemove={() => onRemoveItem(index)}
            />
          ))
        )}
      </div>

      {/* ملخص الطلب */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          {/* الإجمالي الفرعي */}
          <div className="flex justify-between text-gray-600">
            <span>الإجمالي الفرعي:</span>
            <span>{subtotal.toFixed(2)} ر.س</span>
          </div>

          {/* الخصم */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="fixed">قيمة ثابتة</option>
                <option value="percentage">نسبة مئوية</option>
              </select>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                min="0"
                placeholder="الخصم"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
              />
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>الخصم:</span>
                <span>-{discountAmount.toFixed(2)} ر.س</span>
              </div>
            )}
          </div>

          {/* الإجمالي */}
          <div className="flex justify-between text-xl font-bold text-gray-900 border-t border-gray-200 pt-4">
            <span>الإجمالي:</span>
            <span>{total.toFixed(2)} ر.س</span>
          </div>

          {/* طريقة الدفع */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              طريقة الدفع
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
            >
              <option value="cash">نقدي</option>
              <option value="card">بطاقة</option>
              <option value="transfer">تحويل</option>
            </select>
          </div>

          {/* زر البيع */}
          <button
            onClick={handleCheckout}
            disabled={isLoading || items.length === 0}
            className="w-full py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {isLoading ? 'جاري المعالجة...' : 'إتمام البيع'}
          </button>
        </div>
      )}
    </div>
  );
}

export default Cart;
