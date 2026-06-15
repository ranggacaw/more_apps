<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePatientPasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->role === 'patient' && $user->must_change_password) {
            return redirect()->route('patient.password.edit');
        }

        return $next($request);
    }
}
