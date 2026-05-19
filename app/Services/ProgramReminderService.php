<?php

namespace App\Services;

use App\Jobs\SendUserPackageNotificationJob;
use App\Models\UserPackage;

class ProgramReminderService
{
    public function queueWeeklyCheckInReminders(): int
    {
        $packages = UserPackage::query()
            ->active()
            ->whereNotNull('activated_at')
            ->where(function ($query): void {
                $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->with(['package', 'progressCheckIns'])
            ->get();

        $queued = 0;

        foreach ($packages as $userPackage) {
            $currentWeek = $userPackage->currentProgramWeek();
            $metadata = $userPackage->metadata ?? [];
            $remindedWeeks = $metadata['weekly_reminder_weeks'] ?? [];

            if (in_array($currentWeek, $remindedWeeks, true)) {
                continue;
            }

            if ($userPackage->progressCheckIns->contains('program_week', $currentWeek)) {
                continue;
            }

            SendUserPackageNotificationJob::dispatch($userPackage, 'weekly-check-in-reminder');

            $metadata['weekly_reminder_weeks'] = array_values(array_unique([...$remindedWeeks, $currentWeek]));
            $userPackage->update(['metadata' => $metadata]);

            $queued++;
        }

        return $queued;
    }
}
