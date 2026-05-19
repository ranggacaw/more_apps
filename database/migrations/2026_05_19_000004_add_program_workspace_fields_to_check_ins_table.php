<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('check_ins', function (Blueprint $table): void {
            $table->unsignedInteger('program_week')->nullable()->after('doctor_id');
            $table->decimal('weight_kg', 5, 2)->unsigned()->nullable()->after('program_week');
            $table->decimal('waist_cm', 5, 2)->unsigned()->nullable()->after('weight_kg');
            $table->string('progress_photo_path')->nullable()->after('supporting_document_path');
            $table->text('review_notes')->nullable()->after('progress_photo_path');
            $table->timestamp('reviewed_at')->nullable()->after('review_notes');
            $table->unique(['user_package_id', 'program_week'], 'check_ins_user_package_program_week_unique');
        });
    }

    public function down(): void
    {
        Schema::table('check_ins', function (Blueprint $table): void {
            $table->dropUnique('check_ins_user_package_program_week_unique');
            $table->dropColumn([
                'program_week',
                'weight_kg',
                'waist_cm',
                'progress_photo_path',
                'review_notes',
                'reviewed_at',
            ]);
        });
    }
};
