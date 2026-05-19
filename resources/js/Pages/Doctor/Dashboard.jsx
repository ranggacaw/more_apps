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
        meal_plan_summary: '',
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

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Meal plan summary</label>
                        <Textarea
                            value={data.meal_plan_summary}
                            onChange={(event) => setData('meal_plan_summary', event.target.value)}
                            placeholder="Optional meal plan summary to turn into the patient PDF."
                        />
                        {errors.meal_plan_summary ? <p className="mt-2 text-sm text-rose-600">{errors.meal_plan_summary}</p> : null}
                    </div>

                    <Button className="w-full" disabled={processing || !booking.can_complete}>
                        {processing ? 'Saving consultation...' : 'Complete consultation'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

function ProgramReviewForm({ checkIn }) {
    const { data, setData, post, processing, errors } = useForm({
        review_notes: checkIn.review_notes ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('doctor.program.check-ins.review', checkIn.id), {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-2xl border border-slate-200 p-4">
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Doctor follow-up notes</label>
                <Textarea
                    value={data.review_notes}
                    onChange={(event) => setData('review_notes', event.target.value)}
                    placeholder="Summarize the review outcome, adjustment guidance, and next steps for the patient."
                />
                {errors.review_notes ? <p className="mt-2 text-sm text-rose-600">{errors.review_notes}</p> : null}
            </div>
            <Button className="w-full">{processing ? 'Saving review...' : checkIn.reviewed_at ? 'Update review notes' : 'Save review notes'}</Button>
        </form>
    );
}

function ActiveProgramCard({ program }) {
    return (
        <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">{program.patient.name}</p>
                        <Badge variant={program.has_pending_review ? 'warning' : 'success'}>
                            {program.has_pending_review ? 'pending review' : 'reviewed'}
                        </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{program.patient.email} • {program.patient.phone}</p>
                    <p className="mt-1 text-sm text-slate-500">{program.package.name}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Badge variant="neutral">{program.package.consultation_credits_remaining} / {program.package.consultation_credits_total} credits</Badge>
                    <Badge variant={program.package.status === 'active' ? 'success' : 'neutral'}>{program.package.status}</Badge>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="space-y-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <div>
                        <p className="font-medium text-slate-900">Latest package context</p>
                        {program.package.activated_at ? <p className="mt-2">Activated {formatDateTime(program.package.activated_at)}</p> : null}
                        {program.package.expires_at ? <p>Expires {formatDateTime(program.package.expires_at)}</p> : null}
                    </div>

                    <div>
                        <p className="font-medium text-slate-900">Meal plan asset</p>
                        {program.meal_plan ? (
                            program.meal_plan.url ? (
                                <a href={program.meal_plan.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-amber-700 underline underline-offset-4">
                                    Open current meal plan
                                </a>
                            ) : (
                                <p className="mt-2">Stored meal plan: {program.meal_plan.name}</p>
                            )
                        ) : (
                            <p className="mt-2 text-slate-500">No meal plan uploaded for the source consultation yet.</p>
                        )}
                    </div>

                    <div>
                        <p className="font-medium text-slate-900">Latest weekly check-in</p>
                        {program.latest_check_in ? (
                            <div className="mt-2 rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="font-medium text-slate-900">Week {program.latest_check_in.program_week}</p>
                                {program.latest_check_in.checked_in_at ? <p className="mt-1">Submitted {formatDateTime(program.latest_check_in.checked_in_at)}</p> : null}
                                <p className="mt-2">Weight {program.latest_check_in.weight_kg} kg</p>
                                <p>Waist {program.latest_check_in.waist_cm} cm</p>
                            </div>
                        ) : (
                            <p className="mt-2 text-slate-500">No weekly check-in has been submitted yet.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm font-medium text-slate-900">Weekly progress history</p>
                        <p className="mt-1 text-sm text-slate-500">Review attached media, preserve the patient submission, and add the follow-up notes directly on the same week.</p>
                    </div>

                    {program.progress_history.length ? (
                        program.progress_history.map((checkIn) => (
                            <div key={checkIn.id} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-medium text-slate-900">Week {checkIn.program_week}</p>
                                            <Badge variant={checkIn.reviewed_at ? 'success' : 'warning'}>
                                                {checkIn.reviewed_at ? 'reviewed' : 'awaiting review'}
                                            </Badge>
                                        </div>
                                        {checkIn.checked_in_at ? <p className="mt-1 text-sm text-slate-500">{formatDateTime(checkIn.checked_in_at)}</p> : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 md:text-right">
                                        <p>Weight: {checkIn.weight_kg} kg</p>
                                        <p>Waist: {checkIn.waist_cm} cm</p>
                                    </div>
                                </div>

                                {checkIn.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{checkIn.notes}</p> : null}

                                {checkIn.progress_photo ? (
                                    <div className="mt-3 text-sm">
                                        {checkIn.progress_photo.url ? (
                                            <a href={checkIn.progress_photo.url} target="_blank" rel="noreferrer" className="text-amber-700 underline underline-offset-4">
                                                Open progress photo
                                            </a>
                                        ) : (
                                            <p className="text-slate-500">Stored progress photo: {checkIn.progress_photo.name}</p>
                                        )}
                                    </div>
                                ) : null}

                                {checkIn.reviewed_at ? (
                                    <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
                                        <p className="font-medium">Current review</p>
                                        <p className="mt-2 whitespace-pre-wrap">{checkIn.review_notes}</p>
                                        {checkIn.reviewed_by ? <p className="mt-2 text-emerald-700">Reviewed by {checkIn.reviewed_by}</p> : null}
                                    </div>
                                ) : null}

                                <ProgramReviewForm checkIn={checkIn} />
                            </div>
                        ))
                    ) : (
                        <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                            No weekly progress has been submitted for this active package yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ doctor, consultationWorkload, packages, activePrograms, availabilities }) {
    return (
        <AppLayout title="Doctor Dashboard" description="Review confirmed consultations, active patient programs, weekly check-ins, and your availability calendar.">
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

            <div className="mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Active patient programs</CardTitle>
                        <CardDescription>Only packages linked to consultations completed by you appear here, with the latest weekly review context.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {activePrograms.length ? (
                            activePrograms.map((program) => <ActiveProgramCard key={program.id} program={program} />)
                        ) : (
                            <p className="text-sm text-slate-500">No active patient programs are assigned to you right now.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
