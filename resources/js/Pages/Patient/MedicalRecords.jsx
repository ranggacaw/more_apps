import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import PatientLayout from '@/Layouts/PatientLayout';
import { formatDateTime } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const imageAssetPattern = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;

function isImageAsset(name) {
    return typeof name === 'string' && imageAssetPattern.test(name);
}

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
                {record.clinician?.name ? <p>Clinician: {record.clinician.name}</p> : null}
                {record.package_name ? <p>Package: {record.package_name}</p> : null}
                <p>{record.source_label}</p>
            </div>
        </button>
    );
}

function DetailPanel({ record }) {
    if (!record) {
        return (
            <Card className="border-border-subtle bg-white xl:sticky xl:top-28">
                <CardContent className="p-6 text-sm leading-6 text-slate-500">
                    Select a record to read the full note, doctor follow-up, and available attachments.
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
                    {record.clinician?.name ? ` · ${record.clinician.name}` : ''}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
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
                                    {attachment.url && isImageAsset(attachment.name) ? (
                                        <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                            <img src={attachment.url} alt={attachment.label} className="h-56 w-full object-cover" />
                                        </a>
                                    ) : null}
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

export default function MedicalRecords({ filters, categoryOptions, dateWindowOptions, stats, records }) {
    const form = useForm({
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

    const selectedRecord = records.find((record) => record.id === selectedRecordId) ?? null;

    return (
        <PatientLayout>
            <Head title="Medical Records" />

            <div className="space-y-6">
                <Card className="border-border-subtle bg-white">
                    <CardContent className="p-6 lg:p-8">
                        <div className="max-w-3xl">
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clinical-gold">Patient archive</p>
                            <h1 className="mt-3 font-headline text-3xl leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                                Medical records designed for reading, not hunting.
                            </h1>
                            <p className="mt-4 text-sm leading-7 text-secondary sm:text-base">
                                Review consultation notes, treatment-plan files, and weekly progress in one clear archive built for scanning first and detail second.
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

                <div className="space-y-6">
                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Search archive</CardTitle>
                            <CardDescription>Filter by note text, clinician, package context, or attachment name without losing your place in the timeline.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.7fr)_minmax(180px,0.7fr)_auto] lg:items-end">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
                                    <Input
                                        value={form.data.search}
                                        onChange={(event) => form.setData('search', event.target.value)}
                                        placeholder="Search notes, meal plans, uploads, or doctor names"
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

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
                        <div className="space-y-6">
                            <Card className="border-border-subtle bg-white">
                                <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <CardTitle>Archive timeline</CardTitle>
                                        <CardDescription>{records.length} matching record{records.length === 1 ? '' : 's'} sorted by the most recent activity.</CardDescription>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-500">
                                        <span className="rounded-full border border-slate-200 px-2.5 py-1">Consultation</span>
                                        <span className="rounded-full border border-slate-200 px-2.5 py-1">Progress</span>
                                        <span className="rounded-full border border-slate-200 px-2.5 py-1">Reviewed</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {records.length > 0 ? (
                                        records.map((record) => (
                                            <RecordCard
                                                key={record.id}
                                                record={record}
                                                active={record.id === selectedRecordId}
                                                onSelect={setSelectedRecordId}
                                            />
                                        ))
                                    ) : (
                                        <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                                            <p className="text-lg font-semibold text-slate-900">No records match your current filters.</p>
                                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                                Completed consultations and weekly progress entries will appear here as your archive grows.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <DetailPanel record={selectedRecord} />
                    </div>
                </div>
            </div>
        </PatientLayout>
    );
}
