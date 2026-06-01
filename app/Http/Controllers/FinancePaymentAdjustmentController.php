<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class FinancePaymentAdjustmentController extends Controller
{
    public function update(Request $request, Payment $payment): RedirectResponse
    {
        abort_unless($payment->status === 'paid', 404);

        $validated = $request->validate([
            'return_amount' => ['required', 'integer', 'min:0', 'max:'.$payment->amount],
            'hpp_amount' => ['required', 'integer', 'min:0'],
        ]);

        $payment->update($validated);

        return back()->with('success', 'Payment finance values updated.');
    }
}
