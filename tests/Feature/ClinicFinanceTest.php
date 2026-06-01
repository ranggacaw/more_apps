<?php

namespace Tests\Feature;

use App\Models\BalanceSheetEntry;
use App\Models\Doctor;
use App\Models\OperatingExpense;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ClinicFinanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_and_doctor_can_view_finance_reports_while_admins_and_patients_are_blocked(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        [$doctorUser] = $this->createDoctor();
        $admin = User::factory()->create(['role' => 'admin']);
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($superAdmin)
            ->get(route('finance.profit-loss.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Finance/ProfitLoss')
                ->where('canManageFinance', true)
                ->has('paymentAdjustments'));

        $this->actingAs($doctorUser)
            ->get(route('finance.balance-sheet.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Finance/BalanceSheet')
                ->where('canManageFinance', false)
                ->where('balanceSheetEntries', []));

        $this->actingAs($admin)
            ->get(route('finance.profit-loss.index'))
            ->assertForbidden();

        $this->actingAs($patient)
            ->get(route('finance.balance-sheet.index'))
            ->assertForbidden();

        $this->actingAs($doctorUser)
            ->post(route('finance.operating-expenses.store'), [
                'name' => 'Read-only attempt',
                'amount' => 100000,
                'expense_date' => '2026-05-10',
            ])
            ->assertForbidden();

        $payment = $this->createPayment($patient, 'doctor-read-only-payment', 500000, '2026-05-10 10:00:00');

        $this->actingAs($doctorUser)
            ->patch(route('finance.payment-adjustments.update', $payment), [
                'return_amount' => 50000,
                'hpp_amount' => 100000,
            ])
            ->assertForbidden();
    }

    public function test_super_admin_can_manage_paid_payment_return_and_hpp_values(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $patient = User::factory()->create(['role' => 'patient']);
        $payment = $this->createPayment($patient, 'finance-adjustment-payment', 1000000, '2026-05-10 10:00:00');

        $this->actingAs($superAdmin)
            ->get(route('finance.profit-loss.index', [
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-31',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Finance/ProfitLoss')
                ->where('paymentAdjustments.0.id', $payment->id)
                ->where('paymentAdjustments.0.return_amount', 0)
                ->where('paymentAdjustments.0.hpp_amount', 0));

        $this->actingAs($superAdmin)
            ->patch(route('finance.payment-adjustments.update', $payment), [
                'return_amount' => 150000,
                'hpp_amount' => 300000,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('payments', [
            'id' => $payment->id,
            'return_amount' => 150000,
            'hpp_amount' => 300000,
        ]);

        $this->actingAs($superAdmin)
            ->get(route('finance.profit-loss.index', [
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-31',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('report.returns', 150000)
                ->where('report.hpp', 300000)
                ->where('report.total_revenue', 850000)
                ->where('report.gross_profit', 550000));
    }

    public function test_super_admin_can_manage_operating_expenses_and_balance_sheet_entries(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();

        $this->actingAs($superAdmin)
            ->post(route('finance.operating-expenses.store'), [
                'name' => 'Clinic rent',
                'category' => 'Facilities',
                'amount' => 4000000,
                'expense_date' => '2026-05-05',
                'notes' => 'May rent.',
            ])
            ->assertRedirect();

        $expense = OperatingExpense::query()->firstOrFail();

        $this->assertDatabaseHas('operating_expenses', [
            'id' => $expense->id,
            'name' => 'Clinic rent',
            'amount' => 4000000,
        ]);

        $this->actingAs($superAdmin)
            ->patch(route('finance.operating-expenses.update', $expense), [
                'name' => 'Clinic rent revised',
                'category' => 'Facilities',
                'amount' => 4500000,
                'expense_date' => '2026-05-06',
                'notes' => 'Updated rent.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('operating_expenses', [
            'id' => $expense->id,
            'name' => 'Clinic rent revised',
            'amount' => 4500000,
        ]);

        $this->actingAs($superAdmin)
            ->delete(route('finance.operating-expenses.destroy', $expense))
            ->assertRedirect();

        $this->assertSoftDeleted('operating_expenses', ['id' => $expense->id]);

        $this->actingAs($superAdmin)
            ->post(route('finance.balance-sheet-entries.store'), [
                'side' => 'asset',
                'label' => 'Treatment device',
                'category' => 'Equipment',
                'amount' => 12000000,
                'entry_date' => '2026-05-07',
                'notes' => 'Manual asset input.',
            ])
            ->assertRedirect();

        $entry = BalanceSheetEntry::query()->firstOrFail();

        $this->actingAs($superAdmin)
            ->patch(route('finance.balance-sheet-entries.update', $entry), [
                'side' => 'liability',
                'label' => 'Supplier payable',
                'category' => 'Supplier',
                'amount' => 5000000,
                'entry_date' => '2026-05-08',
                'notes' => 'Reclassified.',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('balance_sheet_entries', [
            'id' => $entry->id,
            'side' => 'liability',
            'label' => 'Supplier payable',
            'amount' => 5000000,
        ]);

        $this->actingAs($superAdmin)
            ->delete(route('finance.balance-sheet-entries.destroy', $entry))
            ->assertRedirect();

        $this->assertSoftDeleted('balance_sheet_entries', ['id' => $entry->id]);
    }

    public function test_profit_and_loss_report_calculates_cash_basis_totals(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $patient = User::factory()->create(['role' => 'patient']);

        $this->createPayment($patient, 'pnl-paid-1', 1000000, '2026-05-10 10:00:00', [
            'return_amount' => 100000,
            'hpp_amount' => 200000,
        ]);
        $this->createPayment($patient, 'pnl-paid-2', 500000, '2026-05-20 10:00:00', [
            'hpp_amount' => 100000,
        ]);
        $this->createPayment($patient, 'pnl-pending', 900000, '2026-05-20 10:00:00', [
            'status' => 'pending',
        ]);
        $this->createPayment($patient, 'pnl-outside', 800000, '2026-06-05 10:00:00');

        OperatingExpense::create([
            'name' => 'Staff incentive',
            'amount' => 150000,
            'expense_date' => '2026-05-12',
        ]);
        OperatingExpense::create([
            'name' => 'Utilities',
            'amount' => 50000,
            'expense_date' => '2026-05-22',
        ]);
        OperatingExpense::create([
            'name' => 'Outside window',
            'amount' => 999000,
            'expense_date' => '2026-06-01',
        ]);

        $this->actingAs($superAdmin)
            ->get(route('finance.profit-loss.index', [
                'start_date' => '2026-05-01',
                'end_date' => '2026-05-31',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Finance/ProfitLoss')
                ->where('report.gross_revenue', 1500000)
                ->where('report.returns', 100000)
                ->where('report.total_revenue', 1400000)
                ->where('report.hpp', 300000)
                ->where('report.gross_profit', 1100000)
                ->where('report.gross_margin_percentage', 78.57)
                ->where('report.operating_expenses', 200000)
                ->where('report.net_income', 900000));
    }

    public function test_balance_sheet_report_calculates_manual_entries_retained_earnings_and_variance(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $patient = User::factory()->create(['role' => 'patient']);

        $this->createPayment($patient, 'bs-paid-1', 1000000, '2026-05-10 10:00:00', [
            'return_amount' => 100000,
            'hpp_amount' => 250000,
        ]);

        OperatingExpense::create([
            'name' => 'Payroll',
            'amount' => 150000,
            'expense_date' => '2026-05-15',
        ]);

        BalanceSheetEntry::create([
            'side' => 'asset',
            'label' => 'Treatment equipment',
            'category' => 'Equipment',
            'amount' => 300000,
            'entry_date' => '2026-05-12',
        ]);
        BalanceSheetEntry::create([
            'side' => 'equity',
            'label' => 'Initial capital',
            'category' => 'Owner capital',
            'amount' => 700000,
            'entry_date' => '2026-05-01',
        ]);
        BalanceSheetEntry::create([
            'side' => 'liability',
            'label' => 'Supplier payable',
            'category' => 'Supplier',
            'amount' => 200000,
            'entry_date' => '2026-05-20',
        ]);
        BalanceSheetEntry::create([
            'side' => 'asset',
            'label' => 'Future equipment',
            'category' => 'Equipment',
            'amount' => 999000,
            'entry_date' => '2026-06-01',
        ]);

        $this->actingAs($superAdmin)
            ->get(route('finance.balance-sheet.index', ['as_of_date' => '2026-05-31']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Finance/BalanceSheet')
                ->where('report.cash', 500000)
                ->where('report.retained_earnings', 500000)
                ->where('report.manual_asset_total', 300000)
                ->where('report.manual_equity_total', 700000)
                ->where('report.manual_liability_total', 200000)
                ->where('report.total_assets', 800000)
                ->where('report.total_equity_liabilities', 1400000)
                ->where('report.variance', -600000)
                ->where('report.asset_rows.1.label', 'Treatment equipment')
                ->where('report.equity_rows.1.label', 'Initial capital')
                ->where('report.liability_rows.0.label', 'Supplier payable'));
    }

    public function test_finance_request_validation_rejects_invalid_dates_negative_amounts_and_unsupported_sides(): void
    {
        $superAdmin = User::factory()->superAdmin()->create();
        $patient = User::factory()->create(['role' => 'patient']);

        $this->actingAs($superAdmin)
            ->get(route('finance.profit-loss.index', [
                'start_date' => '2026-05-31',
                'end_date' => '2026-05-01',
            ]))
            ->assertSessionHasErrors('end_date');

        $this->actingAs($superAdmin)
            ->post(route('finance.operating-expenses.store'), [
                'name' => 'Invalid expense',
                'amount' => -1,
                'expense_date' => '2026-05-10',
            ])
            ->assertSessionHasErrors('amount');

        $this->actingAs($superAdmin)
            ->post(route('finance.balance-sheet-entries.store'), [
                'side' => 'inventory',
                'label' => 'Invalid side',
                'amount' => 100000,
                'entry_date' => '2026-05-10',
            ])
            ->assertSessionHasErrors('side');

        $payment = $this->createPayment($patient, 'invalid-finance-adjustment-payment', 500000, '2026-05-10 10:00:00');

        $this->actingAs($superAdmin)
            ->patch(route('finance.payment-adjustments.update', $payment), [
                'return_amount' => 500001,
                'hpp_amount' => -1,
            ])
            ->assertSessionHasErrors(['return_amount', 'hpp_amount']);

        $this->actingAs($patient)
            ->post(route('finance.balance-sheet-entries.store'), [
                'side' => 'asset',
                'label' => 'Unauthorized',
                'amount' => 100000,
                'entry_date' => '2026-05-10',
            ])
            ->assertForbidden();
    }

    /**
     * @return array{0: User, 1: Doctor}
     */
    private function createDoctor(): array
    {
        $doctorUser = User::factory()->create(['role' => 'doctor']);
        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialization' => 'Aesthetic Medicine',
            'consultation_fee' => 500000,
            'is_active' => true,
        ]);

        return [$doctorUser, $doctor];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createPayment(User $patient, string $orderId, int $amount, string $paidAt, array $overrides = []): Payment
    {
        return Payment::create(array_merge([
            'user_id' => $patient->id,
            'booking_id' => null,
            'attempt_number' => 1,
            'type' => 'consultation',
            'amount' => $amount,
            'return_amount' => 0,
            'hpp_amount' => 0,
            'consultation_credit_applied' => 0,
            'provider' => 'midtrans',
            'midtrans_order_id' => $orderId,
            'status' => 'paid',
            'paid_at' => Carbon::parse($paidAt),
        ], $overrides));
    }
}
