import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout, { PatientPageHeader } from '@/Layouts/PatientLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

export default function ReportDetail({ report }) {
    return (
        <PatientLayout>
            <Head title="Medical Report" />
            <PatientPageHeader title="Visit Report" subtitle={report.visit_date ? formatDateTime(report.visit_date) : 'Finalized visit report'} />
            <div className="mb-4">
                <Link href={route('patient.reports.index')} className="text-sm font-semibold text-clinical-gold hover:underline">Back to reports</Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <Card>
                    <CardHeader><CardTitle>Doctor notes and instructions</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-700">
                        <div><p className="font-semibold text-slate-900">Doctor notes</p><p className="mt-2 whitespace-pre-wrap">{report.notes ?? 'No notes provided.'}</p></div>
                        <div><p className="font-semibold text-slate-900">Patient instructions</p><p className="mt-2 whitespace-pre-wrap">{report.patient_instructions ?? 'No patient instructions provided.'}</p></div>
                        {report.meal_plan?.url ? <a href={report.meal_plan.url} target="_blank" rel="noreferrer" className="inline-flex text-sm font-semibold text-clinical-gold underline">Open {report.meal_plan.name}</a> : null}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Measurements</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {Object.entries(report.metrics ?? {}).length ? Object.entries(report.metrics).map(([key, value]) => (
                            <div key={key} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span>{key.replaceAll('_', ' ')}</span><span className="font-semibold">{value}</span></div>
                        )) : <p className="text-slate-500">No measurements were captured.</p>}
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
