<?php

namespace App\Services;

use App\Models\Booking;
use Illuminate\Support\Str;

class MeetingLinkService
{
    public function ensureJoinableForBooking(Booking $booking): string
    {
        if (filled($booking->meeting_link) && ! $this->usesLegacyPlaceholderLink($booking->meeting_link)) {
            return $booking->meeting_link;
        }

        return $this->createForBooking($booking);
    }

    public function createForBooking(Booking $booking): string
    {
        return match (config('services.meeting.provider', 'jitsi')) {
            'jitsi' => $this->buildJitsiLink($booking),
            // URL-only Google Meet and Zoom placeholders are not joinable unless those providers create the room first.
            default => $this->buildJitsiLink($booking),
        };
    }

    private function buildJitsiLink(Booking $booking): string
    {
        return rtrim((string) config('services.meeting.jitsi_base_url', 'https://meet.jit.si'), '/')
            .'/'.Str::lower(sprintf('more-clinic-booking-%d-doctor-%d-patient-%d', $booking->id, $booking->doctor_id, $booking->user_id));
    }

    private function usesLegacyPlaceholderLink(?string $meetingLink): bool
    {
        if (blank($meetingLink)) {
            return true;
        }

        $normalizedLink = Str::lower(rtrim($meetingLink, '/'));
        $googleMeetPrefix = Str::lower(rtrim((string) config('services.meeting.google_meet_base_url', 'https://meet.google.com'), '/')).'/';
        $zoomPrefix = Str::lower(rtrim((string) config('services.meeting.zoom_base_url', 'https://zoom.us'), '/')).'/j/';

        return str_starts_with($normalizedLink, $googleMeetPrefix)
            || str_starts_with($normalizedLink, $zoomPrefix);
    }
}
