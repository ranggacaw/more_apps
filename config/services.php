<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'clinic_email' => [
        'provider' => env('CLINIC_EMAIL_PROVIDER', 'laravel_mail'),
    ],

    'whatsapp' => [
        'provider' => env('WHATSAPP_PROVIDER', 'log'),
    ],

    'fonnte' => [
        'token' => env('FONNTE_TOKEN'),
        'url' => env('FONNTE_URL', 'https://api.fonnte.com/send'),
    ],

    'wablas' => [
        'token' => env('WABLAS_TOKEN'),
        'url' => env('WABLAS_URL', 'https://www.wablas.com/api/send-message'),
    ],

    'meeting' => [
        'provider' => env('MEETING_PROVIDER', 'jitsi'),
        'google_meet_base_url' => env('GOOGLE_MEET_BASE_URL', 'https://meet.google.com'),
        'jitsi_base_url' => env('JITSI_MEETING_BASE_URL', 'https://meet.jit.si'),
        'zoom_base_url' => env('ZOOM_MEETING_BASE_URL', 'https://zoom.us'),
    ],

];
