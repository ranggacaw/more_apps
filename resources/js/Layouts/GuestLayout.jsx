import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col bg-surface-cream text-on-background">
            <header className="fixed top-0 w-full z-50 py-4 flex justify-center items-center bg-surface-cream/80 backdrop-blur-sm">
                <Link href="/">
                    <span className="font-headline text-2xl tracking-[0.2em] text-clinical-gold font-bold">
                        MORÉ
                    </span>
                </Link>
            </header>

            <main className="flex-grow flex items-center justify-center px-4 md:px-10 pt-20 pb-8 relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-clinical-gold/5 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-clinical-gold/5 rounded-full blur-[100px]" />

                <div className="max-w-[480px] w-full z-10">{children}</div>
            </main>

            <footer className="py-4 text-center">
                <p className="text-[12px] text-secondary/60 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} MORÉ Aesthetic and
                    Wellness Centre. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
