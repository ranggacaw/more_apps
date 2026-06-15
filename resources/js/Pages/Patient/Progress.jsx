import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout, { PatientPageHeader } from '@/Layouts/PatientLayout';
import { Head } from '@inertiajs/react';

export default function Progress({ metrics = {} }) {
    return (
        <PatientLayout>
            <Head title="Progress" />
            <PatientPageHeader title="Progress Trends" subtitle="Chronological metric points from finalized reports and reviewed weekly progress records." />
            <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(metrics).map(([key, points]) => (
                    <Card key={key}>
                        <CardHeader><CardTitle className="capitalize">{key}</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            {points.length ? points.map((point, index) => (
                                <div key={`${point.date}-${index}`} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm shadow-sm">
                                    <span>{point.date} · {point.label}</span>
                                    <span className="font-semibold text-slate-900">{point.value}</span>
                                </div>
                            )) : <p className="text-sm text-slate-500">No {key} data yet.</p>}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PatientLayout>
    );
}
