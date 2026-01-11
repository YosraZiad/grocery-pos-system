import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductSearch from '../components/ProductSearch';
import Cart from '../components/Cart';

function Sales() {
  const [cartItems, setCartItems] = useState([]);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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
      alert(`الكمية المتاحة: ${product.quantity + newItems[index].quantity}`);
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
      alert(error.response?.data?.message || 'حدث خطأ أثناء إتمام البيع');
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* البحث وإضافة المنتجات */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">شاشة المبيعات</h2>
          <ProductSearch onSelectProduct={handleAddProduct} />
        </div>

        {/* معلومات إضافية */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 نصائح:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• ابحث بالاسم أو الباركود لإضافة منتج</li>
            <li>• يمكنك تعديل الكمية من السلة</li>
            <li>• يمكنك إضافة خصم قبل إتمام البيع</li>
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
  );
}

export default Sales;
