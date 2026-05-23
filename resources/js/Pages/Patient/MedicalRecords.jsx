import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PatientLayout from '@/Layouts/PatientLayout';
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
                {record.clinician?.name ? <p>Clinician: {record.clinician.name}</p> : null}
                {record.package_name ? <p>Package: {record.package_name}</p> : null}
                <p>{record.source_label}</p>
            </div>
        </Link>
    );
}

import { DataTable, SortableHeader } from '@/Components/DataTable';

const columns = [
    {
        accessorKey: "event_date",
        header: ({ column }) => <SortableHeader column={column} title="Date" />,
        cell: ({ row }) => {
            const date = row.getValue("event_date");
            return <span className="text-sm text-slate-600">{date ? formatDateTime(date) : 'Date unavailable'}</span>;
        },
    },
    {
        accessorKey: "title",
        header: ({ column }) => <SortableHeader column={column} title="Record" />,
        cell: ({ row }) => {
            const title = row.getValue("title");
            const summary = row.original.summary;
            return (
                <div>
                    <p className="text-sm font-medium text-slate-900">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{summary}</p>
                </div>
            );
        },
    },
    {
        accessorKey: "clinician.name",
        header: ({ column }) => <SortableHeader column={column} title="Clinician" />,
        cell: ({ row }) => {
            const name = row.getValue("clinician.name");
            return <span className="text-sm text-slate-600">{name ?? 'Not recorded'}</span>;
        },
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const record = row.original;
            return (
                <div className="flex flex-wrap gap-2">
                    <Badge variant="neutral">{record.category_label}</Badge>
                    <Badge variant={badgeByStatus[record.status] ?? 'neutral'}>{record.status_label}</Badge>
                </div>
            );
        },
    },
    {
        accessorKey: "package_name",
        header: ({ column }) => <SortableHeader column={column} title="Package" />,
        cell: ({ row }) => {
            const packageName = row.getValue("package_name");
            return <span className="text-sm text-slate-600">{packageName ?? 'Not linked'}</span>;
        },
    },
    {
        id: "actions",
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => {
            return (
                <div className="text-right">
                    <Link href={row.original.href} className="text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
                        Open record
                    </Link>
                </div>
            );
        },
    },
];

function RecordTable({ records }) {
    return (
        <div className="hidden lg:block">
            <DataTable columns={columns} data={records} />
        </div>
    );
}

function PaginationControls({ filters, pagination }) {
    if (!pagination || pagination.total === 0) {
        return null;
    }

    const visitPage = (page) => {
        router.get(route('patient.medical-records.index'), {
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

export default function MedicalRecords({ filters, categoryOptions, dateWindowOptions, stats, records, pagination }) {
    const form = useForm({
        search: filters.search ?? '',
        category: filters.category ?? '',
        date_window: filters.date_window ?? 'all',
    });

    const submit = (event) => {
        event.preventDefault();
        form.get(route('patient.medical-records.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        form.setData('search', '');
        form.setData('category', '');
        form.setData('date_window', 'all');

        router.get(route('patient.medical-records.index'), {
            search: '',
            category: '',
            date_window: 'all',
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <PatientLayout>
            <Head title="Medical Records" />

            <div className="space-y-6">
                <Card className="border-border-subtle bg-white">
                    <CardContent className="p-6 lg:p-8">
                        <div className="max-w-3xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clinical-gold">Patient archive</p>
                            <h1 className="mt-3 font-headline text-3xl leading-tight text-slate-950 sm:text-4xl">Medical records in one scan-first archive.</h1>
                            <p className="mt-4 text-sm leading-7 text-secondary sm:text-base">
                                Browse consultations and weekly progress from a single index, then open one focused detail page at a time when you need the full record.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Records" value={stats.total_records} helper="Consultations and weekly progress entries" />
                    <StatCard label="Attachments" value={stats.attachment_count} helper="Meal plans, uploads, and progress files" />
                    <StatCard label="Consultations" value={stats.consultation_records} helper="Completed doctor notes" />
                    <StatCard label="Progress" value={stats.progress_records} helper="Weekly check-ins and reviews" />
                </div>

                <Card className="border-border-subtle bg-white">
                    <CardHeader>
                        <CardTitle>Filter archive</CardTitle>
                        <CardDescription>Search by note text, clinician, package context, or attachment name without losing your place in the archive.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto] lg:items-end">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
                                <Input value={form.data.search} onChange={(event) => form.setData('search', event.target.value)} placeholder="Search notes, files, or doctor names" />
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
                            <span className="rounded-full border border-slate-200 px-2.5 py-1">Detail page</span>
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
                                <p className="mt-2 text-sm leading-6 text-slate-500">Completed consultations and weekly progress entries will appear here as your archive grows.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
