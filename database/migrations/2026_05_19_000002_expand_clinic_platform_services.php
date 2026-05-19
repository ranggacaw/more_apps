<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->string('patient_upload_path')->nullable()->after('notes');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->unsignedTinyInteger('attempt_number')->default(1)->after('booking_id');
            $table->unique(['booking_id', 'attempt_number']);
        });

        Schema::create('packages', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('price')->default(0);
            $table->unsignedInteger('consultation_credits')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('user_packages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('package_id')->constrained()->cascadeOnDelete();
            $table->foreignId('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->string('status')->default('active');
            $table->unsignedInteger('consultation_credits_total');
            $table->unsignedInteger('consultation_credits_remaining');
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('consultations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('booking_id')->unique()->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('recommended_package_id')->nullable()->constrained('packages')->nullOnDelete();
            $table->foreignId('user_package_id')->nullable()->constrained('user_packages')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->string('meal_plan_pdf_path')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('check_ins', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_package_id')->constrained('user_packages')->cascadeOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->foreignId('consultation_id')->nullable()->constrained('consultations')->nullOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->nullable()->constrained('doctors')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->string('supporting_document_path')->nullable();
            $table->unsignedInteger('remaining_consultations_after')->nullable();
            $table->timestamp('checked_in_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_ins');
        Schema::dropIfExists('consultations');
        Schema::dropIfExists('user_packages');
        Schema::dropIfExists('packages');

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropUnique('payments_booking_id_attempt_number_unique');
            $table->dropColumn('attempt_number');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn('patient_upload_path');
        });
    }
};
