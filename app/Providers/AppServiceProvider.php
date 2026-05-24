<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->shouldUseBuiltAssets()) {
            Vite::useHotFile(storage_path('framework/vite.hot.disabled'));
        }

        Vite::prefetch(concurrency: 3);
    }

    private function shouldUseBuiltAssets(): bool
    {
        if (app()->runningInConsole()) {
            return false;
        }

        if (! Vite::isRunningHot() || ! is_file(public_path('build/manifest.json'))) {
            return false;
        }

        return ! in_array(request()->getHost(), ['localhost', '127.0.0.1', '[::1]'], true);
    }
}
