import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/Layouts/AppLayout';
import { dayLabels, formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

export default function Availability({ availabilities, upcomingSlots }) {
    const { data, setData, post, processing, errors } = useForm({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
        slot_duration_minutes: 30,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('doctor.availability.store'));
    };

    return (
        <AppLayout title="Doctor Availability" description="Define weekly availability and let the system generate consultation slots for patients.">
            <Head title="Doctor Availability" />

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Add availability block</CardTitle>
                        <CardDescription>This creates recurring slot windows for upcoming dates.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Day of week</label>
                                <select
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                    value={data.day_of_week}
                                    onChange={(event) => setData('day_of_week', Number(event.target.value))}
                                >
                                    {dayLabels.map((label, index) => (
                                        <option key={label} value={index}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Start time</label>
                                    <Input type="time" value={data.start_time} onChange={(event) => setData('start_time', event.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">End time</label>
                                    <Input type="time" value={data.end_time} onChange={(event) => setData('end_time', event.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Slot duration (minutes)</label>
                                <Input type="number" min="15" max="120" value={data.slot_duration_minutes} onChange={(event) => setData('slot_duration_minutes', Number(event.target.value))} />
                            </div>

                            {Object.values(errors).length ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {Object.values(errors)[0]}
                                </div>
                            ) : null}

                            <Button className="w-full" disabled={processing}>
                                {processing ? 'Saving...' : 'Save availability'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly availability</CardTitle>
                            <CardDescription>Recurring blocks currently used for slot generation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {availabilities.length ? (
                                availabilities.map((availability) => (
                                    <div key={availability.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">{dayLabels[availability.day_of_week]}</p>
                                        <p>
                                            {availability.start_time} - {availability.end_time}
                                        </p>
                                        <p>{availability.slot_duration_minutes} minute intervals</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No availability configured yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming generated slots</CardTitle>
                            <CardDescription>These slots are visible to patients in the booking flow.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {upcomingSlots.length ? (
                                upcomingSlots.map((slot) => (
                                    <div key={slot.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">{formatDateTime(slot.start_time)}</p>
                                        <p>Status: {slot.status}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No upcoming slots yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
