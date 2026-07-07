<!DOCTYPE html>
<html lang="{{ $lang ?? 'ar' }}" dir="{{ ($lang ?? 'ar') === 'en' ? 'ltr' : 'rtl' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>فاتورة #{{ $sale->invoice_number }}</title>
    <style>
        .invoice-container * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        .invoice-container {
            font-family: 'Arial', 'Tahoma', sans-serif;
            direction: {{ ($lang ?? 'ar') === 'en' ? 'ltr' : 'rtl' }} !important;
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
            text-align: {{ ($lang ?? 'ar') === 'en' ? 'left' : 'right' }};
            flex: 1;
        }

        .info-box-left {
            text-align: {{ ($lang ?? 'ar') === 'en' ? 'right' : 'left' }};
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
            text-align: {{ ($lang ?? 'ar') === 'en' ? 'left' : 'right' }};
            border-bottom: 1px solid #ddd;
        }

        th {
            background-color: #f5f5f5;
            font-weight: bold;
            color: #333;
        }

        .text-left {
            text-align: {{ ($lang ?? 'ar') === 'en' ? 'right' : 'left' }};
        }

        .text-right {
            text-align: {{ ($lang ?? 'ar') === 'en' ? 'left' : 'right' }};
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
                direction: {{ ($lang ?? 'ar') === 'en' ? 'ltr' : 'rtl' }} !important;
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
            <h1>🛒 {{ ($lang ?? 'ar') === 'en' ? 'Grocery POS Store' : 'متجر المواد الغذائية' }}</h1>
            <p>{{ ($lang ?? 'ar') === 'en' ? 'Sales Invoice' : 'فاتورة مبيعات' }}</p>
        </div>

        <div class="invoice-info">
            <div class="info-box-right">
                <h3>{{ ($lang ?? 'ar') === 'en' ? 'Invoice & Customer Information' : 'معلومات الفاتورة والعميل' }}</h3>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Customer Name' : 'اسم العميل' }}:</strong> {{ $sale->customer->name ?? (($lang ?? 'ar') === 'en' ? 'General Customer' : 'عميل عام') }}</p>
                @if($sale->customer && $sale->customer->phone)
                    <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Customer Phone' : 'هاتف العميل' }}:</strong> {{ $sale->customer->phone }}</p>
                @endif
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Invoice Number' : 'رقم الفاتورة' }}:</strong> {{ $sale->invoice_number }}</p>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Payment Method' : 'طريقة الدفع' }}:</strong> 
                    @if($sale->payment_method === 'cash') {{ ($lang ?? 'ar') === 'en' ? 'Cash' : 'نقدي' }}
                    @elseif($sale->payment_method === 'card') {{ ($lang ?? 'ar') === 'en' ? 'Card' : 'بطاقة' }}
                    @elseif($sale->payment_method === 'transfer') {{ ($lang ?? 'ar') === 'en' ? 'Transfer' : 'تحويل' }}
                    @elseif($sale->payment_method === 'hybrid') {{ ($lang ?? 'ar') === 'en' ? 'Hybrid' : 'مختلط (مقسم)' }}
                    @else {{ $sale->payment_method }}
                    @endif
                </p>
                @if($sale->payment_method === 'hybrid' && is_array($sale->payment_details))
                    <div style="font-size: 11px; margin-top: 5px; color: #666; border-top: 1px dashed #ddd; padding-top: 5px; line-height: 1.5;">
                        <strong>{{ ($lang ?? 'ar') === 'en' ? 'Hybrid Payment Details:' : 'تفاصيل الدفع المختلط:' }}</strong>
                        @foreach($sale->payment_details as $pay)
                            <div>• {{ $pay['method'] === 'cash' ? (($lang ?? 'ar') === 'en' ? 'Cash' : 'نقدي') : ($pay['method'] === 'card' ? (($lang ?? 'ar') === 'en' ? 'Card' : 'بطاقة') : ($pay['method'] === 'transfer' ? (($lang ?? 'ar') === 'en' ? 'Transfer' : 'تحويل') : (($lang ?? 'ar') === 'en' ? 'Other' : 'أخرى'))) }}: {{ number_format($pay['amount'], 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</div>
                        @endforeach
                    </div>
                @endif
            </div>
            <div class="info-box-left">
                <h3>{{ ($lang ?? 'ar') === 'en' ? 'Sales Officer' : 'مسؤول المبيعات' }}</h3>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Date' : 'التاريخ' }}:</strong> {{ $sale->created_at->format('Y-m-d H:i') }}</p>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Name' : 'الاسم' }}:</strong> {{ $sale->user->name }}</p>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Email' : 'البريد' }}:</strong> {{ $sale->user->email }}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ ($lang ?? 'ar') === 'en' ? 'Product' : 'المنتج' }}</th>
                    <th class="text-center">{{ ($lang ?? 'ar') === 'en' ? 'Quantity' : 'الكمية' }}</th>
                    <th class="text-left">{{ ($lang ?? 'ar') === 'en' ? 'Price' : 'السعر' }}</th>
                    <th class="text-left">{{ ($lang ?? 'ar') === 'en' ? 'Total' : 'الإجمالي' }}</th>
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
                    <td class="text-left">{{ number_format($item->price, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</td>
                    <td class="text-left">{{ number_format($item->subtotal, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>{{ ($lang ?? 'ar') === 'en' ? 'Subtotal:' : 'الإجمالي الفرعي:' }}</span>
                <span>{{ number_format($sale->items->sum('subtotal'), 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</span>
            </div>
            @if($sale->discount > 0)
            <div class="totals-row" style="color: #d32f2f;">
                <span>{{ ($lang ?? 'ar') === 'en' ? 'Discount' : 'الخصم' }} 
                    @if($sale->discount_type === 'percentage')
                        ({{ $sale->discount }}%)
                    @endif
                :</span>
                <span>-{{ number_format($sale->discount, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</span>
            </div>
            @endif
            <div class="totals-row total">
                <span>{{ ($lang ?? 'ar') === 'en' ? 'Final Total:' : 'الإجمالي النهائي:' }}</span>
                <span>{{ number_format($sale->total, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</span>
            </div>
        </div>

        <div class="footer">
            <p>{{ ($lang ?? 'ar') === 'en' ? 'Thank you for your visit!' : 'شكراً لزيارتك!' }}</p>
            <p>{{ ($lang ?? 'ar') === 'en' ? 'Support:' : 'للاستفسار:' }} info@store.com</p>
        </div>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            🖨️ طباعة الفاتورة
        </button>
    </div>
</body>
</html>
