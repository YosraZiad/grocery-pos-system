<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * عرض جميع المستخدمين
     */
    public function index(Request $request)
    {
        $query = User::with('roles');

        // البحث بالاسم أو البريد
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // فلترة حسب الرول
        if ($request->has('role')) {
            $query->role($request->role);
        }

        $perPage = $request->get('per_page', 20);
        $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($users, 200);
    }

    /**
     * عرض مستخدم واحد
     */
    public function show(string $id)
    {
        $user = User::with('roles', 'permissions')->findOrFail($id);

        return response()->json([
            'data' => $user,
        ], 200);
    }

    /**
     * إضافة مستخدم جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'tenant_id' => config('tenant_id'),
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        // تعيين الرول
        $user->assignRole($request->role);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user->load('roles'),
        ], 201);
    }

    /**
     * تحديث مستخدم
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'sometimes|nullable|string|min:8',
            'role' => 'sometimes|required|string|exists:roles,name',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $updateData = [];
        if ($request->has('name')) {
            $updateData['name'] = $request->name;
        }
        if ($request->has('email')) {
            $updateData['email'] = $request->email;
        }
        if ($request->has('password') && $request->password) {
            $updateData['password'] = Hash::make($request->password);
        }

        if (!empty($updateData)) {
            $user->update($updateData);
        }

        // تحديث الرول
        if ($request->has('role')) {
            $user->syncRoles([$request->role]);
        }

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $user->load('roles', 'permissions'),
        ], 200);
    }

    /**
     * حذف مستخدم
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        // منع حذف المستخدم الحالي
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Cannot delete your own account',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ], 200);
    }

    /**
     * تحديث كلمة مرور المستخدم
     */
    public function updatePassword(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        // التحقق من أن المستخدم يحاول تحديث كلمة مروره فقط
        if ($user->id !== auth()->id()) {
            return response()->json([
                'message' => 'You can only update your own password',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        // التحقق من كلمة المرور الحالية
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect',
            ], 422);
        }

        // تحديث كلمة المرور
        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Password updated successfully',
        ], 200);
    }
}
