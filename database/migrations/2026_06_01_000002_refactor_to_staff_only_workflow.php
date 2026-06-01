<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->nullable()->default(null)->change();
        });

        DB::table('users')->where('role', 'patient')->update(['role' => null]);

        Schema::table('consultations', function (Blueprint $table): void {
            $table->decimal('slimming_weight_kg', 8, 2)->nullable()->after('notes');
            $table->decimal('slimming_bmi', 8, 2)->nullable()->after('slimming_weight_kg');
            $table->decimal('slimming_vfa', 8, 2)->nullable()->after('slimming_bmi');
            $table->decimal('slimming_body_fat_percentage', 8, 2)->nullable()->after('slimming_vfa');
            $table->decimal('slimming_body_age', 8, 2)->nullable()->after('slimming_body_fat_percentage');
            $table->decimal('slimming_muscle_mass', 8, 2)->nullable()->after('slimming_body_age');
            $table->decimal('slimming_upper_arm_cm', 8, 2)->nullable()->after('slimming_muscle_mass');
            $table->decimal('slimming_waist_cm', 8, 2)->nullable()->after('slimming_upper_arm_cm');
            $table->decimal('slimming_abdomen_cm', 8, 2)->nullable()->after('slimming_waist_cm');
            $table->decimal('slimming_hip_cm', 8, 2)->nullable()->after('slimming_abdomen_cm');
            $table->decimal('slimming_thigh_cm', 8, 2)->nullable()->after('slimming_hip_cm');
            $table->decimal('slimming_calf_cm', 8, 2)->nullable()->after('slimming_thigh_cm');
            $table->decimal('slimming_metabolism_bmr', 8, 2)->nullable()->after('slimming_calf_cm');
            $table->decimal('slimming_anti_oxidant', 8, 2)->nullable()->after('slimming_metabolism_bmr');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table): void {
            $table->dropColumn([
                'slimming_weight_kg',
                'slimming_bmi',
                'slimming_vfa',
                'slimming_body_fat_percentage',
                'slimming_body_age',
                'slimming_muscle_mass',
                'slimming_upper_arm_cm',
                'slimming_waist_cm',
                'slimming_abdomen_cm',
                'slimming_hip_cm',
                'slimming_thigh_cm',
                'slimming_calf_cm',
                'slimming_metabolism_bmr',
                'slimming_anti_oxidant',
            ]);
        });

        DB::table('users')->whereNull('role')->update(['role' => 'patient']);

        Schema::table('users', function (Blueprint $table): void {
            $table->string('role')->default('patient')->change();
        });
    }
};
