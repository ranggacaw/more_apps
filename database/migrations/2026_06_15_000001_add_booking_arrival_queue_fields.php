<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clinic_queue_entries', function (Blueprint $table): void {
            $table->string('source_type')->default('walk_in')->after('id');
            $table->foreignId('booking_id')->nullable()->after('source_type')->constrained('bookings')->nullOnDelete();
            $table->date('queue_date')->nullable()->after('booking_id');
            $table->unsignedInteger('queue_sequence')->nullable()->after('queue_date');
            $table->timestamp('called_at')->nullable()->after('assigned_at');
        });

        $sequencesByDate = [];
        DB::table('clinic_queue_entries')
            ->orderBy('queued_at')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->each(function ($entry) use (&$sequencesByDate): void {
                $queuedAt = $entry->queued_at ?? $entry->created_at ?? now();
                $queueDate = Carbon::parse($queuedAt)->toDateString();
                $sequencesByDate[$queueDate] = ($sequencesByDate[$queueDate] ?? 0) + 1;

                DB::table('clinic_queue_entries')
                    ->where('id', $entry->id)
                    ->update([
                        'source_type' => $entry->source_type ?? 'walk_in',
                        'queue_date' => $queueDate,
                        'queue_sequence' => $sequencesByDate[$queueDate],
                        'queue_number' => $entry->queue_number ?: 'Q-'.str_pad((string) $sequencesByDate[$queueDate], 3, '0', STR_PAD_LEFT),
                    ]);
            });

        Schema::table('clinic_queue_entries', function (Blueprint $table): void {
            $table->unique('booking_id', 'clinic_queue_entries_booking_id_unique');
            $table->unique(['queue_date', 'queue_sequence'], 'clinic_queue_entries_queue_date_sequence_unique');
            $table->index(['queue_date', 'status', 'doctor_id'], 'clinic_queue_entries_queue_date_status_doctor_index');
            $table->index(['source_type', 'status'], 'clinic_queue_entries_source_status_index');
        });

        Schema::table('bookings', function (Blueprint $table): void {
            $table->timestamp('no_show_at')->nullable()->after('same_day_reminder_sent_at');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn('no_show_at');
        });

        Schema::table('clinic_queue_entries', function (Blueprint $table): void {
            $table->dropUnique('clinic_queue_entries_booking_id_unique');
            $table->dropUnique('clinic_queue_entries_queue_date_sequence_unique');
            $table->dropIndex('clinic_queue_entries_queue_date_status_doctor_index');
            $table->dropIndex('clinic_queue_entries_source_status_index');
            $table->dropConstrainedForeignId('booking_id');
            $table->dropColumn([
                'source_type',
                'queue_date',
                'queue_sequence',
                'called_at',
            ]);
        });
    }
};
