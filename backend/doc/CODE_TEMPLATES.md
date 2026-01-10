# 📝 قوالب الكود الجاهزة - Code Templates

## 🔧 Backend Templates (Laravel)

### 1. Multi-Tenant Middleware

```php
// app/Http/Middleware/TenantMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = $request->header('X-Tenant-ID') 
            ?? auth()->user()?->tenant_id 
            ?? session('tenant_id');

        if (!$tenantId) {
            return response()->json(['error' => 'Tenant not identified'], 403);
        }

        // Set tenant in request
        $request->merge(['tenant_id' => $tenantId]);
        
        // Set global scope for tenant ⚠️ مهم جدًا
        config(['tenant_id' => $tenantId]);

        return $next($request);
    }
}
```

### 2. Base Model with Tenant Global Scope ⚠️ مهم جدًا

```php
// app/Models/BaseModel.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class BaseModel extends Model
{
    /**
     * Global Scope للمواد - مهم جدًا
     * يضمن أن كل Query تلقائيًا يفلتر حسب tenant_id
     */
    protected static function booted()
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if ($tenantId = config('tenant_id')) {
                $builder->where('tenant_id', $tenantId);
            }
        });
    }
}
```

### 3. Product Model

```php
// app/Models/Product.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends BaseModel  // ⚠️ extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'barcode',
        'purchase_price',
        'sale_price',
        'quantity',
        'expiry_date',
        'min_stock_alert',
        'min_expiry_alert',
    ];

    protected $casts = [
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'quantity' => 'integer',
        'expiry_date' => 'date',
        'min_stock_alert' => 'integer',
        'min_expiry_alert' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function isLowStock(): bool
    {
        return $this->quantity <= $this->min_stock_alert;
    }

    public function isExpiringSoon(): bool
    {
        if (!$this->expiry_date) {
            return false;
        }
        
        $daysUntilExpiry = now()->diffInDays($this->expiry_date, false);
        return $daysUntilExpiry >= 0 && $daysUntilExpiry <= $this->min_expiry_alert;
    }
}
```

### 4. Inventory Transaction Model (⚠️ قبل Sales)

```php
// app/Models/InventoryTransaction.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class InventoryTransaction extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'product_id',
        'type', // in, out, return
        'quantity',
        'reference_type', // Sale, Purchase, Return
        'reference_id',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
```

### 5. Sale Controller (مع Inventory Transaction)

```php
// app/Http/Controllers/Api/SaleController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SaleController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'discount' => 'nullable|numeric|min:0',
            'discount_type' => 'nullable|in:percentage,fixed',
            'payment_method' => 'required|in:cash,card,transfer',
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $tenantId = $request->tenant_id;
            $userId = auth()->id();
            
            // Calculate totals
            $subtotal = 0;
            $items = [];

            foreach ($validated['items'] as $item) {
                $product = Product::findOrFail($item['product_id']);
                
                // Check stock
                if ($product->quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}");
                }

                $price = $product->sale_price;
                $itemSubtotal = $price * $item['quantity'];
                $subtotal += $itemSubtotal;

                $items[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'price' => $price,
                    'subtotal' => $itemSubtotal,
                ];
            }

            // Calculate discount
            $discount = 0;
            if (isset($validated['discount'])) {
                if ($validated['discount_type'] === 'percentage') {
                    $discount = ($subtotal * $validated['discount']) / 100;
                } else {
                    $discount = $validated['discount'];
                }
            }

            $total = $subtotal - $discount;

            // Generate invoice number
            $invoiceNumber = 'INV-' . strtoupper(Str::random(8));

            // Create sale
            $sale = Sale::create([
                'tenant_id' => $tenantId,
                'invoice_number' => $invoiceNumber,
                'user_id' => $userId,
                'total' => $total,
                'discount' => $discount,
                'discount_type' => $validated['discount_type'] ?? null,
                'payment_method' => $validated['payment_method'],
                'status' => 'completed',
            ]);

            // Create sale items and update inventory
            foreach ($items as $itemData) {
                $product = $itemData['product'];
                
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'quantity' => $itemData['quantity'],
                    'price' => $itemData['price'],
                    'subtotal' => $itemData['subtotal'],
                ]);

                // Update product quantity
                $product->decrement('quantity', $itemData['quantity']);

                // Create inventory transaction ⚠️ مهم
                InventoryTransaction::create([
                    'tenant_id' => $tenantId,
                    'product_id' => $product->id,
                    'type' => 'out',
                    'quantity' => $itemData['quantity'],
                    'reference_type' => 'Sale',
                    'reference_id' => $sale->id,
                ]);
            }

            return response()->json([
                'message' => 'Sale completed successfully',
                'data' => $sale->load('items.product'),
            ], 201);
        });
    }

    public function invoice($id)
    {
        $sale = Sale::with(['user', 'items.product'])
            ->findOrFail($id);

        // Return HTML invoice (بدل PDF)
        return view('invoices.sale', compact('sale'));
    }
}
```

### 6. Profit Loss Controller (On-The-Fly)

