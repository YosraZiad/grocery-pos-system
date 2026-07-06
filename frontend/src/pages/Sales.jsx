import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '../context/I18nContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import ProductSearch from '../components/ProductSearch';
import Cart from '../components/Cart';
import SuspendCartModal from '../components/SuspendCartModal';


// تأثير صوتي ميكانيكي لفتح درج النقدية باستخدام Web Audio API
const playDrawerSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // الجزء 1: رنين جرس حاد وسريع (Ding)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(987.77, audioCtx.currentTime); // نغمة B5
    gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.35);
    
    // الجزء 2: صوت انزلاق الدرج المعدني الميكانيكي (Chink)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(140, audioCtx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.25);
    gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    
    osc2.start();
    osc2.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.error("Audio Context drawer sound failed:", e);
  }
};

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

  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('fixed');
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [appliedVoucher, setAppliedVoucher] = useState(null);

  // استعلام فواتير الانتظار المعلقة لمزامنة الشارة والعدد تلقائياً
  const { data: suspendedSalesList = [], refetch: refetchSuspended } = useQuery({
    queryKey: ["suspendedSales"],
    queryFn: async () => {
      try {
        const response = await api.get("/suspended-sales");
        return response.data.data || [];
      } catch (err) {
        console.error("Error loading suspended sales:", err);
        return [];
      }
    },
    refetchInterval: 10000, // تحديث تلقائي كل 10 ثوانٍ
  });

  // استعلام المنتجات السريعة لشبكة واجهة المبيعات
  const { data: quickProducts = [], isLoading: isLoadingQuickProducts } = useQuery({
    queryKey: ["quickProducts"],
    queryFn: async () => {
      try {
        const response = await api.get("/products", {
          params: { per_page: 24 }
        });
        return response.data?.data || [];
      } catch (err) {
        console.error("Error loading quick products:", err);
        return [];
      }
    }
  });

  // استعادة الفاتورة المعلقة
  const handleResume = async (sale) => {
    if (checkoutMutation.isPending) return;

    if (cartItems.length > 0) {
      const confirmMsg = t('confirmRestoreMessage') || "السلة الحالية تحتوي على منتجات. عند استعادة الفاتورة المعلقة، سيتم تفريغ السلة الحالية. هل تريد الاستمرار؟";
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    try {
      // 1. حذفها من السيرفر لأنها أصبحت نشطة بالسلة
      await api.delete(`/suspended-sales/${sale.id}`);
      
      // 2. تحديث السلة والخصومات
      setDiscount(parseFloat(sale.discount));
      setDiscountType(sale.discount_type);
      setCartItems(sale.items);
      
      // 3. تحديث القائمة
      refetchSuspended();
      
      toast.success(t('saleRestoredSuccessfully') || `تمت استعادة الفاتورة المعلقة ${sale.suspend_id} بنجاح`);
    } catch (err) {
      console.error("Error resuming sale:", err);
      toast.error("حدث خطأ أثناء استعادة الفاتورة");
    }
  };


  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discountAmount =
    discountType === 'percentage' ? (subtotal * discount) / 100 : discount;
  const total = subtotal - discountAmount;


  // إتمام البيع (Hook)
  const checkoutMutation = useMutation({
    mutationFn: async (saleData) => {
      const response = await api.post('/sales', saleData);
      return response.data;
    },
    onSuccess: (data) => {
      // تشغيل صوت الدرج وتنبيه بالفتح
      playDrawerSound();
      toast.success(t('cashDrawerOpened') || 'Cash drawer opened automatically | تم فتح درج النقدية تلقائياً');

      // إعادة تعيين السلة
      setCartItems([]);
      localStorage.removeItem('pos_cart_items');
      
      // تحديث البيانات
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['sales']);

      toast.success(t('saleCompletedSuccessfully') || 'Sale completed successfully');
      
      // توجيه المستخدم لصفحة الفاتورة مع التفعيل التلقائي للطباعة
      navigate(`/sales/${data.data.id}/invoice`, { state: { autoPrint: true } });
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

  const handleNewClick = (e) => {
    e.stopPropagation();
    if (cartItems.length > 0 && !checkoutMutation.isPending) {
      setShowSuspendModal(true);
    }
  };




  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 overflow-hidden">
      {/* Header - Compact */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('salesScreenTitle')}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('quickAndEasy')}
          </p>
        </div>

        {/* Suspended Sales Slider & New Button */}
        <div className="flex items-center gap-4 flex-1 justify-end max-w-full overflow-hidden">
          {/* Horizontal Slider */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 flex-1 justify-end scrollbar-thin scroll-smooth min-h-[44px]">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {t('suspended') || 'المعلقة'}:
            </span>
            {suspendedSalesList.length > 0 ? (
              <div className="flex items-center gap-2">
                {suspendedSalesList.map((sale, index) => (
                  <button
                    key={sale.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResume(sale);
                    }}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
                  >
                    #{index + 1}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                {t('noSuspendedSales') || 'لا توجد فواتير معلقة حالياً'}
              </span>
            )}
          </div>

          {/* New Button */}
          <button
            type="button"
            onClick={handleNewClick}
            className={`px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all active:scale-95 shadow-md shrink-0 ${
              cartItems.length === 0 || checkoutMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span>➕</span>
            <span>{t('new') || 'نيو'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* البحث وإضافة المنتجات */}
        <div className="lg:col-span-5 flex flex-col space-y-4 h-full min-h-0">
          <div className="card p-4 flex-shrink-0 shadow-sm border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl">
            <ProductSearch 
              onSelectProduct={handleAddProduct} 
              onUpdateLatestQuantity={handleUpdateLatestProductQuantity}
              onApplyVoucher={setAppliedVoucher}
            />
          </div>
          
          {/* شبكة المنتجات السريعة */}
          <div className="card p-4 flex-1 flex flex-col min-h-0 shadow-sm border border-gray-150 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700 mb-3 flex-shrink-0">
              <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <span>⚡</span>
                <span>{t('quickProducts') || 'المنتجات السريعة'}</span>
              </h3>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                {t('clickToAdd') || 'اضغط للإضافة'}
              </span>
            </div>

            {/* شبكة أزرار المنتجات */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
              {isLoadingQuickProducts ? (
                <div className="h-full flex items-center justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                </div>
              ) : quickProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {quickProducts.map((product) => {
                    const isOutOfStock = product.quantity <= 0;
                    const isLowStock = product.quantity <= product.min_stock_alert;
                    
                    return (
                      <button
                        key={product.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isOutOfStock) {
                            handleAddProduct(product);
                          } else {
                            toast.error(t('outOfStock') || 'المنتج غير متوفر في المخزن');
                          }
                        }}
                        disabled={isOutOfStock}
                        className={`flex flex-col justify-between p-3 rounded-xl border text-start transition-all hover:shadow-md hover:border-amber-500 dark:hover:border-amber-400 active:scale-95 group ${
                          isOutOfStock
                            ? 'bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
                            : isLowStock
                            ? 'bg-red-50/30 dark:bg-red-950/10 border-red-200 dark:border-red-900/30 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
                            : 'bg-gray-50/50 dark:bg-gray-800/30 border-gray-200/80 dark:border-gray-700'
                        }`}
                      >
                        <div className="w-full">
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate font-medium">
                            {product.category?.name || t('general') || 'عام'}
                          </span>
                          <span className="font-bold text-gray-900 dark:text-white text-xs mt-1 block line-clamp-2 leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {product.name}
                          </span>
                        </div>
                        
                        <div className="w-full mt-3 flex items-center justify-between gap-1 flex-wrap">
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm whitespace-nowrap">
                            {product.sale_price} <span className="text-[10px] font-normal text-gray-400">{t('sar')}</span>
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[9px] font-bold text-red-650 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">
                              {t('outOfStockShort') || 'نفذ'}
                            </span>
                          ) : isLowStock ? (
                            <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">
                              {product.quantity}
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-gray-400 dark:text-gray-500">
                              {t('stockShort') || 'متاح'}: {product.quantity}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs py-10">
                  {t('noProductsFound') || 'لا توجد منتجات مضافة'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* سلة المشتريات - أكبر مساحة */}
        <div className="lg:col-span-7 h-full min-h-0">
          <Cart
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onCheckout={checkoutMutation.mutate}
            isLoading={checkoutMutation.isPending}
            latestAddedId={latestAddedId}
            itemIndexToDelete={itemIndexToDelete}
            onClearDeleteIndex={() => setItemIndexToDelete(null)}
            onClearCart={() => {
              setCartItems([]);
              setDiscount(0);
              setDiscountType("fixed");
            }}
            onRestoreCart={(items) => setCartItems(items)}
            discount={discount}
            setDiscount={setDiscount}
            discountType={discountType}
            setDiscountType={setDiscountType}
            appliedVoucher={appliedVoucher}
            setAppliedVoucher={setAppliedVoucher}
          />
        </div>
      </div>

      {/* شريط الاختصارات البصري السفلي */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-xl p-2 flex flex-wrap gap-x-4 gap-y-1 items-center justify-center text-xs font-semibold shadow-md text-gray-700 dark:text-gray-300 flex-shrink-0">
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] text-gray-800 dark:text-gray-200 shadow-sm font-mono">F4</kbd>
          <span>{t('searchShortcut') || "بحث يدوي جديد"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] text-gray-800 dark:text-gray-200 shadow-sm font-mono">F3</kbd>
          <span>{t('discountShortcut') || "إضافة خصم"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] text-gray-800 dark:text-gray-200 shadow-sm font-mono">F2</kbd>
          <span>{t('checkoutShortcut') || "دفع وإتمام"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] text-gray-800 dark:text-gray-200 shadow-sm font-mono">Esc</kbd>
          <span>{t('closeShortcut') || "إغلاق النوافذ"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] text-gray-800 dark:text-gray-200 shadow-sm font-mono">Qty*Barcode</kbd>
          <span>{t('qtyScanHelp') || "ضرب مسبق (مثال: 5*6224)"}</span>
        </div>
        <span className="text-gray-300 dark:text-gray-600">|</span>
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-[10px] text-gray-800 dark:text-gray-200 shadow-sm font-mono">*Qty / +Qty / -Qty</kbd>
          <span>{t('qtyAdjustHelp') || "تعديل كمية آخر منتج (مثال: *12, +3, -2)"}</span>
        </div>
      </div>

      {/* Suspend Cart Modal */}
      <SuspendCartModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={(suspendedSale) => {
          setDiscount(0);
          setDiscountType("fixed");
          setCartItems([]);
          refetchSuspended();
        }}
        items={cartItems}
        total={total}
        discount={discount}
        discountType={discountType}
      />
    </div>
  );
}

export default Sales;
