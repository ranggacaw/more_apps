import { Link, usePage } from '@inertiajs/react';

const linksByRole = {
    patient: [
        { href: route('patient.dashboard'), label: 'Dashboard', current: 'patient.dashboard' },
        { href: route('bookings.create'), label: 'Book Consultation', current: 'bookings.*' },
        { href: route('patient.packages.index'), label: 'Packages', current: 'patient.packages.*' },
        { href: route('profile.edit'), label: 'Profile', current: 'profile.*' },
    ],
    doctor: [
        { href: route('doctor.dashboard'), label: 'Dashboard', current: 'doctor.dashboard' },
        { href: route('doctor.availability.index'), label: 'Availability', current: 'doctor.availability.*' },
        { href: route('profile.edit'), label: 'Profile', current: 'profile.*' },
    ],
    admin: [
        { href: route('admin.dashboard'), label: 'Dashboard', current: 'admin.dashboard' },
        { href: route('admin.packages.index'), label: 'Packages', current: 'admin.packages.*' },
        { href: route('admin.reports.index'), label: 'Reports', current: 'admin.reports.*' },
        { href: route('admin.broadcasts.index'), label: 'Broadcasts', current: 'admin.broadcasts.*' },
        { href: route('admin.content.index'), label: 'Content', current: 'admin.content.*' },
        { href: route('admin.users.index'), label: 'Users', current: 'admin.users.*' },
        { href: route('profile.edit'), label: 'Profile', current: 'profile.*' },
    ],
};

export default function AppLayout({ title, description, children }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const links = linksByRole[user?.role] ?? [];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <Link href={route('home')} className="text-lg font-semibold tracking-[0.2em] text-amber-700">
                            MORE CLINIC
                        </Link>
                        <p className="text-sm text-slate-500">Patient booking, doctor operations, and admin control in one app.</p>
                    </div>

                    <div className="flex flex-col gap-3 lg:items-end">
                        <nav className="flex flex-wrap gap-2 text-sm">
                            {links.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`rounded-full px-3 py-1.5 transition ${route().current(link.current) ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link
                                href={route('logout')}
                                method="post"
                                as="button"
                                className="rounded-full px-3 py-1.5 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                            >
                                Log out
                            </Link>
                        </nav>
                        <p className="text-sm text-slate-500">
                            Signed in as <span className="font-medium text-slate-700">{user?.name}</span>
                        </p>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                        {description ? <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p> : null}
                    </div>
                </div>

                {flash?.success ? (
                    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                ) : null}

                {flash?.error ? (
                    <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {flash.error}
                    </div>
                ) : null}

                {children}
            </main>
        </div>
    );
}
