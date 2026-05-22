import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                'clinical-gold': '#B5922A',
                'clinical-gold-light': '#D4B44E',
                'surface-cream': '#FCFBFA',
                'on-background': '#151c27',
                'secondary': '#555f6f',
                'outline-variant': '#d0c5b0',
                'border-subtle': '#E5E7EB',
                'charcoal-depth': '#111827',
                'secondary-container': '#d6e0f3',
                'on-secondary-container': '#596373',
                'surface-container': '#e7eefe',
                'surface-container-low': '#f0f3ff',
                'surface-container-lowest': '#ffffff',
                'status-success': '#059669',
                'status-warning': '#D97706',
            },
            fontFamily: {
                sans: ['Hanken Grotesk', ...defaultTheme.fontFamily.sans],
                headline: ['Libre Caslon Text', 'serif'],
                'headline-lg': ['Libre Caslon Text', 'serif'],
                'headline-md': ['Libre Caslon Text', 'serif'],
                'title-lg': ['Hanken Grotesk', 'sans-serif'],
                'label-md': ['Hanken Grotesk', 'sans-serif'],
                'label-sm': ['Hanken Grotesk', 'sans-serif'],
                'body-md': ['Hanken Grotesk', 'sans-serif'],
                'body-lg': ['Hanken Grotesk', 'sans-serif'],
            },
            fontSize: {
                'headline-lg': ['2.25rem', { lineHeight: '2.5rem' }],
                'headline-md': ['1.5rem', { lineHeight: '2rem' }],
                'title-lg': ['1.25rem', { lineHeight: '1.75rem' }],
                'label-md': ['0.9375rem', { lineHeight: '1.375rem' }],
                'label-sm': ['0.8125rem', { lineHeight: '1.25rem' }],
                'body-md': ['0.9375rem', { lineHeight: '1.5rem' }],
                'body-lg': ['1rem', { lineHeight: '1.625rem' }],
            },
            spacing: {
                'stack-md': '16px',
                'stack-lg': '32px',
                'gutter': '24px',
                'stack-sm': '8px',
            },
        },
    },

    plugins: [forms],
};
