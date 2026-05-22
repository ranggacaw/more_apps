import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DoctorLayout from '@/Layouts/DoctorLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

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

function RecordCard({ record, active, onSelect }) {
    return (
        <button
            type="button"
            onClick={() => onSelect(record.id)}
            className={`w-full rounded-[24px] border p-5 text-left transition ${
                active
                    ? 'border-slate-900 bg-slate-50 shadow-sm'
                    : 'border-border-subtle bg-white hover:border-slate-300 hover:bg-slate-50/60'
            }`}
        >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="neutral">{record.category_label}</Badge>
                        <Badge variant={badgeByStatus[record.status] ?? 'neutral'}>{record.status_label}</Badge>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-950">{record.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-secondary">{record.summary}</p>
                </div>

                <div className="shrink-0 text-sm text-slate-500 sm:text-right">
                    <p>{record.event_date ? formatDateTime(record.event_date) : 'Date unavailable'}</p>
                    <p className="mt-1">{record.attachments.length} attachment{record.attachments.length === 1 ? '' : 's'}</p>
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                {record.patient?.name ? <p>Patient: {record.patient.name}</p> : null}
                {record.package_name ? <p>Package: {record.package_name}</p> : null}
                <p>{record.source_label}</p>
            </div>
        </button>
    );
}

function EmptyState() {
    return (
        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-slate-900">No records match your current filters.</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
                Completed consultations and weekly progress submissions from your patients will appear here.
            </p>
        </div>
    );
}

