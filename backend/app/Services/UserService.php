<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;

class UserService
{
    /**
     * Get all users with filters
     *
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function index(array $filters): LengthAwarePaginator
    {
        $query = User::with('roles');

        // Search by name or email
        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if (isset($filters['role'])) {
            $query->role($filters['role']);
        }

        $perPage = $filters['per_page'] ?? 20;
        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    /**
     * Show single user
     *
     * @param string $id
     * @return User
     */
    public function show(string $id): User
    {
        return User::with('roles', 'permissions')->findOrFail($id);
    }

    /**
     * Create a new user
     *
     * @param array $data
     * @return User
     */
    public function create(array $data): User
    {
        $user = User::create([
            'tenant_id' => $data['tenant_id'],
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        // Assign role
        if (isset($data['role'])) {
            $user->assignRole($data['role']);
        }

        return $user->load('roles');
    }

    /**
     * Update user
     *
     * @param string $id
     * @param array $data
     * @return User
     */
    public function update(string $id, array $data): User
    {
        $user = User::findOrFail($id);

        $updateData = [];
        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }
        if (isset($data['email'])) {
            $updateData['email'] = $data['email'];
        }
        if (isset($data['password']) && !empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        if (!empty($updateData)) {
            $user->update($updateData);
        }

        // Update role
        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
        }

        return $user->load('roles', 'permissions');
    }

    /**
     * Delete user
     *
     * @param string $id
     * @param int $currentUserId
     * @return void
     * @throws \RuntimeException
     */
    public function delete(string $id, int $currentUserId): void
    {
        $user = User::findOrFail($id);

        // Prevent deleting current user
        if ($user->id === $currentUserId) {
            throw new \RuntimeException('Cannot delete your own account');
        }

        $user->delete();
    }

    /**
     * Update user password
     *
     * @param string $id
     * @param string $currentPassword
     * @param string $newPassword
     * @param int $requestingUserId
     * @return void
     * @throws \RuntimeException
     */
    public function updatePassword(string $id, string $currentPassword, string $newPassword, int $requestingUserId): void
    {
        $user = User::findOrFail($id);

        // Verify user can only update their own password
        if ($user->id !== $requestingUserId) {
            throw new \RuntimeException('You can only update your own password');
        }

        // Verify current password
        if (!Hash::check($currentPassword, $user->password)) {
            throw new \RuntimeException('Current password is incorrect');
        }

        // Update password
        $user->update([
            'password' => Hash::make($newPassword),
        ]);
    }
}
