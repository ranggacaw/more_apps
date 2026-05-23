import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

function getInitials(name) {
    if (!name) return 'DR';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const navItems = [
    { href: route('doctor.dashboard'), label: 'Dashboard', icon: 'dashboard', current: 'doctor.dashboard' },
    { href: route('doctor.consultations.index'), label: 'Consultations', icon: 'stethoscope', current: 'doctor.consultations.*' },
    { href: route('doctor.program-reviews.index'), label: 'Program Reviews', icon: 'clinical_notes', current: 'doctor.program-reviews.*' },
    { href: route('doctor.medical-records.index'), label: 'Medical Records', icon: 'description', current: 'doctor.medical-records.*' },
    { href: route('doctor.availability.index'), label: 'Availability', icon: 'calendar_month', current: 'doctor.availability.*' },
    { href: route('profile.edit'), label: 'Settings', icon: 'settings', current: 'profile.*' },
];

export function DoctorPageHeader({ title, subtitle, actions }) {
    return (
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-stack-lg">
            <div>
                <h2 className="font-headline-lg text-headline-lg text-charcoal-depth">{title}</h2>
                {subtitle ? (
                    <p className="font-body-md text-body-md text-secondary mt-1">{subtitle}</p>
                ) : null}
            </div>
            {actions ? <div className="flex items-center gap-stack-sm">{actions}</div> : null}
        </header>
    );
}

export default function DoctorLayout({ doctor, children }) {
    const { flash } = usePage().props;
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-surface-cream text-on-background font-body-md">
            <header className="fixed top-0 w-full z-50 bg-surface-cream/80 backdrop-blur-md border-b border-border-subtle shadow-sm lg:hidden">
                <div className="flex items-center justify-between h-16 px-4">
                    <div>
                        <p className="font-headline-md text-headline-md tracking-widest text-clinical-gold">MORÉ</p>
                        <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Practitioner Portal</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Notifications"
                            className="material-symbols-outlined text-secondary p-2"
                        >
                            notifications
                        </button>
                        <button
                            type="button"
                            aria-label="Open navigation menu"
                            className="material-symbols-outlined text-secondary"
                            onClick={() => setMobileOpen(true)}
                        >
                            menu
                        </button>
                    </div>
                </div>
            </header>

            {mobileOpen ? (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-72 max-w-[88vw] bg-white pt-6 px-4 pb-4 shadow-xl flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="font-headline-md text-headline-md tracking-widest text-clinical-gold">MORÉ</p>
                                <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Practitioner Portal</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close navigation menu"
                                className="material-symbols-outlined text-secondary"
                                onClick={() => setMobileOpen(false)}
                            >
                                close
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-6 border-b border-border-subtle pb-4">
                            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs ring-2 ring-clinical-gold/20">
                                {getInitials(doctor.name)}
                            </div>
                            <div>
                                <p className="font-label-md text-label-md font-bold">{doctor.name}</p>
                                <p className="text-[10px] text-secondary uppercase">{doctor.specialization}</p>
                            </div>
                        </div>

                        <nav className="flex-1 space-y-1">
                            {navItems.map((item) => {
                                const isActive = item.current ? route().current(item.current) : false;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                            isActive
                                                ? 'bg-secondary-container text-on-secondary-container font-semibold'
                                                : 'text-secondary hover:bg-surface-container-low'
                                        }`}
                                    >
                                        <span className="material-symbols-outlined">{item.icon}</span>
                                        <span className="font-label-md text-label-md">{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-auto pt-4 border-t border-border-subtle space-y-3">
                            <Link
                                href={route('doctor.availability.index')}
                                onClick={() => setMobileOpen(false)}
                                className="block text-center w-full bg-clinical-gold text-white font-label-md text-label-md py-3 rounded-md hover:opacity-90 transition-opacity shadow-sm"
                            >
                                Update Availability
                            </Link>
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-2 p-2 rounded-lg text-xs text-slate-400 hover:text-slate-600 transition-colors w-full justify-center"
                            >
                                <span className="material-symbols-outlined text-sm">logout</span>
                                <span>Log out</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}

            <aside className="h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-border-subtle flex-col p-stack-md z-40 hidden lg:flex">
                <div className="mb-10 px-2">
                    <h1 className="font-headline-md text-headline-md tracking-widest text-clinical-gold">MORÉ</h1>
                    <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-1">Practitioner Portal</p>
                </div>
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = item.current ? route().current(item.current) : false;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                                    isActive
                                        ? 'bg-secondary-container text-on-secondary-container font-semibold translate-x-1'
                                        : 'text-secondary hover:bg-surface-container-low'
                                }`}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span className="font-label-md text-label-md">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
                <div className="mt-auto pt-6 border-t border-border-subtle">
                    <Link href={route('doctor.availability.index')} className="block text-center w-full bg-clinical-gold text-white font-label-md text-label-md py-3 rounded-md hover:opacity-90 transition-opacity shadow-sm">
                        Update Availability
                    </Link>
                    <div className="flex items-center gap-3 mt-6 px-2">
                        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs ring-2 ring-clinical-gold/20">
                            {getInitials(doctor.name)}
                        </div>
                        <div>
                            <p className="font-label-md text-label-md font-bold">{doctor.name}</p>
                            <p className="text-[10px] text-secondary uppercase">{doctor.specialization}</p>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="pt-20 p-4 sm:p-6 lg:pt-gutter lg:ml-64 lg:p-gutter lg:max-w-container-max-width">
                {flash?.success ? <div className="mb-stack-md rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 font-body-md text-body-md text-emerald-700">{flash.success}</div> : null}
                {flash?.error ? <div className="mb-stack-md rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 font-body-md text-body-md text-rose-700">{flash.error}</div> : null}

                {children}

                <footer className="mt-stack-lg pt-stack-lg border-t border-border-subtle grid grid-cols-1 md:grid-cols-3 gap-gutter pb-stack-lg">
                    <div>
                        <h4 className="font-headline-md text-headline-md text-clinical-gold mb-4">MORÉ</h4>
                        <p className="font-label-sm text-label-sm text-secondary">&copy; 2024 MORÉ Aesthetic and Wellness Centre. All rights reserved.</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="font-label-md text-label-md font-bold mb-1">Quick Links</p>
                        <a className="text-secondary hover:text-clinical-gold transition-all font-label-sm text-label-sm" href="#">Privacy Policy</a>
                        <a className="text-secondary hover:text-clinical-gold transition-all font-label-sm text-label-sm" href="#">Terms of Service</a>
                    </div>
                    <div className="flex flex-col gap-2">
                        <p className="font-label-md text-label-md font-bold mb-1">Support</p>
                        <a className="text-secondary hover:text-clinical-gold transition-all font-label-sm text-label-sm" href="#">Practitioner Help Desk</a>
                        <a className="text-secondary hover:text-clinical-gold transition-all font-label-sm text-label-sm" href="#">System Status: <span className="text-status-success font-bold">Operational</span></a>
                    </div>
                </footer>
            </main>
        </div>
    );
}
