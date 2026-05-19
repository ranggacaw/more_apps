<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->unsignedInteger('consultation_credit')->default(0)->after('medical_notes');
            $table->timestamp('consultation_credit_awarded_at')->nullable()->after('consultation_credit');
            $table->timestamp('consultation_credit_expires_at')->nullable()->after('consultation_credit_awarded_at');
            $table->timestamp('consultation_credit_consumed_at')->nullable()->after('consultation_credit_expires_at');
            $table->foreignId('consultation_credit_payment_id')->nullable()->after('consultation_credit_consumed_at')->constrained('payments')->nullOnDelete();
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->foreignId('booking_id')->nullable()->change();
            $table->string('type')->default('consultation')->after('attempt_number');
            $table->foreignId('package_id')->nullable()->after('booking_id')->constrained()->nullOnDelete();
            $table->unsignedInteger('consultation_credit_applied')->default(0)->after('amount');
            $table->foreignId('consultation_credit_source_payment_id')->nullable()->after('consultation_credit_applied')->constrained('payments')->nullOnDelete();
            $table->index(['user_id', 'type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropIndex('payments_user_id_type_status_index');
            $table->dropConstrainedForeignId('consultation_credit_source_payment_id');
            $table->dropConstrainedForeignId('package_id');
            $table->dropColumn(['type', 'consultation_credit_applied']);
            $table->foreignId('booking_id')->nullable(false)->change();
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('consultation_credit_payment_id');
            $table->dropColumn([
                'consultation_credit',
                'consultation_credit_awarded_at',
                'consultation_credit_expires_at',
                'consultation_credit_consumed_at',
            ]);
        });
    }
};
