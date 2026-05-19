import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { dayLabels, formatCurrency, formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

function ConsultationWorkloadCard({ booking, packages }) {
    const { data, setData, post, processing, errors } = useForm({
        notes: booking.consultation?.notes ?? '',
        recommended_package_id: booking.consultation?.recommended_package_id ? String(booking.consultation.recommended_package_id) : '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('doctor.bookings.complete', booking.id), {
            preserveScroll: true,
        });
    };

    return (
        <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{booking.patient.name}</p>
                        {booking.is_today ? <Badge variant="success">Today</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{formatDateTime(booking.start_time)}</p>
                    <p className="mt-1 text-sm text-slate-500">{booking.patient.email} • {booking.patient.phone}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant={booking.status === 'confirmed' ? 'success' : 'neutral'}>{booking.status}</Badge>
                    <Badge variant={booking.payment_status === 'paid' ? 'success' : 'warning'}>{booking.payment_status ?? 'unpaid'}</Badge>
                    <Badge>Ready for completion</Badge>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">Pre-consultation intake</p>
                    {booking.intake.notes || booking.intake.patient_upload_name ? (
                        <div className="mt-3 space-y-3 text-sm text-slate-600">
                            <div>
                                <p className="font-medium text-slate-700">Patient notes</p>
                                <p className="mt-1 whitespace-pre-wrap">{booking.intake.notes ?? 'No notes provided.'}</p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-700">Uploaded document</p>
                                <div className="mt-1">
                                    {booking.intake.patient_upload_name ? (
                                        booking.intake.patient_upload_url ? (
                                            <a href={booking.intake.patient_upload_url} target="_blank" rel="noreferrer" className="text-amber-700 underline underline-offset-4">
                                                {booking.intake.patient_upload_name}
                                            </a>
                                        ) : (
                                            <p>{booking.intake.patient_upload_name}</p>
                                        )
                                    ) : (
                                        <p>No document uploaded.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-3 text-sm text-slate-500">No intake context was provided for this booking.</p>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 p-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Consultation notes</label>
                        <Textarea
                            value={data.notes}
                            onChange={(event) => setData('notes', event.target.value)}
                            placeholder="Document the key outcomes, next steps, and any care guidance from the session."
                            required
                        />
                        {errors.notes ? <p className="mt-2 text-sm text-rose-600">{errors.notes}</p> : null}
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Recommended package</label>
                        <select
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                            value={data.recommended_package_id}
                            onChange={(event) => setData('recommended_package_id', event.target.value)}
                        >
                            <option value="">No package recommendation</option>
                            {packages.map((pkg) => (
                                <option key={pkg.id} value={pkg.id}>
                                    {pkg.name} • {formatCurrency(pkg.price)} • {pkg.consultation_credits} credits
                                </option>
                            ))}
                        </select>
                        {errors.recommended_package_id ? <p className="mt-2 text-sm text-rose-600">{errors.recommended_package_id}</p> : null}
                    </div>

                    <Button className="w-full" disabled={processing || !booking.can_complete}>
                        {processing ? 'Saving consultation...' : 'Complete consultation'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

export default function Dashboard({ doctor, consultationWorkload, packages, availabilities }) {
    return (
        <AppLayout title="Doctor Dashboard" description="Review confirmed consultations, check patient intake context, complete sessions, and manage your availability calendar.">
            <Head title="Doctor Dashboard" />

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Current confirmed consultations</CardTitle>
                        <CardDescription>Same-day consultations are prioritized so you can review intake context and close out each paid session.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {consultationWorkload.length ? (
                            consultationWorkload.map((booking) => <ConsultationWorkloadCard key={booking.id} booking={booking} packages={packages} />)
                        ) : (
                            <p className="text-sm text-slate-500">No confirmed consultations are waiting for completion right now.</p>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{doctor.name}</CardTitle>
                            <CardDescription>{doctor.specialization}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600">{doctor.bio}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active availability blocks</CardTitle>
                            <CardDescription>These blocks generate the patient-facing consultation slots.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {availabilities.length ? (
                                availabilities.map((availability) => (
                                    <div key={availability.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">{dayLabels[availability.day_of_week]}</p>
                                        <p>
                                            {availability.start_time} - {availability.end_time}
                                        </p>
                                        <p>{availability.slot_duration_minutes} minute slots</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No availability blocks yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
