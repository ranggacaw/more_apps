import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout, { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function HourRow({ hour }) {
    const form = useForm({
        day_of_week: hour.day_of_week,
        start_time: hour.start_time,
        end_time: hour.end_time,
        is_active: hour.is_active,
    });

    const submit = (event) => {
        event.preventDefault();
        form.patch(route('admin.schedule-settings.hours.update', hour.id), { preserveScroll: true });
    };

    return (
        <form onSubmit={submit} className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:items-end">
            <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Day</label>
                <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.day_of_week} onChange={(event) => form.setData('day_of_week', event.target.value)}>
                    {dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}
                </select>
            </div>
            <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Start</label>
                <Input type="time" value={form.data.start_time} onChange={(event) => form.setData('start_time', event.target.value)} />
            </div>
            <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">End</label>
                <Input type="time" value={form.data.end_time} onChange={(event) => form.setData('end_time', event.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 md:pb-2">
                <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                Active
            </label>
            <Button disabled={form.processing}>{form.processing ? 'Saving...' : 'Save'}</Button>
        </form>
    );
}

export default function ScheduleSettings({ hours, overrides }) {
    const form = useForm({ day_of_week: 1, start_time: '16:00', end_time: '20:00', is_active: true });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('admin.schedule-settings.hours.store'), { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <Head title="Schedule Settings" />
            <AdminPageHeader title="Schedule Settings" subtitle="Manage clinic operating windows and review audited admin booking overrides." />
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Clinic operating hours</CardTitle>
                        <CardDescription>Slots are generated from these shared clinic windows for every active doctor.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">Day</label>
                                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.day_of_week} onChange={(event) => form.setData('day_of_week', event.target.value)}>
                                        {dayNames.map((day, index) => <option key={day} value={index}>{day}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">Start</label>
                                    <Input type="time" value={form.data.start_time} onChange={(event) => form.setData('start_time', event.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-slate-600">End</label>
                                    <Input type="time" value={form.data.end_time} onChange={(event) => form.setData('end_time', event.target.value)} />
                                </div>
                                <Button disabled={form.processing}>{form.processing ? 'Adding...' : 'Add hours'}</Button>
                            </div>
                            {Object.values(form.errors).length ? <p className="mt-3 text-sm text-rose-600">{Object.values(form.errors)[0]}</p> : null}
                        </form>
                        <div className="space-y-3">
                            {hours.map((hour) => <HourRow key={hour.id} hour={hour} />)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Override audit</CardTitle>
                        <CardDescription>Recent admin outside-hours booking overrides with required reasons.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {overrides.length ? overrides.map((override) => (
                            <div key={override.id} className="rounded-xl border border-slate-200 p-3 text-sm">
                                <p className="font-medium text-slate-900">{override.doctor} · {override.override_date} {override.start_time}</p>
                                <p className="mt-1 text-slate-600">{override.reason}</p>
                                <p className="mt-2 text-xs text-slate-500">By {override.admin} {override.booking_id ? `for booking #${override.booking_id}` : ''} · {formatDateTime(override.created_at)}</p>
                            </div>
                        )) : <p className="text-sm text-slate-500">No schedule overrides have been recorded.</p>}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
