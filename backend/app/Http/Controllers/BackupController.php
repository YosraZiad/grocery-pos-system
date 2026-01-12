<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Spatie\Backup\BackupDestination\Backup;
use Spatie\Backup\BackupDestination\BackupDestination;
use Spatie\Backup\Tasks\Backup\BackupJobFactory;

class BackupController extends Controller
{
    /**
     * إنشاء نسخة احتياطية
     */
    public function create(Request $request)
    {
        try {
            // إنشاء نسخة احتياطية
            Artisan::call('backup:run', [
                '--only-db' => $request->only_db ?? false,
            ]);

            return response()->json([
                'message' => 'Backup created successfully',
                'data' => [
                    'status' => 'success',
                    'created_at' => now()->toDateTimeString(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create backup',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * عرض قائمة النسخ الاحتياطية
     */
    public function list()
    {
        try {
            $backups = [];
            $backupDestination = BackupDestination::create(config('backup.backup.destination.disks')[0] ?? 'local', config('backup.backup.name'));

            if ($backupDestination) {
                $allBackups = $backupDestination->backups();
                
                foreach ($allBackups as $backup) {
                    $backups[] = [
                        'path' => $backup->path(),
                        'size' => $backup->size(),
                        'date' => $backup->date()->format('Y-m-d H:i:s'),
                        'age' => $backup->date()->diffForHumans(),
                    ];
                }
            }

            // ترتيب حسب التاريخ (الأحدث أولاً)
            usort($backups, function ($a, $b) {
                return strtotime($b['date']) - strtotime($a['date']);
            });

            return response()->json([
                'data' => $backups,
                'count' => count($backups),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to list backups',
                'error' => $e->getMessage(),
                'data' => [],
            ], 200);
        }
    }

    /**
     * استرجاع نسخة احتياطية
     */
    public function restore(Request $request, $id)
    {
        try {
            $backupPath = $request->path;
            
            if (!$backupPath) {
                return response()->json([
                    'message' => 'Backup path is required',
                ], 400);
            }

            // التحقق من وجود الملف
            if (!Storage::disk('local')->exists($backupPath)) {
                return response()->json([
                    'message' => 'Backup file not found',
                ], 404);
            }

            // استرجاع النسخة الاحتياطية
            Artisan::call('backup:restore', [
                '--backup' => $backupPath,
                '--force' => true,
            ]);

            return response()->json([
                'message' => 'Backup restored successfully',
                'data' => [
                    'status' => 'success',
                    'restored_at' => now()->toDateTimeString(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to restore backup',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * حذف نسخة احتياطية
     */
    public function destroy($id)
    {
        try {
            $backupPath = request()->path;
            
            if (!$backupPath) {
                return response()->json([
                    'message' => 'Backup path is required',
                ], 400);
            }

            // حذف الملف
            if (Storage::disk('local')->exists($backupPath)) {
                Storage::disk('local')->delete($backupPath);
            }

            return response()->json([
                'message' => 'Backup deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete backup',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * تحميل نسخة احتياطية
     */
    public function download($id)
    {
        try {
            $backupPath = request()->path;
            
            if (!$backupPath) {
                return response()->json([
                    'message' => 'Backup path is required',
                ], 400);
            }

            // التحقق من وجود الملف
            if (!Storage::disk('local')->exists($backupPath)) {
                return response()->json([
                    'message' => 'Backup file not found',
                ], 404);
            }

            return Storage::disk('local')->download($backupPath);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to download backup',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
