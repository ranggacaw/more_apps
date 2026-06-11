import AdminLayout, { AdminPageHeader } from '@/Layouts/AdminLayout';
import AppLayout from '@/Layouts/AppLayout';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import FinanceLayout, { FinancePageHeader } from '@/Layouts/FinanceLayout';
import { Head, Link } from '@inertiajs/react';

const modules = [
    {
        slug: 'system-architecture',
        title: 'System Architecture',
        description: 'Route boundaries, authentication flow, domain model, booking lifecycle, queue origin, and state transitions.',
        icon: 'account_tree',
        color: 'cyan',
    },
    {
        slug: 'admin-operations',
        title: 'Admin Operations',
        description: 'Dashboard, assisted bookings, schedule settings, walk-in queue, invoices, broadcasts, content, users, and master data.',
        icon: 'admin_panel_settings',
        color: 'green',
    },
    {
        slug: 'doctor-clinical',
        title: 'Doctor Clinical',
        description: 'Consultation workspace, meeting links, scheduled and walk-in completion, line items, program reviews, medical records, and packages.',
        icon: 'stethoscope',
        color: 'amber',
    },
    {
        slug: 'payments-finance',
        title: 'Payments & Finance',
        description: 'Midtrans webhook, internal billing handoffs, profit & loss, balance sheet, and finance mutations.',
        icon: 'payments',
        color: 'red',
    },
    {
        slug: 'notifications-reminders',
        title: 'Notifications & Reminders',
        description: 'Booking jobs, package jobs, WhatsApp broadcasts, scheduler tasks, and provider configuration.',
        icon: 'notifications_active',
        color: 'indigo',
    },
];

const colorMap = {
    cyan: {
        bg: 'bg-cyan-50',
        border: 'border-cyan-200',
        iconBg: 'bg-cyan-100',
        iconText: 'text-cyan-700',
        hover: 'hover:border-cyan-300 hover:shadow-cyan-100/50',
    },
    green: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        iconBg: 'bg-emerald-100',
        iconText: 'text-emerald-700',
        hover: 'hover:border-emerald-300 hover:shadow-emerald-100/50',
    },
    amber: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        iconBg: 'bg-amber-100',
        iconText: 'text-amber-700',
        hover: 'hover:border-amber-300 hover:shadow-amber-100/50',
    },
    red: {
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        iconBg: 'bg-rose-100',
        iconText: 'text-rose-700',
        hover: 'hover:border-rose-300 hover:shadow-rose-100/50',
    },
    indigo: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        iconBg: 'bg-indigo-100',
        iconText: 'text-indigo-700',
        hover: 'hover:border-indigo-300 hover:shadow-indigo-100/50',
    },
};

function ModuleCard({ module }) {
    const colors = colorMap[module.color];

    return (
        <Link
            href={route('system-docs.show', module.slug)}
            className={`group flex flex-col rounded-[20px] border ${colors.border} ${colors.bg} p-6 shadow-sm transition-all duration-200 ${colors.hover} hover:shadow-lg sm:p-7`}
        >
            <div className="mb-4 flex items-center justify-between">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${colors.iconBg} ${colors.iconText}`}>
                    <span className="material-symbols-outlined text-[22px]">{module.icon}</span>
                </div>
                <span className="material-symbols-outlined text-lg text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-600">
                    arrow_forward
                </span>
            </div>

            <h3 className="font-label-lg text-label-lg font-bold text-slate-900 mb-2">{module.title}</h3>
            <p className="font-body-sm text-body-sm text-slate-600 leading-relaxed flex-1">{module.description}</p>
        </Link>
    );
}

function DocsContent() {
    return (
        <div className="space-y-8">
            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">System Documentation</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Interactive Flowcharts</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
                    Visual system documentation with Mermaid flowcharts covering every module. Browse inline with full navigation and color-coded process diagrams.
                </p>
            </section>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                    <ModuleCard key={module.slug} module={module} />
                ))}
            </div>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="font-label-lg text-label-lg font-bold text-slate-900 mb-3">How to use</h2>
                <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 leading-relaxed">
                    <li>Click any module card to open its interactive flowchart page.</li>
                    <li>Use the module tabs at the top to switch between sections.</li>
                    <li>Flowcharts are rendered with Mermaid.js and show full process flows with color-coded steps.</li>
                    <li>Use the sidebar inside each flowchart page to jump to specific diagrams.</li>
                </ol>
            </section>
        </div>
    );
}

export default function SystemDocs({ role, doctor }) {
    const content = <DocsContent />;

    return (
        <>
            <Head title="System Documentation" />

            {role === 'doctor' ? (
                <DoctorLayout doctor={doctor}>
                    <DoctorPageHeader
                        title="System Docs"
                        subtitle="Interactive flowchart documentation for every system module."
                    />
                    {content}
                </DoctorLayout>
            ) : role === 'admin' ? (
                <AdminLayout>
                    <AdminPageHeader
                        title="System Docs"
                        subtitle="Interactive flowchart documentation for every system module."
                    />
                    {content}
                </AdminLayout>
            ) : role === 'super_admin' ? (
                <FinanceLayout>
                    <FinancePageHeader
                        title="System Docs"
                        subtitle="Interactive flowchart documentation for every system module."
                    />
                    {content}
                </FinanceLayout>
            ) : (
                <AppLayout
                    title="System Docs"
                    description="Interactive flowchart documentation for every system module."
                >
                    {content}
                </AppLayout>
            )}
        </>
    );
}
