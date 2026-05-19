import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { formatCurrency } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

function PackageEditorCard({ pkg, packageTypes }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: pkg.name,
        description: pkg.description ?? '',
        price: pkg.price,
        duration_days: pkg.duration_days,
        type: pkg.type,
        consultation_credits: pkg.consultation_credits,
        is_active: pkg.is_active,
    });

    const submit = (event) => {
        event.preventDefault();
        patch(route('admin.packages.update', pkg.id));
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <CardTitle>{pkg.name}</CardTitle>
                        <CardDescription>{pkg.slug}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Badge variant={pkg.is_active ? 'success' : 'neutral'}>{pkg.is_active ? 'active' : 'inactive'}</Badge>
                        <Badge variant="neutral">{pkg.type}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="text-slate-500">Paid purchases</p>
                        <p className="mt-1 font-semibold text-slate-900">{pkg.paid_payments_count}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="text-slate-500">Active entitlements</p>
                        <p className="mt-1 font-semibold text-slate-900">{pkg.active_entitlements_count}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="text-slate-500">Historical entitlements</p>
                        <p className="mt-1 font-semibold text-slate-900">{pkg.total_entitlements_count}</p>
                    </div>
                </div>

                <form onSubmit={submit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Package name</label>
                            <Input value={data.name} onChange={(event) => setData('name', event.target.value)} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Price</label>
                            <Input type="number" min="0" value={data.price} onChange={(event) => setData('price', Number(event.target.value))} />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                        <Textarea value={data.description} onChange={(event) => setData('description', event.target.value)} />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Duration (days)</label>
                            <Input type="number" min="1" max="365" value={data.duration_days} onChange={(event) => setData('duration_days', Number(event.target.value))} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Package type</label>
                            <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={data.type} onChange={(event) => setData('type', event.target.value)}>
                                {packageTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Consultation credits</label>
                            <Input
                                type="number"
                                min="1"
                                max="52"
                                value={data.consultation_credits}
                                onChange={(event) => setData('consultation_credits', Number(event.target.value))}
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                        <input type="checkbox" checked={data.is_active} onChange={(event) => setData('is_active', event.target.checked)} />
                        Keep this package purchasable in the patient catalog
                    </label>

                    {Object.values(errors).length ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(errors)[0]}</div>
                    ) : null}

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <p className="text-sm text-slate-500">Current catalog price: {formatCurrency(pkg.price)}</p>
                        <Button disabled={processing}>{processing ? 'Saving...' : 'Save package'}</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default function Packages({ packages, packageTypes }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        price: 0,
        duration_days: 30,
        type: packageTypes[0] ?? 'basic',
        consultation_credits: 1,
        is_active: true,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('admin.packages.store'), {
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout title="Admin Packages" description="Create, review, price, and deactivate package offerings without breaking historical payments or entitlements.">
            <Head title="Admin Packages" />

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create package</CardTitle>
                        <CardDescription>New packages become purchasable only when marked active.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Package name</label>
                                <Input value={data.name} onChange={(event) => setData('name', event.target.value)} />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                                <Textarea value={data.description} onChange={(event) => setData('description', event.target.value)} />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Price</label>
                                    <Input type="number" min="0" value={data.price} onChange={(event) => setData('price', Number(event.target.value))} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Consultation credits</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="52"
                                        value={data.consultation_credits}
                                        onChange={(event) => setData('consultation_credits', Number(event.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Duration (days)</label>
                                    <Input type="number" min="1" max="365" value={data.duration_days} onChange={(event) => setData('duration_days', Number(event.target.value))} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Package type</label>
                                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={data.type} onChange={(event) => setData('type', event.target.value)}>
                                        {packageTypes.map((type) => (
                                            <option key={type} value={type}>
                                                {type}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                                <input type="checkbox" checked={data.is_active} onChange={(event) => setData('is_active', event.target.checked)} />
                                Publish this package to the active patient catalog immediately
                            </label>

                            {Object.values(errors).length ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(errors)[0]}</div>
                            ) : null}

                            <Button className="w-full" disabled={processing}>
                                {processing ? 'Saving...' : 'Create package'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {packages.length ? (
                        packages.map((pkg) => <PackageEditorCard key={pkg.id} pkg={pkg} packageTypes={packageTypes} />)
                    ) : (
                        <Card>
                            <CardContent className="py-10 text-sm text-slate-500">No packages have been created yet.</CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
