<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'user_id',
        'action',
        'description',
        'admin_user_id',
        'ip_address',
    ];

    /**
     * العلاقة مع المستخدم (الكاشير)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * العلاقة مع المدير المعتمد للعملية
     */
    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
