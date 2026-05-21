import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PatientLayout from '@/Layouts/PatientLayout';
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

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function getInitials(name) {
    if (!name) return 'DR';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

function ProgressHistoryItem({ item }) {
    return (
        <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-slate-900">Week {item.program_week}</p>
                        <Badge variant={item.reviewed_at ? 'success' : 'warning'}>
                            {item.reviewed_at ? 'Reviewed' : 'Waiting for review'}
                        </Badge>
                    </div>
                    {item.checked_in_at ? (
                        <p className="mt-1 text-sm text-slate-500">Submitted {formatDateTime(item.checked_in_at)}</p>
                    ) : null}
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-500 sm:text-right">
                    <p>Weight: {item.weight_kg} kg</p>
                    <p>Waist: {item.waist_cm} cm</p>
                </div>
            </div>

            {item.notes ? <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{item.notes}</p> : null}

            {item.progress_photo ? (
                <div className="mt-3 text-sm">
                    {item.progress_photo.url ? (
                        <a
                            href={item.progress_photo.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light"
                        >
                            Open progress photo
                        </a>
                    ) : (
                        <p className="text-slate-500">Progress photo stored: {item.progress_photo.name}</p>
                    )}
                </div>
            ) : null}

            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <p className="font-medium text-slate-900">Doctor follow-up</p>
                {item.review_notes ? (
                    <>
                        <p className="mt-1.5 whitespace-pre-wrap">{item.review_notes}</p>
                        {item.reviewed_by ? (
                            <p className="mt-1.5 text-slate-500">Reviewed by {item.reviewed_by}</p>
                        ) : null}
                    </>
                ) : (
                    <p className="mt-1.5 text-slate-500">Your doctor has not reviewed this week yet.</p>
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

    const progressPercent =
        activePackage.consultation_credits_total > 0
            ? Math.round(
                  ((activePackage.consultation_credits_total - activePackage.consultation_credits_remaining) /
                      activePackage.consultation_credits_total) *
                      100,
              )
            : 0;

    return (
        <Card className="soft-lift">
            <CardHeader className="border-b border-slate-100">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="font-headline text-xl">{activePackage.name}</CardTitle>
                        <CardDescription>
                            Week {activePackage.current_program_week} of your active program with{' '}
                            {activePackage.doctor?.name ?? 'your care team'}.
                        </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariant[activePackage.status] ?? 'neutral'}>{activePackage.status}</Badge>
                        <Badge variant={activePackage.current_week_submitted ? 'success' : 'warning'}>
                            {activePackage.current_week_submitted ? 'This week submitted' : 'Check-in due'}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-0 p-0">
                <div className="grid gap-3 p-5 sm:grid-cols-2 md:grid-cols-4 border-b border-slate-100">
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Doctor</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {activePackage.doctor?.name ?? 'Not assigned yet'}
                        </p>
                        {activePackage.doctor?.specialization ? (
                            <p className="text-xs text-slate-500">{activePackage.doctor.specialization}</p>
                        ) : null}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Credits</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {activePackage.consultation_credits_remaining} / {activePackage.consultation_credits_total}
                        </p>
                        <p className="text-xs text-slate-500">Remaining</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Activated</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                            {activePackage.activated_at ? formatDate(activePackage.activated_at) : 'Not available'}
                        </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Meal plan</p>
                        {activePackage.meal_plan ? (
                            activePackage.meal_plan.url ? (
                                <a
                                    href={activePackage.meal_plan.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="mt-1 inline-block text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light"
                                >
                                    Open meal plan
                                </a>
                            ) : (
                                <p className="mt-1 text-sm font-medium text-slate-900">{activePackage.meal_plan.name}</p>
                            )
                        ) : (
                            <p className="mt-1 text-xs text-slate-500">No meal plan uploaded yet.</p>
                        )}
                    </div>
                </div>

                {activePackage.consultation_credits_total > 0 ? (
                    <div className="border-b border-slate-100 px-5 pt-4 pb-5">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-500">Program Progress</span>
                            <span className="font-bold text-clinical-gold">{progressPercent}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-clinical-gold rounded-full transition-all duration-700"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                ) : null}

                <div className="grid grid-cols-1 lg:grid-cols-2">
                    <form
                        onSubmit={submit}
                        className="space-y-4 p-5 lg:border-r border-slate-100"
                        id={`checkin-form-${activePackage.id}`}
                    >
                        <div>
                            <p className="text-sm font-medium text-slate-900">Weekly Check-in</p>
                            <p className="mt-1 text-xs text-slate-500">
                                Submit one update per program week without consuming consultation credits.
                            </p>
                        </div>

                        {activePackage.current_week_submitted ? (
                            <div className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                                Week {activePackage.current_program_week} has already been submitted. Your next form
                                unlocks in the next program week.
                            </div>
                        ) : null}

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-500">Weight (kg)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={data.weight_kg}
                                    onChange={(event) => setData('weight_kg', event.target.value)}
                                    disabled={activePackage.current_week_submitted}
                                />
                                {errors.weight_kg ? (
                                    <p className="mt-1 text-xs text-rose-600">{errors.weight_kg}</p>
                                ) : null}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-medium text-slate-500">Waist (cm)</label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="1"
                                    value={data.waist_cm}
                                    onChange={(event) => setData('waist_cm', event.target.value)}
                                    disabled={activePackage.current_week_submitted}
                                />
                                {errors.waist_cm ? (
                                    <p className="mt-1 text-xs text-rose-600">{errors.waist_cm}</p>
                                ) : null}
                            </div>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-500">Notes</label>
                            <Textarea
                                value={data.notes}
                                onChange={(event) => setData('notes', event.target.value)}
                                placeholder="Document how the week felt, changes you noticed..."
                                disabled={activePackage.current_week_submitted}
                            />
                            {errors.notes ? <p className="mt-1 text-xs text-rose-600">{errors.notes}</p> : null}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-medium text-slate-500">Progress photo</label>
                            <input
                                type="file"
                                accept="image/*"
                                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-clinical-gold/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-clinical-gold hover:file:bg-clinical-gold/20"
                                onChange={(event) => setData('progress_photo', event.target.files?.[0] ?? null)}
                                disabled={activePackage.current_week_submitted}
                            />
                            {errors.progress_photo ? (
                                <p className="mt-1 text-xs text-rose-600">{errors.progress_photo}</p>
                            ) : null}
                        </div>

                        <Button
                            className="w-full bg-clinical-gold text-white hover:bg-clinical-gold-light focus:ring-clinical-gold"
                            disabled={processing || activePackage.current_week_submitted}
                        >
                            {processing
                                ? 'Submitting progress...'
                                : `Submit week ${activePackage.current_program_week} check-in`}
                        </Button>
                    </form>

                    <div className="p-5">
                        <p className="text-sm font-medium text-slate-900">Progress History</p>
                        <p className="mt-1 text-xs text-slate-500">
                            Track each weekly submission and its doctor review state.
                        </p>
                        <div className="mt-4 space-y-3">
                            {activePackage.progress_history.length ? (
                                activePackage.progress_history.map((item) => (
                                    <ProgressHistoryItem key={item.id} item={item} />
                                ))
                            ) : (
                                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                                    No weekly progress has been submitted for this package yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Dashboard({ stats, profileContext, upcomingConsultation, activePackages, engagementFeed, bookings }) {
    const firstName = profileContext.name?.split(' ')[0] ?? 'there';
    const hasPendingCheckIn = activePackages.some((pkg) => !pkg.current_week_submitted);
    const firstPendingPackage = activePackages.find((pkg) => !pkg.current_week_submitted);

    return (
        <PatientLayout>
            <Head title="Patient Dashboard" />

            <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="font-headline text-2xl md:text-3xl text-slate-900">
                        {getGreeting()}, {firstName}
                    </h1>
                    <p className="mt-1 text-sm text-secondary">
                        Your wellness journey is on track. Here is your overview for today.
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white p-4 rounded-xl border border-border-subtle soft-lift flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-secondary">Health Status</p>
                            <p className="text-sm font-semibold text-emerald-600">
                                {activePackages.length > 0 ? 'Active Program' : 'On Track'}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-8 grid grid-cols-2 gap-4 lg:gap-6 md:grid-cols-4">
                <div className="bg-white p-4 rounded-xl border border-border-subtle soft-lift">
                    <p className="text-xs uppercase tracking-wider text-secondary mb-1">Total Bookings</p>
                    <p className="font-headline text-2xl text-slate-900">{stats.totalBookings}</p>
                    <p className="text-xs text-slate-400 mt-1">All time</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border-subtle soft-lift">
                    <p className="text-xs uppercase tracking-wider text-secondary mb-1">Confirmed</p>
                    <p className="font-headline text-2xl text-slate-900">{stats.confirmedBookings}</p>
                    <p className="text-xs text-emerald-600 mt-1">Consultations</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border-subtle soft-lift">
                    <p className="text-xs uppercase tracking-wider text-secondary mb-1">Paid Bookings</p>
                    <p className="font-headline text-2xl text-slate-900">{stats.paidBookings}</p>
                    <p className="text-xs text-slate-400 mt-1">Completed payments</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-border-subtle soft-lift">
                    <p className="text-xs uppercase tracking-wider text-secondary mb-1">Active Packages</p>
                    <p className="font-headline text-2xl text-slate-900">{stats.activePackages}</p>
                    <p className="text-xs text-clinical-gold mt-1">In progress</p>
                </div>
            </section>

            <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-12 lg:gap-6">
                <div className="md:col-span-7 lg:col-span-8 bg-white rounded-xl border border-border-subtle soft-lift overflow-hidden flex flex-col md:flex-row">
                    <div className="flex items-center justify-center bg-gradient-to-br from-clinical-gold/20 to-clinical-gold/5 p-8 md:w-1/3">
                        <div className="flex flex-col items-center text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-clinical-gold/10 text-2xl font-bold text-clinical-gold">
                                {getInitials(upcomingConsultation?.doctor)}
                            </div>
                            {upcomingConsultation ? (
                                <span className="mt-3 rounded-full bg-clinical-gold px-3 py-1 text-xs font-medium text-white">
                                    Next Visit
                                </span>
                            ) : null}
                        </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-center p-6">
                        <h3 className="font-headline text-lg font-bold text-slate-900">
                            {upcomingConsultation ? 'Upcoming Consultation' : 'No Consultation Scheduled'}
                        </h3>
                        {upcomingConsultation ? (
                            <>
                                <div className="mt-3 space-y-2 text-sm text-secondary">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-clinical-gold text-base">calendar_today</span>
                                        <span>{formatDateTime(upcomingConsultation.start_time)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-clinical-gold text-base">person</span>
                                        <span className="font-medium text-slate-700">{upcomingConsultation.doctor}</span>
                                    </div>
                                    {upcomingConsultation.specialization ? (
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-clinical-gold text-base">medical_services</span>
                                            <span>{upcomingConsultation.specialization}</span>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="mt-4 flex gap-3">
                                    <a
                                        href="#recent-consultations"
                                        className="inline-flex items-center justify-center rounded-xl bg-clinical-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-clinical-gold-light focus:outline-none focus:ring-2 focus:ring-clinical-gold focus:ring-offset-2"
                                    >
                                        View Schedule
                                    </a>
                                    <a
                                        href="#active-program-workspace"
                                        className="inline-flex items-center justify-center rounded-xl border border-outline-variant bg-white px-4 py-2 text-sm font-medium text-secondary transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                                    >
                                        Open Treatment Plan
                                    </a>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="mt-2 text-sm text-secondary">
                                    No confirmed consultation is scheduled right now.
                                </p>
                                <div className="mt-4">
                                    <Link
                                        href={route('bookings.create')}
                                        className="inline-flex items-center justify-center rounded-xl bg-clinical-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-clinical-gold-light focus:outline-none focus:ring-2 focus:ring-clinical-gold focus:ring-offset-2"
                                    >
                                        Book Consultation
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {hasPendingCheckIn ? (
                    <div className="md:col-span-5 lg:col-span-4">
                        <div className="flex h-full min-h-[220px] flex-col justify-between overflow-hidden rounded-xl bg-slate-900 p-6 text-white relative border border-slate-700 shadow-sm">
                            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-clinical-gold/20 blur-3xl" />
                            <div className="relative z-10">
                                <h3 className="font-headline text-lg">Weekly Check-in</h3>
                                <p className="mt-2 text-sm opacity-75">
                                    It's time to record your progress and update your practitioner on your symptoms.
                                </p>
                            </div>
                            <div className="relative z-10">
                                <a
                                    href={`#checkin-form-${firstPendingPackage?.id ?? ''}`}
                                    className="block w-full rounded-md bg-white py-3 text-center text-sm font-bold text-slate-900 transition-colors hover:bg-slate-50"
                                >
                                    Complete Form (4 mins)
                                </a>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="md:col-span-5 lg:col-span-4">
                        <div className="flex h-full min-h-[220px] flex-col items-center justify-center rounded-xl bg-white border border-border-subtle soft-lift p-6 text-center">
                            <div className="w-12 h-12 rounded-full bg-clinical-gold/10 flex items-center justify-center text-clinical-gold mb-3">
                                <span className="material-symbols-outlined">check_circle</span>
                            </div>
                            <p className="font-headline text-base text-slate-900">All Caught Up</p>
                            <p className="text-sm text-secondary mt-1">No pending check-ins right now.</p>
                            <Link
                                href={route('bookings.create')}
                                className="mt-4 inline-flex items-center justify-center rounded-xl bg-clinical-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-clinical-gold-light focus:outline-none focus:ring-2 focus:ring-clinical-gold focus:ring-offset-2"
                            >
                                Book Consultation
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 lg:gap-6">
                <div className="md:col-span-8">
                    <div id="active-program-workspace" className="scroll-mt-28 mb-4">
                        <h2 className="font-headline text-lg font-bold text-slate-900">Active Program Workspace</h2>
                        <p className="mt-1 text-sm text-secondary">
                            Submit your weekly check-in, download meal plans, and review doctor feedback.
                        </p>
                    </div>

                    {activePackages.length ? (
                        <div className="space-y-4">
                            {activePackages.map((activePackage) => (
                                <ActivePackageCard key={activePackage.id} activePackage={activePackage} />
                            ))}
                        </div>
                    ) : (
                        <Card className="soft-lift">
                            <CardHeader>
                                <CardTitle className="font-headline">No Active Program Yet</CardTitle>
                                <CardDescription>
                                    Your booking history is still available, and package cards will appear here once an
                                    entitlement is active.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link
                                    href={route('patient.packages.index')}
                                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                                >
                                    Browse packages
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="flex flex-col gap-4 md:col-span-4">
                    <div className="bg-white p-5 rounded-xl border border-border-subtle soft-lift">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">Profile Health Context</h3>
                        <div className="space-y-2.5 text-sm">
                            <div className="flex justify-between gap-4">
                                <span className="text-secondary">Patient</span>
                                <span className="max-w-[60%] text-right font-medium text-slate-900 break-words">{profileContext.name}</span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-secondary">Date of birth</span>
                                <span className="max-w-[60%] text-right font-medium text-slate-900">
                                    {formatDate(profileContext.date_of_birth)}
                                </span>
                            </div>
                            <div className="flex justify-between gap-4">
                                <span className="text-secondary">Phone</span>
                                <span className="max-w-[60%] text-right font-medium text-slate-900 break-words">
                                    {profileContext.phone ?? 'Not provided'}
                                </span>
                            </div>
                            <div className="border-t border-slate-100 pt-2.5">
                                <p className="text-xs text-secondary">Address</p>
                                <p className="mt-0.5 text-sm font-medium text-slate-900">
                                    {profileContext.address || 'No address saved yet.'}
                                </p>
                            </div>
                            <div className="border-t border-slate-100 pt-2.5">
                                <p className="text-xs text-secondary">Medical notes</p>
                                <p className="mt-0.5 whitespace-pre-wrap text-sm font-medium text-slate-900">
                                    {profileContext.medical_notes || 'No medical notes saved yet.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-border-subtle soft-lift">
                        <h3 className="text-sm font-medium text-slate-900 mb-4">Engagement Feed</h3>
                        <div className="space-y-2.5">
                            {engagementFeed.length ? (
                                engagementFeed.map((item, index) => (
                                    <div key={`${item.title}-${index}`} className="rounded-xl bg-slate-50 p-3">
                                        <div className="flex items-center gap-2">
                                            <Badge variant={item.variant}>{item.variant}</Badge>
                                            <p className="text-xs font-medium text-slate-900">{item.title}</p>
                                        </div>
                                        <p className="mt-1.5 text-xs text-secondary">{item.body}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-secondary">No urgent engagement items right now.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-border-subtle soft-lift">
                        <h3 className="text-sm font-medium text-slate-900 mb-1">Next Steps</h3>
                        <p className="text-xs text-secondary mb-4">
                            Continue your care journey with a new consultation or package.
                        </p>
                        <div className="space-y-2">
                            <Link
                                href={route('bookings.create')}
                                className="inline-flex w-full items-center justify-center rounded-xl bg-clinical-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-clinical-gold-light focus:outline-none focus:ring-2 focus:ring-clinical-gold focus:ring-offset-2"
                            >
                                Book Consultation
                            </Link>
                            <Link
                                href={route('patient.packages.index')}
                                className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2"
                            >
                                Browse Packages
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div id="recent-consultations" className="scroll-mt-28 mt-8">
                <div className="bg-white rounded-xl border border-border-subtle soft-lift">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="font-headline text-lg font-bold text-slate-900">
                            Upcoming & Recent Consultations
                        </h3>
                        <p className="text-xs text-secondary mt-1">
                            Track every booking from pending payment through confirmed consultation.
                        </p>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {bookings.length ? (
                            bookings.map((booking) => (
                                <div
                                    key={booking.id}
                                    className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-slate-50/50 md:flex-row md:items-center md:justify-between"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-clinical-gold/10">
                                            <span className="text-sm font-bold text-clinical-gold">
                                                {getInitials(booking.doctor)}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{booking.doctor}</p>
                                            <p className="text-xs text-secondary">{booking.specialization}</p>
                                            <p className="mt-1 text-xs text-secondary">
                                                {formatDateTime(booking.start_time)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                                        <Badge variant={statusVariant[booking.status] ?? 'neutral'}>
                                            {booking.status}
                                        </Badge>
                                        {booking.payment_status ? (
                                            <Badge variant={statusVariant[booking.payment_status] ?? 'neutral'}>
                                                {booking.payment_status}
                                            </Badge>
                                        ) : null}
                                        {booking.meeting_link ? (
                                            <a
                                                href={booking.meeting_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="ml-1 text-xs font-medium text-clinical-gold underline-offset-4 hover:underline"
                                            >
                                                Join meeting
                                            </a>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-5 py-4">
                                <p className="text-sm text-secondary">No consultations yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PatientLayout>
    );
}
