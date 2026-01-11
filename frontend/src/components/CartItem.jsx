function CartItem({ item, onUpdateQuantity, onRemove }) {
  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      onRemove();
    } else {
      onUpdateQuantity(newQuantity);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
      <div className="flex-1">
        <div className="font-medium text-gray-900">{item.product.name}</div>
        <div className="text-sm text-gray-500">
          {item.product.category?.name} | {item.price} ر.س
        </div>
      </div>
      <div className="flex items-center space-x-4">
        {/* تحكم في الكمية */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
          >
            -
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            min="1"
            max={item.product.quantity + item.quantity}
            className="w-16 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500"
          />
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-50"
          >
            +
          </button>
        </div>

        {/* الإجمالي */}
        <div className="w-24 text-right">
          <div className="font-medium text-gray-900">
            {(item.price * item.quantity).toFixed(2)} ر.س
          </div>
        </div>

        {/* زر الحذف */}
        <button
          onClick={onRemove}
          className="text-red-600 hover:text-red-900 px-2"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default CartItem;
