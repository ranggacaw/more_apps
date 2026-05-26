<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_queue_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('queue_number');
            $table->string('patient_name');
            $table->string('patient_phone')->nullable();
            $table->text('complaint_notes')->nullable();
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->nullOnDelete();
            $table->string('status')->default('waiting');
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('assigned_at')->nullable();
            $table->timestamp('consultation_started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_queue_entries');
    }
};
