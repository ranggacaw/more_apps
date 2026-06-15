import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dayLabels, formatDateTime } from '@/lib/format';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { Head, Link, router } from '@inertiajs/react';

function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-[22px] border border-border-subtle bg-white p-4 shadow-[0_10px_30px_-24px_rgba(17,24,39,0.4)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-clinical-gold">{label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-secondary">{helper}</p>
        </div>
    );
}

function patientName(item) {
    return item?.patient?.name ?? item?.guest_patient_name ?? item?.patient_name ?? 'Guest patient';
}

function EmptyPanel({ message }) {
    return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-secondary">
            {message}
        </div>
    );
}

function QueueItem({ eyebrow, title, description, actionLabel, href, primary = false, warning = false }) {
    return (
        <div className={`rounded-2xl border p-4 transition ${primary ? 'border-slate-900 bg-slate-50' : 'border-slate-200 hover:border-amber-200 hover:bg-amber-50/30'}`}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        {primary ? <Badge className="bg-slate-950 text-white">Next</Badge> : null}
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">{eyebrow}</p>
                    </div>
                    <h3 className="mt-2 text-base font-bold text-slate-950">{title}</h3>
                    <p className={`mt-1 text-sm ${warning ? 'font-medium text-amber-700' : 'text-secondary'}`}>{description}</p>
                </div>
                {href ? (
                    <Link
                        href={href}
                        className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-bold transition ${primary ? 'bg-slate-950 text-white hover:bg-slate-800' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    >
                        {actionLabel}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

function PriorityAction({ queuePatient, nextConsultation, firstReview, onCallPatient, onStartConsultation }) {
    if (queuePatient) {
        const isWaiting = queuePatient.status === 'waiting';
        const isInConsultation = queuePatient.status === 'in_consultation';
        const sourceLabel = queuePatient.source_label ?? (queuePatient.source_type === 'booking' ? 'Booking arrival' : 'Walk-in');
        const statusLabel = isWaiting ? 'Next in queue' : (isInConsultation ? 'In Consultation' : 'Called');
        const workspaceHref = isInConsultation
            ? queuePatient.workspace_href ?? (queuePatient.id ? route('doctor.queue.workspace', { entry: queuePatient.id }) : null)
            : null;

        return (
            <section className="mb-5 overflow-hidden rounded-[28px] border border-amber-200 bg-white shadow-[0_18px_50px_-32px_rgba(17,24,39,0.45)]">
                <div className="border-b border-amber-100 bg-amber-50/70 px-4 py-3 sm:px-6">
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-amber-700 font-bold uppercase tracking-[0.14em] text-white">Do now</Badge>
                        <Badge variant="warning" className="border border-amber-200 bg-white font-semibold">{statusLabel}</Badge>
                        <Badge variant="neutral" className="border border-amber-200 bg-white font-semibold">{sourceLabel}</Badge>
                        {queuePatient.called_at ? <span className="text-xs font-medium text-amber-900/70">Called {formatDateTime(queuePatient.called_at)}</span> : null}
                    </div>
                </div>
                <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch lg:p-7">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                            {isWaiting ? 'Call patient' : (isInConsultation ? 'Continue in-room consultation' : 'Start consultation')} for {queuePatient.queue_number}, {patientName(queuePatient)}
                        </h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
                            This in-clinic queue patient is the most time-sensitive clinical handoff on the dashboard.
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-secondary">Queue</p>
                                <p className="mt-2 text-2xl font-bold text-slate-950">{queuePatient.queue_number}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-secondary">Status</p>
                                <p className="mt-2 text-sm font-bold text-slate-950">{statusLabel}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs uppercase tracking-[0.14em] text-secondary">WhatsApp</p>
                                <p className="mt-2 text-sm font-bold text-slate-950">{queuePatient.patient_phone ?? 'Not recorded'}</p>
                            </div>
                        </div>

                        {queuePatient.complaint_notes ? (
                            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Intake notes</p>
                                <p className="mt-2 text-sm leading-6 text-slate-700">{queuePatient.complaint_notes}</p>
                            </div>
                        ) : null}
                    </div>

                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                        <div>
                            <p className="text-sm font-bold">Recommended action</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">
                                {isWaiting ? 'Call this patient first, then start the in-room consultation.' : (isInConsultation ? 'Return to the in-room workspace and finish the active consultation.' : 'Start the in-room workspace before reviewing schedule or archive items.')}
                            </p>
                        </div>
                        <div className="mt-5">
                            {isWaiting ? (
                                <Button onClick={onCallPatient} className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-950 hover:bg-amber-50">
                                    Call patient
                                </Button>
                            ) : isInConsultation ? (
                                workspaceHref ? (
                                    <Link href={workspaceHref} className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-amber-50">
                                        Open in-room workspace
                                    </Link>
                                ) : (
                                    <Button disabled className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-950 opacity-70">
                                        Workspace unavailable
                                    </Button>
                                )
                            ) : (
                                <Button onClick={onStartConsultation} className="w-full rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-950 hover:bg-amber-50">
                                    Start consultation
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    if (nextConsultation) {
        return (
            <section className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(17,24,39,0.45)]">
                <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch lg:p-7">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-slate-950 font-bold uppercase tracking-[0.14em] text-white">Do now</Badge>
                            <Badge variant="neutral">Next consultation</Badge>
                        </div>
                        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Open workspace for {patientName(nextConsultation)}</h2>
                        <p className="mt-2 text-sm leading-6 text-secondary">{formatDateTime(nextConsultation.start_time)}</p>
                        {nextConsultation.needs_meeting_link ? <p className="mt-2 text-sm font-medium text-amber-700">Google Meet link required before completion.</p> : null}
                    </div>
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                        <div>
                            <p className="text-sm font-bold">Recommended action</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">Open the dedicated consultation workspace for this patient.</p>
                        </div>
                        <Link href={nextConsultation.workspace_href} className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-amber-50">
                            Open consultation workspace
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    if (firstReview) {
        return (
            <section className="mb-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(17,24,39,0.45)]">
                <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch lg:p-7">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-slate-950 font-bold uppercase tracking-[0.14em] text-white">Do now</Badge>
                            <Badge variant="neutral">Pending review</Badge>
                        </div>
                        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Review {patientName(firstReview)}'s weekly progress</h2>
                        <p className="mt-2 text-sm leading-6 text-secondary">{firstReview.package_name} - Week {firstReview.program_week}</p>
                    </div>
                    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
                        <div>
                            <p className="text-sm font-bold">Recommended action</p>
                            <p className="mt-2 text-sm leading-6 text-slate-300">No patient is waiting. Clear the oldest weekly follow-up next.</p>
                        </div>
                        <Link href={firstReview.review_href} className="mt-5 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-amber-50">
                            Review record
                        </Link>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="mb-5 rounded-[28px] border border-border-subtle bg-white p-5 shadow-[0_18px_50px_-32px_rgba(17,24,39,0.45)] sm:p-6">
            <Badge variant="success" className="font-bold uppercase tracking-[0.14em]">Clear</Badge>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">No urgent doctor action right now.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Use the secondary workspaces below for records, program reviews, or the full consultation workload.</p>
        </section>
    );
}

export default function Dashboard({ doctor, stats, todaySchedule, nextConsultation, pendingReviews, clinicSchedule }) {
    const [queueState, setQueueState] = useState({ current: null, next: null });
    const firstReview = pendingReviews[0] ?? null;
    const queuePatient = queueState.current ?? queueState.next;

    const fetchStatus = () => {
        fetch(route('doctor.queue.api'))
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch status');
            })
            .then((data) => setQueueState(data?.current !== undefined ? data : { current: data, next: null }))
            .catch((err) => console.error('Error fetching doctor queue status:', err));
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleCallPatient = () => {
        if (!queuePatient?.id || queuePatient.status !== 'waiting') return;
        router.post(route('doctor.queue.call', { entry: queuePatient.id }));
    };

    const handleStartConsultation = () => {
        if (!queuePatient?.id || queuePatient.status !== 'assigned') return;
        router.post(route('doctor.queue.start', { entry: queuePatient.id }));
    };

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Doctor Dashboard" />

            <DoctorPageHeader
                title="Doctor command center"
                subtitle={`Welcome back, ${doctor.name}. Start with the patient or review that needs a doctor decision next.`}
            />

            <PriorityAction
                queuePatient={queuePatient}
                nextConsultation={nextConsultation}
                firstReview={firstReview}
                onCallPatient={handleCallPatient}
                onStartConsultation={handleStartConsultation}
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Active Patients" value={stats.active_patients} helper="Patients with active programs under your care" />
                <StatCard label="Ready Consultations" value={stats.ready_consultations} helper="Confirmed bookings ready for completion" />
                <StatCard label="Pending Reviews" value={stats.pending_reviews} helper="Weekly check-ins still waiting for review" />
                <StatCard label="Clinic Schedule" value={`${stats.clinic_schedule_days} days`} helper="Shared appointment windows for all doctors" />
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <section className="rounded-[28px] border border-border-subtle bg-white p-4 shadow-[0_14px_40px_-30px_rgba(17,24,39,0.45)] sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-headline text-2xl text-slate-950">Today's patients</h3>
                            <p className="mt-1 text-sm text-secondary">Sorted by what needs attention first.</p>
                        </div>
                        <Link href={route('doctor.consultations.index')} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                            Open all consultations
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {todaySchedule.length > 0 ? todaySchedule.map((booking, index) => (
                            <QueueItem
                                key={booking.id}
                                eyebrow={formatDateTime(booking.start_time)}
                                title={patientName(booking)}
                                description={`${booking.payment_status ?? 'unpaid'} payment${booking.arrival_status ? ` - ${booking.arrival_status.replace('_', ' ')}` : ''}${booking.meeting_link ? ' - meeting link ready' : ''}${booking.needs_meeting_link ? ' - Google Meet link required' : ''}`}
                                actionLabel={booking.needs_meeting_link ? 'Add link' : 'Open workspace'}
                                href={booking.workspace_href}
                                primary={index === 0 && !queuePatient}
                                warning={booking.needs_meeting_link}
                            />
                        )) : (
                            <EmptyPanel message="No confirmed consultations are waiting right now." />
                        )}
                    </div>
                </section>

                <div className="space-y-5">
                    <section className="rounded-[28px] border border-border-subtle bg-white p-4 shadow-[0_14px_40px_-30px_rgba(17,24,39,0.45)] sm:p-5">
                        <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                                <h3 className="font-headline text-2xl text-slate-950">Reviews to clear</h3>
                                <p className="mt-1 text-sm text-secondary">Short follow-ups, separated from live patients.</p>
                            </div>
                            <Badge className="bg-surface-container-low font-bold text-on-secondary-container">{pendingReviews.length}</Badge>
                        </div>
                        <div className="space-y-3">
                            {pendingReviews.length > 0 ? pendingReviews.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-sm font-bold text-slate-950">{patientName(item)}</p>
                                    <p className="mt-1 text-sm text-secondary">{item.package_name} - Week {item.program_week}</p>
                                    <p className="mt-1 text-xs text-secondary">{item.checked_in_at ? `Submitted ${formatDateTime(item.checked_in_at)}` : 'Awaiting submission timestamp'}</p>
                                    <Link href={item.review_href} className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                                        Review record
                                    </Link>
                                </div>
                            )) : (
                                <EmptyPanel message="No weekly reviews are pending right now." />
                            )}
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-border-subtle bg-white p-4 shadow-[0_14px_40px_-30px_rgba(17,24,39,0.45)] sm:p-5">
                        <h3 className="font-headline text-2xl text-slate-950">If no patient is waiting</h3>
                        <p className="mt-1 text-sm text-secondary">Secondary workspaces stay available without distracting from the next clinical action.</p>
                        <div className="mt-4 grid gap-2">
                            <Link href={route('doctor.medical-records.index')} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                                Medical records archive
                            </Link>
                            <Link href={route('doctor.program-reviews.index')} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                                Program review workspace
                            </Link>
                            <Link href={route('doctor.consultations.index')} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                                Full consultation workload
                            </Link>
                        </div>
                    </section>

                    <section className="rounded-[28px] border border-border-subtle bg-white p-4 shadow-[0_14px_40px_-30px_rgba(17,24,39,0.45)] sm:p-5">
                        <h3 className="font-headline text-2xl text-slate-950">Clinic windows</h3>
                        <p className="mt-1 text-sm text-secondary">Shared appointment hours for all doctors.</p>
                        <div className="mt-4 space-y-2">
                            {clinicSchedule.length > 0 ? clinicSchedule.map((window) => (
                                <div key={window.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                                    <p className="text-sm font-bold text-slate-950">{dayLabels[window.day_of_week]}</p>
                                    <p className="text-sm text-secondary">{window.start_time} - {window.end_time}</p>
                                </div>
                            )) : (
                                <EmptyPanel message="No clinic schedule is configured yet." />
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </DoctorLayout>
    );
}
