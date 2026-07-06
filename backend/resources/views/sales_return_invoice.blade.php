<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة مرتجع مبيعات #{{ $salesReturn->return_number }}</title>
    <style>
        .invoice-container * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .invoice-container {
            font-family: 'Arial', 'Tahoma', sans-serif;
            direction: rtl !important;
            padding: 30px;
            background: #fff;
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #ddd;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }

        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

        .invoice-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }

        .info-box-right {
            text-align: right;
            flex: 1;
        }

        .info-box-left {
            text-align: left;
            flex: 1;
        }

        .info-box-right h3, .info-box-left h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
        }

        .info-box-right p, .info-box-left p {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        th, td {
            padding: 12px;
            text-align: right;
            border-bottom: 1px solid #ddd;
        }

        th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #333;
        }

        .text-left {
            text-align: left;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .totals {
            margin-top: 20px;
            margin-left: auto;
            width: 300px;
        }

        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }

        .totals-row.total {
            font-weight: bold;
            font-size: 18px;
            border-top: 2px solid #333;
            border-bottom: 2px solid #333;
            padding: 15px 0;
            margin-top: 10px;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
        }

        @media print {
            body {
                padding: 0;
                direction: rtl !important;
            }

            .invoice-container {
                border: none;
                padding: 20px;
            }

            .no-print {
                display: none;
            }

            @page {
                margin: 1cm;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <div class="header">
            <h1>🛒 متجر المواد الغذائية</h1>
            <p>فاتورة مرتجعات</p>
        </div>

        <div class="invoice-info">
            <div class="info-box-right">
                <h3>معلومات المرتجع</h3>
                <p><strong>اسم العميل:</strong> {{ $salesReturn->customer_name ?? 'عميل عام' }}</p>
                <p><strong>رقم الفاتورة:</strong> {{ $salesReturn->return_number }}</p>
                <p><strong>طريقة الدفع:</strong> 
                    @if($salesReturn->refund_method === 'cash') نقدي
                    @elseif($salesReturn->refund_method === 'card') بطاقة
                    @elseif($salesReturn->refund_method === 'transfer') تحويل
                    @elseif($salesReturn->refund_method === 'replacement') سند استبدال
                    @elseif($salesReturn->refund_method === 'hybrid') مختلط (مقسم)
                    @else {{ $salesReturn->refund_method }}
                    @endif
                </p>
                @if($salesReturn->customer_phone)
                    <p><strong>هاتف العميل:</strong> {{ $salesReturn->customer_phone }}</p>
                @endif
                <p style="font-size: 12px; color: #888; margin-top: 5px;">
                    <strong>مرتبط بالفاتورة الأصلية:</strong> {{ $salesReturn->sale->invoice_number }}
                </p>
            </div>
            <div class="info-box-left">
                <h3>مسؤول الارتجاع</h3>
                <p><strong>التاريخ:</strong> {{ $salesReturn->created_at->format('Y-m-d H:i') }}</p>
                <p><strong>الاسم:</strong> {{ $salesReturn->user->name }}</p>
                <p><strong>البريد:</strong> {{ $salesReturn->user->email }}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>المنتج</th>
                    <th>الكمية المسترجعة</th>
                    <th>سعر الوحدة</th>
                    <th>الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                @foreach($salesReturn->items as $index => $item)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->product->name }}</strong><br>
                        <small style="color: #666;">{{ $item->product->category->name ?? '' }}</small>
                    </td>
                    <td class="text-center">{{ $item->return_quantity }}</td>
                    <td class="text-left">{{ number_format($item->price, 2) }} ر.س</td>
                    <td class="text-left">{{ number_format($item->subtotal, 2) }} ر.س</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>إجمالي قيمة المرتجعات:</span>
                <span>{{ number_format($salesReturn->subtotal, 2) }} ر.س</span>
            </div>
            @if($salesReturn->discount_amount > 0)
            <div class="totals-row" style="color: #d32f2f;">
                <span>خصم نسبي مسترجع:</span>
                <span>-{{ number_format($salesReturn->discount_amount, 2) }} ر.س</span>
            </div>
            @endif
            <div class="totals-row total">
                <span>الصافي المسترد:</span>
                <span>{{ number_format($salesReturn->refund_total, 2) }} ر.س</span>
            </div>
        </div>

        @if($salesReturn->reason)
        <div style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-right: 3px solid #ffa000; font-size: 13px;">
            <strong>سبب الاسترجاع:</strong> {{ $salesReturn->reason }}
        </div>
        @endif

        <div class="footer">
            <p>تم إصدار فاتورة المرتجع بنجاح.</p>
            <p>شكراً لتعاملكم معنا!</p>
        </div>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            🖨️ طباعة فاتورة المرتجع
        </button>
    </div>
</body>
</html>
