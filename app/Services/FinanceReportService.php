<?php

namespace App\Services;

use App\Models\BalanceSheetEntry;
use App\Models\OperatingExpense;
use App\Models\Payment;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class FinanceReportService
{
    /**
     * @return array<string, mixed>
     */
    public function profitAndLoss(CarbonInterface $startDate, CarbonInterface $endDate): array
    {
        $paidPayments = Payment::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$startDate, $endDate]);

        $expenses = OperatingExpense::query()
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()]);

        $grossRevenue = (int) (clone $paidPayments)->sum('amount');
        $returns = (int) (clone $paidPayments)->sum('return_amount');
        $hpp = (int) (clone $paidPayments)->sum('hpp_amount');
        $operatingExpenses = (int) (clone $expenses)->sum('amount');
        $totalRevenue = $grossRevenue - $returns;
        $grossProfit = $totalRevenue - $hpp;
        $netIncome = $grossProfit - $operatingExpenses;

        return [
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'gross_revenue' => $grossRevenue,
            'returns' => $returns,
            'total_revenue' => $totalRevenue,
            'hpp' => $hpp,
            'gross_profit' => $grossProfit,
            'gross_margin_percentage' => $totalRevenue > 0 ? round(($grossProfit / $totalRevenue) * 100, 2) : 0,
            'operating_expenses' => $operatingExpenses,
            'net_income' => $netIncome,
            'payments_count' => (clone $paidPayments)->count(),
            'expense_count' => (clone $expenses)->count(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function balanceSheet(CarbonInterface $asOfDate): array
    {
        $startDate = Carbon::create(1970, 1, 1)->startOfDay();
        $profitAndLoss = $this->profitAndLoss($startDate, $asOfDate);
        $retainedEarnings = $profitAndLoss['net_income'];
        $cash = $retainedEarnings;

        $entries = BalanceSheetEntry::query()
            ->where('entry_date', '<=', $asOfDate->toDateString())
            ->orderBy('entry_date')
            ->orderBy('id')
            ->get();

        $assetEntries = $entries->where('side', 'asset')->values();
        $equityEntries = $entries->where('side', 'equity')->values();
        $liabilityEntries = $entries->where('side', 'liability')->values();

        $assetRows = collect([
            [
                'id' => 'cash',
                'label' => 'Cash from paid payments',
                'category' => 'cash',
                'amount' => $cash,
                'entry_date' => $asOfDate->toDateString(),
                'source' => 'calculated',
            ],
        ])->merge($this->entryRows($assetEntries));

        $equityRows = collect([
            [
                'id' => 'retained-earnings',
                'label' => 'Retained earnings',
                'category' => 'calculated',
                'amount' => $retainedEarnings,
                'entry_date' => $asOfDate->toDateString(),
                'source' => 'calculated',
            ],
        ])->merge($this->entryRows($equityEntries));

        $liabilityRows = $this->entryRows($liabilityEntries);

        $totalAssets = (int) $assetRows->sum('amount');
        $totalEquityLiabilities = (int) $equityRows->sum('amount') + (int) $liabilityRows->sum('amount');

        return [
            'as_of_date' => $asOfDate->toDateString(),
            'cash' => $cash,
            'retained_earnings' => $retainedEarnings,
            'manual_asset_total' => (int) $assetEntries->sum('amount'),
            'manual_equity_total' => (int) $equityEntries->sum('amount'),
            'manual_liability_total' => (int) $liabilityEntries->sum('amount'),
            'total_assets' => $totalAssets,
            'total_equity_liabilities' => $totalEquityLiabilities,
            'variance' => $totalAssets - $totalEquityLiabilities,
            'asset_rows' => $assetRows->values()->all(),
            'equity_rows' => $equityRows->values()->all(),
            'liability_rows' => $liabilityRows->values()->all(),
            'source_totals' => [
                'gross_revenue' => $profitAndLoss['gross_revenue'],
                'returns' => $profitAndLoss['returns'],
                'hpp' => $profitAndLoss['hpp'],
                'operating_expenses' => $profitAndLoss['operating_expenses'],
                'net_income' => $profitAndLoss['net_income'],
            ],
        ];
    }

    /**
     * @param  Collection<int, BalanceSheetEntry>  $entries
     * @return Collection<int, array<string, mixed>>
     */
    private function entryRows(Collection $entries): Collection
    {
        return $entries->map(fn (BalanceSheetEntry $entry) => [
            'id' => $entry->id,
            'label' => $entry->label,
            'category' => $entry->category,
            'amount' => $entry->amount,
            'entry_date' => $entry->entry_date?->toDateString(),
            'notes' => $entry->notes,
            'source' => 'manual',
        ]);
    }
}
