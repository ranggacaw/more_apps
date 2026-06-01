<?php

namespace App\Http\Controllers;

use App\Models\BalanceSheetEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FinanceBalanceSheetEntryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        BalanceSheetEntry::create($this->validateEntry($request));

        return back()->with('success', 'Balance-sheet entry saved.');
    }

    public function update(Request $request, BalanceSheetEntry $balanceSheetEntry): RedirectResponse
    {
        $balanceSheetEntry->update($this->validateEntry($request));

        return back()->with('success', 'Balance-sheet entry updated.');
    }

    public function destroy(BalanceSheetEntry $balanceSheetEntry): RedirectResponse
    {
        $balanceSheetEntry->delete();

        return back()->with('success', 'Balance-sheet entry deleted.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateEntry(Request $request): array
    {
        return $request->validate([
            'side' => ['required', Rule::in(BalanceSheetEntry::SIDES)],
            'label' => ['required', 'string', 'max:120'],
            'category' => ['nullable', 'string', 'max:120'],
            'amount' => ['required', 'integer', 'min:0'],
            'entry_date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
    }
}
