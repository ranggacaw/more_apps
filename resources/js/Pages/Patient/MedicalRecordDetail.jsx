import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout from '@/Layouts/PatientLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

const imageAssetPattern = /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i;

function isImageAsset(name) {
    return typeof name === 'string' && imageAssetPattern.test(name);
}

const badgeByStatus = {
    completed: 'success',
    reviewed: 'success',
    submitted: 'warning',
};

export default function MedicalRecordDetail({ record, backHref }) {
    return (
        <PatientLayout>
            <Head title={record.title} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clinical-gold">Patient archive</p>
                        <h1 className="mt-2 font-headline text-3xl text-slate-950">{record.title}</h1>
                        <p className="mt-2 text-sm text-secondary">Open one record at a time without losing your path back to the archive.</p>
                    </div>
                    <Link href={backHref} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                        Back to archive
                    </Link>
                </div>

                <Card className="border-border-subtle bg-white">
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
                        <div className="grid gap-3 md:grid-cols-3">
                            {record.clinician ? (
                                <div className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Clinician</p>
                                    <p className="mt-2 text-sm font-medium text-slate-900">{record.clinician.name}</p>
                                    {record.clinician.specialization ? <p className="mt-1 text-sm text-slate-500">{record.clinician.specialization}</p> : null}
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
        </PatientLayout>
    );
}
