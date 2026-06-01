<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('aesthetic_programs', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->unsignedInteger('price')->default(0);
            $table->unsignedInteger('hpp_amount')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
            $table->index(['is_active', 'name']);
        });

        Schema::create('consultation_package_options', function (Blueprint $table): void {
            $table->id();
            $table->string('program_family');
            $table->string('option_type');
            $table->string('name');
            $table->unsignedInteger('price')->default(0);
            $table->string('injection_frequency')->nullable();
            $table->string('duration_label')->nullable();
            $table->unsignedInteger('duration_days')->nullable();
            $table->string('requires_program_family')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->index(['is_active', 'option_type', 'program_family']);
        });

        Schema::create('consultation_line_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('aesthetic_program_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('consultation_package_option_id')->nullable()->constrained()->nullOnDelete();
            $table->string('type');
            $table->string('name');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('dosage_value', 8, 2)->nullable();
            $table->string('dosage_unit')->default('ml');
            $table->unsignedInteger('unit_price')->default(0);
            $table->unsignedInteger('hpp_amount')->default(0);
            $table->unsignedInteger('line_total')->default(0);
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->index(['consultation_id', 'type']);
        });

        Schema::create('clinic_operating_hours', function (Blueprint $table): void {
            $table->id();
            $table->unsignedTinyInteger('day_of_week');
            $table->time('start_time');
            $table->time('end_time');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['day_of_week', 'start_time', 'end_time']);
        });

        Schema::create('schedule_override_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('admin_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('booking_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('slot_id')->nullable()->constrained('time_slots')->nullOnDelete();
            $table->date('override_date');
            $table->time('start_time');
            $table->time('end_time')->nullable();
            $table->text('reason');
            $table->timestamps();
            $table->index(['doctor_id', 'override_date']);
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreignId('consultation_id')->nullable()->after('booking_id')->constrained()->nullOnDelete();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('consultation_id');
            $table->dropForeign(['user_id']);
            $table->foreignId('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::dropIfExists('schedule_override_logs');
        Schema::dropIfExists('clinic_operating_hours');
        Schema::dropIfExists('consultation_line_items');
        Schema::dropIfExists('consultation_package_options');
        Schema::dropIfExists('aesthetic_programs');
    }
};
