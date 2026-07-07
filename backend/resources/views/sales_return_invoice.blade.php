<!DOCTYPE html>
<html lang="{{ $lang ?? 'ar' }}" dir="{{ ($lang ?? 'ar') === 'en' ? 'ltr' : 'rtl' }}">
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
            <p>{{ ($lang ?? 'ar') === 'en' ? 'Returns Invoice' : 'فاتورة مرتجعات' }}</p>
        </div>

        <div class="invoice-info">
            <div class="info-box-right">
                <h3>{{ ($lang ?? 'ar') === 'en' ? 'Return Information' : 'معلومات المرتجع' }}</h3>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Customer Name' : 'اسم العميل' }}:</strong> {{ $salesReturn->customer_name ?? (($lang ?? 'ar') === 'en' ? 'General Customer' : 'عميل عام') }}</p>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Return Number' : 'رقم المرتجع' }}:</strong> {{ $salesReturn->return_number }}</p>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Refund Method' : 'طريقة الرد' }}:</strong> 
                    @if($salesReturn->refund_method === 'cash') {{ ($lang ?? 'ar') === 'en' ? 'Cash' : 'نقدي' }}
                    @elseif($salesReturn->refund_method === 'card') {{ ($lang ?? 'ar') === 'en' ? 'Card' : 'بطاقة' }}
                    @elseif($salesReturn->refund_method === 'transfer') {{ ($lang ?? 'ar') === 'en' ? 'Transfer' : 'تحويل' }}
                    @elseif($salesReturn->refund_method === 'replacement') {{ ($lang ?? 'ar') === 'en' ? 'Replacement Voucher' : 'سند استبدال' }}
                    @elseif($salesReturn->refund_method === 'hybrid') {{ ($lang ?? 'ar') === 'en' ? 'Hybrid' : 'مختلط (مقسم)' }}
                    @else {{ $salesReturn->refund_method }}
                    @endif
                </p>
                @if($salesReturn->customer_phone)
                    <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Customer Phone' : 'هاتف العميل' }}:</strong> {{ $salesReturn->customer_phone }}</p>
                @endif
            </div>
            <div class="info-box-left">
                <h3>{{ ($lang ?? 'ar') === 'en' ? 'Return Officer' : 'مسؤول الارتجاع' }}</h3>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Date' : 'التاريخ' }}:</strong> {{ $salesReturn->created_at->format('Y-m-d H:i') }}</p>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Name' : 'الاسم' }}:</strong> {{ $salesReturn->user->name }}</p>
                <p><strong>{{ ($lang ?? 'ar') === 'en' ? 'Email' : 'البريد' }}:</strong> {{ $salesReturn->user->email }}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>{{ ($lang ?? 'ar') === 'en' ? 'Product' : 'المنتج' }}</th>
                    <th class="text-center">{{ ($lang ?? 'ar') === 'en' ? 'Returned Qty' : 'الكمية المسترجعة' }}</th>
                    <th class="text-left">{{ ($lang ?? 'ar') === 'en' ? 'Unit Price' : 'سعر الوحدة' }}</th>
                    <th class="text-left">{{ ($lang ?? 'ar') === 'en' ? 'Total' : 'الإجمالي' }}</th>
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
                    <td class="text-left">{{ number_format($item->price, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</td>
                    <td class="text-left">{{ number_format($item->subtotal, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals">
            <div class="totals-row">
                <span>{{ ($lang ?? 'ar') === 'en' ? 'Total Returns Value:' : 'إجمالي قيمة المرتجعات:' }}</span>
                <span>{{ number_format($salesReturn->subtotal, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</span>
            </div>
            @if($salesReturn->discount_amount > 0)
            <div class="totals-row" style="color: #d32f2f;">
                <span>{{ ($lang ?? 'ar') === 'en' ? 'Proportional Discount Refunded:' : 'خصم نسبي مسترجع:' }}</span>
                <span>-{{ number_format($salesReturn->discount_amount, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</span>
            </div>
            @endif
            <div class="totals-row total">
                <span>{{ ($lang ?? 'ar') === 'en' ? 'Net Refunded:' : 'الصافي المسترد:' }}</span>
                <span>{{ number_format($salesReturn->refund_total, 2) }} {{ ($lang ?? 'ar') === 'en' ? 'SAR' : 'ر.س' }}</span>
            </div>
        </div>

        @if($salesReturn->reason)
        <div style="margin-top: 20px; padding: 10px; background-color: #f9f9f9; border-right: 3px solid #ffa000; font-size: 13px;">
            <strong>{{ ($lang ?? 'ar') === 'en' ? 'Return Reason:' : 'سبب الاسترجاع:' }}</strong> {{ $salesReturn->reason }}
        </div>
        @endif

        <div class="footer">
            <p>{{ ($lang ?? 'ar') === 'en' ? 'Return invoice issued successfully.' : 'تم إصدار فاتورة المرتجع بنجاح.' }}</p>
            <p>{{ ($lang ?? 'ar') === 'en' ? 'Thank you for dealing with us!' : 'شكراً لتعاملكم معنا!' }}</p>
        </div>
    </div>

    <div class="no-print" style="text-align: center; margin-top: 20px;">
        <button onclick="window.print()" style="padding: 10px 20px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">
            🖨️ طباعة فاتورة المرتجع
        </button>
    </div>
</body>
</html>
