<?php

return [
    'asset_disk' => env('CLINIC_ASSET_DISK', env('FILESYSTEM_DISK', 'local')),

    'consultation_fee' => (int) env('CLINIC_CONSULTATION_FEE', 500000),

    'consultation_credit_expires_days' => (int) env('CLINIC_CONSULTATION_CREDIT_EXPIRES_DAYS', 30),

    'reminders' => [
        'day_before_at' => env('CLINIC_DAY_BEFORE_REMINDER_AT', '08:00'),
        'same_day_lead_minutes' => (int) env('CLINIC_SAME_DAY_REMINDER_LEAD_MINUTES', 180),
        'same_day_window_minutes' => (int) env('CLINIC_SAME_DAY_REMINDER_WINDOW_MINUTES', 10),
        'weekly_check_in_at' => env('CLINIC_WEEKLY_CHECK_IN_REMINDER_AT', '09:00'),
    ],
];
