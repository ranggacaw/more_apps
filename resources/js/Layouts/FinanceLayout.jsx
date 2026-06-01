import { Link, usePage } from '@inertiajs/react';

function getInitials(name) {
    if (!name) return 'FA';
    return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const navItems = [
    { href: route('finance.profit-loss.index'), label: 'Profit and Loss', current: 'finance.profit-loss.*' },
    { href: route('finance.balance-sheet.index'), label: 'Balance Sheet', current: 'finance.balance-sheet.*' },
    { href: `${route('finance.profit-loss.index')}#operating-expenses`, label: 'Operating Expenses' },
    { href: `${route('finance.balance-sheet.index')}#balance-sheet-entries`, label: 'Manual Entries' },
    { href: route('profile.edit'), label: 'Settings', current: 'profile.*' },
];

export function FinancePageHeader({ title, subtitle, actions }) {
    return (
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">Finance workspace</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{title}</h1>
                {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </header>
    );
}

export default function FinanceLayout({ children }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const initials = getInitials(user?.name);

    return (
        <div className="min-h-screen bg-surface-cream text-slate-900">
            <header className="border-b border-border-subtle bg-white/90 shadow-sm backdrop-blur">
                <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clinical-gold/10 text-sm font-bold text-clinical-gold">
                            {initials}
                        </div>
                        <div>
                            <Link href={route('finance.profit-loss.index')} className="font-headline-md text-headline-md tracking-widest text-clinical-gold">
                                MORE FINANCE
                            </Link>
                            <p className="text-xs uppercase tracking-[0.18em] text-secondary">Super Admin Portal</p>
                        </div>
                    </div>

                    <nav className="flex flex-wrap items-center gap-2 text-sm">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-full px-3 py-2 transition ${item.current && route().current(item.current) ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-full px-3 py-2 text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
                        >
                            Log out
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {flash?.success ? <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{flash.success}</div> : null}
                {flash?.error ? <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{flash.error}</div> : null}

                {children}
            </main>
        </div>
    );
}
