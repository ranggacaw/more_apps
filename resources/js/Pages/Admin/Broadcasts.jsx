import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

const statusVariants = {
    queued: 'warning',
    processing: 'warning',
    completed: 'success',
    completed_with_failures: 'warning',
    failed: 'danger',
};

export default function Broadcasts({ audienceScopes, broadcasts }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        audience_scope: audienceScopes[0]?.value ?? 'verified_patients',
        message: '',
    });

    const scopeLabels = Object.fromEntries(audienceScopes.map((scope) => [scope.value, scope.label]));

    const submit = (event) => {
        event.preventDefault();
        post(route('admin.broadcasts.store'), {
            onSuccess: () => reset('message'),
        });
    };

    return (
        <AppLayout title="Admin Broadcasts" description="Draft audited WhatsApp broadcasts, pick a supported audience, and queue delivery work through the existing provider service.">
            <Head title="Admin Broadcasts" />

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

                <div className="space-y-4">
                    {broadcasts.length ? (
                        broadcasts.map((broadcast) => (
                            <Card key={broadcast.id}>
                                <CardHeader>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <CardTitle>{scopeLabels[broadcast.audience_scope] ?? broadcast.audience_scope}</CardTitle>
                                            <CardDescription>{broadcast.requested_by ? `Queued by ${broadcast.requested_by}` : 'Queued by an admin account'}</CardDescription>
                                        </div>
                                        <Badge variant={statusVariants[broadcast.status] ?? 'neutral'}>{broadcast.status.replaceAll('_', ' ')}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4 text-sm text-slate-600">
                                    <p className="rounded-2xl bg-slate-50 p-4 text-slate-700">{broadcast.message}</p>

                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <p className="text-slate-500">Recipients</p>
                                            <p className="mt-1 font-semibold text-slate-900">{broadcast.recipient_count}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <p className="text-slate-500">Sent</p>
                                            <p className="mt-1 font-semibold text-slate-900">{broadcast.sent_count}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-200 p-4">
                                            <p className="text-slate-500">Failed</p>
                                            <p className="mt-1 font-semibold text-slate-900">{broadcast.failed_count}</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-2 text-xs text-slate-500 md:grid-cols-3">
                                        <p>{broadcast.queued_at ? `Queued: ${formatDateTime(broadcast.queued_at)}` : 'Queued: not recorded'}</p>
                                        <p>{broadcast.started_at ? `Started: ${formatDateTime(broadcast.started_at)}` : 'Started: waiting'}</p>
                                        <p>{broadcast.completed_at ? `Completed: ${formatDateTime(broadcast.completed_at)}` : `Pending deliveries: ${broadcast.pending_count}`}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="py-10 text-sm text-slate-500">No broadcast history yet.</CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
