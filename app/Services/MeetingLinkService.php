<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Str;

class MeetingLinkService
{
    public function createForBooking(Booking $booking): string
    {
        return match (config('services.meeting.provider', 'google_meet')) {
            'zoom' => rtrim((string) config('services.meeting.zoom_base_url', 'https://zoom.us'), '/').'/j/'.random_int(1000000000, 9999999999),
            default => rtrim((string) config('services.meeting.google_meet_base_url', 'https://meet.google.com'), '/').'/'.Str::lower(Str::random(3)).'-'.Str::lower(Str::random(4)).'-'.Str::lower(Str::random(3)),
        };
    }
}
