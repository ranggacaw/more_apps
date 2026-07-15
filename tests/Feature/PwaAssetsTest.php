<?php

namespace Tests\Feature;

use Tests\TestCase;

class PwaAssetsTest extends TestCase
{
    public function test_manifest_webmanifest_is_served_as_installable_pwa_metadata(): void
    {
        $response = $this->get('/manifest.webmanifest');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/manifest+json');
        $response->assertJson([
            'name' => 'MORÉ Clinic',
            'short_name' => 'MORÉ',
            'start_url' => '/dashboard',
            'scope' => '/',
            'display' => 'standalone',
            'theme_color' => '#111827',
            'background_color' => '#FCFBFA',
        ]);

        $icons = $response->json('icons');
        $this->assertNotEmpty($icons, 'Manifest must declare tablet-appropriate icons.');

        $purposes = collect($icons)->pluck('purpose')->flatten()->implode(' ');
        $this->assertStringContainsString('maskable', $purposes, 'Manifest must include a maskable icon for Android tablets.');
    }

    public function test_service_worker_is_served_with_javascript_content_type(): void
    {
        $response = $this->get('/service-worker.js');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/javascript');
        $content = $response->getContent();
        $this->assertStringContainsString('service worker', $content);
        $this->assertStringContainsString('CACHE_VERSION', $content);
        $this->assertStringContainsString('/offline.html', $content);
    }

    public function test_offline_fallback_is_branded_and_explains_network_requirement(): void
    {
        $response = $this->get('/offline.html');

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('MORÉ Clinic', $content);
        $this->assertStringContainsString('offline', $content);
        $this->assertStringContainsString('network', $content);
    }

    public function test_app_shell_includes_manifest_and_mobile_app_metadata(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
        $content = $response->getContent();
        $this->assertStringContainsString('rel="manifest"', $content);
        $this->assertStringContainsString('/manifest.webmanifest', $content);
        $this->assertStringContainsString('name="theme-color"', $content);
        $this->assertStringContainsString('apple-mobile-web-app-capable', $content);
        $this->assertStringContainsString('apple-touch-icon', $content);
        $this->assertStringContainsString('viewport-fit=cover', $content);
    }
}
