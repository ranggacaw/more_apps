import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link, useForm } from '@inertiajs/react';

const statusVariant = {
    active: 'success',
    completed: 'neutral',
    confirmed: 'success',
    paid: 'success',
    pending: 'warning',
    cancelled: 'danger',
};

function formatDate(value) {
    if (!value) {
        return 'Not provided';
    }

    return new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(value));
}

function ProgressHistoryItem({ item }) {
    return (
        <div className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">Week {item.program_week}</p>
                        <Badge variant={item.reviewed_at ? 'success' : 'warning'}>{item.reviewed_at ? 'reviewed' : 'waiting for review'}</Badge>
                    </div>
                    {item.checked_in_at ? <p className="mt-1 text-sm text-slate-500">Submitted {formatDateTime(item.checked_in_at)}</p> : null}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 md:text-right">
                    <p>Weight: {item.weight_kg} kg</p>
                    <p>Waist: {item.waist_cm} cm</p>
                </div>
            </div>

            {item.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.notes}</p> : null}

            {item.progress_photo ? (
                <div className="mt-3 text-sm">
                    {item.progress_photo.url ? (
                        <a href={item.progress_photo.url} target="_blank" rel="noreferrer" className="text-amber-700 underline underline-offset-4">
                            Open progress photo
                        </a>
                    ) : (
                        <p className="text-slate-500">Progress photo stored: {item.progress_photo.name}</p>
                    )}
                </div>
            ) : null}

            <div className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Doctor follow-up</p>
                {item.review_notes ? (
                    <>
                        <p className="mt-2 whitespace-pre-wrap">{item.review_notes}</p>
                        {item.reviewed_by ? <p className="mt-2 text-slate-500">Reviewed by {item.reviewed_by}</p> : null}
                    </>
                ) : (
                    <p className="mt-2 text-slate-500">Your doctor has not reviewed this week yet.</p>
                )}
            </div>
        </div>
    );
}

