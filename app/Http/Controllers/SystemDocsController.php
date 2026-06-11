<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SystemDocsController extends Controller
{
    private const MODULES = [
        'system-architecture' => 'System Architecture',
        'admin-operations' => 'Admin Operations',
        'doctor-clinical' => 'Doctor Clinical',
        'payments-finance' => 'Payments & Finance',
        'notifications-reminders' => 'Notifications & Reminders',
    ];

    public function index(Request $request): Response
    {
        return Inertia::render('SystemDocs', [
            'role' => $request->user()->role,
            'doctor' => $this->doctorProps($request),
        ]);
    }

    public function show(Request $request, string $module): Response|RedirectResponse
    {
        if (!isset(self::MODULES[$module])) {
            return redirect()->route('system-docs');
        }

        return Inertia::render('SystemDocsShow', [
            'role' => $request->user()->role,
            'doctor' => $this->doctorProps($request),
            'module' => $module,
            'moduleTitle' => self::MODULES[$module],
            'modules' => self::MODULES,
        ]);
    }

    private function doctorProps(Request $request): ?array
    {
        if ($request->user()->role !== 'doctor') {
            return null;
        }

        $profile = $request->user()->doctorProfile()->first();

        return [
            'name' => $request->user()->name,
            'specialization' => $profile?->specialization ?: 'Practitioner',
        ];
    }
}
