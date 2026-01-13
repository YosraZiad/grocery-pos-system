import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProductSearch from '../components/ProductSearch';
import Cart from '../components/Cart';

function Sales() {
  const [cartItems, setCartItems] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  // Reset السلة عند فتح الصفحة (New Sale)
  useEffect(() => {
    // Reset السلة عند فتح الصفحة مباشرة (New Sale)
    setCartItems([]);
  }, []);

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
      toast.error(
        `${t('availableQuantity')}: ${product.quantity + newItems[index].quantity}`,
        { duration: 4000 }
      );
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

      toast.success(t('saleCompletedSuccessfully') || 'Sale completed successfully');
      
      // توجيه المستخدم لصفحة الفاتورة
      navigate(`/sales/${data.data.id}/invoice`);
    },
    onError: (error) => {
      const message = error.response?.data?.message || 
        (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null) ||
        t('errorCreatingSale') || 'Error creating sale';
      toast.error(message, { duration: 5000 });
    },
  });

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('salesScreenTitle')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('quickAndEasy')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* البحث وإضافة المنتجات */}
        <div className="lg:col-span-5 space-y-4">
          <div className="card p-6">
            <ProductSearch onSelectProduct={handleAddProduct} />
          </div>

          {/* معلومات إضافية - Compact */}
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center space-x-2 rtl:space-x-reverse text-sm">
              <span>💡</span>
              <span>{t('tips')}</span>
            </h3>
            <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <li>• {t('tip1')}</li>
              <li>• {t('tip2')}</li>
              <li>• {t('tip3')}</li>
            </ul>
          </div>
        </div>

        {/* سلة المشتريات - أكبر مساحة */}
        <div className="lg:col-span-7">
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
