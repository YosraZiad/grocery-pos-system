<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * تسجيل مستخدم جديد
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'nullable|string|max:255|unique:users,username',
            'employee_barcode' => 'nullable|string|max:255|unique:users,employee_barcode',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'tenant_id' => 'required|exists:tenants,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'employee_barcode' => $request->employee_barcode,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'tenant_id' => $request->tenant_id,
        ]);

        // تعيين دور افتراضي (كاشير)
        $user->assignRole('cashier');

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user->load('roles'),
            'token' => $token,
        ], 201);
    }

    /**
     * تسجيل الدخول
     */
    public function login(Request $request)
    {
        $identifier = trim((string) $request->input('identifier', $request->input('email', $request->input('employee_barcode', ''))));
        $password = $request->input('password');
        $isBarcodeLogin = $this->isBarcodeIdentifier($identifier) || $request->input('login_method') === 'barcode';

        $validator = Validator::make([
            'identifier' => $identifier,
            'password' => $password,
        ], [
            'identifier' => 'required|string|max:255',
            'password' => $isBarcodeLogin ? 'nullable' : 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $this->findUserByIdentifier($identifier, $isBarcodeLogin);

        if (!$user) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        if ($this->isAccountLocked($user)) {
            return response()->json([
                'message' => 'Account is locked due to multiple failed attempts',
                'locked_until' => $user->locked_until?->toIso8601String(),
                'retry_after_seconds' => now()->diffInSeconds($user->locked_until),
            ], 423);
        }

        // If the lock has expired, reset failed attempts
        if ($user->locked_until !== null && now()->gte($user->locked_until)) {
            $user->forceFill([
                'failed_login_attempts' => 0,
                'locked_until' => null,
            ])->save();
        }

        if (!$isBarcodeLogin && !Hash::check((string) $password, $user->password)) {
            return $this->handleFailedLoginAttempt($user);
        }

        $loginAt = Carbon::now();
        $user->forceFill([
            'failed_login_attempts' => 0,
            'locked_until' => null,
            'last_login_at' => $loginAt,
        ])->save();

        // حذف جميع الـ tokens القديمة (اختياري - للأمان)
        $user->tokens()->delete();

        // إنشاء token جديد
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user' => $user->load('roles'),
            'token' => $token,
            'tenant_id' => $user->tenant_id,
            'login_method' => $isBarcodeLogin ? 'barcode' : 'username_password',
            'login_at_server' => $loginAt->toIso8601String(),
        ], 200);
    }

    private function findUserByIdentifier(string $identifier, bool $isBarcodeLogin): ?User
    {
        if ($isBarcodeLogin) {
            return User::where('employee_barcode', $identifier)->first();
        }

        return User::where('username', $identifier)
            ->orWhere('email', $identifier)
            ->first();
    }

    private function isBarcodeIdentifier(string $identifier): bool
    {
        return str_starts_with(strtoupper($identifier), 'EMP-');
    }

    private function isAccountLocked(User $user): bool
    {
        return $user->locked_until !== null && now()->lt($user->locked_until);
    }

    private function handleFailedLoginAttempt(User $user)
    {
        $attempts = min(3, (int) $user->failed_login_attempts + 1);
        $shouldLock = $attempts >= 3;
        $lockedUntil = $shouldLock ? now()->addMinutes(15) : null;

        $user->forceFill([
            'failed_login_attempts' => $attempts,
            'locked_until' => $lockedUntil,
        ])->save();

        return response()->json([
            'message' => $shouldLock
                ? 'Account locked after 3 failed attempts'
                : 'Invalid credentials',
            'attempts_remaining' => max(0, 3 - $attempts),
            'locked_until' => $lockedUntil?->toIso8601String(),
        ], $shouldLock ? 423 : 401);
    }

    /**
     * تسجيل الخروج
     */
    public function logout(Request $request)
    {
        $user = $request->user();
        
        // حذف الـ token الحالي
        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        } else {
            // حذف جميع الـ tokens إذا لم يكن هناك token محدد
            $user?->tokens()->delete();
        }

        return response()->json([
            'message' => 'Logged out successfully',
        ], 200);
    }

    /**
     * بيانات المستخدم الحالي
     */
    public function me(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('roles', 'permissions'),
        ], 200);
    }

    /**
     * التحقق من صلاحيات المدير لإجراءات الحذف ذات القيمة المرتفعة
     */
    public function verifyAdmin(Request $request)
    {
        $identifier = trim((string) $request->input('identifier', ''));
        $password = $request->input('password');
        $isBarcode = $this->isBarcodeIdentifier($identifier);

        $validator = Validator::make([
            'identifier' => $identifier,
            'password' => $isBarcode ? 'nullable' : 'required|string',
        ], [
            'identifier' => 'required|string|max:255',
            'password' => $isBarcode ? 'nullable' : 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $this->findUserByIdentifier($identifier, $isBarcode);

        if (!$user) {
            return response()->json([
                'message' => 'Admin user not found',
            ], 404);
        }

        // إذا لم يكن باركود، نتحقق من كلمة المرور
        if (!$isBarcode && !Hash::check((string) $password, $user->password)) {
            return response()->json([
                'message' => 'Invalid password',
            ], 401);
        }

        // التحقق من أنه يملك دور 'admin'
        if (!$user->hasRole('admin')) {
            return response()->json([
                'message' => 'User is not an authorized admin',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'admin' => [
                'id' => $user->id,
                'name' => $user->name,
            ]
        ], 200);
    }

    /**
     * إعادة تعيين بيانات اختبار تسجيل الدخول السريع
     */
    public function resetFastLogin()
    {
        try {
            \Illuminate\Support\Facades\Artisan::call('db:seed', [
                '--class' => 'FastLoginTestCasesSeeder'
            ]);
            return response()->json([
                'message' => 'Database successfully reset to fast login test states',
                'output' => \Illuminate\Support\Facades\Artisan::output()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to seed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * تحديث الـ PIN للمستخدم الحالي
     */
    public function updatePin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pin' => 'required|string|digits:4',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $user->pin = $request->pin;
        $user->save();

        return response()->json([
            'message' => 'PIN updated successfully',
        ], 200);
    }

    /**
     * التحقق من الـ PIN للمستخدم الحالي
     */
    public function verifyPin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pin' => 'required|string|digits:4',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (!$user->pin || !Hash::check($request->pin, $user->pin)) {
            return response()->json([
                'message' => 'Invalid PIN',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'PIN verified successfully',
        ], 200);
    }
}
