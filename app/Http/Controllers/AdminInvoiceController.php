<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Services\PackageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminInvoiceController extends Controller
{
    public function index(): Response
    {
        $invoices = Payment::query()
            ->with(['user:id,name,phone,email', 'booking.patient:id,name,phone,email', 'package:id,name,price,consultation_credits', 'consultation:id,booking_id'])
            ->where('type', 'package')
            ->where('provider', 'internal')
            ->where('status', 'pending')
            ->latest('id')
            ->get()
            ->map(fn (Payment $payment) => [
                'id' => $payment->id,
                'order_id' => $payment->midtrans_order_id,
                'patient_name' => $payment->user?->name ?? $payment->booking?->patientDisplayName() ?? 'Guest patient',
                'patient_phone' => $payment->user?->phone ?? $payment->booking?->patientContactPhone(),
                'booking_id' => $payment->booking_id,
                'consultation_id' => $payment->consultation_id,
                'amount' => $payment->amount,
                'created_at' => $payment->created_at?->toDateTimeString(),
                'can_finalize' => $payment->user_id !== null && $payment->package_id !== null,
                'package' => $payment->package ? [
                    'name' => $payment->package->name,
                    'price' => $payment->package->price,
                    'consultation_credits' => $payment->package->consultation_credits,
                ] : null,
            ])
            ->values();

        return Inertia::render('Admin/Invoices', [
            'invoices' => $invoices,
        ]);
    }

    public function finalize(Request $request, Payment $payment, PackageService $packageService): RedirectResponse
    {
        abort_unless($payment->type === 'package' && $payment->provider === 'internal', 404);

        DB::transaction(function () use ($request, $payment, $packageService): void {
            $lockedPayment = Payment::query()
                ->with(['user', 'package', 'consultation'])
                ->lockForUpdate()
                ->findOrFail($payment->id);

            abort_unless($lockedPayment->status === 'pending', 422, 'This invoice has already been processed.');
            abort_unless($lockedPayment->user && $lockedPayment->package, 422, 'A registered patient and package are required before finalizing this invoice.');

            $lockedPayment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payload' => array_merge($lockedPayment->payload ?? [], [
                    'finalized_by_user_id' => $request->user()->id,
                    'finalized_at' => now()->toIso8601String(),
                ]),
            ]);

            $userPackage = $packageService->activatePackage($lockedPayment->user, $lockedPayment->package, $lockedPayment, [
                'source' => 'admin_internal_package_invoice',
                'booking_id' => $lockedPayment->booking_id,
                'consultation_id' => $lockedPayment->consultation_id,
            ]);

            $lockedPayment->consultation?->update(['user_package_id' => $userPackage->id]);
        });

        return back()->with('success', 'Package invoice finalized and consultation credits activated.');
    }

    public function finalizeTreatmentPayment(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($payment->type === 'consultation_treatment' && $payment->provider === 'internal', 404);

        DB::transaction(function () use ($request, $payment): void {
            $lockedPayment = Payment::query()
                ->lockForUpdate()
                ->findOrFail($payment->id);

            abort_unless($lockedPayment->type === 'consultation_treatment' && $lockedPayment->provider === 'internal', 404);
            abort_unless($lockedPayment->status === 'pending', 422, 'This treatment payment is not eligible for finalization.');

            $lockedPayment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payload' => array_merge($lockedPayment->payload ?? [], [
                    'finalized_by_user_id' => $request->user()->id,
                    'finalized_at' => now()->toIso8601String(),
                ]),
            ]);
        });

        return back()->with('success', 'Treatment payment marked as paid.');
    }
}
