import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatCurrency } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

export default function Reports({ filters, revenue, conversion }) {
    const { data, setData, get, processing } = useForm(filters);

    const submit = (event) => {
        event.preventDefault();
        get(route('admin.reports.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout>
            <Head title="Admin Reports" />
            <AdminPageHeader title="Admin Reports" subtitle="Review paid revenue and the current registration-to-purchase funnel using transactional records." />

            <Card>
                <CardHeader>
                    <CardTitle>Reporting window</CardTitle>
                    <CardDescription>Revenue uses paid payment timestamps. Funnel metrics use creation timestamps across the operational tables.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">From</label>
                            <Input type="date" value={data.from} onChange={(event) => setData('from', event.target.value)} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">To</label>
                            <Input type="date" value={data.to} onChange={(event) => setData('to', event.target.value)} />
                        </div>
                        <Button disabled={processing}>{processing ? 'Refreshing...' : 'Apply filters'}</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-5">
                <Card>
                    <CardHeader>
                        <CardDescription>Consultation revenue</CardDescription>
                        <CardTitle>{formatCurrency(revenue.consultation_total)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-500">{revenue.consultation_count} paid consultation transactions</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Package revenue</CardDescription>
                        <CardTitle>{formatCurrency(revenue.package_total)}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-500">{revenue.package_count} paid package transactions</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Total paid revenue</CardDescription>
                        <CardTitle>{formatCurrency(revenue.overall_total)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Verified patients</CardDescription>
                        <CardTitle>{conversion.verified_patients}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Package purchases</CardDescription>
                        <CardTitle>{conversion.package_purchases}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue split</CardTitle>
                        <CardDescription>Separate paid totals for consultation and package commerce.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-600">
                        <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="font-medium text-slate-900">Consultations</p>
                            <p className="mt-2">Revenue: {formatCurrency(revenue.consultation_total)}</p>
                            <p>Paid transactions: {revenue.consultation_count}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 p-4">
                            <p className="font-medium text-slate-900">Packages</p>
                            <p className="mt-2">Revenue: {formatCurrency(revenue.package_total)}</p>
                            <p>Paid transactions: {revenue.package_count}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Conversion funnel</CardTitle>
                        <CardDescription>Operational counts from registration through package activation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                        {[
                            ['Registered users', conversion.registered_users],
                            ['Verified patients', conversion.verified_patients],
                            ['Consultation bookings', conversion.consultation_bookings],
                            ['Paid consultations', conversion.paid_consultations],
                            ['Package purchases', conversion.package_purchases],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                <span>{label}</span>
                                <span className="font-semibold text-slate-900">{value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
