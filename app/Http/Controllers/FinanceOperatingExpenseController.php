<?php

namespace App\Http\Controllers;

use App\Models\OperatingExpense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FinanceOperatingExpenseController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        OperatingExpense::create($this->validateExpense($request));

        return back()->with('success', 'Operating expense saved.');
    }

    public function update(Request $request, OperatingExpense $operatingExpense): RedirectResponse
    {
        $operatingExpense->update($this->validateExpense($request));

        return back()->with('success', 'Operating expense updated.');
    }

    public function destroy(OperatingExpense $operatingExpense): RedirectResponse
    {
        $operatingExpense->delete();

        return back()->with('success', 'Operating expense deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateExpense(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'amount' => ['required', 'integer', 'min:0'],
            'expense_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
