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
            $table->boolean('must_change_password')->default(false)->after('password');
        });

        DB::table('users')->whereNull('role')->update(['role' => 'patient']);

        Schema::table('consultations', function (Blueprint $table): void {
            $table->string('patient_report_status')->default('draft')->after('notes');
            $table->text('patient_instructions')->nullable()->after('patient_report_status');
            $table->date('next_control_date')->nullable()->after('patient_instructions');
            $table->timestamp('patient_report_finalized_at')->nullable()->after('next_control_date');
            $table->timestamp('patient_report_notified_at')->nullable()->after('patient_report_finalized_at');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table): void {
            $table->dropColumn([
                'patient_report_status',
                'patient_instructions',
                'next_control_date',
                'patient_report_finalized_at',
                'patient_report_notified_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('must_change_password');
        });
    }
};
