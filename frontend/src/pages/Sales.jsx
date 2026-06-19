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
  const [activeShift, setActiveShift] = useState(null);
  const [checkingShift, setCheckingShift] = useState(true);
  const [latestAddedId, setLatestAddedId] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();

  // إتمام البيع (Hook)
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
      console.error('Sale creation error:', error);
      
      let message = t('errorCreatingSale') || 'Error creating sale';
      
      if (error.response) {
        // Server responded with error
        if (error.response.data?.message) {
          message = error.response.data.message;
        } else if (error.response.data?.errors) {
          const errors = Object.values(error.response.data.errors).flat();
          message = errors.join(', ');
        } else if (error.response.data?.error) {
          message = error.response.data.error;
        } else {
          message = `Server error: ${error.response.status} ${error.response.statusText}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        message = t('networkError') || 'Network error. Please check your connection.';
      } else {
        // Something else happened
        message = error.message || t('errorCreatingSale') || 'Error creating sale';
      }
      
      toast.error(message, { duration: 6000 });
    },
  });

  // Reset السلة عند فتح الصفحة (New Sale)
  useEffect(() => {
    checkActiveShift();
    setCartItems([]);
  }, []);

  const checkActiveShift = async () => {
    try {
      const response = await api.get('/shifts/active');
      if (response.data?.active) {
        setActiveShift(response.data.shift);
      } else {
        setActiveShift(null);
      }
    } catch (error) {
      console.error("Error checking active shift:", error);
    } finally {
      setCheckingShift(false);
    }
  };

  if (checkingShift) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!activeShift) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-6 text-center space-y-5">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center text-3xl mx-auto">
            <span>⚠️</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('shiftRequiredTitle') || "Shift Activation Required | تفعيل الوردية مطلوب"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('shiftRequiredDesc') || "You must open a new shift and declare your starting cash float before you can make sales. | يجب عليك فتح وردية جديدة والتصريح بالعهدة النقدية قبل البدء بالمبيعات."}
            </p>
          </div>
          <button
            onClick={() => navigate('/start-shift')}
            className="w-full btn btn-primary min-h-12 text-base font-bold flex items-center justify-center"
          >
            {t('openShiftBtn') || "Open New Shift | فتح وردية جديدة"}
          </button>
        </div>
      </div>
    );
  }

  // إضافة منتج للسلة
  const handleAddProduct = (product) => {
    // التحقق من وجود المنتج في السلة
    const existingIndex = cartItems.findIndex(
      item => item.product.id === product.id
    );

    // تعيين معرف الوميض للمنتج الأحدث المضاف
    setLatestAddedId(`${product.id}-${Date.now()}`);

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
            latestAddedId={latestAddedId}
          />
        </div>
      </div>
    </div>
  );
}

export default Sales;
