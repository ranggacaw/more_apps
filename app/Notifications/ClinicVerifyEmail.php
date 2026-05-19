<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class ClinicVerifyEmail extends VerifyEmail implements ShouldQueue
{
    use Queueable;

    public $afterCommit = true;

    public $tries = 3;
}
