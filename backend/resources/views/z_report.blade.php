<!DOCTYPE html>
<html lang="{{ $lang ?? 'ar' }}" dir="{{ ($lang ?? 'ar') === 'en' ? 'ltr' : 'rtl' }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Z-Report #{{ $shift->shift_number }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background-color: #f9f9f9;
            font-family: 'Courier New', Courier, monospace;
            padding: 10px;
            color: #111;
        }

        .z-report-container {
            background: #fff;
            max-width: 320px;
            margin: 0 auto;
            padding: 20px 15px;
            border: 1px dashed #ccc;
        }

        .header {
            text-align: center;
            margin-bottom: 15px;
        }

        .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .header h2 {
            font-size: 14px;
            font-weight: normal;
            margin-bottom: 10px;
            color: #444;
        }

        .divider {
            border-top: 1px dashed #000;
            margin: 10px 0;
        }

        .double-divider {
            border-top: 3px double #000;
            margin: 10px 0;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin: 4px 0;
        }

        .info-label {
            font-weight: bold;
        }

        .info-value {
            text-align: right;
            word-break: break-all;
        }

        .section-title {
            font-size: 12px;
            font-weight: bold;
            text-align: center;
            margin: 12px 0 6px 0;
            text-transform: uppercase;
            background: #eee;
            padding: 2px;
        }

        .financial-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin: 8px 0;
        }

        .financial-table th {
            text-align: inherit;
            border-bottom: 1px solid #000;
            padding: 3px 0;
            font-weight: bold;
        }

        .financial-table td {
            padding: 5px 0;
            border-bottom: 1px dashed #eee;
        }

        .text-right {
            text-align: right;
        }

        .badge {
            display: inline-block;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: bold;
            color: #fff;
            border-radius: 3px;
        }

        .badge-match {
            background-color: #2e7d32;
            color: #fff;
        }

        .badge-shortage {
            background-color: #c62828;
            color: #fff;
        }

        .badge-overage {
            background-color: #ef6c00;
            color: #fff;
        }

        .notes-box {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 8px;
            font-size: 10px;
            margin-top: 8px;
            white-space: pre-wrap;
            word-break: break-all;
        }

        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #666;
        }

        @media print {
            body {
                background: none;
                padding: 0;
            }
            .z-report-container {
                border: none;
                max-width: 100%;
                width: 100%;
                padding: 0;
            }
        }
    </style>
