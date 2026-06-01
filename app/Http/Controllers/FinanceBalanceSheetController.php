<?php

namespace App\Http\Controllers;

use App\Models\BalanceSheetEntry;
use App\Services\FinanceReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class FinanceBalanceSheetController extends Controller
{
    public function __invoke(Request $request, FinanceReportService $reports): Response
    {
        $validated = $request->validate([
            'as_of_date' => ['nullable', 'date'],
        ]);

        $asOfDate = isset($validated['as_of_date'])
            ? Carbon::parse($validated['as_of_date'])->endOfDay()
            : now()->endOfDay();
        $canManage = $request->user()->role === 'super_admin';

        return Inertia::render('Finance/BalanceSheet', [
            'filters' => [
                'as_of_date' => $asOfDate->toDateString(),
            ],
            'report' => $reports->balanceSheet($asOfDate),
            'balanceSheetEntries' => $canManage ? $this->balanceSheetEntries($asOfDate) : [],
            'allowedSides' => BalanceSheetEntry::SIDES,
            'canManageFinance' => $canManage,
            'doctor' => $this->doctorPayload($request),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function balanceSheetEntries(Carbon $asOfDate): array
    {
        return BalanceSheetEntry::query()
            ->where('entry_date', '<=', $asOfDate->toDateString())
            ->latest('entry_date')
            ->latest('id')
            ->get()
            ->map(fn (BalanceSheetEntry $entry) => [
                'id' => $entry->id,
                'side' => $entry->side,
                'label' => $entry->label,
                'category' => $entry->category,
                'amount' => $entry->amount,
                'entry_date' => $entry->entry_date?->toDateString(),
                'notes' => $entry->notes,
            ])
            ->all();
    }

    /**
     * @return array<string, string>|null
     */
    private function doctorPayload(Request $request): ?array
    {
        if ($request->user()->role !== 'doctor') {
            return null;
        }

        $doctorProfile = $request->user()->doctorProfile;

        return [
            'name' => $request->user()->name,
            'specialization' => $doctorProfile?->specialization ?? 'Practitioner',
        ];
    }
}
