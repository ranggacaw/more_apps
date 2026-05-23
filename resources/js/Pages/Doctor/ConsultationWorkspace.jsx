import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ConsultationWorkspace({ doctor, booking, packages, backHref }) {
    const { data, setData, post, processing, errors } = useForm({
        notes: booking.consultation?.notes ?? '',
        recommended_package_id: booking.consultation?.recommended_package_id ? String(booking.consultation.recommended_package_id) : '',
        meal_plan_summary: booking.consultation?.meal_plan_summary ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('doctor.bookings.complete', booking.id), {
            preserveScroll: true,
        });
    };

    return (
        <DoctorLayout doctor={doctor}>
            <Head title={`Consultation ${booking.patient.name}`} />

            <DoctorPageHeader
                title={`Consultation for ${booking.patient.name}`}
                subtitle="Review the intake context, complete the consultation, and keep unrelated dashboard content out of this workflow."
                actions={<Link href={backHref} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Back to consultations</Link>}
            />

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <div className="space-y-6">
                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Booking summary</CardTitle>
                            <CardDescription>{formatDateTime(booking.start_time)}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-600">
                            <div>
                                <p className="font-medium text-slate-900">Patient</p>
                                <p className="mt-1">{booking.patient.name}</p>
                                <p className="mt-1">{booking.patient.email}</p>
                                <p className="mt-1">{booking.patient.phone}</p>
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">Payment</p>
                                <p className="mt-1 capitalize">{booking.payment_status ?? 'unpaid'}</p>
                            </div>
                            {booking.meeting_link ? (
                                <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="inline-flex text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
                                    Open meeting link
                                </a>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Pre-consultation intake</CardTitle>
                            <CardDescription>Use the submitted patient context before you complete the consultation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-slate-600">
                            <div>
                                <p className="font-medium text-slate-900">Patient notes</p>
                                <div className="mt-2 rounded-2xl bg-slate-50 p-4">
                                    <p className="whitespace-pre-wrap">{booking.intake?.notes ?? 'No intake context was provided.'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="font-medium text-slate-900">Uploaded document</p>
                                {booking.intake?.patient_upload_name ? (
                                    booking.intake?.patient_upload_url ? (
                                        <a href={booking.intake.patient_upload_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
                                            {booking.intake.patient_upload_name}
                                        </a>
                                    ) : (
                                        <p className="mt-2">{booking.intake.patient_upload_name}</p>
                                    )
                                ) : (
                                    <p className="mt-2">No document uploaded.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border-subtle bg-white">
                    <CardHeader>
                        <CardTitle>Complete consultation</CardTitle>
                        <CardDescription>Capture the notes, any package recommendation, and an optional meal plan summary for the generated patient PDF.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Consultation notes</label>
                                <Textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} placeholder="Document the key outcomes, next steps, and care guidance." required />
                                {errors.notes ? <p className="mt-2 text-sm text-rose-600">{errors.notes}</p> : null}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Recommended package</label>
                                <select className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm text-on-background" value={data.recommended_package_id} onChange={(event) => setData('recommended_package_id', event.target.value)}>
                                    <option value="">No package recommendation</option>
                                    {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} · {formatCurrency(pkg.price)} · {pkg.consultation_credits} credits</option>)}
                                </select>
                                {errors.recommended_package_id ? <p className="mt-2 text-sm text-rose-600">{errors.recommended_package_id}</p> : null}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Meal plan summary</label>
                                <Textarea value={data.meal_plan_summary} onChange={(event) => setData('meal_plan_summary', event.target.value)} placeholder="Optional meal plan summary for the patient PDF." />
                                {errors.meal_plan_summary ? <p className="mt-2 text-sm text-rose-600">{errors.meal_plan_summary}</p> : null}
                            </div>

                            <Button className="w-full bg-clinical-gold text-white hover:opacity-90" disabled={processing || !booking.can_complete}>
                                {processing ? 'Saving consultation...' : 'Complete consultation'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DoctorLayout>
    );
}
