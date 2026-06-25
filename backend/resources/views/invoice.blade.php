<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة #{{ $sale->invoice_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            direction: rtl;
            padding: 20px;
            background: #fff;
        }

        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
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

        .info-box {
            flex: 1;
        }

        .info-box h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: #333;
        }

        .info-box p {
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
            <p>فاتورة مبيعات</p>
        </div>

        <div class="invoice-info">
            <div class="info-box">
                <h3>معلومات الفاتورة</h3>
                <p><strong>رقم الفاتورة:</strong> {{ $sale->invoice_number }}</p>
                <p><strong>التاريخ:</strong> {{ $sale->created_at->format('Y-m-d H:i') }}</p>
                <p><strong>طريقة الدفع:</strong> 
                    @if($sale->payment_method === 'cash') نقدي
                    @elseif($sale->payment_method === 'card') بطاقة
                    @elseif($sale->payment_method === 'transfer') تحويل
                    @elseif($sale->payment_method === 'hybrid') مختلط (مقسم)
                    @else {{ $sale->payment_method }}
                    @endif
                </p>
                @if($sale->payment_method === 'hybrid' && is_array($sale->payment_details))
                    <div style="font-size: 11px; margin-top: 5px; color: #666; border-top: 1px dashed #ddd; padding-top: 5px; line-height: 1.5;">
                        <strong>تفاصيل الدفع المختلط:</strong>
                        @foreach($sale->payment_details as $pay)
                            <div>• {{ $pay['method'] === 'cash' ? 'نقدي' : ($pay['method'] === 'card' ? 'بطاقة' : ($pay['method'] === 'transfer' ? 'تحويل' : 'أخرى')) }}: {{ number_format($pay['amount'], 2) }} ر.س</div>
                        @endforeach
                    </div>
                @endif
            </div>
            <div class="info-box">
                <h3>معلومات البائع</h3>
                <p><strong>الاسم:</strong> {{ $sale->user->name }}</p>
                <p><strong>البريد:</strong> {{ $sale->user->email }}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>المنتج</th>
                    <th>الكمية</th>
                    <th>السعر</th>
                    <th>الإجمالي</th>
                </tr>
            </thead>
            <tbody>
                @foreach($sale->items as $index => $item)
                <tr>
                    <td class="text-center">{{ $index + 1 }}</td>
                    <td>
                        <strong>{{ $item->product->name }}</strong><br>
                        <small style="color: #666;">{{ $item->product->category->name ?? '' }}</small>
                    </td>
                    <td class="text-center">{{ $item->quantity }}</td>
                    <td class="text-left">{{ number_format($item->price, 2) }} ر.س</td>
                    <td class="text-left">{{ number_format($item->subtotal, 2) }} ر.س</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>الإجمالي الفرعي:</span>
                <span>{{ number_format($sale->items->sum('subtotal'), 2) }} ر.س</span>
            </div>
            @if($sale->discount > 0)
            <div class="totals-row" style="color: #d32f2f;">
                <span>الخصم 
                    @if($sale->discount_type === 'percentage')
                        ({{ $sale->discount }}%)
                    @endif
                :</span>
                <span>-{{ number_format($sale->discount, 2) }} ر.س</span>
            </div>
            @endif
            <div class="totals-row total">
                <span>الإجمالي النهائي:</span>
                <span>{{ number_format($sale->total, 2) }} ر.س</span>
            </div>
        </div>

        <div class="footer">
            <p>شكراً لزيارتك!</p>
            <p>للاستفسار: info@store.com</p>
        </div>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            🖨️ طباعة الفاتورة
        </button>
    </div>
</body>
</html>
