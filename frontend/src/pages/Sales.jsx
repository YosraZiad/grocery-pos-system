import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProductSearch from '../components/ProductSearch';
import Cart from '../components/Cart';

function Sales() {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_cart_items');
      console.log("Sales component: Initializing cartItems from localStorage. Value:", saved);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Sales component: Failed to parse pos_cart_items:", e);
      return [];
    }
  });
  const [activeShift, setActiveShift] = useState(null);
  const [checkingShift, setCheckingShift] = useState(true);
  const [latestAddedId, setLatestAddedId] = useState(null);
  const [itemIndexToDelete, setItemIndexToDelete] = useState(null);
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

  // التحقق من الوردية عند فتح الصفحة
  useEffect(() => {
    checkActiveShift();
  }, []);

  // مزامنة السلة مع الـ LocalStorage عند تغييرها
  useEffect(() => {
    console.log("Sales component: Syncing cartItems to localStorage. New value:", cartItems);
    localStorage.setItem('pos_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

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

  // إضافة منتج للسلة مع دعم الكمية المخصصة والتحقق من المخزون
  const handleAddProduct = (product, quantity = 1) => {
    const existingIndex = cartItems.findIndex(
      item => item.product.id === product.id
    );

    // تعيين معرف الوميض للمنتج الأحدث المضاف
    setLatestAddedId(`${product.id}-${Date.now()}`);

    if (existingIndex >= 0) {
      const newItems = [...cartItems];
      const newQty = newItems[existingIndex].quantity + quantity;

      // التحقق من المخزون
      if (newQty > product.quantity) {
        toast.error(
          `${t('availableQuantity') || 'الكمية المتاحة'}: ${product.quantity}`,
          { duration: 4000 }
        );
        return;
      }

      newItems[existingIndex].quantity = newQty;
      setCartItems(newItems);
    } else {
      // التحقق من المخزون للمنتج الجديد
      if (quantity > product.quantity) {
        toast.error(
          `${t('availableQuantity') || 'الكمية المتاحة'}: ${product.quantity}`,
          { duration: 4000 }
        );
        return;
      }

      setCartItems([
        ...cartItems,
        {
          product: product,
          quantity: quantity,
          price: product.sale_price,
        },
      ]);
    }
  };

  // تحديث كمية آخر منتج مضاف (عبر حقل البحث)
  const handleUpdateLatestProductQuantity = (action, amount) => {
    if (cartItems.length === 0) {
      toast.error(t('cartIsEmpty') || "السلة فارغة");
      return;
    }

    // تحديد الفهرس الخاص بآخر منتج مضاف
    let targetIndex = -1;
    if (latestAddedId) {
      const prodId = parseInt(latestAddedId.split('-')[0], 10);
      for (let i = cartItems.length - 1; i >= 0; i--) {
        if (cartItems[i].product.id === prodId) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex === -1) {
      targetIndex = cartItems.length - 1;
    }

    const targetItem = cartItems[targetIndex];
    let newQty = targetItem.quantity;

    if (action === 'set') {
      newQty = amount;
    } else if (action === 'add') {
      newQty += amount;
    } else if (action === 'subtract') {
      newQty -= amount;
    }

    if (newQty < 1) {
      setItemIndexToDelete(targetIndex);
      return;
    }

    // التحقق من توفر الكمية
    if (newQty > targetItem.product.quantity) {
      toast.error(
        `${t('availableQuantity') || 'الكمية المتاحة'}: ${targetItem.product.quantity}`,
        { duration: 4000 }
      );
      return;
    }

    const oldQty = targetItem.quantity;
    const newItems = [...cartItems];
    newItems[targetIndex].quantity = newQty;
    setCartItems(newItems);

    // وميض التحديث لآخر عنصر معدل
    setLatestAddedId(`${targetItem.product.id}-${Date.now()}`);

    // تسجيل في الـ audit logs إذا تم تخفيض الكمية (سلوك void أمني)
    if (newQty < oldQty) {
      const valDiff = ((oldQty - newQty) * targetItem.price).toFixed(2);
      api.post('/audit-logs', {
        action: 'cart_item_quantity_update',
        description: `Reduced quantity of ${targetItem.product.name} from ${oldQty} to ${newQty} (Value difference: ${valDiff} SAR)`,
      }).catch(err => console.error("Error logging quantity reduction:", err));
    }
  };

  // تحديث الكمية
  const handleUpdateQuantity = (index, quantity) => {
    const newItems = [...cartItems];
    const product = newItems[index].product;

    // التحقق من توفر الكمية
    if (quantity > product.quantity) {
      toast.error(
        `${t('availableQuantity') || 'الكمية المتاحة'}: ${product.quantity}`,
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
            <ProductSearch 
              onSelectProduct={handleAddProduct} 
              onUpdateLatestQuantity={handleUpdateLatestProductQuantity}
            />
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
            itemIndexToDelete={itemIndexToDelete}
            onClearDeleteIndex={() => setItemIndexToDelete(null)}
          />
        </div>
      </div>

      {/* شريط الاختصارات البصري السفلي */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex flex-wrap gap-4 items-center justify-center text-sm font-semibold shadow-md text-gray-700 dark:text-gray-300 mt-6">
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-800 dark:text-gray-200 shadow-sm font-mono">F4</kbd>
          <span>{t('searchShortcut') || "بحث يدوي جديد"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-800 dark:text-gray-200 shadow-sm font-mono">F3</kbd>
          <span>{t('discountShortcut') || "إضافة خصم"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-800 dark:text-gray-200 shadow-sm font-mono">F2</kbd>
          <span>{t('checkoutShortcut') || "دفع وإتمام"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-800 dark:text-gray-200 shadow-sm font-mono">Esc</kbd>
          <span>{t('closeShortcut') || "إغلاق النوافذ"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-800 dark:text-gray-200 shadow-sm font-mono">Qty*Barcode</kbd>
          <span>{t('qtyScanHelp') || "ضرب مسبق (مثال: 5*6224)"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-800 dark:text-gray-200 shadow-sm font-mono">*Qty / +Qty / -Qty</kbd>
          <span>{t('qtyAdjustHelp') || "تعديل كمية آخر منتج (مثال: *12, +3, -2)"}</span>
        </div>
      </div>
    </div>
  );
}

export default Sales;
