# 📤 دليل رفع المشروع على GitHub

## الخطوات

### 1. إنشاء Repository على GitHub

#### للـ Backend:
1. اذهب إلى [GitHub](https://github.com)
2. اضغط على **"New repository"** أو **"+"** في الأعلى
3. اسم الـ Repository: `grocery-pos-backend`
4. اختر **Private** أو **Public** حسب رغبتك
5. **لا** تضع علامة على "Initialize this repository with a README"
6. اضغط **"Create repository"**

#### للـ Frontend:
1. نفس الخطوات لكن اسم الـ Repository: `grocery-pos-frontend`

### 2. ربط المشروع المحلي مع GitHub

#### للـ Backend:
```bash
cd c:\wamp64\www\grocery-pos-backend

# أضف remote (استبدل YOUR_USERNAME باسمك على GitHub)
git remote add origin https://github.com/YOUR_USERNAME/grocery-pos-backend.git

# ارفع المشروع
git branch -M main
git push -u origin main
```

#### للـ Frontend:
```bash
cd c:\wamp64\www\grocery-pos-frontend

# أضف remote (استبدل YOUR_USERNAME باسمك على GitHub)
git remote add origin https://github.com/YOUR_USERNAME/grocery-pos-frontend.git

# ارفع المشروع
git branch -M main
git push -u origin main
```

### 3. إذا كنت تستخدم SSH بدل HTTPS

إذا كان لديك SSH keys مضبوطة على GitHub، استخدم:
```bash
git remote add origin git@github.com:YOUR_USERNAME/grocery-pos-backend.git
```

### 4. التحقق من الرفع

بعد الرفع، اذهب إلى صفحة الـ Repository على GitHub وتأكد من أن جميع الملفات موجودة.

## 📝 ملاحظات مهمة

1. **ملف `.env`** لن يُرفع (موجود في `.gitignore`)
2. **مجلد `vendor/`** لن يُرفع (موجود في `.gitignore`)
3. **مجلد `node_modules/`** لن يُرفع (موجود في `.gitignore`)

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

---

**جاهز للرفع! 🚀**
