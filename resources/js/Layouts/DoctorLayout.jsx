import { Link, usePage } from '@inertiajs/react';

function getInitials(name) {
    if (!name) return 'DR';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const navItems = [
    { href: route('doctor.dashboard'), label: 'Dashboard', icon: 'dashboard', current: 'doctor.dashboard' },
    { href: route('doctor.availability.index'), label: 'My Appointments', icon: 'calendar_month', current: 'doctor.availability.*' },
    { href: '#workspace', label: 'Treatment Plan', icon: 'medical_services', anchor: true },
    { href: '#programs', label: 'Medical Records', icon: 'description', anchor: true },
    { href: route('profile.edit'), label: 'Settings', icon: 'settings', current: 'profile.*' },
];

export default function DoctorLayout({ doctor, children }) {
    const { flash } = usePage().props;

    return (
        <div className="min-h-screen bg-surface-cream text-on-background font-body-md">
            <div className="border-b border-border-subtle bg-white px-4 py-4 lg:hidden">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-headline-md text-headline-md tracking-widest text-clinical-gold">MORÉ</p>
                        <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-1">Practitioner Portal</p>
                    </div>
                    <Link href={route('logout')} method="post" as="button" className="p-2 bg-white border border-border-subtle rounded-md text-secondary hover:bg-surface-container transition-colors">
                        <span className="material-symbols-outlined">logout</span>
                    </Link>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {navItems.filter((item) => !item.anchor).map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`rounded-lg px-3 py-2 font-label-md text-label-md ${
                                item.current && route().current(item.current)
                                    ? 'bg-secondary-container font-semibold text-on-secondary-container'
                                    : 'text-secondary hover:bg-surface-container-low transition-all'
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>

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
                        Book New Session
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

            <main className="p-4 sm:p-6 lg:ml-64 lg:p-gutter lg:max-w-container-max-width">
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
