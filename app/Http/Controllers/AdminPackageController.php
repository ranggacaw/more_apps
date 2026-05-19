<?php

namespace App\Http\Controllers;

use App\Models\Package;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminPackageController extends Controller
{
    public function index(): Response
    {
        $packages = Package::query()
            ->withCount([
                'payments as paid_payments_count' => fn ($query) => $query->where('status', 'paid'),
                'userPackages as total_entitlements_count',
                'userPackages as active_entitlements_count' => fn ($query) => $query->where('status', 'active'),
            ])
            ->orderByDesc('is_active')
            ->orderBy('price')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Packages', [
            'packages' => $packages->map(fn (Package $package) => [
                'id' => $package->id,
                'name' => $package->name,
                'slug' => $package->slug,
                'description' => $package->description,
                'price' => $package->price,
                'duration_days' => $package->duration_days,
                'type' => $package->type,
                'consultation_credits' => $package->consultation_credits,
                'is_active' => $package->is_active,
                'paid_payments_count' => $package->paid_payments_count,
                'total_entitlements_count' => $package->total_entitlements_count,
                'active_entitlements_count' => $package->active_entitlements_count,
            ])->values(),
            'packageTypes' => ['basic', 'advance', 'vip'],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatePackage($request);

        Package::create([
            ...$data,
            'slug' => $this->uniqueSlug($data['name']),
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Package created.');
    }

    public function update(Request $request, Package $package): RedirectResponse
    {
        $data = $this->validatePackage($request, $package);

        $package->update([
            ...$data,
            'slug' => $this->uniqueSlug($data['name'], $package),
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Package updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validatePackage(Request $request, ?Package $package = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:3000'],
            'price' => ['required', 'integer', 'min:0'],
            'duration_days' => ['required', 'integer', 'min:1', 'max:365'],
            'type' => ['required', Rule::in(['basic', 'advance', 'vip'])],
            'consultation_credits' => ['required', 'integer', 'min:1', 'max:52'],
            'is_active' => ['nullable', 'boolean'],
        ]);
    }

    private function uniqueSlug(string $name, ?Package $ignore = null): string
    {
        $base = Str::slug($name) ?: 'package';
        $slug = $base;
        $suffix = 2;

        while (Package::query()
            ->when($ignore, fn ($query) => $query->where('id', '!=', $ignore->id))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
