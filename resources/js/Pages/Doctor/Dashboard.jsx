import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { dayLabels, formatDateTime } from '@/lib/format';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { Head, Link } from '@inertiajs/react';

function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-[24px] border border-border-subtle bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
    );
}

export default function Dashboard({ doctor, stats, todaySchedule, nextConsultation, pendingReviews, availabilityPreview }) {
    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Doctor Dashboard" />

            <DoctorPageHeader
                title="Overview"
                subtitle={`Welcome back, ${doctor.name}. This page keeps today's workload short, then routes you into focused consultation, review, and archive workspaces.`}
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Active Patients" value={stats.active_patients} helper="Patients with active programs under your care" />
                <StatCard label="Ready Consultations" value={stats.ready_consultations} helper="Confirmed bookings ready for completion" />
                <StatCard label="Pending Reviews" value={stats.pending_reviews} helper="Weekly check-ins still waiting for review" />
                <StatCard label="Availability Blocks" value={stats.availability_blocks} helper="Current schedule blocks on your calendar" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
                <div className="space-y-6">
                    <Card className="border-border-subtle bg-white">
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle>Today's consultation overview</CardTitle>
                                <CardDescription>See the next items in schedule order, then open a dedicated consultation workspace when you are ready to complete one.</CardDescription>
                            </div>
                            <Link href={route('doctor.consultations.index')} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Open consultations
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {todaySchedule.length > 0 ? todaySchedule.map((booking) => (
                                <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{booking.patient.name}</p>
                                            <p className="mt-1 text-sm text-slate-500">{formatDateTime(booking.start_time)}</p>
                                            <p className="mt-1 text-xs text-slate-500">{booking.payment_status ?? 'unpaid'} payment {booking.meeting_link ? '· meeting link ready' : ''}</p>
                                            {booking.needs_meeting_link ? (
                                                <p className="mt-1 text-xs font-medium text-amber-700">Google Meet link required</p>
                                            ) : null}
                                        </div>
                                        <Link href={booking.workspace_href} className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                                            Open workspace
                                        </Link>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">No confirmed consultations are waiting right now.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border-subtle bg-white">
                        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle>Pending weekly reviews</CardTitle>
                                <CardDescription>Open the focused progress workspace for the next patient who needs follow-up.</CardDescription>
                            </div>
                            <Link href={route('doctor.program-reviews.index')} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Open program reviews
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pendingReviews.length > 0 ? pendingReviews.map((item) => (
                                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">{item.patient.name}</p>
                                            <p className="mt-1 text-sm text-slate-500">{item.package_name} · Week {item.program_week}</p>
                                            <p className="mt-1 text-xs text-slate-500">{item.checked_in_at ? `Submitted ${formatDateTime(item.checked_in_at)}` : 'Awaiting submission timestamp'}</p>
                                        </div>
                                        <Link href={item.review_href} className="inline-flex items-center rounded-xl bg-clinical-gold px-4 py-2 text-sm font-medium text-white transition hover:bg-clinical-gold-light">
                                            Review record
                                        </Link>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">No weekly reviews are pending right now.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Next action</CardTitle>
                            <CardDescription>Jump straight into the most likely next task from the overview.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {nextConsultation ? (
                                <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{nextConsultation.patient.name}</p>
                                        <p className="mt-1 text-sm text-slate-500">{formatDateTime(nextConsultation.start_time)}</p>
                                    </div>
                                    <Link href={nextConsultation.workspace_href} className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                                        Open consultation workspace
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500">No consultation action is waiting right now.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border-subtle bg-white">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Availability snapshot</CardTitle>
                                <CardDescription>Keep a short view of your current availability blocks here.</CardDescription>
                            </div>
                            <Link href={route('doctor.availability.index')} className="text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
                                Manage
                            </Link>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {availabilityPreview.length > 0 ? availabilityPreview.map((availability) => (
                                <div key={availability.id} className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-sm font-semibold text-slate-900">{dayLabels[availability.day_of_week]}</p>
                                    <p className="mt-1 text-sm text-slate-500">{availability.start_time} - {availability.end_time}</p>
                                    <p className="mt-1 text-xs text-slate-500">{availability.slot_duration_minutes} minute slots</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">No availability blocks are configured yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Other workspaces</CardTitle>
                            <CardDescription>Use the archive when you need broader history or one of the dedicated workflow pages when you are executing today’s work.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href={route('doctor.medical-records.index')} className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Open medical records archive
                            </Link>
                            <Link href={route('doctor.program-reviews.index')} className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Open active program reviews
                            </Link>
                            <Link href={route('doctor.consultations.index')} className="block rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                Open consultation workload
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DoctorLayout>
    );
}
