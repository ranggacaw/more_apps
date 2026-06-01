import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AdminDataTable from '@/Components/AdminDataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

const statusVariants = {
    queued: 'warning',
    processing: 'warning',
    completed: 'success',
    completed_with_failures: 'warning',
    failed: 'danger',
};

export default function Broadcasts({ audienceScopes, broadcasts, pagination, sortBy, sortDir }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        audience_scope: audienceScopes[0]?.value ?? 'doctors',
        message: '',
    });

    const scopeLabels = Object.fromEntries(audienceScopes.map((scope) => [scope.value, scope.label]));

    const submit = (event) => {
        event.preventDefault();
        post(route('admin.broadcasts.store'), {
            onSuccess: () => reset('message'),
        });
    };

    const columns = [
        {
            accessorKey: 'audience_scope',
            header: 'Audience',
            meta: { sortKey: 'audience_scope' },
            cell: ({ getValue }) => scopeLabels[getValue()] ?? getValue(),
        },
        {
            accessorKey: 'status',
            header: 'Status',
            meta: { sortKey: 'status' },
            cell: ({ getValue }) => (
                <Badge variant={statusVariants[getValue()] ?? 'neutral'}>
                    {getValue().replaceAll('_', ' ')}
                </Badge>
            ),
        },
        {
            accessorKey: 'recipient_count',
            header: 'Recipients',
            cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        },
        {
            accessorKey: 'sent_count',
            header: 'Sent',
            cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        },
        {
            accessorKey: 'failed_count',
            header: 'Failed',
            cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        },
        {
            accessorKey: 'queued_at',
            header: 'Queued',
            meta: { sortKey: 'created_at' },
            cell: ({ getValue }) => (
                <span className="text-xs text-slate-500">
                    {getValue() ? formatDateTime(getValue()) : '—'}
                </span>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="Admin Broadcasts" />
            <AdminPageHeader title="Admin Broadcasts" subtitle="Draft audited WhatsApp broadcasts, pick a supported audience, and queue delivery work through the existing provider service." />

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Queue a broadcast</CardTitle>
                        <CardDescription>Delivery happens asynchronously so admins can audit send outcomes after dispatch.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Audience scope</label>
                                <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={data.audience_scope} onChange={(event) => setData('audience_scope', event.target.value)}>
                                    {audienceScopes.map((scope) => (
                                        <option key={scope.value} value={scope.value}>
                                            {scope.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Message</label>
                                <Textarea value={data.message} onChange={(event) => setData('message', event.target.value)} placeholder="Write the WhatsApp update exactly as it should be delivered." />
                            </div>

                            {Object.values(errors).length ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(errors)[0]}</div>
                            ) : null}

                            <Button className="w-full" disabled={processing}>
                                {processing ? 'Queueing...' : 'Queue broadcast'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <AdminDataTable
                    columns={columns}
                    data={broadcasts}
                    pagination={pagination}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    routeName="admin.broadcasts.index"
                />
            </div>
        </AdminLayout>
    );
}
