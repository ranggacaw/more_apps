<?php

namespace App\Http\Controllers;

use App\Models\OperatingExpense;
use App\Models\Payment;
use App\Services\FinanceReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FinanceProfitLossController extends Controller
{
    public function __invoke(Request $request, FinanceReportService $reports): Response
    {
        $validated = $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date'],
        ]);

        $startDate = isset($validated['start_date'])
            ? Carbon::parse($validated['start_date'])->startOfDay()
            : now()->startOfMonth();
        $endDate = isset($validated['end_date'])
            ? Carbon::parse($validated['end_date'])->endOfDay()
            : now()->endOfDay();

        if ($endDate->lt($startDate)) {
            throw ValidationException::withMessages([
                'end_date' => 'The end date must be on or after the start date.',
            ]);
        }

        $canManage = $request->user()->role === 'super_admin';

        return Inertia::render('Finance/ProfitLoss', [
            'filters' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'report' => $reports->profitAndLoss($startDate, $endDate),
            'paymentAdjustments' => $canManage ? $this->paymentAdjustments($startDate, $endDate) : [],
            'pendingInternalPayments' => $this->pendingInternalPayments(),
            'operatingExpenses' => $canManage ? $this->operatingExpenses($startDate, $endDate) : [],
            'canManageFinance' => $canManage,
            'doctor' => $this->doctorPayload($request),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function paymentAdjustments(Carbon $startDate, Carbon $endDate): array
    {
        return Payment::query()
            ->with('user:id,name')
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$startDate, $endDate])
            ->latest('paid_at')
            ->latest('id')
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'patient_name' => $payment->user?->name ?? 'Unknown patient',
                'type' => $payment->type,
                'order_id' => $payment->midtrans_order_id,
                'amount' => $payment->amount,
                'return_amount' => $payment->return_amount,
                'hpp_amount' => $payment->hpp_amount,
                'paid_at' => $payment->paid_at?->toDateTimeString(),
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function pendingInternalPayments(): array
    {
        return Payment::query()
            ->with(['user:id,name', 'booking.patient:id,name', 'queueEntry:id,patient_name,queue_number', 'consultation.lineItems'])
            ->where('type', 'consultation_treatment')
            ->where('provider', 'internal')
            ->where('status', 'pending')
            ->latest('id')
            ->limit(25)
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'patient_name' => $payment->user?->name ?? $payment->booking?->patientDisplayName() ?? $payment->queueEntry?->patient_name ?? 'Guest patient',
                'order_id' => $payment->midtrans_order_id,
                'amount' => $payment->amount,
                'hpp_amount' => $payment->hpp_amount,
                'booking_id' => $payment->booking_id,
                'queue_entry_id' => $payment->queue_entry_id,
                'consultation_id' => $payment->consultation_id,
                'created_at' => $payment->created_at?->toDateTimeString(),
                'line_items' => $payment->consultation?->lineItems?->map(fn ($item) => [
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'line_total' => $item->line_total,
                    'hpp_amount' => $item->hpp_amount,
                ])->values()->all() ?? [],
            ])
            ->all();
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function operatingExpenses(Carbon $startDate, Carbon $endDate): array
    {
        return OperatingExpense::query()
            ->whereBetween('expense_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->latest('expense_date')
            ->latest('id')
            ->get()
            ->map(fn (OperatingExpense $expense) => [
                'id' => $expense->id,
                'name' => $expense->name,
                'category' => $expense->category,
                'amount' => $expense->amount,
                'expense_date' => $expense->expense_date?->toDateString(),
                'notes' => $expense->notes,
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
