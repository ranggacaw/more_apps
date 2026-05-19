<?php

return [
    'asset_disk' => env('CLINIC_ASSET_DISK', env('FILESYSTEM_DISK', 'local')),

    'consultation_fee' => (int) env('CLINIC_CONSULTATION_FEE', 500000),

    'reminders' => [
        'day_before_at' => env('CLINIC_DAY_BEFORE_REMINDER_AT', '08:00'),
        'same_day_lead_minutes' => (int) env('CLINIC_SAME_DAY_REMINDER_LEAD_MINUTES', 180),
        'same_day_window_minutes' => (int) env('CLINIC_SAME_DAY_REMINDER_WINDOW_MINUTES', 10),
    ],
];
