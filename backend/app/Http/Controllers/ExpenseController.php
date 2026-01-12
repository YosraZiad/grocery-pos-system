<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    /**
     * عرض جميع المصروفات
     */
    public function index(Request $request)
    {
        $query = Expense::with(['category', 'user']);

        // فلترة حسب القسم
        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // فلترة حسب التاريخ
        if ($request->has('from')) {
            $query->whereDate('date', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->whereDate('date', '<=', $request->to);
        }

        // البحث في الوصف
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('description', 'like', "%{$search}%");
        }

        $perPage = $request->get('per_page', 20);
        $expenses = $query->orderBy('date', 'desc')->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($expenses, 200);
    }

    /**
     * عرض مصروف واحد
     */
    public function show(string $id)
    {
        $expense = Expense::with(['category', 'user'])->findOrFail($id);

        return response()->json([
            'data' => $expense,
        ], 200);
    }

    /**
     * إضافة مصروف جديد
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $expense = Expense::create([
            'tenant_id' => config('tenant_id'),
            'category_id' => $request->category_id,
            'amount' => $request->amount,
            'description' => $request->description,
            'date' => $request->date,
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Expense created successfully',
            'data' => $expense->load(['category', 'user']),
        ], 201);
    }

    /**
     * تعديل مصروف
     */
    public function update(Request $request, string $id)
    {
        $validator = Validator::make($request->all(), [
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string',
            'date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $expense = Expense::findOrFail($id);

        $expense->update([
            'category_id' => $request->category_id,
            'amount' => $request->amount,
            'description' => $request->description,
            'date' => $request->date,
        ]);

        return response()->json([
            'message' => 'Expense updated successfully',
            'data' => $expense->load(['category', 'user']),
        ], 200);
    }

    /**
     * حذف مصروف
     */
    public function destroy(string $id)
    {
        $expense = Expense::findOrFail($id);

        $expense->delete();

        return response()->json([
            'message' => 'Expense deleted successfully',
        ], 200);
    }

    /**
     * ملخص المصروفات
     */
    public function summary(Request $request)
    {
        $query = Expense::query();

        // فلترة حسب التاريخ
        if ($request->has('from')) {
            $query->whereDate('date', '>=', $request->from);
        }
        if ($request->has('to')) {
            $query->whereDate('date', '<=', $request->to);
        }

        // ملخص عام
        $totalExpenses = $query->sum('amount');
        $expensesCount = $query->count();
        $averageExpense = $expensesCount > 0 ? $totalExpenses / $expensesCount : 0;

        // ملخص حسب القسم
        $byCategory = Expense::select('expense_categories.name as category_name', DB::raw('SUM(expenses.amount) as total'))
            ->join('expense_categories', 'expenses.category_id', '=', 'expense_categories.id')
            ->when($request->has('from'), function ($q) use ($request) {
                $q->whereDate('expenses.date', '>=', $request->from);
            })
            ->when($request->has('to'), function ($q) use ($request) {
                $q->whereDate('expenses.date', '<=', $request->to);
            })
            ->groupBy('expense_categories.id', 'expense_categories.name')
            ->orderBy('total', 'desc')
            ->get();

        // ملخص يومي (آخر 30 يوم)
        $dailyExpenses = Expense::select(DB::raw('DATE(date) as date'), DB::raw('SUM(amount) as total'))
            ->whereDate('date', '>=', now()->subDays(30))
            ->when($request->has('from'), function ($q) use ($request) {
                $q->whereDate('date', '>=', $request->from);
            })
            ->when($request->has('to'), function ($q) use ($request) {
                $q->whereDate('date', '<=', $request->to);
            })
            ->groupBy(DB::raw('DATE(date)'))
            ->orderBy('date', 'desc')
            ->get();

        return response()->json([
            'data' => [
                'total_expenses' => $totalExpenses,
                'expenses_count' => $expensesCount,
                'average_expense' => $averageExpense,
                'by_category' => $byCategory,
                'daily_expenses' => $dailyExpenses,
            ],
        ], 200);
    }
}
