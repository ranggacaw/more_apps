<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\UserPackage;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class AdminReportController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
        ]);

        $from = isset($validated['from'])
            ? Carbon::parse($validated['from'])->startOfDay()
            : now()->subDays(29)->startOfDay();
        $to = isset($validated['to'])
            ? Carbon::parse($validated['to'])->endOfDay()
            : now()->endOfDay();

        $paidPayments = Payment::query()
            ->where('status', 'paid')
            ->whereBetween('paid_at', [$from, $to]);

        $consultationPayments = (clone $paidPayments)->where('type', 'consultation');
        $packagePayments = (clone $paidPayments)->where('type', 'package');

        return Inertia::render('Admin/Reports', [
            'filters' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'revenue' => [
                'consultation_total' => (clone $consultationPayments)->sum('amount'),
                'consultation_count' => (clone $consultationPayments)->count(),
                'package_total' => (clone $packagePayments)->sum('amount'),
                'package_count' => (clone $packagePayments)->count(),
                'overall_total' => (clone $paidPayments)->sum('amount'),
            ],
            'conversion' => [
                'registered_users' => User::query()->whereBetween('created_at', [$from, $to])->count(),
                'verified_patients' => User::query()
                    ->whereIn('role', ['doctor', 'admin', 'super_admin'])
                    ->whereNotNull('email_verified_at')
                    ->whereBetween('created_at', [$from, $to])
                    ->count(),
                'consultation_bookings' => Booking::query()->whereBetween('created_at', [$from, $to])->count(),
                'paid_consultations' => Payment::query()
                    ->where('status', 'paid')
                    ->where('type', 'consultation')
                    ->whereBetween('paid_at', [$from, $to])
                    ->count(),
                'package_purchases' => UserPackage::query()->whereBetween('created_at', [$from, $to])->count(),
            ],
        ]);
    }
}
