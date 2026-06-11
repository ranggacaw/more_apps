import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DoctorLayout from '@/Layouts/DoctorLayout';
import { CLINIC_TIME_ZONE } from '@/lib/format';
import { Head, Link, router, useForm } from '@inertiajs/react';

const badgeByStatus = {
    completed: 'success',
    reviewed: 'success',
    submitted: 'warning',
};

function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-[24px] border border-border-subtle bg-white p-4 shadow-[0_10px_30px_-24px_rgba(17,24,39,0.55)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
                <p className="text-3xl font-semibold text-slate-950">{value}</p>
                <p className="rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-semibold text-secondary">{helper}</p>
            </div>
        </div>
    );
}

const formatRecordDateParts = (value) => {
    if (!value) {
        return { date: 'Date unavailable', time: null };
    }

    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: CLINIC_TIME_ZONE,
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
    const parts = formatter.format(new Date(value)).replace(/\//g, '-').split(', ');

    return {
        date: parts.length > 1 ? parts.slice(0, -1).join(', ') : parts[0],
        time: parts.length > 1 ? parts[parts.length - 1] : null,
    };
};

function RecordRow({ record }) {
    const eventDate = formatRecordDateParts(record.event_date);

    return (
        <Link href={record.href} className="group grid gap-4 p-4 transition hover:bg-surface-container-low/70 sm:p-5 xl:grid-cols-[128px_minmax(140px,0.75fr)_minmax(220px,1.4fr)_150px_120px_68px] xl:items-center xl:px-6">
            <div>
                <p className="text-sm font-semibold text-slate-950 xl:font-medium">{eventDate.date}</p>
                {eventDate.time ? <p className="mt-1 text-xs text-slate-500">{eventDate.time}</p> : null}
            </div>

            <div>
                <p className="text-sm font-semibold text-slate-950">{record.patient?.name || 'Unknown patient'}</p>
                {record.patient?.email ? <p className="mt-1 text-xs text-slate-500">{record.patient.email}</p> : null}
            </div>

            <div>
                <h2 className="text-sm font-semibold text-slate-950">{record.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-secondary">{record.summary}</p>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500 xl:hidden">
                    <p>{record.package_name ?? 'Not linked'}</p>
                    <p>{record.source_label}</p>
                    <p>{record.attachment_count} file{record.attachment_count === 1 ? '' : 's'}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                <Badge variant="neutral" className="bg-white ring-1 ring-border-subtle">{record.category_label}</Badge>
                <Badge variant={badgeByStatus[record.status] ?? 'neutral'}>{record.status_label}</Badge>
            </div>

            <p className="hidden text-sm text-secondary xl:block">{record.package_name ?? 'Not linked'}</p>

            <div className="xl:text-right">
                <span className="inline-flex items-center justify-center rounded-xl border border-clinical-gold/40 px-3 py-2 text-sm font-semibold text-clinical-gold transition group-hover:bg-clinical-gold group-hover:text-white">
                    Open
                </span>
            </div>
        </Link>
    );
}

function PaginationControls({ filters, pagination }) {
    if (!pagination || pagination.total === 0) {
        return null;
    }

    const visitPage = (page) => {
        router.get(route('doctor.medical-records.index'), {
            patient_name: filters.patient_name,
            search: filters.search,
            category: filters.category,
            date_window: filters.date_window,
            page,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    if (!pagination.has_pages) {
        return <p className="border-t border-border-subtle bg-surface-cream/50 p-4 text-sm text-secondary sm:p-5 lg:p-6">Showing {pagination.from}-{pagination.to} of {pagination.total} records</p>;
    }

    return (
        <div className="flex flex-col gap-3 border-t border-border-subtle bg-surface-cream/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 lg:p-6">
            <p className="text-sm text-secondary">Showing {pagination.from}-{pagination.to} of {pagination.total} records</p>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:flex">
                <Button type="button" variant="outline" className="min-w-24" onClick={() => visitPage(pagination.current_page - 1)} disabled={pagination.current_page <= 1}>
                    Previous
                </Button>
                <span className="min-w-24 text-center text-sm text-secondary">Page {pagination.current_page} of {pagination.last_page}</span>
                <Button type="button" variant="outline" className="min-w-24" onClick={() => visitPage(pagination.current_page + 1)} disabled={pagination.current_page >= pagination.last_page}>
                    Next
                </Button>
            </div>
        </div>
    );
}

export default function MedicalRecords({ doctor, filters, categoryOptions, dateWindowOptions, stats, records, pagination }) {
    const form = useForm({
        patient_name: filters.patient_name ?? '',
        search: filters.search ?? '',
        category: filters.category ?? '',
        date_window: filters.date_window ?? 'all',
    });

    const submit = (event) => {
        event.preventDefault();
        form.get(route('doctor.medical-records.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        form.setData('patient_name', '');
        form.setData('search', '');
        form.setData('category', '');
        form.setData('date_window', 'all');

        router.get(route('doctor.medical-records.index'), {
            patient_name: '',
            search: '',
            category: '',
            date_window: 'all',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Medical Records" />

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-clinical-gold">Doctor Archive</p>
                    <h1 className="mt-2 font-headline-lg text-4xl tracking-tight text-charcoal-depth sm:text-5xl">Medical Records</h1>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-secondary">
                        Search patient history, scan recent clinical activity, and open one focused record workspace without losing context.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                    <Link href={route('doctor.consultations.index')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-secondary shadow-sm transition hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                        Open consultations
                    </Link>
                    <Link href={route('doctor.program-reviews.index')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border-subtle bg-white px-4 py-2.5 text-sm font-semibold text-secondary shadow-sm transition hover:bg-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
                        Open reviews
                    </Link>
                </div>
            </section>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Records" value={stats.total_records} helper="All time" />
                <StatCard label="Patients" value={stats.patient_count} helper="Unique" />
                <StatCard label="Consultations" value={stats.consultation_records} helper="Completed" />
                <StatCard label="Progress" value={stats.progress_records} helper="Reviews" />
            </div>

            <div className="mt-6 space-y-6">
                <Card className="rounded-[28px] border-border-subtle bg-white shadow-[0_10px_34px_-28px_rgba(17,24,39,0.55)]">
                    <CardContent className="p-4 sm:p-5 lg:p-6">
                        <form onSubmit={submit} className="grid gap-4 xl:grid-cols-[minmax(220px,0.9fr)_minmax(280px,1.25fr)_180px_180px_auto] xl:items-end">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Patient</label>
                                <div className="relative w-full">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-lg select-none">search</span>
                                    </span>
                                    <Input
                                        type="text"
                                        value={form.data.patient_name}
                                        onChange={(event) => form.setData('patient_name', event.target.value)}
                                        placeholder="Search by patient name"
                                        className="h-12 rounded-xl border-border-subtle bg-surface-cream pl-9"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Record text</label>
                                <div className="relative w-full">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-lg select-none">manage_search</span>
                                    </span>
                                    <Input
                                        type="text"
                                        value={form.data.search}
                                        onChange={(event) => form.setData('search', event.target.value)}
                                        placeholder="Search notes, uploads, or package names"
                                        className="h-12 rounded-xl border-border-subtle bg-surface-cream pl-9"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Category</label>
                                <select className="h-12 w-full rounded-xl border border-border-subtle bg-surface-cream px-3 text-sm text-secondary" value={form.data.category} onChange={(event) => form.setData('category', event.target.value)}>
                                    {categoryOptions.map((option) => (
                                        <option key={option.value || 'all-categories'} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-900">Date</label>
                                <select className="h-12 w-full rounded-xl border border-border-subtle bg-surface-cream px-3 text-sm text-secondary" value={form.data.date_window} onChange={(event) => form.setData('date_window', event.target.value)}>
                                    {dateWindowOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2 xl:w-48">
                                <Button className="h-12 border border-clinical-gold bg-clinical-gold text-white hover:bg-clinical-gold-light" disabled={form.processing}>{form.processing ? 'Filtering...' : 'Apply'}</Button>
                                <Button type="button" variant="outline" onClick={resetFilters} disabled={form.processing} className="h-12 border-border-subtle text-secondary hover:bg-surface-container-low">Reset</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden rounded-[28px] border-border-subtle bg-white shadow-[0_14px_38px_-30px_rgba(17,24,39,0.65)]">
                    <CardHeader className="border-b border-border-subtle p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between lg:gap-6 lg:p-6">
                        <div>
                            <CardTitle>Archive records</CardTitle>
                            <CardDescription>
                                {pagination.total > 0
                                    ? `Showing ${pagination.from}-${pagination.to} of ${pagination.total} matching records, sorted by the most recent activity.`
                                    : 'No matching records yet.'}
                            </CardDescription>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-secondary sm:mt-0">
                            <span className="rounded-full border border-border-subtle bg-surface-cream px-3 py-1">Consultation</span>
                            <span className="rounded-full border border-border-subtle bg-surface-cream px-3 py-1">Progress</span>
                            <span className="rounded-full border border-border-subtle bg-surface-cream px-3 py-1">Workspace</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {records.length > 0 ? (
                            <>
                                <div className="hidden grid-cols-[128px_minmax(140px,0.75fr)_minmax(220px,1.4fr)_150px_120px_68px] gap-4 border-b border-border-subtle bg-surface-cream/70 px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-secondary xl:grid">
                                    <span>Date</span>
                                    <span>Patient</span>
                                    <span>Record</span>
                                    <span>Status</span>
                                    <span>Package</span>
                                    <span className="text-right">Open</span>
                                </div>
                                <div className="divide-y divide-border-subtle">
                                    {records.map((record) => <RecordRow key={record.id} record={record} />)}
                                </div>
                                <PaginationControls filters={filters} pagination={pagination} />
                            </>
                        ) : (
                            <div className="m-4 rounded-[28px] border border-dashed border-border-subtle bg-surface-cream px-6 py-12 text-center sm:m-5 lg:m-6">
                                <p className="text-lg font-semibold text-slate-900">No records match your current filters.</p>
                                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-secondary">Completed consultations and weekly progress submissions from your patients will appear here. Reset filters to return to the full archive.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DoctorLayout>
    );
}
