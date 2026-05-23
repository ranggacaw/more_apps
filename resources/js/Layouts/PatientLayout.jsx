import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const patientNavLinks = [
    { href: route('patient.dashboard'), label: 'Dashboard', icon: 'dashboard', current: 'patient.dashboard' },
    { href: route('patient.medical-records.index'), label: 'Medical Records', icon: 'folder_open', current: 'patient.medical-records.*' },
    { href: route('bookings.create'), label: 'Book Consultation', icon: 'calendar_month', current: 'bookings.*' },
    { href: route('patient.packages.index'), label: 'Packages', icon: 'medical_services', current: 'patient.packages.*' },
    { href: route('profile.edit'), label: 'Settings', icon: 'settings', current: 'profile.*' },
];

function NavItem({ link, active, onClick }) {
    return (
        <Link
            href={link.href}
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-lg font-medium text-sm transition-all ${
                active
                    ? 'bg-clinical-gold/10 text-clinical-gold translate-x-1'
                    : 'text-secondary hover:bg-slate-50'
            }`}
        >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span>{link.label}</span>
        </Link>
    );
}

export default function PatientLayout({ children }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);

    const initials = user?.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() ?? 'U';

    return (
        <div className="min-h-screen bg-surface-cream text-slate-900">
            <header className="fixed top-0 w-full z-50 bg-surface-cream/80 backdrop-blur-md border-b border-border-subtle shadow-sm">
                <div className="flex justify-between items-center h-20 px-6 lg:px-8 max-w-full mx-auto">
                    <Link href="/" className="font-headline text-xl tracking-[0.2em] text-clinical-gold">
                        MORÉ
                    </Link>
                    <nav className="hidden md:flex items-center gap-8">
                        {patientNavLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`border-b-2 pb-1 text-sm transition-colors ${
                                    route().current(link.current)
                                        ? 'border-clinical-gold text-clinical-gold'
                                        : 'border-transparent text-secondary hover:text-clinical-gold'
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            aria-label="Open navigation menu"
                            className="material-symbols-outlined text-secondary md:hidden"
                            onClick={() => setMobileOpen(true)}
                        >
                            menu
                        </button>
                        <button
                            type="button"
                            aria-label="Notifications"
                            className="material-symbols-outlined text-secondary hidden md:inline-flex"
                        >
                            notifications
                        </button>
                        <div className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center bg-clinical-gold/10">
                            <span className="text-sm font-bold text-clinical-gold">{initials}</span>
                        </div>
                    </div>
                </div>
            </header>

            <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white pt-24 px-4 pb-4 border-r border-border-subtle z-40">
                <nav className="space-y-1">
                    {patientNavLinks.map((link) => (
                        <NavItem
                            key={link.href}
                            link={link}
                            active={route().current(link.current)}
                        />
                    ))}
                </nav>
                <div className="mt-auto pb-6">
                    <Link
                        href={route('bookings.create')}
                        className="block w-full rounded-md bg-clinical-gold py-3 text-center text-sm font-medium text-white soft-lift transition-opacity hover:opacity-90"
                    >
                        Book New Session
                    </Link>
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="flex items-center gap-2 mt-3 p-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 transition-colors w-full justify-center"
                    >
                        <span className="material-symbols-outlined text-sm">logout</span>
                        <span>Log out</span>
                    </Link>
                </div>
            </aside>

            {mobileOpen ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-72 max-w-[88vw] bg-white pt-20 px-4 pb-4 shadow-xl">
                        <div className="flex justify-end mb-2">
                            <button
                                type="button"
                                aria-label="Close navigation menu"
                                className="material-symbols-outlined text-secondary"
                                onClick={() => setMobileOpen(false)}
                            >
                                close
                            </button>
                        </div>
                        <div className="mb-4 border-b border-border-subtle pb-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-clinical-gold">MORÉ</p>
                            <p className="mt-2 text-sm font-medium text-slate-900">{user?.name}</p>
                        </div>
                        <nav className="space-y-1">
                            {patientNavLinks.map((link) => (
                                <NavItem
                                    key={link.href}
                                    link={link}
                                    active={route().current(link.current)}
                                    onClick={() => setMobileOpen(false)}
                                />
                            ))}
                        </nav>
                        <div className="mt-6">
                            <Link
                                href={route('bookings.create')}
                                onClick={() => setMobileOpen(false)}
                                className="block w-full rounded-md bg-clinical-gold py-3 text-center text-sm font-medium text-white soft-lift transition-opacity hover:opacity-90"
                            >
                                Book New Session
                            </Link>
                        </div>
                        <div className="mt-4 border-t border-border-subtle pt-4">
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 p-3 rounded-lg text-sm text-secondary hover:bg-slate-50 w-full"
                            >
                                <span className="material-symbols-outlined">logout</span>
                                <span>Log out</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}

            <main className="lg:ml-64 pt-24 px-4 pb-8 sm:px-6 lg:px-8">
                <div className="mx-auto w-full">
                {flash?.success ? (
                    <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                ) : null}

                {flash?.error ? (
                    <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {flash.error}
                    </div>
                ) : null}

                {children}
                </div>
            </main>
        </div>
    );
}
