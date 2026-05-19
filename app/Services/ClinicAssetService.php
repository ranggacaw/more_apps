<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\CheckIn;
use App\Models\Consultation;
use App\Models\EducationalContent;
use DateTimeInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class ClinicAssetService
{
    public function assetDisk(): string
    {
        return (string) config('clinic.asset_disk', config('filesystems.default'));
    }

    public function storePatientUpload(Booking $booking, UploadedFile $file): string
    {
        return $file->store('clinic/patient-uploads/booking-'.$booking->id, [
            'disk' => $this->assetDisk(),
        ]);
    }

    public function storeCheckInDocument(CheckIn $checkIn, UploadedFile $file): string
    {
        return $file->store('clinic/check-ins/check-in-'.$checkIn->id, [
            'disk' => $this->assetDisk(),
        ]);
    }

    public function storeProgressPhoto(CheckIn $checkIn, UploadedFile $file): string
    {
        return $file->store('clinic/check-ins/check-in-'.$checkIn->id.'/progress-photos', [
            'disk' => $this->assetDisk(),
        ]);
    }

    public function storeMealPlanPdf(Consultation $consultation, string $summary): string
    {
        $path = 'clinic/meal-plans/consultation-'.$consultation->id.'-'.Str::uuid().'.pdf';

        Storage::disk($this->assetDisk())->put(
            $path,
            $this->renderPdf('MORE Clinic Meal Plan', $summary),
        );

        return $path;
    }

    public function storeEducationalContentAsset(EducationalContent $content, UploadedFile $file): string
    {
        return $file->store('clinic/content/content-'.$content->id, [
            'disk' => $this->assetDisk(),
        ]);
    }

    public function temporaryUrl(string $path, DateTimeInterface $expiresAt): ?string
    {
        try {
            return Storage::disk($this->assetDisk())->temporaryUrl($path, $expiresAt);
        } catch (Throwable) {
            return null;
        }
    }

    private function renderPdf(string $title, string $summary): string
    {
        $lines = array_values(array_filter(array_map(
            static fn (string $line) => trim($line),
            preg_split('/\r\n|\r|\n/', trim($title."\n".$summary)) ?: [],
        )));

        $streamLines = [
            'BT',
            '/F1 14 Tf',
            '50 780 Td',
        ];

        foreach ($lines as $index => $line) {
            if ($index > 0) {
                $streamLines[] = '0 -18 Td';
            }

            $streamLines[] = '('.$this->escapePdfText($line).') Tj';
        }

        $streamLines[] = 'ET';

        $stream = implode("\n", $streamLines);

        $objects = [
            "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
            "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
            "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
            "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
            "5 0 obj\n<< /Length ".strlen($stream)." >>\nstream\n{$stream}\nendstream\nendobj\n",
        ];

        $pdf = "%PDF-1.4\n";
        $offsets = [0];

        foreach ($objects as $object) {
            $offsets[] = strlen($pdf);
            $pdf .= $object;
        }

        $xrefOffset = strlen($pdf);

        $pdf .= 'xref' . "\n";
        $pdf .= '0 '.(count($objects) + 1)."\n";
        $pdf .= "0000000000 65535 f \n";

        foreach (range(1, count($objects)) as $index) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$index]);
        }

        $pdf .= 'trailer' . "\n";
        $pdf .= '<< /Size '.(count($objects) + 1).' /Root 1 0 R >>' . "\n";
        $pdf .= 'startxref' . "\n";
        $pdf .= $xrefOffset."\n%%EOF";

        return $pdf;
    }

    private function escapePdfText(string $value): string
    {
        return str_replace(
            ['\\', '(', ')'],
            ['\\\\', '\\(', '\\)'],
            $value,
        );
    }
}
