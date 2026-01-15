<?php

namespace App\Http\Controllers;

use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    /**
     * عرض جميع الرول
     */
    public function index()
    {
        try {
            $tenantId = config('tenant_id');
            
            $roles = Role::where('guard_name', 'sanctum')
                ->with('permissions')
                ->get()
                ->map(function ($role) use ($tenantId) {
                    // حساب عدد المستخدمين يدوياً لتجنب مشاكل Global Scope
                    // استخدام model_has_roles table مباشرة
                    $usersCount = \DB::table('model_has_roles')
                        ->join('users', 'model_has_roles.model_id', '=', 'users.id')
                        ->where('model_has_roles.role_id', $role->id)
                        ->where('model_has_roles.model_type', User::class)
                        ->where('users.tenant_id', $tenantId)
                        ->count();
                    
                    $role->users_count = $usersCount;
                    return $role;
                });

            return response()->json([
                'data' => $roles,
                'count' => $roles->count(),
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching roles: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Error fetching roles',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * عرض رول واحد
     */
    public function show(string $id)
    {
        $role = Role::where('guard_name', 'sanctum')
            ->with('permissions')
            ->findOrFail($id);

        return response()->json([
            'data' => $role,
        ], 200);
    }

    /**
     * إضافة رول جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'sanctum',
        ]);

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'message' => 'Role created successfully',
            'data' => $role->load('permissions'),
        ], 201);
    }

    /**
     * تحديث رول
     */
    public function update(Request $request, string $id)
    {
        $role = Role::where('guard_name', 'sanctum')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:roles,name,' . $id,
            'permissions' => 'sometimes|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        if ($request->has('name')) {
            $role->update(['name' => $request->name]);
        }

        if ($request->has('permissions')) {
            $role->syncPermissions($request->permissions);
        }

        return response()->json([
            'message' => 'Role updated successfully',
            'data' => $role->load('permissions'),
        ], 200);
    }

    /**
     * حذف رول
     */
    public function destroy(string $id)
    {
        $role = Role::where('guard_name', 'sanctum')->findOrFail($id);

        // منع حذف الرول الأساسية
        if (in_array($role->name, ['admin', 'cashier'])) {
            return response()->json([
                'message' => 'Cannot delete system roles',
            ], 422);
        }

        $role->delete();

        return response()->json([
            'message' => 'Role deleted successfully',
        ], 200);
    }

    /**
     * عرض جميع الصلاحيات
     */
    public function permissions()
    {
        try {
            $permissions = Permission::where('guard_name', 'sanctum')
                ->orderBy('name')
                ->get()
                ->groupBy(function ($permission) {
                    // تجميع الصلاحيات حسب النوع
                    $parts = explode(' ', $permission->name);
                    return $parts[0] ?? 'other';
                });

            return response()->json([
                'data' => $permissions,
                'count' => Permission::where('guard_name', 'sanctum')->count(),
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Error fetching permissions: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching permissions',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
