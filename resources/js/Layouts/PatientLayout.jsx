import ApplicationLogo from '@/Components/ApplicationLogo';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const navItems = [
    ['Dashboard', 'patient.dashboard'],
    ['Progress', 'patient.progress'],
    ['Medical Reports', 'patient.reports.index'],
    ['Profile', 'profile.edit'],
];

export default function PatientLayout({ children }) {
    const user = usePage().props.auth.user;
    const [open, setOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f7f3ee]">
            <nav className="border-b border-[#e8ded2] bg-white/90 backdrop-blur">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-8">
                        <Link href={route('patient.dashboard')} className="flex items-center gap-3">
                            <ApplicationLogo className="h-9 w-auto fill-current text-gray-800" />
                            <span className="text-sm font-semibold tracking-[0.2em] text-slate-700">PATIENT PORTAL</span>
                        </Link>
                        <div className="hidden gap-6 sm:flex">
                            {navItems.map(([label, routeName]) => (
                                <NavLink key={routeName} href={route(routeName)} active={route().current(routeName)}>
                                    {label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                    <div className="hidden items-center gap-4 text-sm sm:flex">
                        <span className="text-slate-600">{user.name}</span>
                        <Link href={route('logout')} method="post" as="button" className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 hover:bg-slate-50">
                            Log Out
                        </Link>
                    </div>
                    <button type="button" className="rounded-md p-2 text-slate-500 sm:hidden" onClick={() => setOpen(!open)}>
                        Menu
                    </button>
                </div>
                {open ? (
                    <div className="border-t border-[#e8ded2] bg-white px-4 py-3 sm:hidden">
                        {navItems.map(([label, routeName]) => (
                            <ResponsiveNavLink key={routeName} href={route(routeName)} active={route().current(routeName)}>
                                {label}
                            </ResponsiveNavLink>
                        ))}
                        <ResponsiveNavLink href={route('logout')} method="post" as="button">
                            Log Out
                        </ResponsiveNavLink>
                    </div>
                ) : null}
            </nav>
            <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
    );
}

export function PatientPageHeader({ title, subtitle }) {
    return (
        <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-clinical-gold">MORE Clinic</p>
            <h1 className="mt-2 font-headline text-3xl text-slate-950">{title}</h1>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm text-slate-600">{subtitle}</p> : null}
        </div>
    );
}