</head>
<body>
    <div class="z-report-container">
        <!-- الهيدر -->
        <div class="header">
            <h1>{{ $tenantName }}</h1>
            <h2>{{ ($lang ?? 'ar') === 'en' ? 'SHIFT Z-REPORT' : 'تقرير إغلاق الوردية Z' }}</h2>
            <div class="info-row">
                <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Shift No:' : 'رقم الوردية:' }}</span>
                <span class="info-value">{{ $shift->shift_number }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Cashier:' : 'الكاشير:' }}</span>
                <span class="info-value">{{ $shift->user->name }}</span>
            </div>
        </div>

        <div class="divider"></div>

        <!-- أوقات الوردية -->
        <div class="info-row">
            <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Opened At:' : 'وقت الفتح:' }}</span>
            <span class="info-value">{{ $shift->opened_at->format('Y-m-d H:i:s') }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Closed At:' : 'وقت الإغلاق:' }}</span>
            <span class="info-value">{{ $shift->closed_at ? $shift->closed_at->format('Y-m-d H:i:s') : '-' }}</span>
        </div>

        <div class="divider"></div>

        <!-- ملخص المبيعات الكلي -->
        <div class="section-title">{{ ($lang ?? 'ar') === 'en' ? 'Sales Summary' : 'ملخص المبيعات' }}</div>
        <div class="info-row">
            <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Total Sales:' : 'إجمالي المبيعات:' }}</span>
            <span class="info-value">{{ number_format($shift->total_sales, 2) }} ر.س</span>
        </div>
        <div class="info-row">
            <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Total Returns:' : 'إجمالي المرتجعات:' }}</span>
            <span class="info-value">{{ number_format($shift->total_returns, 2) }} ر.س</span>
        </div>

        <div class="divider"></div>

        <!-- تفاصيل تسوية المدفوعات -->
        <div class="section-title">{{ ($lang ?? 'ar') === 'en' ? 'Payment Reconciliation' : 'تسوية العهدة والمدفوعات' }}</div>
        <div class="info-row" style="font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 2px;">
            <span>{{ ($lang ?? 'ar') === 'en' ? 'Method' : 'طريقة الدفع' }}</span>
            <span>{{ ($lang ?? 'ar') === 'en' ? 'Expected / Actual' : 'المتوقع / الفعلي' }}</span>
        </div>
        
        <!-- النقد / كاش -->
        <div class="info-row">
            <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Cash:' : 'نقدي (كاش):' }}</span>
            <span class="info-value">
                {{ number_format($shift->expected_cash, 2) }} / {{ number_format($shift->actual_cash, 2) }} ر.س
            </span>
        </div>
        
        <!-- شبكة / بطاقة -->
        <div class="info-row">
            <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Card:' : 'بطاقة (شبكة):' }}</span>
            <span class="info-value">
                {{ number_format($shift->expected_card, 2) }} / {{ number_format($shift->actual_card, 2) }} ر.س
            </span>
        </div>

        <!-- العهدة الافتتاحية -->
        <div class="info-row" style="font-size: 10px; color: #555;">
            <span>{{ ($lang ?? 'ar') === 'en' ? '* Opening Float:' : '* عهدة الافتتاح (مشمولة):' }}</span>
            <span>{{ number_format($shift->opening_float, 2) }} ر.س</span>
        </div>

        <div class="double-divider"></div>

        <!-- النتيجة النهائية والفروقات -->
        <div class="info-row" style="font-size: 13px; font-weight: bold;">
            <span>{{ ($lang ?? 'ar') === 'en' ? 'Difference:' : 'إجمالي الفارق:' }}</span>
            <span>{{ number_format($shift->difference, 2) }} ر.س</span>
        </div>

        <div class="info-row" style="margin-top: 5px;">
            <span class="info-label">{{ ($lang ?? 'ar') === 'en' ? 'Status:' : 'الحالة:' }}</span>
            <span class="info-value">
                @if(abs($shift->difference) < 0.01)
                    <span class="badge badge-match">{{ ($lang ?? 'ar') === 'en' ? 'MATCHED' : 'متطابق' }}</span>
                @elseif($shift->difference < 0)
                    <span class="badge badge-shortage">{{ ($lang ?? 'ar') === 'en' ? 'SHORTAGE' : 'عجز عهدة' }}</span>
                @else
                    <span class="badge badge-overage">{{ ($lang ?? 'ar') === 'en' ? 'OVERAGE' : 'زيادة عهدة' }}</span>
                @endif
            </span>
        </div>

        <!-- تبرير الفارق إن وجد -->
        @if(!empty($shift->notes))
            <div class="divider"></div>
            <div class="info-label" style="font-size: 11px;">{{ ($lang ?? 'ar') === 'en' ? 'Justification / Notes:' : 'تبرير الفارق / ملاحظات:' }}</div>
            <div class="notes-box">{{ $shift->notes }}</div>
        @endif

        <div class="divider"></div>

        <!-- فوتر التقرير -->
        <div class="footer">
            <p>{{ ($lang ?? 'ar') === 'en' ? 'Thank you for your hard work today!' : 'شكراً لجهودكم اليوم عمل رائع!' }}</p>
            <p style="margin-top: 5px; font-size: 8px;">{{ now()->format('Y-m-d H:i:s') }}</p>
        </div>
    </div>
</body>
</html>
