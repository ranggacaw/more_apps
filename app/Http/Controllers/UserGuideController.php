<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;
use Inertia\Response;

class UserGuideController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $blocks = $this->parseMarkdown(File::get(base_path('docs/cara_menggunakan_aplikasi.md')));
        $title = 'User Guide';

        if (($blocks[0]['type'] ?? null) === 'heading' && ($blocks[0]['level'] ?? null) === 1) {
            $title = $blocks[0]['content'];
            array_shift($blocks);
        }

        $doctorProfile = $request->user()->role === 'doctor'
            ? $request->user()->doctorProfile()->first()
            : null;
        $doctor = $request->user()->role === 'doctor'
            ? [
                'name' => $request->user()->name,
                'specialization' => $doctorProfile?->specialization ?: 'Practitioner',
            ]
            : null;

        return Inertia::render('UserGuide', [
            'title' => $title,
            'role' => $request->user()->role,
            'doctor' => $doctor,
            'blocks' => $blocks,
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function parseMarkdown(string $markdown): array
    {
        $lines = preg_split('/\R/u', trim($markdown)) ?: [];
        $blocks = [];
        $index = 0;
        $count = count($lines);

        while ($index < $count) {
            $line = trim($lines[$index]);

            if ($line === '') {
                $index++;

                continue;
            }

            if (preg_match('/^```([A-Za-z0-9_-]+)?$/', $line, $matches) === 1) {
                $language = $matches[1] ?: null;
                $content = [];
                $index++;

                while ($index < $count && trim($lines[$index]) !== '```') {
                    $content[] = rtrim($lines[$index]);
                    $index++;
                }

                $blocks[] = [
                    'type' => 'code',
                    'language' => $language,
                    'content' => implode("\n", $content),
                ];

                if ($index < $count) {
                    $index++;
                }

                continue;
            }

            if (preg_match('/^(#{1,3})\s+(.*)$/', $line, $matches) === 1) {
                $blocks[] = [
                    'type' => 'heading',
                    'level' => strlen($matches[1]),
                    'content' => $matches[2],
                ];
                $index++;

                continue;
            }

            if (preg_match('/^-\s+(.*)$/', $line) === 1) {
                $items = [];

                while ($index < $count && preg_match('/^-\s+(.*)$/', trim($lines[$index]), $matches) === 1) {
                    $items[] = $matches[1];
                    $index++;
                }

                $blocks[] = [
                    'type' => 'list',
                    'ordered' => false,
                    'items' => $items,
                ];

                continue;
            }

            if (preg_match('/^\d+\.\s+(.*)$/', $line) === 1) {
                $items = [];

                while ($index < $count && preg_match('/^\d+\.\s+(.*)$/', trim($lines[$index]), $matches) === 1) {
                    $items[] = $matches[1];
                    $index++;
                }

                $blocks[] = [
                    'type' => 'list',
                    'ordered' => true,
                    'items' => $items,
                ];

                continue;
            }

            $paragraph = [$line];
            $index++;

            while ($index < $count) {
                $nextLine = trim($lines[$index]);

                if ($nextLine === '' || $this->startsNewBlock($nextLine)) {
                    break;
                }

                $paragraph[] = $nextLine;
                $index++;
            }

            $blocks[] = [
                'type' => 'paragraph',
                'content' => implode(' ', $paragraph),
            ];
        }

        return $blocks;
    }

    private function startsNewBlock(string $line): bool
    {
        return preg_match('/^(#{1,3})\s+/', $line) === 1
            || preg_match('/^-\s+/', $line) === 1
            || preg_match('/^\d+\.\s+/', $line) === 1
            || preg_match('/^```/', $line) === 1;
    }
}
