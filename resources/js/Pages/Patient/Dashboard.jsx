import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout, { PatientPageHeader } from '@/Layouts/PatientLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ activePackages = [], latestReport = null, nextControlDate = null, metricSummary = {} }) {
    return (
        <PatientLayout>
            <Head title="Patient Portal" />
            <PatientPageHeader title="Your Care Snapshot" subtitle="Review your active packages, latest visit report, and progress updates from MORÉ Clinic." />
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Active programs</CardTitle>
                        <CardDescription>Package credits and care status managed by the clinic team.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {activePackages.length ? activePackages.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                                <p className="font-semibold text-slate-900">{item.name}</p>
                                <p className="mt-1 text-sm text-slate-600">{item.consultation_credits_remaining} of {item.consultation_credits_total} consultations remaining</p>
                            </div>
                        )) : <p className="text-sm text-slate-500">No active package is currently linked to your portal.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Next control</CardTitle>
                        <CardDescription>{nextControlDate ? nextControlDate : 'No next-control date has been set yet.'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {latestReport ? <Link href={latestReport.href} className="text-sm font-semibold text-clinical-gold hover:underline">Open latest report</Link> : <p className="text-sm text-slate-500">Your finalized reports will appear here.</p>}
                    </CardContent>
                </Card>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Latest report</CardTitle>
                        <CardDescription>{latestReport?.visit_date ? formatDateTime(latestReport.visit_date) : 'No finalized report yet'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {latestReport ? <p className="line-clamp-4 text-sm text-slate-600">{latestReport.summary ?? latestReport.patient_instructions ?? 'Report finalized.'}</p> : <p className="text-sm text-slate-500">Clinic reports become visible after finalization.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Progress metrics</CardTitle>
                        <CardDescription>Latest available measurements from reports and weekly check-ins.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-sm">
                        {Object.entries(metricSummary).length ? Object.entries(metricSummary).map(([key, point]) => (
                            <div key={key} className="rounded-2xl bg-white p-4 shadow-sm">
                                <p className="capitalize text-slate-500">{key}</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900">{point.value}</p>
                            </div>
                        )) : <p className="text-slate-500">No progress metrics are available yet.</p>}
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
