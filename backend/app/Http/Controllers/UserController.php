<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    protected UserService $service;

    public function __construct(UserService $service)
    {
        $this->service = $service;
    }
    /**
     * عرض جميع المستخدمين
     */
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'role', 'per_page']);
        $users = $this->service->index($filters);

        return response()->json($users, 200);
    }

    /**
     * عرض مستخدم واحد
     */
    public function show(string $id)
    {
        $user = $this->service->show($id);

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

        $data = $request->only(['name', 'email', 'password', 'role']);
        $data['tenant_id'] = config('tenant_id');

        $user = $this->service->create($data);

        return response()->json([
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    /**
     * تحديث مستخدم
     */
    public function update(Request $request, string $id)
    {
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

        $data = $request->only(['name', 'email', 'password', 'role']);
        $user = $this->service->update($id, $data);

        return response()->json([
            'message' => 'User updated successfully',
            'data' => $user,
        ], 200);
    }

    /**
     * حذف مستخدم
     */
    public function destroy(string $id)
    {
        try {
            $this->service->delete($id, auth()->id());

            return response()->json([
                'message' => 'User deleted successfully',
            ], 200);

        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * تحديث كلمة مرور المستخدم
     */
    public function updatePassword(Request $request, string $id)
    {
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

        try {
            $this->service->updatePassword(
                $id,
                $request->current_password,
                $request->password,
                auth()->id()
            );

            return response()->json([
                'message' => 'Password updated successfully',
            ], 200);

        } catch (\RuntimeException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
