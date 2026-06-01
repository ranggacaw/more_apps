<?php

namespace App\Http\Controllers;

use App\Models\AestheticProgram;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminAestheticProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'sort_by' => ['nullable', Rule::in(['name', 'price', 'hpp_amount', 'is_active', 'updated_at'])],
            'sort_dir' => ['nullable', Rule::in(['asc', 'desc'])],
        ]);

        $sortBy = $filters['sort_by'] ?? null;
        $sortDir = $filters['sort_dir'] ?? 'asc';

        $query = AestheticProgram::query();

        if ($sortBy) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('name');
        }

        $paginated = $query->paginate(15);

        return Inertia::render('Admin/AestheticPrograms', [
            'programs' => $paginated->getCollection()->map(fn (AestheticProgram $program) => [
                'id' => $program->id,
                'name' => $program->name,
                'price' => $program->price,
                'hpp_amount' => $program->hpp_amount,
                'gross_margin' => $program->price - $program->hpp_amount,
                'is_active' => $program->is_active,
                'updated_at' => $program->updated_at?->toIso8601String(),
            ])->values(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
            'sortBy' => $sortBy,
            'sortDir' => $sortDir,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        AestheticProgram::create($this->validateProgram($request));

        return back()->with('success', 'Aesthetic program saved.');
    }

    public function update(Request $request, AestheticProgram $aestheticProgram): RedirectResponse
    {
        $aestheticProgram->update($this->validateProgram($request));

        return back()->with('success', 'Aesthetic program updated.');
    }

    public function destroy(AestheticProgram $aestheticProgram): RedirectResponse
    {
        if ($aestheticProgram->lineItems()->exists()) {
            $aestheticProgram->update(['is_active' => false]);

            return back()->with('success', 'Aesthetic program is in use and was deactivated.');
        }

        $aestheticProgram->delete();

        return back()->with('success', 'Aesthetic program deleted.');
    }

    private function validateProgram(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'price' => ['required', 'integer', 'min:0'],
            'hpp_amount' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],
        ]);
    }
}
