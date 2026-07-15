import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

function getInitials(name) {
    if (!name) return 'AD';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const navItems = [
    { href: route('admin.dashboard'), label: 'Dashboard', icon: 'dashboard', current: 'admin.dashboard' },
    { href: route('admin.bookings.index'), label: 'Bookings', icon: 'calendar_month', current: 'admin.bookings.*' },
    { href: route('admin.queue.index'), label: 'Queue', icon: 'queue', current: 'admin.queue.*' },
    { href: route('admin.invoices.index'), label: 'Invoices', icon: 'receipt_long', current: 'admin.invoices.*' },
    { href: route('admin.reports.index'), label: 'Reports', icon: 'bar_chart', current: 'admin.reports.*' },
    { href: route('admin.broadcasts.index'), label: 'Broadcasts', icon: 'campaign', current: 'admin.broadcasts.*' },
    { href: route('admin.content.index'), label: 'Content', icon: 'article', current: 'admin.content.*' },
    { href: route('admin.aesthetic-programs.index'), label: 'Aesthetic Programs', icon: 'spa', current: 'admin.aesthetic-programs.*' },
    { href: route('admin.schedule-settings.index'), label: 'Schedule Settings', icon: 'event_available', current: 'admin.schedule-settings.*' },
    { href: route('admin.users.index'), label: 'Users', icon: 'group', current: 'admin.users.*' },
    { href: route('system-docs'), label: 'System Docs', icon: 'schema', current: 'system-docs*' },
    { href: route('user-guide'), label: 'User Guide', icon: 'menu_book', current: 'user-guide' },
    { href: route('profile.edit'), label: 'Settings', icon: 'settings', current: 'profile.*' },
];

export function AdminPageHeader({ title, subtitle, actions }) {
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

export default function AdminLayout({ children }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const [mobileOpen, setMobileOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const initials = getInitials(user?.name);

    return (
        <div className="min-h-screen bg-surface-cream text-on-background font-body-md">
            <header className="fixed top-0 w-full z-50 bg-surface-cream/80 backdrop-blur-md border-b border-border-subtle shadow-sm safe-top lg:hidden">
                <div className="flex items-center justify-between h-16 px-4">
                    <div>
                        <p className="font-headline-md text-headline-md tracking-widest text-clinical-gold">MORÉ</p>
                        <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Admin Portal</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            aria-label="Notifications"
                            className="touch-target material-symbols-outlined text-secondary p-2 rounded-lg hover:bg-surface-container-low"
                        >
                            notifications
                        </button>
                        <button
                            type="button"
                            aria-label="Open navigation menu"
                            className="touch-target material-symbols-outlined text-secondary p-2 rounded-lg hover:bg-surface-container-low"
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
                    <div className="absolute left-0 top-0 h-full w-72 max-w-[88vw] bg-white safe-top pt-6 px-4 pb-4 shadow-xl flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className="font-headline-md text-headline-md tracking-widest text-clinical-gold">MORÉ</p>
                                <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest">Admin Portal</p>
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
                                {initials}
                            </div>
                            <div>
                                <p className="font-label-md text-label-md font-bold">{user?.name}</p>
                                <p className="text-[10px] text-secondary uppercase">Administrator</p>
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
                                href={route('admin.bookings.index')}
                                onClick={() => setMobileOpen(false)}
                                className="block text-center w-full bg-clinical-gold text-white font-label-md text-label-md py-3 rounded-md hover:opacity-90 transition-opacity shadow-sm"
                            >
                                New Booking
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

            {!sidebarOpen ? (
                <button
                    type="button"
                    aria-label="Show sidebar"
                    className="fixed left-4 top-4 z-50 hidden h-11 w-11 items-center justify-center rounded-full border border-border-subtle bg-surface-container-lowest text-secondary shadow-lg transition-colors hover:bg-surface-container-low lg:flex"
                    onClick={() => setSidebarOpen(true)}
                >
                    <span className="material-symbols-outlined">menu_open</span>
                </button>
            ) : null}

            <aside className={`${sidebarOpen ? 'lg:flex' : 'lg:hidden'} h-screen w-64 fixed left-0 top-0 bg-surface-container-lowest border-r border-border-subtle flex-col safe-top p-stack-md z-40 hidden`}>
                <div className="mb-10 flex items-start justify-between gap-3 px-2">
                    <div>
                        <h1 className="font-headline-md text-headline-md tracking-widest text-clinical-gold">MORÉ</h1>
                        <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest mt-1">Admin Portal</p>
                    </div>
                    <button
                        type="button"
                        aria-label="Hide sidebar"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-secondary transition-colors hover:bg-surface-container-low"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className="material-symbols-outlined text-[20px]">left_panel_close</span>
                    </button>
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
                    <Link href={route('admin.bookings.index')} className="block text-center w-full bg-clinical-gold text-white font-label-md text-label-md py-3 rounded-md hover:opacity-90 transition-opacity shadow-sm">
                        New Booking
                    </Link>
                    <div className="flex items-center gap-3 mt-6 px-2">
                        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs ring-2 ring-clinical-gold/20">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-label-md text-label-md font-bold truncate">{user?.name}</p>
                            <p className="text-[10px] text-secondary uppercase">Administrator</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex items-center justify-center w-9 h-9 rounded-lg text-secondary hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Log out"
                        >
                            <span className="material-symbols-outlined text-[20px]">logout</span>
                        </Link>
                    </div>
                </div>
            </aside>

            <main className={`${sidebarOpen ? 'lg:ml-64 lg:p-gutter' : 'lg:ml-0 lg:py-gutter lg:pr-gutter lg:pl-24'} app-main-offset p-4 transition-[margin,padding] duration-200 sm:p-6 lg:pt-gutter`}>
                {flash?.success ? <div className="mb-stack-md rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 font-body-md text-body-md text-emerald-700">{flash.success}</div> : null}
                {flash?.error ? <div className="mb-stack-md rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 font-body-md text-body-md text-rose-700">{flash.error}</div> : null}

                {children}

                <footer className="mt-stack-lg pt-stack-lg border-t border-border-subtle grid grid-cols-1 md:grid-cols-3 gap-gutter pb-stack-lg safe-bottom">
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
                        <a className="text-secondary hover:text-clinical-gold transition-all font-label-sm text-label-sm" href="#">Admin Help Desk</a>
                        <a className="text-secondary hover:text-clinical-gold transition-all font-label-sm text-label-sm" href="#">System Status: <span className="text-status-success font-bold">Operational</span></a>
                    </div>
                </footer>
            </main>
        </div>
    );
}
