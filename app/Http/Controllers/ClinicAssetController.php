<?php

namespace App\Http\Controllers;

use App\Services\ClinicAssetService;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ClinicAssetController extends Controller
{
    public function show(string $path, ClinicAssetService $clinicAssetService): StreamedResponse
    {
        $disk = $clinicAssetService->assetDisk();

        abort_unless(Storage::disk($disk)->exists($path), 404);

        return Storage::disk($disk)->response($path);
    }
}
