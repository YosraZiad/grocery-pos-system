import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import api from '../services/api';
import ProductSearch from '../components/ProductSearch';
import Cart from '../components/Cart';

function Sales() {
  const [cartItems, setCartItems] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { t } = useI18n();

  // إضافة منتج للسلة
  const handleAddProduct = (product) => {
    // التحقق من وجود المنتج في السلة
    const existingIndex = cartItems.findIndex(
      item => item.product.id === product.id
    );

    if (existingIndex >= 0) {
      // زيادة الكمية
      const newItems = [...cartItems];
      newItems[existingIndex].quantity += 1;
      setCartItems(newItems);
    } else {
      // إضافة منتج جديد
      setCartItems([
        ...cartItems,
        {
          product: product,
          quantity: 1,
          price: product.sale_price,
        },
      ]);
    }
  };

  // تحديث الكمية
  const handleUpdateQuantity = (index, quantity) => {
    const newItems = [...cartItems];
    const product = newItems[index].product;

    // التحقق من توفر الكمية
    if (quantity > product.quantity + newItems[index].quantity) {
      alert(`Available quantity: ${product.quantity + newItems[index].quantity}`);
      return;
    }

    newItems[index].quantity = quantity;
    setCartItems(newItems);
  };

  // حذف منتج من السلة
  const handleRemoveItem = (index) => {
    const newItems = cartItems.filter((_, i) => i !== index);
    setCartItems(newItems);
  };

  // إتمام البيع
  const checkoutMutation = useMutation({
    mutationFn: async (saleData) => {
      const response = await api.post('/sales', saleData);
      return response.data;
    },
    onSuccess: (data) => {
      // إعادة تعيين السلة
      setCartItems([]);
      
      // تحديث البيانات
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['sales']);

      // توجيه المستخدم لصفحة الفاتورة
      navigate(`/sales/${data.data.id}/invoice`);
    },
    onError: (error) => {
      alert(error.response?.data?.message || t('error'));
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('salesScreenTitle')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Quick and easy point of sale system
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* البحث وإضافة المنتجات */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <ProductSearch onSelectProduct={handleAddProduct} />
          </div>

          {/* معلومات إضافية */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center space-x-2 rtl:space-x-reverse">
              <span>💡</span>
              <span>{t('tips')}</span>
            </h3>
            <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
              <li>{t('tip1')}</li>
              <li>{t('tip2')}</li>
              <li>{t('tip3')}</li>
            </ul>
          </div>
        </div>

        {/* سلة المشتريات */}
        <div className="lg:col-span-1">
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={checkoutMutation.mutate}
            isLoading={checkoutMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}

export default Sales;
