import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout, { PatientPageHeader } from '@/Layouts/PatientLayout';
import { Head, Link } from '@inertiajs/react';

export default function MedicalRecords({ records = [], stats = {} }) {
    return (
        <PatientLayout>
            <Head title="Medical Records" />
            <PatientPageHeader title="Medical Records" subtitle="Your consultation and weekly progress archive." />
            <div className="mb-6 grid gap-3 sm:grid-cols-4">
                {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="rounded-2xl bg-white p-4 text-sm shadow-sm">
                        <p className="capitalize text-slate-500">{key.replaceAll('_', ' ')}</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                {records.length ? records.map((record) => (
                    <Card key={record.id}>
                        <CardHeader><CardTitle>{record.title}</CardTitle></CardHeader>
                        <CardContent className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                            <div><p>{record.summary}</p><p className="mt-1">{record.category_label} · {record.attachment_count} attachments</p></div>
                            <Link href={record.href} className="rounded-full bg-clinical-gold px-4 py-2 text-center font-semibold text-white">Open</Link>
                        </CardContent>
                    </Card>
                )) : <Card><CardContent className="p-6 text-sm text-slate-500">No medical records are available yet.</CardContent></Card>}
            </div>
        </PatientLayout>
    );
}
