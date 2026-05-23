import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link, router, useForm } from '@inertiajs/react';

const badgeByStatus = {
    completed: 'success',
    reviewed: 'success',
    submitted: 'warning',
};

function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-[24px] border border-border-subtle bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
    );
}

function RecordCard({ record }) {
    return (
        <Link href={record.href} className="block rounded-[24px] border border-border-subtle bg-white p-5 transition hover:border-slate-300 hover:bg-slate-50/60">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="neutral">{record.category_label}</Badge>
                        <Badge variant={badgeByStatus[record.status] ?? 'neutral'}>{record.status_label}</Badge>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-slate-950">{record.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-secondary">{record.summary}</p>
                </div>

                <div className="shrink-0 text-sm text-slate-500 sm:text-right">
                    <p>{record.event_date ? formatDateTime(record.event_date) : 'Date unavailable'}</p>
                    <p className="mt-1">{record.attachment_count} file{record.attachment_count === 1 ? '' : 's'}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                {record.patient?.name ? <p>Patient: {record.patient.name}</p> : null}
                {record.package_name ? <p>Package: {record.package_name}</p> : null}
                <p>{record.source_label}</p>
            </div>
        </Link>
    );
}

function RecordTable({ records }) {
    return (
        <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full border-separate border-spacing-0">
                <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Patient</th>
                        <th className="px-4 py-3">Record</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Package</th>
                        <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => (
                        <tr key={record.id} className="border-t border-slate-100 align-top">
                            <td className="px-4 py-4 text-sm text-slate-600">{record.event_date ? formatDateTime(record.event_date) : 'Date unavailable'}</td>
                            <td className="px-4 py-4">
                                <p className="text-sm font-medium text-slate-900">{record.patient?.name ?? 'Unknown patient'}</p>
                                {record.patient?.email ? <p className="mt-1 text-xs text-slate-500">{record.patient.email}</p> : null}
                            </td>
                            <td className="px-4 py-4">
                                <p className="text-sm font-medium text-slate-900">{record.title}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{record.summary}</p>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="neutral">{record.category_label}</Badge>
                                    <Badge variant={badgeByStatus[record.status] ?? 'neutral'}>{record.status_label}</Badge>
                                </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">{record.package_name ?? 'Not linked'}</td>
                            <td className="px-4 py-4 text-right">
                                <Link href={record.href} className="text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
                                    Open workspace
                                </Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
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
        return <p className="border-t border-slate-100 pt-4 text-sm text-slate-500">Showing {pagination.from}-{pagination.to} of {pagination.total} records</p>;
    }

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">Showing {pagination.from}-{pagination.to} of {pagination.total} records</p>
            <div className="flex items-center gap-2">
                <Button type="button" variant="outline" className="min-w-24" onClick={() => visitPage(pagination.current_page - 1)} disabled={pagination.current_page <= 1}>
                    Previous
                </Button>
                <span className="min-w-24 text-center text-sm text-slate-500">Page {pagination.current_page} of {pagination.last_page}</span>
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

            <DoctorPageHeader title="Medical Records" subtitle="Browse the archive by patient, compare rows quickly, and open one focused record workspace at a time." />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Records" value={stats.total_records} helper="Consultations and weekly progress entries" />
                <StatCard label="Patients" value={stats.patient_count} helper="Unique patients in your archive" />
                <StatCard label="Consultations" value={stats.consultation_records} helper="Completed consultation notes" />
                <StatCard label="Progress" value={stats.progress_records} helper="Weekly check-ins and reviews" />
            </div>

            <div className="mt-6 space-y-6">
                <Card className="border-border-subtle bg-white">
                    <CardHeader>
                        <CardTitle>Filter archive</CardTitle>
                        <CardDescription>Start with patient name, then narrow by record text, package context, or file name while keeping the archive scannable.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto] lg:items-end">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Patient name</label>
                                <Input value={form.data.patient_name} onChange={(event) => form.setData('patient_name', event.target.value)} placeholder="Search by patient name" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Record search</label>
                                <Input value={form.data.search} onChange={(event) => form.setData('search', event.target.value)} placeholder="Search notes, uploads, or package names" />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                                <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.category} onChange={(event) => form.setData('category', event.target.value)}>
                                    {categoryOptions.map((option) => (
                                        <option key={option.value || 'all-categories'} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Date window</label>
                                <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.date_window} onChange={(event) => form.setData('date_window', event.target.value)}>
                                    {dateWindowOptions.map((option) => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                                <Button className="sm:min-w-28" disabled={form.processing}>{form.processing ? 'Filtering...' : 'Apply'}</Button>
                                <Button type="button" variant="outline" onClick={resetFilters} disabled={form.processing} className="sm:min-w-24">Reset</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-end gap-3">
                    <Link href={route('doctor.consultations.index')} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Open consultations
                    </Link>
                    <Link href={route('doctor.program-reviews.index')} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Open program reviews
                    </Link>
                </div>

                <Card className="border-border-subtle bg-white">
                    <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <CardTitle>Archive records</CardTitle>
                            <CardDescription>
                                {pagination.total > 0
                                    ? `Showing ${pagination.from}-${pagination.to} of ${pagination.total} matching records, sorted by the most recent activity.`
                                    : 'No matching records yet.'}
                            </CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                            <span className="rounded-full border border-slate-200 px-2.5 py-1">Consultation</span>
                            <span className="rounded-full border border-slate-200 px-2.5 py-1">Progress</span>
                            <span className="rounded-full border border-slate-200 px-2.5 py-1">Focused workspace</span>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {records.length > 0 ? (
                            <>
                                <RecordTable records={records} />
                                <div className="space-y-4 lg:hidden">
                                    {records.map((record) => <RecordCard key={record.id} record={record} />)}
                                </div>
                                <PaginationControls filters={filters} pagination={pagination} />
                            </>
                        ) : (
                            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                                <p className="text-lg font-semibold text-slate-900">No records match your current filters.</p>
                                <p className="mt-2 text-sm leading-6 text-slate-500">Completed consultations and weekly progress submissions from your patients will appear here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DoctorLayout>
    );
}
