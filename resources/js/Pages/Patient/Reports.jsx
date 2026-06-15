import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout, { PatientPageHeader } from '@/Layouts/PatientLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

export default function Reports({ reports = [] }) {
    return (
        <PatientLayout>
            <Head title="Medical Reports" />
            <PatientPageHeader title="Medical Reports" subtitle="Finalized visit summaries and doctor guidance from your own care history." />
            <div className="space-y-4">
                {reports.length ? reports.map((report) => (
                    <Card key={report.id}>
                        <CardHeader>
                            <CardTitle>{report.visit_date ? formatDateTime(report.visit_date) : 'Visit report'}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="text-sm text-slate-600">
                                <p>Doctor: {report.doctor_name ?? 'Clinic doctor'}</p>
                                {report.next_control_date ? <p>Next control: {report.next_control_date}</p> : null}
                            </div>
                            <Link href={report.href} className="rounded-full bg-clinical-gold px-4 py-2 text-center text-sm font-semibold text-white">View report</Link>
                        </CardContent>
                    </Card>
                )) : <Card><CardContent className="p-6 text-sm text-slate-500">No finalized reports are available yet.</CardContent></Card>}
            </div>
        </PatientLayout>
    );
}
