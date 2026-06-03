<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table): void {
            $table->dropForeign(['booking_id']);
            $table->foreignId('booking_id')->nullable()->change();
            $table->foreignId('queue_entry_id')->nullable()->after('booking_id')->constrained('clinic_queue_entries')->nullOnDelete();
            $table->foreign('booking_id')->references('id')->on('bookings')->cascadeOnDelete();
            $table->unique('queue_entry_id');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->foreignId('queue_entry_id')->nullable()->after('booking_id')->constrained('clinic_queue_entries')->nullOnDelete();
            $table->index(['queue_entry_id', 'type', 'status']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropIndex('payments_queue_entry_id_type_status_index');
            $table->dropConstrainedForeignId('queue_entry_id');
        });

        Schema::table('consultations', function (Blueprint $table): void {
            $table->dropUnique('consultations_queue_entry_id_unique');
            $table->dropConstrainedForeignId('queue_entry_id');
            $table->dropForeign(['booking_id']);
            $table->foreignId('booking_id')->nullable(false)->change();
            $table->foreign('booking_id')->references('id')->on('bookings')->cascadeOnDelete();
        });
    }
};
