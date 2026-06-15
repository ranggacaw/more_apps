<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ClinicAssetService;
use App\Services\PatientAccountService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AdminUserController extends Controller
{
    public function index(Request $request, ClinicAssetService $clinicAssetService): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'role' => ['nullable', Rule::in(['doctor', 'admin', 'super_admin', 'patient'])],
            'verification_state' => ['nullable', Rule::in(['verified', 'unverified'])],
            'sort_by' => ['nullable', Rule::in(['name', 'email', 'phone', 'role', 'email_verified_at', 'bookings_count', 'payments_count', 'active_packages_count'])],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $sortBy = $filters['sort_by'] ?? null;
        $sortDir = $filters['sort_dir'] ?? 'desc';

        $query = User::query()
            ->with('doctorProfile')
            ->withCount([
                'bookings',
                'payments',
                'userPackages as active_packages_count' => fn ($query) => $query->where('status', 'active'),
            ])
            ->when($filters['search'] ?? null, function ($query, $search): void {
                $query->where(function ($nestedQuery) use ($search): void {
                    $nestedQuery
                        ->where('name', 'like', '%'.$search.'%')
                        ->orWhere('email', 'like', '%'.$search.'%')
                        ->orWhere('phone', 'like', '%'.$search.'%');
                });
            })
            ->when($filters['role'] ?? null, fn ($query, $role) => $query->where('role', $role))
            ->when(($filters['verification_state'] ?? null) === 'verified', fn ($query) => $query->whereNotNull('email_verified_at'))
            ->when(($filters['verification_state'] ?? null) === 'unverified', fn ($query) => $query->whereNull('email_verified_at'));

        if ($sortBy) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->latest();
        }

        $paginated = $query->paginate(15);

        return Inertia::render('Admin/Users', [
            'filters' => [
                'search' => $filters['search'] ?? '',
                'role' => $filters['role'] ?? '',
                'verification_state' => $filters['verification_state'] ?? '',
            ],
            'users' => $paginated->getCollection()->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'is_verified' => $user->email_verified_at !== null,
                'date_of_birth' => $user->date_of_birth?->toDateString(),
                'address' => $user->address,
                'medical_notes' => $user->medical_notes,
                'bookings_count' => $user->bookings_count,
                'payments_count' => $user->payments_count,
                'active_packages_count' => $user->active_packages_count,
                'doctor_profile' => $user->doctorProfile ? [
                    'specialization' => $user->doctorProfile->specialization,
                    'bio' => $user->doctorProfile->bio,
                    'avatar_url' => $clinicAssetService->temporaryAssetUrl($user->doctorProfile->avatar_url, now()->addMinutes(30)),
                    'consultation_fee' => $user->doctorProfile->consultation_fee,
                    'is_active' => $user->doctorProfile->is_active,
                ] : null,
            ])->values(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'sortBy' => $sortBy,
            'sortDir' => $sortDir,
            'roles' => ['doctor', 'admin', 'super_admin', 'patient'],
            'defaultConsultationFee' => (int) config('clinic.consultation_fee', 500000),
        ]);
    }

    public function store(Request $request, PatientAccountService $patientAccountService): RedirectResponse
    {
        $data = $this->validateUser($request);

        DB::transaction(function () use ($request, $data, $patientAccountService): void {
            if ($data['role'] === 'patient') {
                $patientAccountService->provision($data);

                return;
            }

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'password' => $data['password'],
                'role' => $data['role'],
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'address' => $data['address'] ?? null,
                'medical_notes' => $data['medical_notes'] ?? null,
                'email_verified_at' => $request->boolean('is_verified') ? now() : null,
            ]);

            $this->syncDoctorProfile($user, $request, $data['role']);
        });

        return back()->with('success', 'User account created.');
    }

    public function update(Request $request, User $user, PatientAccountService $patientAccountService): RedirectResponse
    {
        $data = $this->validateUser($request, $user);

        DB::transaction(function () use ($request, $user, $data, $patientAccountService): void {
            if ($data['role'] === 'patient') {
                $data['phone'] = $patientAccountService->normalizePhone($data['phone']);
                $data['email'] = filled($data['email'] ?? null) ? $data['email'] : $patientAccountService->emailForPhone($data['phone']);
            }

            $payload = [
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'role' => $data['role'],
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'address' => $data['address'] ?? null,
                'medical_notes' => $data['medical_notes'] ?? null,
                'email_verified_at' => $request->boolean('is_verified') ? now() : null,
            ];

            if (! empty($data['password'])) {
                $payload['password'] = $data['password'];
            }

            $user->update($payload);

            $this->syncDoctorProfile($user, $request, $data['role']);
        });

        return back()->with('success', 'User account updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateUser(Request $request, ?User $user = null): array
    {
        $passwordRules = $user || $request->input('role') === 'patient'
            ? ['nullable', 'confirmed', Password::defaults()]
            : ['required', 'confirmed', Password::defaults()];
        $patientAccountService = app(PatientAccountService::class);
        $phoneRules = ['required', 'string', 'max:30'];

        if ($request->input('role') !== 'patient') {
            $phoneRules[] = Rule::unique('users', 'phone')->ignore($user?->id);
        } elseif ($user) {
            $phoneRules[] = function (string $attribute, mixed $value, \Closure $fail) use ($user, $patientAccountService): void {
                $normalizedPhone = $patientAccountService->normalizePhone((string) $value);

                if (! $normalizedPhone) {
                    $fail('The phone field must contain a usable patient phone number.');

                    return;
                }

                $exists = User::query()
                    ->where('phone', $normalizedPhone)
                    ->whereKeyNot($user->id)
                    ->exists();

                if ($exists) {
                    $fail('The phone number is already linked to another patient account.');
                }
            };
        }

        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => [Rule::requiredIf($request->input('role') !== 'patient'), 'nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'phone' => $phoneRules,
            'password' => $passwordRules,
            'role' => ['required', Rule::in(['doctor', 'admin', 'super_admin', 'patient'])],
            'is_verified' => ['nullable', 'boolean'],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:1000'],
            'medical_notes' => ['nullable', 'string', 'max:2000'],
            'specialization' => [Rule::requiredIf($request->input('role') === 'doctor'), 'nullable', 'string', 'max:120'],
            'bio' => ['nullable', 'string', 'max:2000'],
            'avatar_url' => ['nullable', 'url', 'max:500'],
            'consultation_fee' => [Rule::requiredIf($request->input('role') === 'doctor'), 'nullable', 'integer', 'min:0'],
            'doctor_is_active' => ['nullable', 'boolean'],
        ]);
    }

    private function syncDoctorProfile(User $user, Request $request, string $role): void
    {
        if ($role !== 'doctor') {
            $user->doctorProfile?->update(['is_active' => false]);

            return;
        }

        $doctorProfile = $user->doctorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'specialization' => (string) $request->input('specialization'),
                'bio' => $request->input('bio'),
                'avatar_url' => $request->input('avatar_url'),
                'consultation_fee' => (int) $request->input('consultation_fee', config('clinic.consultation_fee', 500000)),
                'is_active' => $request->boolean('doctor_is_active', true),
            ],
        );
    }
}
