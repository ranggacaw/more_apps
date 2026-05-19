<?php

namespace App\Http\Controllers;

use App\Models\EducationalContent;
use App\Services\ClinicAssetService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AdminContentController extends Controller
{
    public function index(ClinicAssetService $clinicAssetService): Response
    {
        $contents = EducationalContent::query()
            ->with(['createdBy', 'updatedBy'])
            ->latest('updated_at')
            ->get();

        return Inertia::render('Admin/Content', [
            'contents' => $contents->map(fn (EducationalContent $content) => [
                'id' => $content->id,
                'title' => $content->title,
                'slug' => $content->slug,
                'excerpt' => $content->excerpt,
                'body' => $content->body,
                'status' => $content->status,
                'published_at' => $content->published_at?->toIso8601String(),
                'asset' => $content->asset_path ? [
                    'name' => basename($content->asset_path),
                    'url' => $clinicAssetService->temporaryUrl($content->asset_path, now()->addMinutes(30)),
                ] : null,
                'created_by' => $content->createdBy?->name,
                'updated_by' => $content->updatedBy?->name,
                'updated_at' => $content->updated_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    public function store(Request $request, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        $data = $this->validateContent($request);

        unset($data['asset']);

        $content = EducationalContent::create([
            ...$data,
            'slug' => $this->uniqueSlug($data['title']),
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published' ? now() : null,
            'created_by_user_id' => $request->user()->id,
            'updated_by_user_id' => $request->user()->id,
        ]);

        if ($request->hasFile('asset')) {
            $content->update([
                'asset_path' => $clinicAssetService->storeEducationalContentAsset($content, $request->file('asset')),
            ]);
        }

        return back()->with('success', 'Content saved.');
    }

    public function update(Request $request, EducationalContent $content, ClinicAssetService $clinicAssetService): RedirectResponse
    {
        $data = $this->validateContent($request, $content);

        unset($data['asset']);

        $content->update([
            ...$data,
            'slug' => $this->uniqueSlug($data['title'], $content),
            'status' => $data['status'],
            'published_at' => $data['status'] === 'published'
                ? ($content->published_at ?? now())
                : null,
            'updated_by_user_id' => $request->user()->id,
        ]);

        if ($request->hasFile('asset')) {
            $content->update([
                'asset_path' => $clinicAssetService->storeEducationalContentAsset($content, $request->file('asset')),
            ]);
        }

        return back()->with('success', 'Content updated.');
    }

    /**
     * @return array<string, mixed>
     */
    private function validateContent(Request $request, ?EducationalContent $content = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:150'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body' => ['required', 'string', 'max:20000'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'asset' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);
    }

    private function uniqueSlug(string $title, ?EducationalContent $ignore = null): string
    {
        $base = Str::slug($title) ?: 'content';
        $slug = $base;
        $suffix = 2;

        while (EducationalContent::query()
            ->when($ignore, fn ($query) => $query->where('id', '!=', $ignore->id))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
