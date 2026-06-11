import { Badge } from '@/components/ui/badge';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

function StatPill({ label, value, emphasized = false }) {
    return (
        <div className={`rounded-[18px] p-3 text-center ${emphasized ? 'bg-slate-950 text-white' : 'bg-surface-container-low'}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className={`mt-1 text-xs font-medium ${emphasized ? 'text-white/70' : 'text-secondary'}`}>{label}</p>
        </div>
    );
}

function PatientContact({ patient }) {
    const contacts = [patient.email, patient.phone].filter(Boolean);

    if (contacts.length === 0) {
        return null;
    }

    return <p className="mt-1 text-sm font-medium text-secondary">{contacts.join(' · ')}</p>;
}

function SubmittedAt({ value, fallback = 'Awaiting submission timestamp' }) {
    return <span>{value ? formatDateTime(value) : fallback}</span>;
}

function MetricValue({ value, suffix }) {
    return value ? `${value} ${suffix}` : 'Not recorded';
}

function NextReviewCommand({ review }) {
    if (!review) {
        return (
            <section className="mt-6 rounded-[30px] border border-border-subtle bg-white p-5 shadow-[0_18px_50px_-34px_rgba(17,24,39,0.55)] sm:p-6">
                <Badge variant="success" className="font-bold uppercase tracking-[0.14em]">Clear</Badge>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">No weekly reviews are pending right now.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Use the active program list below to browse patient status, credits, and latest records.</p>
            </section>
        );
    }

    return (
        <section className="mt-6 overflow-hidden rounded-[30px] border border-[#DECFA8] bg-white shadow-[0_18px_50px_-34px_rgba(17,24,39,0.55)]">
            <div className="border-b border-[#F0E4C5] bg-[#FBF6E8] px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-950 font-bold uppercase tracking-[0.14em] text-white">Do first</Badge>
                    <Badge variant="warning" className="border border-[#D8C58C] bg-white font-semibold text-[#836615]">Oldest pending review</Badge>
                    <span className="text-xs font-medium text-[#836615]/80">
                        Submitted <SubmittedAt value={review.checked_in_at} />
                    </span>
                </div>
            </div>

            <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-stretch lg:p-7">
                <div>
                    <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">
                        Review {review.patient.name}'s week {review.program_week} progress
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
                        {review.package_name}. Open the weekly review workspace, add doctor notes, then return to this queue.
                    </p>

                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-border-subtle bg-surface-container-low p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Patient</p>
                            <p className="mt-2 text-xl font-bold text-slate-950">{review.patient.name}</p>
                        </div>
                        <div className="rounded-2xl border border-border-subtle bg-surface-container-low p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Program week</p>
                            <p className="mt-2 text-xl font-bold text-slate-950">Week {review.program_week}</p>
                        </div>
                        <div className="rounded-2xl border border-border-subtle bg-surface-container-low p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Submitted</p>
                            <p className="mt-2 text-sm font-bold leading-6 text-slate-950"><SubmittedAt value={review.checked_in_at} fallback="Not recorded" /></p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-slate-950 p-4 text-white">
                    <div>
                        <p className="text-sm font-bold">Recommended action</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">This is the oldest pending patient progress review assigned to you.</p>
                    </div>
                    <Link href={review.review_href} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-gold">
                        Open review workspace
                    </Link>
                </div>
            </div>
        </section>
    );
}

function PendingReviewQueue({ pendingReviews }) {
    return (
        <aside className="rounded-[28px] border border-border-subtle bg-white p-4 shadow-[0_16px_40px_-30px_rgba(17,24,39,0.45)] sm:p-5 xl:sticky xl:top-8 xl:self-start">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-950">Pending queue</h2>
                    <p className="mt-1 text-sm leading-6 text-secondary">Sorted by oldest submission first.</p>
                </div>
                <Badge variant={pendingReviews.length > 0 ? 'warning' : 'success'} className="text-sm font-bold">{pendingReviews.length}</Badge>
            </div>

            <div className="mt-5 space-y-3">
                {pendingReviews.length > 0 ? pendingReviews.map((item, index) => (
                    <Link
                        key={item.id}
                        href={item.review_href}
                        className={`block rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-30px_rgba(17,24,39,0.45)] ${index === 0 ? 'border-slate-950 bg-surface-container-low' : 'border-border-subtle hover:border-clinical-gold/50 hover:bg-amber-50/30'}`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="font-bold text-slate-950">{item.patient.name}</p>
                                <p className="mt-1 text-sm text-secondary">{item.package_name} · Week {item.program_week}</p>
                            </div>
                            {index === 0 ? <Badge className="bg-slate-950 font-bold uppercase tracking-[0.12em] text-white">Next</Badge> : null}
                        </div>
                        <p className="mt-3 text-xs font-medium text-secondary">
                            Submitted <SubmittedAt value={item.checked_in_at} />
                        </p>
                    </Link>
                )) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-secondary">
                        No weekly reviews are pending right now.
                    </div>
                )}
            </div>
        </aside>
    );
}

function LatestCheckInSummary({ checkIn }) {
    if (!checkIn) {
        return (
            <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Latest check-in</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">No weekly check-in has been submitted for this program yet.</p>
            </div>
        );
    }

    return (
        <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Latest week</p>
                <p className="mt-2 font-bold text-slate-950">Week {checkIn.program_week}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Metrics</p>
                <p className="mt-2 font-bold text-slate-950">
                    {MetricValue({ value: checkIn.weight_kg, suffix: 'kg' })} / {MetricValue({ value: checkIn.waist_cm, suffix: 'cm' })}
                </p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-4">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Submitted</p>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-950"><SubmittedAt value={checkIn.checked_in_at} fallback="Not recorded" /></p>
            </div>
        </div>
    );
}

function ProgramCard({ program }) {
    const hasPendingReview = program.has_pending_review;
    const actionHref = program.review_workspace_href ?? route('doctor.medical-records.index');

    return (
        <article className="rounded-[28px] border border-border-subtle bg-white p-4 shadow-[0_16px_40px_-30px_rgba(17,24,39,0.45)] sm:p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant={hasPendingReview ? 'warning' : 'success'} className="font-bold">
                                    {hasPendingReview ? `${program.pending_review_count} pending` : 'All reviewed'}
                                </Badge>
                                <Badge variant="neutral" className="font-semibold">
                                    {program.package.consultation_credits_remaining} / {program.package.consultation_credits_total} credits
                                </Badge>
                            </div>
                            <h3 className="mt-3 text-xl font-bold text-slate-950">{program.patient.name}</h3>
                            <p className="mt-1 text-sm font-medium text-secondary">{program.package.name}</p>
                            <PatientContact patient={program.patient} />
                        </div>
                    </div>

                    <LatestCheckInSummary checkIn={program.latest_check_in} />
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-surface-cream p-4">
                    <div>
                        <p className="text-sm font-bold text-slate-950">Program status</p>
                        <p className="mt-2 text-sm capitalize leading-6 text-secondary">{program.package.status}</p>
                        {program.package.activated_at ? <p className="mt-2 text-sm leading-6 text-secondary">Activated {formatDateTime(program.package.activated_at)}</p> : null}
                        {program.package.expires_at ? <p className="mt-1 text-sm leading-6 text-secondary">Expires {formatDateTime(program.package.expires_at)}</p> : null}
                    </div>

                    <div className="mt-5 grid gap-2">
                        <Link
                            href={actionHref}
                            className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-gold ${hasPendingReview ? 'bg-clinical-gold text-white hover:bg-clinical-gold-light' : 'border border-border-subtle bg-white text-secondary hover:bg-surface-container-low hover:text-slate-950'}`}
                        >
                            {hasPendingReview ? 'Review latest' : 'Open latest record'}
                        </Link>
                        {program.meal_plan?.url ? (
                            <a href={program.meal_plan.url} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-bold text-secondary transition hover:bg-surface-container-low hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-gold">
                                Open meal plan
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        </article>
    );
}

export default function ProgramReviews({ doctor, stats, programs, pendingReviews }) {
    const firstPendingReview = pendingReviews[0] ?? null;

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Program Reviews" />

            <DoctorPageHeader title="Program Reviews" subtitle="Start with pending check-ins, then scan active programs for context, credits, and follow-up status." />

            <div className="grid grid-cols-3 gap-2 rounded-[24px] border border-border-subtle bg-white p-2 shadow-[0_16px_40px_-30px_rgba(17,24,39,0.45)] sm:max-w-md">
                <StatPill label="Programs" value={stats.active_programs} />
                <StatPill label="Patients" value={stats.active_patients} />
                <StatPill label="Pending" value={stats.pending_reviews} emphasized />
            </div>

            <NextReviewCommand review={firstPendingReview} />

            <div className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <PendingReviewQueue pendingReviews={pendingReviews} />

                <div className="space-y-4">
                    {programs.length > 0 ? programs.map((program) => (
                        <ProgramCard key={program.id} program={program} />
                    )) : (
                        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-secondary shadow-[0_16px_40px_-30px_rgba(17,24,39,0.45)]">
                            No active patient programs are assigned to you right now.
                        </div>
                    )}
                </div>
            </div>
        </DoctorLayout>
    );
}
