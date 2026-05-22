import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { dayLabels, formatCurrency, formatDateTime } from '@/lib/format';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

function formatDate(value) {
    if (!value) return 'Not available';
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function formatTime(value) {
    if (!value) return '--:--';
    return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function getRecentCheckIns(programs) {
    return programs
        .flatMap((p) => p.progress_history.map((c) => ({ ...c, patient: p.patient, programId: p.id })))
        .sort((a, b) => (b.checked_in_at ? new Date(b.checked_in_at).getTime() : 0) - (a.checked_in_at ? new Date(a.checked_in_at).getTime() : 0))
        .slice(0, 5);
}

function getTrendData(programs) {
    const map = new Map();
    programs.forEach((p) => p.progress_history.forEach((c) => {
        const cur = map.get(c.program_week) ?? { week: c.program_week, submitted: 0, reviewed: 0 };
        cur.submitted++;
        if (c.reviewed_at) cur.reviewed++;
        map.set(c.program_week, cur);
    }));
    return Array.from(map.values()).sort((a, b) => a.week - b.week).slice(-4);
}

function ConsultationWorkloadCard({ booking, packages }) {
    const { data, setData, post, processing, errors } = useForm({
        notes: booking.consultation?.notes ?? '',
        recommended_package_id: booking.consultation?.recommended_package_id ? String(booking.consultation.recommended_package_id) : '',
        meal_plan_summary: booking.consultation?.meal_plan_summary ?? '',
    });

    const submit = (e) => { e.preventDefault(); post(route('doctor.bookings.complete', booking.id), { preserveScroll: true }); };
    const intake = booking.intake ?? {};

    return (
        <div className="rounded-lg border border-border-subtle bg-surface-cream/50 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-clinical-gold"></div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between pl-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-label-md text-label-md font-bold text-charcoal-depth">{booking.patient.name}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${booking.status === 'confirmed' ? 'bg-emerald-50 text-status-success' : 'bg-surface-container text-secondary'}`}>
                            {booking.status}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${booking.payment_status === 'paid' ? 'bg-emerald-50 text-status-success' : 'bg-amber-50 text-status-warning'}`}>
                            {booking.payment_status ?? 'unpaid'}
                        </span>
                    </div>
                    <p className="font-body-md text-body-md text-secondary mt-1">{formatDateTime(booking.start_time)}</p>
                    <p className="text-[12px] text-secondary">{booking.patient.email} &bull; {booking.patient.phone}</p>
                    {booking.meeting_link ? (
                        <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="mt-2 inline-block font-label-sm text-label-sm text-clinical-gold hover:text-primary transition-colors underline underline-offset-4">
                            Consultation access
                        </a>
                    ) : null}
                </div>
                {!booking.can_complete ? <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold text-secondary">NOT READY</span> : null}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr] pl-3">
                <div className="rounded-lg bg-white p-4 space-y-3">
                    <p className="font-label-md text-label-md font-bold text-charcoal-depth">Pre-consultation intake</p>
                    {intake.notes || intake.patient_upload_name ? (
                        <div className="space-y-3 font-body-md text-body-md text-secondary">
                            <div>
                                <p className="font-label-sm text-label-sm font-bold text-on-background">Patient notes</p>
                                <p className="mt-1 whitespace-pre-wrap">{intake.notes ?? 'No notes provided.'}</p>
                            </div>
                            <div>
                                <p className="font-label-sm text-label-sm font-bold text-on-background">Uploaded document</p>
                                <div className="mt-1">
                                    {intake.patient_upload_name ? (
                                        intake.patient_upload_url ? (
                                            <a href={intake.patient_upload_url} target="_blank" rel="noreferrer" className="text-clinical-gold underline underline-offset-4">{intake.patient_upload_name}</a>
                                        ) : (
                                            <p>{intake.patient_upload_name}</p>
                                        )
                                    ) : (
                                        <p>No document uploaded.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="font-body-md text-body-md text-secondary">No intake context was provided.</p>
                    )}
                </div>

                <form onSubmit={submit} className="space-y-4 rounded-lg border border-border-subtle bg-white p-4">
                    <div>
                        <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">Consultation notes</label>
                        <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} placeholder="Document the key outcomes, next steps, and care guidance." required />
                        {errors.notes ? <p className="mt-2 font-body-md text-body-md text-rose-600">{errors.notes}</p> : null}
                    </div>
                    <div>
                        <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">Recommended package</label>
                        <select className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold" value={data.recommended_package_id} onChange={(e) => setData('recommended_package_id', e.target.value)}>
                            <option value="">No package recommendation</option>
                            {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} &bull; {formatCurrency(pkg.price)} &bull; {pkg.consultation_credits} credits</option>)}
                        </select>
                        {errors.recommended_package_id ? <p className="mt-2 font-body-md text-body-md text-rose-600">{errors.recommended_package_id}</p> : null}
                    </div>
                    <div>
                        <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">Meal plan summary</label>
                        <Textarea value={data.meal_plan_summary} onChange={(e) => setData('meal_plan_summary', e.target.value)} placeholder="Optional meal plan summary for the patient PDF." />
                        {errors.meal_plan_summary ? <p className="mt-2 font-body-md text-body-md text-rose-600">{errors.meal_plan_summary}</p> : null}
                    </div>
                    <Button className="w-full bg-clinical-gold text-white hover:opacity-90 transition-opacity shadow-sm font-label-md text-label-md" disabled={processing || !booking.can_complete}>
                        {processing ? 'Saving consultation...' : 'Complete consultation'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

function ProgramReviewForm({ checkIn }) {
    const { data, setData, post, processing, errors } = useForm({ review_notes: checkIn.review_notes ?? '' });
    const submit = (e) => { e.preventDefault(); post(route('doctor.program.check-ins.review', checkIn.id), { preserveScroll: true }); };

    return (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border border-border-subtle bg-white p-4">
            <div>
                <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">Doctor follow-up notes</label>
                <Textarea value={data.review_notes} onChange={(e) => setData('review_notes', e.target.value)} placeholder="Summarize the review outcome, adjustment guidance, and next steps." />
                {errors.review_notes ? <p className="mt-2 font-body-md text-body-md text-rose-600">{errors.review_notes}</p> : null}
            </div>
            <Button className="w-full bg-clinical-gold text-white hover:opacity-90 transition-opacity shadow-sm font-label-md text-label-md">
                {processing ? 'Saving review...' : checkIn.reviewed_at ? 'Update review notes' : 'Save review notes'}
            </Button>
        </form>
    );
}

function ActiveProgramCard({ program }) {
    return (
        <div className="rounded-lg border border-border-subtle bg-surface-cream/50 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-outline-variant"></div>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between pl-3">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-label-md text-label-md font-bold text-charcoal-depth">{program.patient.name}</p>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${program.has_pending_review ? 'bg-amber-50 text-status-warning' : 'bg-emerald-50 text-status-success'}`}>
                            {program.has_pending_review ? 'PENDING REVIEW' : 'REVIEWED'}
                        </span>
                    </div>
                    <p className="font-body-md text-body-md text-secondary mt-1">{program.patient.email} &bull; {program.patient.phone}</p>
                    <p className="text-[12px] text-secondary">{program.package.name}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold text-secondary">{program.package.consultation_credits_remaining} / {program.package.consultation_credits_total} credits</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${program.package.status === 'active' ? 'bg-emerald-50 text-status-success' : 'bg-surface-container text-secondary'}`}>{program.package.status}</span>
                </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr] pl-3">
                <div className="space-y-4 rounded-lg bg-white p-4 font-body-md text-body-md text-secondary">
                    <div>
                        <p className="font-label-sm text-label-sm font-bold text-charcoal-depth">Latest package context</p>
                        {program.package.activated_at ? <p className="mt-2">Activated {formatDateTime(program.package.activated_at)}</p> : null}
                        {program.package.expires_at ? <p>Expires {formatDateTime(program.package.expires_at)}</p> : null}
                    </div>
                    <div>
                        <p className="font-label-sm text-label-sm font-bold text-charcoal-depth">Meal plan asset</p>
                        {program.meal_plan ? (
                            program.meal_plan.url ? (
                                <a href={program.meal_plan.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-clinical-gold hover:text-primary transition-colors underline underline-offset-4">Open current meal plan</a>
                            ) : (
                                <p className="mt-2">Stored meal plan: {program.meal_plan.name}</p>
                            )
                        ) : (
                            <p className="mt-2">No meal plan uploaded yet.</p>
                        )}
                    </div>
                    <div>
                        <p className="font-label-sm text-label-sm font-bold text-charcoal-depth">Latest weekly check-in</p>
                        {program.latest_check_in ? (
                            <div className="mt-2 rounded-lg border border-border-subtle bg-surface-cream/50 p-4">
                                <p className="font-label-md text-label-md font-bold text-charcoal-depth">Week {program.latest_check_in.program_week}</p>
                                {program.latest_check_in.checked_in_at ? <p className="mt-1">Submitted {formatDateTime(program.latest_check_in.checked_in_at)}</p> : null}
                                <p className="mt-2">Weight {program.latest_check_in.weight_kg} kg</p>
                                <p>Waist {program.latest_check_in.waist_cm} cm</p>
                            </div>
                        ) : (
                            <p className="mt-2">No weekly check-in submitted yet.</p>
                        )}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="font-label-md text-label-md font-bold text-charcoal-depth">Weekly progress history</p>
                        <p className="mt-1 font-body-md text-body-md text-secondary">Review attached media and add follow-up notes on the same week.</p>
                    </div>
                    {program.progress_history.length ? (
                        program.progress_history.map((checkIn) => (
                            <div key={checkIn.id} className="rounded-lg border border-border-subtle bg-white p-4">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-label-md text-label-md font-bold text-charcoal-depth">Week {checkIn.program_week}</p>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${checkIn.reviewed_at ? 'bg-emerald-50 text-status-success' : 'bg-amber-50 text-status-warning'}`}>
                                                {checkIn.reviewed_at ? 'REVIEWED' : 'AWAITING REVIEW'}
                                            </span>
                                        </div>
                                        {checkIn.checked_in_at ? <p className="mt-1 font-body-md text-body-md text-secondary">{formatDateTime(checkIn.checked_in_at)}</p> : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 font-body-md text-body-md text-secondary md:text-right">
                                        <p>Weight: {checkIn.weight_kg} kg</p>
                                        <p>Waist: {checkIn.waist_cm} cm</p>
                                    </div>
                                </div>
                                {checkIn.notes ? <p className="mt-3 whitespace-pre-wrap font-body-md text-body-md text-secondary">{checkIn.notes}</p> : null}
                                {checkIn.progress_photo ? (
                                    <div className="mt-3">
                                        {checkIn.progress_photo.url ? (
                                            <a href={checkIn.progress_photo.url} target="_blank" rel="noreferrer" className="font-body-md text-body-md text-clinical-gold hover:text-primary transition-colors underline underline-offset-4">Open progress photo</a>
                                        ) : (
                                            <p className="font-body-md text-body-md text-secondary">Stored photo: {checkIn.progress_photo.name}</p>
                                        )}
                                    </div>
                                ) : null}
                                {checkIn.reviewed_at ? (
                                    <div className="mt-4 rounded-lg bg-emerald-50 p-4 font-body-md text-body-md text-emerald-900">
                                        <p className="font-label-sm text-label-sm font-bold">Current review</p>
                                        <p className="mt-2 whitespace-pre-wrap">{checkIn.review_notes}</p>
                                        {checkIn.reviewed_by ? <p className="mt-2 text-emerald-700">Reviewed by {checkIn.reviewed_by}</p> : null}
                                    </div>
                                ) : null}
                                <ProgramReviewForm checkIn={checkIn} />
                            </div>
                        ))
                    ) : (
                        <p className="rounded-lg border border-dashed border-outline-variant p-6 font-body-md text-body-md text-secondary">No weekly progress submitted yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Dashboard({ doctor, consultationWorkload, packages, activePrograms, availabilities }) {
    const activePatients = activePrograms.length;
    const readyConsultations = consultationWorkload.filter((b) => b.can_complete).length;
    const pendingReviews = activePrograms.reduce((t, p) => t + p.progress_history.filter((c) => !c.reviewed_at).length, 0);
    const recentCheckIns = getRecentCheckIns(activePrograms);
    const trendItems = getTrendData(activePrograms);
    const todayLabel = formatDate(new Date().toISOString());

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Doctor Dashboard" />

            <DoctorPageHeader
                title="Overview"
                subtitle={`Welcome back, ${doctor.name}. You have ${consultationWorkload.length} appointments today.`}
                actions={
                    <div className="hidden md:flex gap-stack-sm">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-border-subtle rounded-md soft-lift">
                            <span className="material-symbols-outlined text-clinical-gold">event</span>
                            <span className="font-label-sm text-label-sm text-charcoal-depth">{todayLabel}</span>
                        </div>
                        <button className="p-2 bg-white border border-border-subtle rounded-md hover:bg-surface-container transition-colors">
                            <span className="material-symbols-outlined text-secondary">notifications</span>
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-12 gap-gutter">
                <section className="col-span-12 lg:col-span-4 bg-white border border-border-subtle rounded-xl soft-lift p-stack-md h-fit">
                    <div className="flex justify-between items-center mb-stack-md">
                        <h3 className="font-title-lg text-title-lg text-charcoal-depth">Today's Schedule</h3>
                        <Link href={route('doctor.availability.index')} className="text-clinical-gold font-label-sm text-label-sm hover:underline">View Calendar</Link>
                    </div>
                    <div className="space-y-4">
                        {consultationWorkload.length ? consultationWorkload.map((booking) => (
                            <div key={booking.id} className={`group relative pl-4 py-1 hover:bg-surface-cream transition-colors rounded-r-md ${booking.can_complete ? 'border-l-2 border-clinical-gold' : 'border-l-2 border-outline-variant opacity-60'}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-label-md text-label-md font-bold">{formatTime(booking.start_time)}</p>
                                        <p className="font-body-md text-body-md text-charcoal-depth">{booking.patient.name}</p>
                                        <p className="text-[12px] text-secondary">{booking.status} &bull; {booking.payment_status ?? 'unpaid'}</p>
                                    </div>
                                    {booking.meeting_link ? (
                                        <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="text-clinical-gold hover:text-primary transition-colors">
                                            <span className="material-symbols-outlined">videocam</span>
                                        </a>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold text-secondary">{booking.can_complete ? 'READY' : 'WAITING'}</span>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <p className="font-body-md text-body-md text-secondary">No consultations scheduled right now.</p>
                        )}
                    </div>
                </section>

                <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-gutter">
                    <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-stack-md">
                        <div className="bg-white border border-border-subtle rounded-xl p-stack-md soft-lift">
                            <p className="text-secondary font-label-sm text-label-sm uppercase">Active Patients</p>
                            <h4 className="font-headline-md text-headline-md text-clinical-gold mt-1">{activePatients}</h4>
                        </div>
                        <div className="bg-white border border-border-subtle rounded-xl p-stack-md soft-lift">
                            <p className="text-secondary font-label-sm text-label-sm uppercase">Ready Today</p>
                            <h4 className="font-headline-md text-headline-md text-clinical-gold mt-1">{readyConsultations}</h4>
                        </div>
                        <div className="bg-white border border-border-subtle rounded-xl p-stack-md soft-lift">
                            <p className="text-secondary font-label-sm text-label-sm uppercase">Pending Reviews</p>
                            <h4 className="font-headline-md text-headline-md text-clinical-gold mt-1">{pendingReviews}</h4>
                        </div>
                    </div>

                    <section className="bg-white border border-border-subtle rounded-xl soft-lift p-stack-md flex flex-col">
                        <div className="flex justify-between items-center mb-stack-md">
                            <h3 className="font-title-lg text-title-lg text-charcoal-depth">Recent Check-ins</h3>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                            {recentCheckIns.length ? recentCheckIns.map((item) => (
                                <div key={item.id} className="p-3 border border-border-subtle rounded-lg bg-surface-cream/50 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-clinical-gold"></div>
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-label-sm text-label-sm font-bold text-charcoal-depth">{item.patient.name}</p>
                                        <span className="text-[10px] text-secondary">{item.checked_in_at ? formatDateTime(item.checked_in_at) : 'Pending'}</span>
                                    </div>
                                    <p className="font-body-md text-[13px] leading-relaxed italic text-secondary line-clamp-2">
                                        {item.notes ?? 'No written note was attached to this check-in.'}
                                    </p>
                                    {item.progress_photo ? (
                                        <div className="mt-2 flex gap-2">
                                            <span className="px-2 py-0.5 bg-white border border-border-subtle rounded text-[9px] font-semibold text-secondary uppercase">Photo attached</span>
                                        </div>
                                    ) : null}
                                </div>
                            )) : (
                                <p className="font-body-md text-body-md text-secondary">No recent check-ins yet.</p>
                            )}
                        </div>
                    </section>

                    <section className="bg-white border border-border-subtle rounded-xl soft-lift p-stack-md flex flex-col">
                        <div className="flex justify-between items-center mb-stack-md">
                            <h3 className="font-title-lg text-title-lg text-charcoal-depth">Availability</h3>
                        </div>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                            {availabilities.length ? availabilities.map((a) => (
                                <div key={a.id} className="p-2 hover:bg-surface-cream rounded-md transition-colors group cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-xs">
                                            <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                                        </div>
                                        <div>
                                            <p className="font-label-md text-label-md font-bold text-charcoal-depth group-hover:text-clinical-gold transition-colors">{dayLabels[a.day_of_week]}</p>
                                            <p className="text-[11px] text-secondary">{a.start_time} - {a.end_time}</p>
                                            <p className="text-[11px] text-secondary">{a.slot_duration_minutes} min slots</p>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="font-body-md text-body-md text-secondary">No availability blocks yet.</p>
                            )}
                        </div>
                    </section>
                </div>

                <section id="workspace" className="col-span-12 bg-white border border-border-subtle rounded-xl soft-lift p-stack-md">
                    <div className="flex justify-between items-center mb-stack-lg">
                        <div>
                            <h3 className="font-title-lg text-title-lg text-charcoal-depth">Current Confirmed Consultations</h3>
                            <p className="font-label-sm text-label-sm text-secondary">Same-day consultations are prioritized so you can review intake context and close out each paid session.</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {consultationWorkload.length ? (
                            consultationWorkload.map((booking) => <ConsultationWorkloadCard key={booking.id} booking={booking} packages={packages} />)
                        ) : (
                            <p className="font-body-md text-body-md text-secondary">No confirmed consultations are waiting for completion right now.</p>
                        )}
                    </div>
                </section>

                <section id="programs" className="col-span-12 bg-white border border-border-subtle rounded-xl soft-lift p-stack-md">
                    <div className="flex justify-between items-center mb-stack-lg">
                        <div>
                            <h3 className="font-title-lg text-title-lg text-charcoal-depth">Active Patient Programs</h3>
                            <p className="font-label-sm text-label-sm text-secondary">Only packages linked to consultations completed by you appear here, with the latest weekly review context.</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {activePrograms.length ? (
                            activePrograms.map((program) => <ActiveProgramCard key={program.id} program={program} />)
                        ) : (
                            <p className="font-body-md text-body-md text-secondary">No active patient programs are assigned to you right now.</p>
                        )}
                    </div>
                </section>

                {trendItems.length ? (
                    <section className="col-span-12 bg-white border border-border-subtle rounded-xl soft-lift p-stack-md">
                        <div className="flex justify-between items-center mb-stack-lg">
                            <div>
                                <h3 className="font-title-lg text-title-lg text-charcoal-depth">Weekly Review Trend</h3>
                                <p className="font-label-sm text-label-sm text-secondary">Submitted check-ins with reviewed portions highlighted</p>
                            </div>
                            <select className="bg-surface-container-low border-none rounded-md font-label-sm text-label-sm text-secondary focus:ring-clinical-gold">
                                <option>Latest 4 Weeks</option>
                            </select>
                        </div>
                        <div className="h-64 w-full flex items-end gap-2 px-4 border-b border-l border-border-subtle relative">
                            {trendItems.map((item) => {
                                const maxS = Math.max(...trendItems.map((t) => t.submitted), 1);
                                const h = Math.max(25, Math.round((item.submitted / maxS) * 100));
                                const rh = item.submitted ? Math.max(15, Math.round((item.reviewed / item.submitted) * h)) : 0;
                                return (
                                    <div key={item.week} className="flex-1 bg-clinical-gold/10 hover:bg-clinical-gold/30 transition-all rounded-t-sm group relative" style={{ height: `${h}%` }}>
                                        <div className="absolute bottom-0 left-0 right-0 bg-clinical-gold/40 rounded-t-sm" style={{ height: `${rh}%` }}></div>
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal-depth text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.submitted} / {item.reviewed}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between mt-4 px-4 text-[10px] text-secondary uppercase tracking-widest">
                            {trendItems.map((item) => <span key={item.week}>Week {item.week}</span>)}
                        </div>
                    </section>
                ) : null}
            </div>
        </DoctorLayout>
    );
}
