import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

const imageAssetPattern = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;

function isImageAsset(name) {
    return typeof name === 'string' && imageAssetPattern.test(name);
}

const badgeByStatus = {
    completed: 'success',
    reviewed: 'success',
    submitted: 'warning',
};

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
                <CardDescription>Update the weekly metrics, patient-facing notes, doctor review, and supporting files for this one record.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Weight (kg)</label>
                            <Input type="number" min="1" max="500" step="0.1" value={form.data.weight_kg} onChange={(event) => form.setData('weight_kg', event.target.value)} required />
                            {form.errors.weight_kg ? <p className="mt-2 text-sm text-rose-600">{form.errors.weight_kg}</p> : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Waist (cm)</label>
                            <Input type="number" min="1" max="500" step="0.1" value={form.data.waist_cm} onChange={(event) => form.setData('waist_cm', event.target.value)} required />
                            {form.errors.waist_cm ? <p className="mt-2 text-sm text-rose-600">{form.errors.waist_cm}</p> : null}
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Progress note</label>
                        <Textarea value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} placeholder="Update the weekly progress summary, symptoms, adherence notes, or follow-up context." />
                        {form.errors.notes ? <p className="mt-2 text-sm text-rose-600">{form.errors.notes}</p> : null}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Doctor review notes</label>
                        <Textarea value={form.data.review_notes} onChange={(event) => form.setData('review_notes', event.target.value)} placeholder="Document your review outcome, adjustments, and next steps. Leave empty to mark this entry as not reviewed yet." />
                        {form.errors.review_notes ? <p className="mt-2 text-sm text-rose-600">{form.errors.review_notes}</p> : null}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Replace progress photo</label>
                            <input type="file" accept="image/*" onChange={(event) => form.setData('progress_photo', event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700" />
                            {form.errors.progress_photo ? <p className="mt-2 text-sm text-rose-600">{form.errors.progress_photo}</p> : null}
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Replace supporting document</label>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(event) => form.setData('supporting_document', event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700" />
                            {form.errors.supporting_document ? <p className="mt-2 text-sm text-rose-600">{form.errors.supporting_document}</p> : null}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">Changes save back to the same patient-visible progress record.</p>
                        <Button disabled={form.processing} className="sm:min-w-40">{form.processing ? 'Saving...' : 'Save Progress Changes'}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function MedicalRecordDetail({ doctor, record, backHref }) {
    return (
        <DoctorLayout doctor={doctor}>
            <Head title={record.title} />

            <DoctorPageHeader
                title={record.title}
                subtitle="Open one record workspace at a time so consultation context stays readable and progress updates stay focused."
                actions={<Link href={backHref} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Back to archive</Link>}
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_420px]">
                <div className="space-y-6">
                    {record.category === 'progress' ? (
                        <ProgressRecordEditor record={record} />
                    ) : (
                        <Card className="border-border-subtle bg-white">
                            <CardHeader>
                                <CardTitle>Consultation record</CardTitle>
                                <CardDescription>This record is read-only here. Use the consultation workload page for open bookings that still need completion.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={route('doctor.consultations.index')} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                    Open consultation workload
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>

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
                                <p className="mt-2 text-sm font-medium text-slate-900">{record.attachments.length} attachment{record.attachments.length === 1 ? '' : 's'}</p>
                            </div>
                        </div>

                        {record.metadata.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {record.metadata.map((item) => (
                                    <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{item}</span>
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
                                                <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
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
            </div>
        </DoctorLayout>
    );
}
