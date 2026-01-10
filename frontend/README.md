# 🛒 Grocery Store POS & Inventory System - Frontend

Frontend application للمشروع مبني بـ React + Vite.

## 🛠️ التقنيات المستخدمة

- **React 19** - واجهة المستخدم
- **Vite** - Build Tool
- **React Router** - Routing
- **React Query** - Data Fetching
- **Axios** - HTTP Client
- **React Hook Form** - Form Management
- **Context API** - State Management (بدل Zustand/Redux)

## 🚀 البدء السريع

### التثبيت

1. استنساخ المشروع:
```bash
git clone https://github.com/yourusername/grocery-pos-frontend.git
cd grocery-pos-frontend
```

2. تثبيت الحزم:
```bash
npm install
```

3. إعداد Environment Variables:
إنشاء ملف `.env`:
```
VITE_API_URL=http://localhost:8000/api
```

4. تشغيل التطبيق:
```bash
npm run dev
```

التطبيق سيعمل على: `http://localhost:5173`

## 📁 بنية المشروع

```
src/
├── components/     # Components قابلة لإعادة الاستخدام
├── pages/         # صفحات التطبيق
├── services/       # API services (Axios instance)
├── hooks/          # Custom React hooks
├── context/        # Context API للـ State Management
├── utils/          # Utility functions
└── layouts/        # Layout components
```

## 🔌 الاتصال مع Backend

- يتم إرسال `X-Tenant-ID` header تلقائيًا مع كل request
- Token يتم حفظه في localStorage
- عند 401 Unauthorized، يتم توجيه المستخدم لصفحة تسجيل الدخول

## 📝 ملاحظات

- ❌ لا Zustand ولا Redux - Context API فقط
- Token storage في localStorage (يمكن تحسينه لاحقًا)

## 📦 Build للإنتاج

```bash
npm run build
```

الملفات المبنية ستكون في مجلد `dist/`

---

**تم التطوير بواسطة:** [Your Name]  
**التاريخ:** 2026  
**الإصدار:** 1.0.0
