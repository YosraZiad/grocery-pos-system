<?php

namespace App\Models;

class Setting extends BaseModel
{
    protected $fillable = [
        'tenant_id',
        'key',
        'value',
    ];

    /**
     * الحصول على قيمة إعداد
     */
    public static function get($key, $default = null)
    {
        $setting = self::where('key', $key)->first();
        return $setting ? $setting->value : $default;
    }

    /**
     * تعيين قيمة إعداد
     */
    public static function set($key, $value)
    {
        return self::updateOrCreate(
            ['tenant_id' => config('tenant_id'), 'key' => $key],
            ['value' => $value]
        );
    }
}
