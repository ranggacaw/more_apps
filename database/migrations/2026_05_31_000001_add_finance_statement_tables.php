<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->unsignedInteger('return_amount')->default(0)->after('amount');
            $table->unsignedInteger('hpp_amount')->default(0)->after('return_amount');
        });

        Schema::create('operating_expenses', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('category')->nullable();
            $table->unsignedInteger('amount')->default(0);
            $table->date('expense_date');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index('expense_date');
        });

        Schema::create('balance_sheet_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('side');
            $table->string('label');
            $table->string('category')->nullable();
            $table->unsignedInteger('amount')->default(0);
            $table->date('entry_date');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['side', 'entry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('balance_sheet_entries');
        Schema::dropIfExists('operating_expenses');

        Schema::table('payments', function (Blueprint $table): void {
            $table->dropColumn(['return_amount', 'hpp_amount']);
        });
    }
};
