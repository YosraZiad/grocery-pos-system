import { createContext, useContext, useState, useEffect } from 'react';

// ترجمات
const translations = {
  en: {
    // Navigation
    home: 'Home',
    categories: 'Categories',
    products: 'Products',
    sales: 'Sales',
    logout: 'Logout',
    
    // Auth
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    loginButton: 'Sign In',
    registerButton: 'Sign Up',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    createAccount: 'Create new account',
    or: 'Or',
    testAccounts: 'Test Accounts',
    admin: 'Admin',
    cashier: 'Cashier',
    
    // Home
    welcome: 'Welcome to Store Management System',
    welcomeDesc: 'An integrated system for managing a grocery store with Point of Sale system and inventory management',
    productManagement: 'Product Management',
    productManagementDesc: 'Manage products, categories, and inventory',
    salesScreen: 'Sales Screen',
    salesScreenDesc: 'Point of Sale system for quick sales',
    reports: 'Reports',
    reportsDesc: 'Comprehensive reports on sales and profits',
    
    // Categories
    manageCategories: 'Manage Categories',
    addCategory: 'Add New Category',
    editCategory: 'Edit Category',
    categoryName: 'Name',
    description: 'Description',
    productsCount: 'Products Count',
    actions: 'Actions',
    edit: 'Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    update: 'Update',
    confirmDelete: 'Are you sure you want to delete this category?',
    
    // Products
    manageProducts: 'Manage Products',
    addProduct: 'Add New Product',
    editProduct: 'Edit Product',
    productName: 'Product Name',
    barcode: 'Barcode',
    purchasePrice: 'Purchase Price',
    salePrice: 'Sale Price',
    quantity: 'Quantity',
    status: 'Status',
    available: 'Available',
    lowStock: 'Low Stock',
    searchPlaceholder: 'Search by name or barcode...',
    allCategories: 'All Categories',
    
    // Sales
    salesScreenTitle: 'Sales Screen',
    cart: 'Shopping Cart',
    emptyCart: 'Cart is empty',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    card: 'Card',
    transfer: 'Transfer',
    fixed: 'Fixed',
    percentage: 'Percentage',
    completeSale: 'Complete Sale',
    processing: 'Processing...',
    tips: 'Tips',
    tip1: 'Search by name or barcode to add product',
    tip2: 'You can modify quantity from cart',
    tip3: 'You can add discount before completing sale',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    close: 'Close',
    copyright: '© 2024 Grocery POS System. All rights reserved.',
    noCategories: 'No categories yet',
    confirmDelete: 'Are you sure you want to delete this item?',
    back: 'Back',
    print: 'Print',
    invoice: 'Invoice',
  },
  ar: {
    // Navigation
    home: 'الرئيسية',
    categories: 'الأقسام',
    products: 'المنتجات',
    sales: 'المبيعات',
    logout: 'تسجيل الخروج',
    
    // Auth
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    loginButton: 'تسجيل الدخول',
    registerButton: 'إنشاء حساب',
    name: 'الاسم',
    confirmPassword: 'تأكيد كلمة المرور',
    createAccount: 'إنشاء حساب جديد',
    or: 'أو',
    testAccounts: 'حسابات تجريبية',
    admin: 'مدير',
    cashier: 'كاشير',
    
    // Home
    welcome: 'مرحباً بك في نظام إدارة المتجر',
    welcomeDesc: 'نظام متكامل لإدارة متجر المواد الغذائية مع نظام نقاط البيع وإدارة المخزون',
    productManagement: 'إدارة المنتجات',
    productManagementDesc: 'إدارة المنتجات والأقسام والمخزون',
    salesScreen: 'شاشة المبيعات',
    salesScreenDesc: 'نظام نقاط البيع للبيع السريع',
    reports: 'التقارير',
    reportsDesc: 'تقارير شاملة عن المبيعات والأرباح',
    
    // Categories
    manageCategories: 'إدارة الأقسام',
    addCategory: 'إضافة قسم جديد',
    editCategory: 'تعديل قسم',
    categoryName: 'الاسم',
    description: 'الوصف',
    productsCount: 'عدد المنتجات',
    actions: 'الإجراءات',
    edit: 'تعديل',
    delete: 'حذف',
    cancel: 'إلغاء',
    save: 'حفظ',
    update: 'تحديث',
    confirmDelete: 'هل أنت متأكد من حذف هذا القسم؟',
    
    // Products
    manageProducts: 'إدارة المنتجات',
    addProduct: 'إضافة منتج جديد',
    editProduct: 'تعديل منتج',
    productName: 'اسم المنتج',
    barcode: 'الباركود',
    purchasePrice: 'سعر الشراء',
    salePrice: 'سعر البيع',
    quantity: 'الكمية',
    status: 'الحالة',
    available: 'متوفر',
    lowStock: 'منخفض',
    searchPlaceholder: 'بحث بالاسم أو الباركود...',
    allCategories: 'جميع الأقسام',
    
    // Sales
    salesScreenTitle: 'شاشة المبيعات',
    cart: 'سلة المشتريات',
    emptyCart: 'السلة فارغة',
    subtotal: 'الإجمالي الفرعي',
    discount: 'الخصم',
    total: 'الإجمالي',
    paymentMethod: 'طريقة الدفع',
    cash: 'نقدي',
    card: 'بطاقة',
    transfer: 'تحويل',
    fixed: 'قيمة ثابتة',
    percentage: 'نسبة مئوية',
    completeSale: 'إتمام البيع',
    processing: 'جاري المعالجة...',
    tips: 'نصائح',
    tip1: '• ابحث بالاسم أو الباركود لإضافة منتج',
    tip2: '• يمكنك تعديل الكمية من السلة',
    tip3: '• يمكنك إضافة خصم قبل إتمام البيع',
    
    // Common
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    close: 'إغلاق',
    copyright: '© 2024 Grocery POS System. جميع الحقوق محفوظة.',
    noCategories: 'لا توجد أقسام بعد',
    confirmDelete: 'هل أنت متأكد من حذف هذا العنصر؟',
    back: 'رجوع',
    print: 'طباعة',
    invoice: 'فاتورة',
  },
};

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
