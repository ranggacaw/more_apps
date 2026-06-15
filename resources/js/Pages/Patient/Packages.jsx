import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout, { PatientPageHeader } from '@/Layouts/PatientLayout';
import { formatCurrency } from '@/lib/format';
import { Head } from '@inertiajs/react';

export default function Packages({ packages = [], credit = null }) {
    return (
        <PatientLayout>
            <Head title="Packages" />
            <PatientPageHeader title="Care Packages" subtitle="Active packages available after your qualifying consultation credit is confirmed." />
            {credit ? (
                <div className="mb-6 rounded-2xl border border-clinical-gold/30 bg-white p-4 text-sm text-slate-700">
                    Consultation credit: <span className="font-semibold">{credit.status ?? 'unavailable'}</span>
                </div>
            ) : null}
            <div className="grid gap-6 md:grid-cols-2">
                {packages.map((item) => (
                    <Card key={item.id}>
                        <CardHeader>
                            <CardTitle>{item.name}</CardTitle>
                            <CardDescription>{item.consultation_credits} consultation credits</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-600">
                            <p>{item.description ?? 'Clinic-managed care package.'}</p>
                            <p className="text-xl font-semibold text-slate-900">{formatCurrency(item.price)}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </PatientLayout>
    );
}
