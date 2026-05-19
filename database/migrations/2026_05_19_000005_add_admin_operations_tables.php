<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table): void {
            $table->unsignedInteger('duration_days')->default(30)->after('price');
            $table->string('type')->default('basic')->after('duration_days');
        });

        Schema::create('educational_contents', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('body');
            $table->string('status')->default('draft');
            $table->string('asset_path')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });

        Schema::create('whatsapp_broadcasts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('requested_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('audience_scope');
            $table->text('message');
            $table->string('status')->default('queued');
            $table->unsignedInteger('recipient_count')->default(0);
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['audience_scope', 'status']);
        });

        Schema::create('whatsapp_broadcast_deliveries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('whatsapp_broadcast_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('phone')->nullable();
            $table->string('status')->default('pending');
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index(['whatsapp_broadcast_id', 'status'], 'broadcast_delivery_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('whatsapp_broadcast_deliveries');
        Schema::dropIfExists('whatsapp_broadcasts');
        Schema::dropIfExists('educational_contents');

        Schema::table('packages', function (Blueprint $table): void {
            $table->dropColumn(['duration_days', 'type']);
        });
    }
};