function RecordTable({ records, selectedRecordId, onSelect }) {
    const handleKeyDown = (event, recordId) => {
        if (event.key !== 'Enter' && event.key !== ' ') {
            return;
        }

        event.preventDefault();
        onSelect(recordId);
    };

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
                        <th className="px-4 py-3 text-right">Files</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((record) => {
                        const active = record.id === selectedRecordId;

                        return (
                            <tr
                                key={record.id}
                                role="button"
                                tabIndex={0}
                                aria-selected={active}
                                onClick={() => onSelect(record.id)}
                                onKeyDown={(event) => handleKeyDown(event, record.id)}
                                className={`cursor-pointer border-t border-slate-100 align-top transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-inset ${
                                    active ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                                }`}
                            >
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
                                <td className="px-4 py-4 text-right text-sm font-medium text-slate-600">{record.attachments.length}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function PaginationControls({ filters, pagination }) {
    if (!pagination || pagination.total === 0) {
        return null;
    }

    if (!pagination.has_pages) {
        return (
            <div className="border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                    Showing {pagination.from}-{pagination.to} of {pagination.total} records
                </p>
            </div>
        );
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

    return (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
                Showing {pagination.from}-{pagination.to} of {pagination.total} records
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    className="min-w-24"
                    onClick={() => visitPage(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                >
                    Previous
                </Button>
                <span className="min-w-24 text-center text-sm text-slate-500">
                    Page {pagination.current_page} of {pagination.last_page}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    className="min-w-24"
                    onClick={() => visitPage(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}

function DetailPanel({ record }) {
    if (!record) {
        return (
            <Card className="border-border-subtle bg-white xl:sticky xl:top-28">
                <CardContent className="p-6 text-sm leading-6 text-slate-500">
                    Select a record to review the full note, patient context, and attached files.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border-subtle bg-white xl:sticky xl:top-28">
            <CardHeader className="border-b border-slate-100 pb-5">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="neutral">{record.category_label}</Badge>
                    <Badge variant={badgeByStatus[record.status] ?? 'neutral'}>{record.status_label}</Badge>
                </div>
                <CardTitle className="font-headline text-2xl leading-tight text-slate-950">{record.title}</CardTitle>
                <CardDescription>
                    {record.event_date ? formatDateTime(record.event_date) : 'Date unavailable'}
                    {record.patient?.name ? ` · ${record.patient.name}` : ''}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {record.patient ? (
                        <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Patient</p>
                            <p className="mt-2 text-sm font-medium text-slate-900">{record.patient.name}</p>
                            {record.patient.email ? <p className="mt-1 text-sm text-slate-500">{record.patient.email}</p> : null}
                            {record.patient.phone ? <p className="mt-1 text-sm text-slate-500">{record.patient.phone}</p> : null}
                        </div>
                    ) : null}
                    {record.package_name ? (
                        <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Linked package</p>
                            <p className="mt-2 text-sm font-medium text-slate-900">{record.package_name}</p>
                        </div>
                    ) : null}
                    <div className="rounded-2xl border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Attachments</p>
                        <p className="mt-2 text-sm font-medium text-slate-900">
                            {record.attachments.length} attachment{record.attachments.length === 1 ? '' : 's'}
                        </p>
                    </div>
                </div>

                {record.metadata.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {record.metadata.map((item) => (
                            <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                {item}
                            </span>
                        ))}
                    </div>
                ) : null}

                {record.full_note ? (
                    <div>
                        <p className="text-sm font-medium text-slate-900">Clinical note</p>
                        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                            <p className="whitespace-pre-wrap">{record.full_note}</p>
                        </div>
                    </div>
                ) : null}

                {record.review_note ? (
                    <div>
                        <p className="text-sm font-medium text-slate-900">Doctor follow-up</p>
                        <div className="mt-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                            <p className="whitespace-pre-wrap">{record.review_note}</p>
                        </div>
                    </div>
                ) : null}

                {record.intake_notes ? (
                    <div>
                        <p className="text-sm font-medium text-slate-900">Linked intake context</p>
                        <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                            <p className="whitespace-pre-wrap">{record.intake_notes}</p>
                        </div>
                    </div>
                ) : null}

                <div>
                    <p className="text-sm font-medium text-slate-900">Attachments</p>
                    {record.attachments.length > 0 ? (
                        <div className="mt-3 space-y-3">
                            {record.attachments.map((attachment) => (
                                <div key={`${record.id}-${attachment.label}-${attachment.name}`} className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-sm font-medium text-slate-900">{attachment.label}</p>
                                    <p className="mt-1 text-xs text-slate-500">{attachment.name}</p>
                                    {attachment.url ? (
                                        <a
                                            href={attachment.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-3 inline-flex text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light"
                                        >
                                            Open attachment
                                        </a>
                                    ) : (
                                        <p className="mt-3 text-sm text-slate-500">Attachment is stored internally and does not support direct temporary opening on this disk.</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="mt-2 text-sm text-slate-500">No attachments are stored on this record.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function ProgressRecordEditor({ record }) {
    const form = useForm({
        weight_kg: record?.weight_kg ?? '',
        waist_cm: record?.waist_cm ?? '',
        notes: record?.full_note ?? '',
        review_notes: record?.review_note ?? '',
        progress_photo: null,
        supporting_document: null,
    });

    useEffect(() => {
        form.setData({
            weight_kg: record?.weight_kg ?? '',
            waist_cm: record?.waist_cm ?? '',
            notes: record?.full_note ?? '',
            review_notes: record?.review_note ?? '',
            progress_photo: null,
            supporting_document: null,
        });
        form.clearErrors();
    }, [record?.id]);

    if (!record || record.category !== 'progress') {
        return null;
    }

    const submit = (event) => {
        event.preventDefault();
        form.patch(route('doctor.program.check-ins.update', record.source_id), {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    return (
        <Card className="border-border-subtle bg-white">
            <CardHeader>
                <CardTitle>Edit Progress Entry</CardTitle>
                <CardDescription>Doctors can adjust metrics, patient-facing notes, review notes, and replace uploaded files for this weekly record.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Weight (kg)</label>
                            <Input
                                type="number"
                                min="1"
                                max="500"
                                step="0.1"
                                value={form.data.weight_kg}
                                onChange={(event) => form.setData('weight_kg', event.target.value)}
                                required
                            />
                            {form.errors.weight_kg ? <p className="mt-2 text-sm text-rose-600">{form.errors.weight_kg}</p> : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Waist (cm)</label>
                            <Input
                                type="number"
                                min="1"
                                max="500"
                                step="0.1"
                                value={form.data.waist_cm}
                                onChange={(event) => form.setData('waist_cm', event.target.value)}
                                required
                            />
                            {form.errors.waist_cm ? <p className="mt-2 text-sm text-rose-600">{form.errors.waist_cm}</p> : null}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Progress note</label>
                        <Textarea
                            value={form.data.notes}
                            onChange={(event) => form.setData('notes', event.target.value)}
                            placeholder="Update the weekly progress summary, symptoms, adherence notes, or follow-up context."
                        />
                        {form.errors.notes ? <p className="mt-2 text-sm text-rose-600">{form.errors.notes}</p> : null}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Doctor review notes</label>
                        <Textarea
                            value={form.data.review_notes}
                            onChange={(event) => form.setData('review_notes', event.target.value)}
                            placeholder="Document your review outcome, adjustments, and next steps. Leave empty to mark this entry as not reviewed yet."
                        />
                        {form.errors.review_notes ? <p className="mt-2 text-sm text-rose-600">{form.errors.review_notes}</p> : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Replace progress photo</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => form.setData('progress_photo', event.target.files?.[0] ?? null)}
                                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
                            />
                            {form.errors.progress_photo ? <p className="mt-2 text-sm text-rose-600">{form.errors.progress_photo}</p> : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Replace supporting document</label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(event) => form.setData('supporting_document', event.target.files?.[0] ?? null)}
                                className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
                            />
                            {form.errors.supporting_document ? <p className="mt-2 text-sm text-rose-600">{form.errors.supporting_document}</p> : null}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">Updates save directly to the same medical record entry and stay visible to the patient archive.</p>
                        <Button disabled={form.processing} className="sm:min-w-40">
                            {form.processing ? 'Saving...' : 'Save Progress Changes'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function MedicalRecords({ doctor, filters, categoryOptions, dateWindowOptions, stats, records, pagination }) {
    const form = useForm({
        patient_name: filters.patient_name ?? '',
        search: filters.search ?? '',
        category: filters.category ?? '',
        date_window: filters.date_window ?? 'all',
    });
    const [selectedRecordId, setSelectedRecordId] = useState(records[0]?.id ?? null);

    useEffect(() => {
        if (records.some((record) => record.id === selectedRecordId)) {
            return;
        }

        setSelectedRecordId(records[0]?.id ?? null);
    }, [records, selectedRecordId]);

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

    const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? null;

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Medical Records" />

            <div className="space-y-6">
                <Card className="border-border-subtle bg-white">
                    <CardContent className="p-6 lg:p-8">
                        <div className="max-w-3xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clinical-gold">Doctor archive</p>
                            <h1 className="mt-3 font-headline text-3xl leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                                Review patient records without digging through the dashboard.
                            </h1>
                            <p className="mt-4 text-sm leading-7 text-secondary sm:text-base">
                                Browse completed consultations and weekly progress updates for your patients in one searchable archive.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Records" value={stats.total_records} helper="Consultations and weekly progress entries" />
                    <StatCard label="Patients" value={stats.patient_count} helper="Unique patients in your archive" />
                    <StatCard label="Consultations" value={stats.consultation_records} helper="Completed consultation notes" />
                    <StatCard label="Progress" value={stats.progress_records} helper="Weekly check-ins and reviews" />
                </div>

                <div className="space-y-6">
                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Search archive</CardTitle>
                            <CardDescription>Start with patient name, then narrow by record text, package context, or file name while keeping the latest records in view.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto] lg:items-end">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Patient name</label>
                                    <Input
                                        value={form.data.patient_name}
                                        onChange={(event) => form.setData('patient_name', event.target.value)}
                                        placeholder="Search by patient name"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Record search</label>
                                    <Input
                                        value={form.data.search}
                                        onChange={(event) => form.setData('search', event.target.value)}
                                        placeholder="Search notes, uploads, or package names"
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                                    <select
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                        value={form.data.category}
                                        onChange={(event) => form.setData('category', event.target.value)}
                                    >
                                        {categoryOptions.map((option) => (
                                            <option key={option.value || 'all-categories'} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Date window</label>
                                    <select
                                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                        value={form.data.date_window}
                                        onChange={(event) => form.setData('date_window', event.target.value)}
                                    >
                                        {dateWindowOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                                    <Button className="sm:min-w-28" disabled={form.processing}>{form.processing ? 'Filtering...' : 'Apply'}</Button>
                                    <Button type="button" variant="outline" onClick={resetFilters} disabled={form.processing} className="sm:min-w-24">
                                        Reset
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end">
                        <Link href={`${route('doctor.dashboard')}#programs`} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                            Open Program Workspace
                        </Link>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
                        <div className="space-y-6">
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
                                        <span className="rounded-full border border-slate-200 px-2.5 py-1">Reviewed</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {records.length > 0 ? (
                                        <>
                                            <RecordTable records={records} selectedRecordId={selectedRecordId} onSelect={setSelectedRecordId} />
                                            <div className="space-y-4 lg:hidden">
                                                {records.map((record) => (
                                                    <RecordCard
                                                        key={record.id}
                                                        record={record}
                                                        active={record.id === selectedRecordId}
                                                        onSelect={setSelectedRecordId}
                                                    />
                                                ))}
                                            </div>
                                            <PaginationControls filters={filters} pagination={pagination} />
                                        </>
                                    ) : (
                                        <EmptyState />
                                    )}
                                </CardContent>
                            </Card>

                            <ProgressRecordEditor record={selectedRecord} />
                        </div>

                        <DetailPanel record={selectedRecord} />
                    </div>
                </div>
            </div>
        </DoctorLayout>
    );
}