```php
// app/Http/Controllers/Api/ProfitLossController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProfitLossController extends Controller
{
    /**
     * حساب الأرباح On-The-Fly (لا table)
     */
    public function daily(Request $request)
    {
        $date = $request->date ?? now()->toDateString();
        $tenantId = $request->tenant_id;

        // Sales
        $sales = Sale::where('tenant_id', $tenantId)
            ->whereDate('created_at', $date)
            ->sum('total');

        // Cost of goods sold (On-The-Fly)
        $costOfGoods = SaleItem::whereHas('sale', function ($query) use ($date, $tenantId) {
            $query->where('tenant_id', $tenantId)
                ->whereDate('created_at', $date);
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * products.purchase_price) as total_cost')
        ->value('total_cost') ?? 0;

        // Expenses
        $expenses = Expense::where('tenant_id', $tenantId)
            ->whereDate('date', $date)
            ->sum('amount');

        // Profit (On-The-Fly)
        $grossProfit = $sales - $costOfGoods;
        $netProfit = $grossProfit - $expenses;

        return response()->json([
            'date' => $date,
            'sales' => $sales,
            'cost_of_goods' => $costOfGoods,
            'gross_profit' => $grossProfit,
            'expenses' => $expenses,
            'net_profit' => $netProfit,
        ]);
    }

    public function summary(Request $request)
    {
        $from = $request->from ?? now()->startOfMonth();
        $to = $request->to ?? now()->endOfMonth();
        $tenantId = $request->tenant_id;

        // Sales
        $sales = Sale::where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$from, $to])
            ->sum('total');

        // Cost of goods sold (On-The-Fly)
        $costOfGoods = SaleItem::whereHas('sale', function ($query) use ($from, $to, $tenantId) {
            $query->where('tenant_id', $tenantId)
                ->whereBetween('created_at', [$from, $to]);
        })
        ->join('products', 'sale_items.product_id', '=', 'products.id')
        ->selectRaw('SUM(sale_items.quantity * products.purchase_price) as total_cost')
        ->value('total_cost') ?? 0;

        // Expenses
        $expenses = Expense::where('tenant_id', $tenantId)
            ->whereBetween('date', [$from, $to])
            ->sum('amount');

        // Profit (On-The-Fly)
        $grossProfit = $sales - $costOfGoods;
        $netProfit = $grossProfit - $expenses;

        return response()->json([
            'from' => $from,
            'to' => $to,
            'sales' => $sales,
            'cost_of_goods' => $costOfGoods,
            'gross_profit' => $grossProfit,
            'expenses' => $expenses,
            'net_profit' => $netProfit,
            'profit_margin' => $sales > 0 ? ($netProfit / $sales) * 100 : 0,
        ]);
    }
}
```

---

## ⚛️ Frontend Templates (React)

### 1. API Service Setup

```javascript
// src/services/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenant_id');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Auth Context (بدل Zustand/Redux) ✅

```javascript
// src/context/AuthContext.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const userData = await authService.me();
        setUser(userData);
      }
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### 3. Auth Service

```javascript
// src/services/auth.js

import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('tenant_id', response.data.user.tenant_id);
    }
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('tenant_id');
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
```

### 4. Invoice Component (HTML بدل PDF)

```jsx
// src/components/sales/Invoice.jsx

export default function Invoice({ sale }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-container print-only">
      <style>{`
        @media print {
          .no-print { display: none; }
          .invoice-container { 
            width: 100%;
            padding: 20px;
          }
        }
      `}</style>

      <div className="no-print mb-4">
        <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded">
          طباعة
        </button>
      </div>

      <div className="bg-white p-6">
        <h2 className="text-2xl font-bold mb-4">فاتورة بيع</h2>
        <div className="mb-4">
          <p>رقم الفاتورة: {sale.invoice_number}</p>
          <p>التاريخ: {new Date(sale.created_at).toLocaleDateString('ar')}</p>
        </div>

        <table className="w-full mb-4">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map(item => (
              <tr key={item.id}>
                <td>{item.product.name}</td>
                <td>{item.quantity}</td>
                <td>{item.price}</td>
                <td>{item.subtotal}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="text-right">
          <p>الإجمالي: {sale.total + sale.discount}</p>
          {sale.discount > 0 && <p>الخصم: {sale.discount}</p>}
          <p className="text-xl font-bold">المجموع: {sale.total}</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 CSS Styling (Tailwind CSS)

### Tailwind Config

```javascript
// tailwind.config.js

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
    },
  },
  plugins: [],
}
```

---

## 📝 Environment Variables

### Backend (.env)

```env
APP_NAME="Grocery POS"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=grocery_pos
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:5173
SESSION_DOMAIN=localhost
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000/api
VITE_APP_NAME=Grocery POS
```

---

**ملاحظة:** هذه القوالب جاهزة للاستخدام ويمكن تخصيصها حسب احتياجاتك.

**⚠️ مهم:**
- BaseModel مع Global Scope
- Inventory Transactions قبل Sales
- Context API بدل Zustand/Redux
- HTML Invoice بدل PDF معقد
- Profit/Loss On-The-Fly
