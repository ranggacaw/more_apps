import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout, { PatientPageHeader } from '@/Layouts/PatientLayout';
import { Head, Link } from '@inertiajs/react';

export default function MedicalRecordDetail({ record, backHref }) {
    return (
        <PatientLayout>
            <Head title="Medical Record" />
            <PatientPageHeader title={record.title} subtitle={record.source_label} />
            <Link href={backHref} className="mb-4 inline-flex text-sm font-semibold text-clinical-gold hover:underline">Back to records</Link>
            <Card>
                <CardHeader><CardTitle>{record.category_label}</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm text-slate-700">
                    {record.full_note ? <div><p className="font-semibold text-slate-900">Notes</p><p className="mt-2 whitespace-pre-wrap">{record.full_note}</p></div> : null}
                    {record.review_note ? <div><p className="font-semibold text-slate-900">Doctor review</p><p className="mt-2 whitespace-pre-wrap">{record.review_note}</p></div> : null}
                    {record.intake_notes ? <div><p className="font-semibold text-slate-900">Intake</p><p className="mt-2 whitespace-pre-wrap">{record.intake_notes}</p></div> : null}
                    {record.attachments?.length ? <div className="space-y-2"><p className="font-semibold text-slate-900">Attachments</p>{record.attachments.map((attachment) => <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="block text-clinical-gold underline">{attachment.name}</a>)}</div> : null}
                </CardContent>
            </Card>
        </PatientLayout>
    );
}
