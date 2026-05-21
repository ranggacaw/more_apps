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
            },
            fontFamily: {
                sans: ['Hanken Grotesk', ...defaultTheme.fontFamily.sans],
                headline: ['Libre Caslon Text', 'serif'],
            },
        },
    },

    plugins: [forms],
};
