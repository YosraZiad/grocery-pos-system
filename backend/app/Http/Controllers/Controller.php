<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;

/**
 * Base Controller لجميع Controllers
 * يحتوي على Traits الأساسية للـ Authorization والـ Validation
 */
abstract class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;
}