function ActivePackageCard({ activePackage }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        weight_kg: '',
        waist_cm: '',
        notes: '',
        progress_photo: null,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('patient.program.check-ins.store', activePackage.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <CardTitle>{activePackage.name}</CardTitle>
                        <CardDescription>
                            Week {activePackage.current_program_week} of your active program with {activePackage.doctor?.name ?? 'your care team'}.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariant[activePackage.status] ?? 'neutral'}>{activePackage.status}</Badge>
                        <Badge variant={activePackage.current_week_submitted ? 'success' : 'warning'}>
                            {activePackage.current_week_submitted ? 'this week submitted' : 'check-in due'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="text-slate-500">Doctor</p>
                        <p className="mt-1 font-medium text-slate-900">{activePackage.doctor?.name ?? 'Not assigned yet'}</p>
                        {activePackage.doctor?.specialization ? <p>{activePackage.doctor.specialization}</p> : null}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="text-slate-500">Credits remaining</p>
                        <p className="mt-1 font-medium text-slate-900">
                            {activePackage.consultation_credits_remaining} / {activePackage.consultation_credits_total}
                        </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="text-slate-500">Activated</p>
                        <p className="mt-1 font-medium text-slate-900">{activePackage.activated_at ? formatDate(activePackage.activated_at) : 'Not available'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <p className="text-slate-500">Meal plan</p>
                        {activePackage.meal_plan ? (
                            activePackage.meal_plan.url ? (
                                <a href={activePackage.meal_plan.url} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium text-amber-700 underline underline-offset-4">
                                    Open meal plan
                                </a>
                            ) : (
                                <p className="mt-1 font-medium text-slate-900">{activePackage.meal_plan.name}</p>
                            )
                        ) : (
                            <p className="mt-1 text-slate-500">No meal plan uploaded yet.</p>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 p-4">
                        <div>
                            <p className="text-sm font-medium text-slate-900">Weekly check-in</p>
                            <p className="mt-1 text-sm text-slate-500">Submit one update per seven-day program week without consuming consultation credits.</p>
                        </div>

                        {activePackage.current_week_submitted ? (
                            <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                                Week {activePackage.current_program_week} has already been submitted. Your next form unlocks in the next program week.
                            </div>
                        ) : null}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Weight (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                    value={data.weight_kg}
                                    onChange={(event) => setData('weight_kg', event.target.value)}
                                    disabled={activePackage.current_week_submitted}
                                />
                                {errors.weight_kg ? <p className="mt-2 text-sm text-rose-600">{errors.weight_kg}</p> : null}
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Waist (cm)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                    value={data.waist_cm}
                                    onChange={(event) => setData('waist_cm', event.target.value)}
                                    disabled={activePackage.current_week_submitted}
                                />
                                {errors.waist_cm ? <p className="mt-2 text-sm text-rose-600">{errors.waist_cm}</p> : null}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                            <Textarea
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                placeholder="Document how the week felt, changes you noticed, and anything you want your doctor to review."
                                disabled={activePackage.current_week_submitted}
                            />
                            {errors.notes ? <p className="mt-2 text-sm text-rose-600">{errors.notes}</p> : null}
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Progress photo</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-sm text-slate-600"
                                onChange={(event) => setData('progress_photo', event.target.files?.[0] ?? null)}
                                disabled={activePackage.current_week_submitted}
                            />
                            {errors.progress_photo ? <p className="mt-2 text-sm text-rose-600">{errors.progress_photo}</p> : null}
                        </div>

                        <Button className="w-full" disabled={processing || activePackage.current_week_submitted}>
                            {processing ? 'Submitting progress...' : `Submit week ${activePackage.current_program_week} check-in`}
                        </Button>
                    </form>

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-slate-900">Progress history</p>
                            <p className="mt-1 text-sm text-slate-500">Track each weekly submission and its doctor review state over time.</p>
                        </div>
                        {activePackage.progress_history.length ? (
                            activePackage.progress_history.map((item) => <ProgressHistoryItem key={item.id} item={item} />)
                        ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                                No weekly progress has been submitted for this package yet.
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({ stats, profileContext, upcomingConsultation, activePackages, engagementFeed, bookings }) {
    return (
        <AppLayout title="Patient Dashboard" description="Manage your active program, meal plans, weekly progress, and upcoming consultations.">
            <Head title="Patient Dashboard" />

            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardDescription>Total bookings</CardDescription>
                        <CardTitle>{stats.totalBookings}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Confirmed consultations</CardDescription>
                        <CardTitle>{stats.confirmedBookings}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Paid bookings</CardDescription>
                        <CardTitle>{stats.paidBookings}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Active packages</CardDescription>
                        <CardTitle>{stats.activePackages}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile health context</CardTitle>
                        <CardDescription>The dashboard reuses your existing profile fields so care context stays visible during follow-up.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-slate-500">Patient</p>
                            <p className="mt-1 font-medium text-slate-900">{profileContext.name}</p>
                            <p>{profileContext.phone ?? 'Phone not provided'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-slate-500">Date of birth</p>
                            <p className="mt-1 font-medium text-slate-900">{formatDate(profileContext.date_of_birth)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                            <p className="text-slate-500">Address</p>
                            <p className="mt-1 font-medium text-slate-900">{profileContext.address || 'No address saved yet.'}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4 sm:col-span-2">
                            <p className="text-slate-500">Medical notes</p>
                            <p className="mt-1 whitespace-pre-wrap font-medium text-slate-900">{profileContext.medical_notes || 'No medical notes saved yet.'}</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Engagement feed</CardTitle>
                            <CardDescription>Current touchpoints are derived from your active program, meal plan, and consultation state.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {engagementFeed.length ? (
                                engagementFeed.map((item, index) => (
                                    <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={item.variant}>{item.variant}</Badge>
                                            <p className="font-medium text-slate-900">{item.title}</p>
                                        </div>
                                        <p className="mt-2">{item.body}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No urgent engagement items right now.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Next confirmed consultation</CardTitle>
                            <CardDescription>Keep your next scheduled session visible while you work through the weekly program.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {upcomingConsultation ? (
                                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <p className="font-medium text-slate-900">{upcomingConsultation.doctor}</p>
                                    <p>{upcomingConsultation.specialization}</p>
                                    <p className="mt-2">{formatDateTime(upcomingConsultation.start_time)}</p>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No confirmed consultation is scheduled right now.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-8 space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Active program workspace</h2>
                    <p className="mt-1 text-sm text-slate-500">Open each package to submit the current week, download the meal plan, and review feedback history.</p>
                </div>

                {activePackages.length ? (
                    activePackages.map((activePackage) => <ActivePackageCard key={activePackage.id} activePackage={activePackage} />)
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>No active program yet</CardTitle>
                            <CardDescription>Your booking history is still available, and package cards will appear here once an entitlement is active.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link
                                href={route('patient.packages.index')}
                                className="inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                            >
                                Browse packages
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming and recent consultations</CardTitle>
                        <CardDescription>Track every booking from pending payment through confirmed consultation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {bookings.length ? (
                            bookings.map((booking) => (
                                <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{booking.doctor}</p>
                                            <p className="text-sm text-slate-500">{booking.specialization}</p>
                                            <p className="mt-2 text-sm text-slate-600">{formatDateTime(booking.start_time)}</p>
                                            {booking.meeting_link ? (
                                                <a href={booking.meeting_link} className="mt-2 inline-block text-sm font-medium text-amber-700">
                                                    Join meeting
                                                </a>
                                            ) : null}
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={statusVariant[booking.status] ?? 'neutral'}>{booking.status}</Badge>
                                            {booking.payment_status ? (
                                                <Badge variant={statusVariant[booking.payment_status] ?? 'neutral'}>{booking.payment_status}</Badge>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">No consultations yet.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Next step</CardTitle>
                        <CardDescription>Continue the care journey with a new consultation or package selection when needed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link
                            href={route('bookings.create')}
                            className="inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            Book consultation
                        </Link>
                        <Link
                            href={route('patient.packages.index')}
                            className="ml-3 inline-flex rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                        >
                            Browse packages
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
