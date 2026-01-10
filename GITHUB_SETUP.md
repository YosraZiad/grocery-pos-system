# 📤 دليل رفع المشروع على GitHub

## الخطوات

### 1. إنشاء Repository على GitHub

1. اذهب إلى [GitHub](https://github.com)
2. اضغط على **"New repository"** أو **"+"** في الأعلى
3. اسم الـ Repository: `grocery-pos-system`
4. اختر **Private** أو **Public** حسب رغبتك
5. **لا** تضع علامة على "Initialize this repository with a README"
6. اضغط **"Create repository"**

### 2. ربط المشروع المحلي مع GitHub

```bash
cd c:\wamp64\www\grocery-pos-system

# أضف remote (استبدل YOUR_USERNAME باسمك على GitHub)
git remote add origin https://github.com/YOUR_USERNAME/grocery-pos-system.git

# ارفع المشروع
git branch -M main
git push -u origin main
```

### 3. إذا كنت تستخدم SSH بدل HTTPS

إذا كان لديك SSH keys مضبوطة على GitHub، استخدم:
```bash
git remote add origin git@github.com:YOUR_USERNAME/grocery-pos-system.git
```

### 4. التحقق من الرفع

بعد الرفع، اذهب إلى صفحة الـ Repository على GitHub وتأكد من أن جميع الملفات موجودة.

## 📝 ملاحظات مهمة

1. **ملفات `.env`** لن تُرفع (موجودة في `.gitignore`)
2. **مجلد `vendor/`** لن يُرفع (موجود في `.gitignore`)
3. **مجلد `node_modules/`** لن يُرفع (موجود في `.gitignore`)
4. **مجلد `dist/`** لن يُرفع (موجود في `.gitignore`)

## 🔄 رفع تحديثات لاحقة

عندما تقوم بتحديثات:
```bash
git add .
git commit -m "وصف التحديثات"
git push
```

## 🎯 نصائح

- استخدم رسائل commit واضحة ووصفية
- ارفع التحديثات بشكل منتظم
- لا ترفع ملفات `.env` أو معلومات حساسة
- استخدم branches منفصلة للميزات الجديدة

## 📁 البنية على GitHub

بعد الرفع، ستكون البنية على GitHub كالتالي:
```
grocery-pos-system/
├── backend/          # Laravel API
├── frontend/         # React App
├── .gitignore
└── README.md
```

---

**جاهز للرفع! 🚀**
