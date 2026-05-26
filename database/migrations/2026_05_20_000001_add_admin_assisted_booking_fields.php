<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreignId('booked_by_admin_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            $table->string('booking_source')->default('self_service')->after('booked_by_admin_id');
            $table->string('consultation_mode')->nullable()->after('booking_source');
            $table->string('guest_patient_name')->nullable()->after('consultation_mode');
            $table->string('guest_whatsapp')->nullable()->after('guest_patient_name');
            $table->timestamp('meeting_link_requested_at')->nullable()->after('meeting_link');
            $table->timestamp('meeting_link_submitted_at')->nullable()->after('meeting_link_requested_at');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        DB::table('bookings')->whereNull('booking_source')->update(['booking_source' => 'self_service']);

        Schema::table('consultations', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
        });

        Schema::table('consultations', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->foreignId('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn([
                'meeting_link_submitted_at',
                'meeting_link_requested_at',
                'guest_whatsapp',
                'guest_patient_name',
                'consultation_mode',
                'booking_source',
                'booked_by_admin_id',
            ]);
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropForeign(['user_id']);
            $table->foreignId('user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
