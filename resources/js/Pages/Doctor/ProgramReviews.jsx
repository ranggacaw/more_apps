import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-[24px] border border-border-subtle bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">{helper}</p>
        </div>
    );
}

export default function ProgramReviews({ doctor, stats, programs, pendingReviews }) {
    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Program Reviews" />

            <DoctorPageHeader title="Active Program Reviews" subtitle="Use this focused workspace for weekly follow-up without turning the dashboard into a long all-in-one operations page." />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Active Programs" value={stats.active_programs} helper="Programs linked to consultations you completed" />
                <StatCard label="Active Patients" value={stats.active_patients} helper="Patients currently under follow-up" />
                <StatCard label="Pending Reviews" value={stats.pending_reviews} helper="Weekly check-ins that still need review" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <Card className="border-border-subtle bg-white h-fit">
                    <CardHeader>
                        <CardTitle>Pending first</CardTitle>
                        <CardDescription>Open the highest-priority weekly review items before browsing the rest of the active programs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {pendingReviews.length > 0 ? pendingReviews.map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                                <p className="text-sm font-semibold text-slate-900">{item.patient.name}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.package_name} · Week {item.program_week}</p>
                                <p className="mt-1 text-xs text-slate-500">{item.checked_in_at ? `Submitted ${formatDateTime(item.checked_in_at)}` : 'Awaiting submission timestamp'}</p>
                                <Link href={item.review_href} className="mt-3 inline-flex text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
                                    Open review workspace
                                </Link>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-500">No weekly reviews are pending right now.</p>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {programs.length > 0 ? programs.map((program) => (
                        <Card key={program.id} className="border-border-subtle bg-white">
                            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <CardTitle>{program.patient.name}</CardTitle>
                                    <CardDescription>{program.package.name} · {program.patient.email} · {program.patient.phone}</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={program.has_pending_review ? 'warning' : 'success'}>
                                        {program.has_pending_review ? `${program.pending_review_count} pending` : 'All reviewed'}
                                    </Badge>
                                    <Badge variant="neutral">{program.package.consultation_credits_remaining} / {program.package.consultation_credits_total} credits</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                                <div className="space-y-4">
                                    {program.latest_check_in ? (
                                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                            <p className="font-medium text-slate-900">Latest weekly check-in</p>
                                            <p className="mt-2">Week {program.latest_check_in.program_week}</p>
                                            {program.latest_check_in.checked_in_at ? <p className="mt-1">Submitted {formatDateTime(program.latest_check_in.checked_in_at)}</p> : null}
                                            <p className="mt-1">Weight {program.latest_check_in.weight_kg} kg · Waist {program.latest_check_in.waist_cm} cm</p>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500">No weekly check-in has been submitted for this program yet.</p>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        {program.meal_plan?.url ? (
                                            <a href={program.meal_plan.url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                                Open meal plan
                                            </a>
                                        ) : null}
                                        <Link href={program.review_workspace_href ?? route('doctor.medical-records.index')} className="inline-flex items-center rounded-xl bg-clinical-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-clinical-gold-light">
                                            {program.has_pending_review ? 'Review latest check-in' : 'Open latest record'}
                                        </Link>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                                    <p className="font-medium text-slate-900">Program status</p>
                                    <p className="mt-2 capitalize">{program.package.status}</p>
                                    {program.package.activated_at ? <p className="mt-2">Activated {formatDateTime(program.package.activated_at)}</p> : null}
                                    {program.package.expires_at ? <p className="mt-1">Expires {formatDateTime(program.package.expires_at)}</p> : null}
                                </div>
                            </CardContent>
                        </Card>
                    )) : (
                        <Card className="border-border-subtle bg-white">
                            <CardContent className="p-6 text-sm text-slate-500">No active patient programs are assigned to you right now.</CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </DoctorLayout>
    );
}
