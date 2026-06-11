import AdminLayout, { AdminPageHeader } from '@/Layouts/AdminLayout';
import AppLayout from '@/Layouts/AppLayout';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import FinanceLayout, { FinancePageHeader } from '@/Layouts/FinanceLayout';
import { Head, Link } from '@inertiajs/react';

const moduleIcons = {
    'system-architecture': 'account_tree',
    'admin-operations': 'admin_panel_settings',
    'doctor-clinical': 'stethoscope',
    'payments-finance': 'payments',
    'notifications-reminders': 'notifications_active',
};

function Layout({ role, doctor, children }) {
    if (role === 'doctor') {
        return (
            <DoctorLayout doctor={doctor}>
                <DoctorPageHeader title="System Docs" subtitle="Interactive flowchart documentation for every system module." />
                {children}
            </DoctorLayout>
        );
    }

    if (role === 'admin') {
        return (
            <AdminLayout>
                <AdminPageHeader title="System Docs" subtitle="Interactive flowchart documentation for every system module." />
                {children}
            </AdminLayout>
        );
    }

    if (role === 'super_admin') {
        return (
            <FinanceLayout>
                <FinancePageHeader title="System Docs" subtitle="Interactive flowchart documentation for every system module." />
                {children}
            </FinanceLayout>
        );
    }

    return (
        <AppLayout title="System Docs" description="Interactive flowchart documentation for every system module.">
            {children}
        </AppLayout>
    );
}

export default function SystemDocsShow({ role, doctor, module, moduleTitle, modules }) {
    const src = `/docs/flowcharts/${module}.html?embed=1`;

    return (
        <>
            <Head title={`System Docs — ${moduleTitle}`} />

            <Layout role={role} doctor={doctor}>
                <div className="space-y-4">
                    <nav className="flex flex-wrap items-center gap-2">
                        <Link
                            href={route('system-docs')}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                            All Modules
                        </Link>

                        {Object.entries(modules).map(([slug, title]) => (
                            <Link
                                key={slug}
                                href={route('system-docs.show', slug)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition ${
                                    slug === module
                                        ? 'bg-clinical-gold text-white font-semibold'
                                        : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{moduleIcons[slug]}</span>
                                {title}
                            </Link>
                        ))}
                    </nav>

                    <div className="overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
                        <iframe
                            src={src}
                            title={moduleTitle}
                            className="w-full border-0"
                            style={{ height: 'calc(100vh - 220px)', minHeight: '600px' }}
                        />
                    </div>
                </div>
            </Layout>
        </>
    );
}
