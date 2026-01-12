<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class SettingController extends Controller
{
    /**
     * عرض جميع الإعدادات
     */
    public function index()
    {
        $settings = Setting::all()->pluck('value', 'key')->toArray();

        // إعدادات افتراضية
        $defaultSettings = [
            'store_name' => 'Grocery Store',
            'store_address' => '',
            'store_phone' => '',
            'store_email' => '',
            'currency' => 'SAR',
            'currency_symbol' => 'ر.س',
            'logo' => null,
            'printer_name' => '',
            'printer_type' => 'thermal',
            'receipt_footer' => 'شكرًا لزيارتك',
        ];

        // دمج الإعدادات الافتراضية مع الإعدادات المحفوظة
        $allSettings = array_merge($defaultSettings, $settings);

        return response()->json([
            'data' => $allSettings,
        ], 200);
    }

    /**
     * تحديث إعداد واحد
     */
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'key' => 'required|string',
            'value' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        Setting::set($request->key, $request->value);

        return response()->json([
            'message' => 'Setting updated successfully',
            'data' => Setting::get($request->key),
        ], 200);
    }

    /**
     * تحديث متعدد للإعدادات
     */
    public function bulkUpdate(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'settings' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        foreach ($request->settings as $key => $value) {
            Setting::set($key, $value);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ], 200);
    }

    /**
     * رفع الشعار
     */
    public function uploadLogo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // حذف الشعار القديم إن وجد
        $oldLogo = Setting::get('logo');
        if ($oldLogo && Storage::exists($oldLogo)) {
            Storage::delete($oldLogo);
        }

        // رفع الشعار الجديد
        $path = $request->file('logo')->store('logos', 'public');

        // حفظ المسار في الإعدادات
        Setting::set('logo', $path);

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'data' => [
                'logo' => Storage::url($path),
            ],
        ], 200);
    }
}
