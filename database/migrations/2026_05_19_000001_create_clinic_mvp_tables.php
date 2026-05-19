<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('specialization');
            $table->text('bio')->nullable();
            $table->string('avatar_url')->nullable();
            $table->unsignedInteger('consultation_fee')->default(500000);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('doctor_availabilities', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedInteger('slot_duration_minutes')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('time_slots', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('availability_id')->nullable()->constrained('doctor_availabilities')->nullOnDelete();
            $table->dateTime('start_time');
            $table->dateTime('end_time');
            $table->string('status')->default('available');
            $table->timestamp('locked_until')->nullable();
            $table->foreignId('locked_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['doctor_id', 'start_time']);
        });

        Schema::create('bookings', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('slot_id')->constrained('time_slots')->cascadeOnDelete();
            $table->string('status')->default('pending');
            $table->text('notes')->nullable();
            $table->string('meeting_link')->nullable();
            $table->timestamp('day_before_reminder_sent_at')->nullable();
            $table->timestamp('same_day_reminder_sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('amount');
            $table->string('provider')->default('midtrans');
            $table->string('midtrans_order_id')->unique();
            $table->string('snap_token')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('paid_at')->nullable();
            $table->json('payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('bookings');
        Schema::dropIfExists('time_slots');
        Schema::dropIfExists('doctor_availabilities');
        Schema::dropIfExists('doctors');
    }
};
