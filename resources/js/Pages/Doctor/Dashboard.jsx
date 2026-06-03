import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dayLabels, formatDateTime } from '@/lib/format';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { Head, Link, router } from '@inertiajs/react';

function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-[24px] border border-border-subtle bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{helper}</p>
        </div>
    );
}

export default function Dashboard({ doctor, stats, todaySchedule, nextConsultation, pendingReviews, clinicSchedule }) {
    const [currentWalkIn, setCurrentWalkIn] = useState(null);

    const fetchStatus = () => {
        fetch(route('doctor.queue.api'))
            .then((res) => {
                if (res.ok) return res.json();
                throw new Error('Failed to fetch status');
            })
            .then((data) => setCurrentWalkIn(data))
            .catch((err) => console.error('Error fetching doctor queue status:', err));
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStartConsultation = () => {
        if (!currentWalkIn) return;
        router.post(route('doctor.queue.start', currentWalkIn.id));
    };

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
                <StatCard label="Clinic Schedule" value={`${stats.clinic_schedule_days} days`} helper="Shared appointment windows for all doctors" />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_380px]">
                <div className="space-y-6">
                    {/* Current Walk-In Patient Panel */}
                    <Card className="border-amber-200 bg-amber-50/10">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-amber-950 font-bold">Current Walk-In Patient</CardTitle>
                                {currentWalkIn && (
                                    <Badge variant={currentWalkIn.status === 'in_consultation' ? 'success' : 'warning'} className="uppercase font-bold text-[10px]">
                                        {currentWalkIn.status === 'in_consultation' ? 'In Consultation' : 'Assigned'}
                                    </Badge>
                                )}
                            </div>
                            <CardDescription className="text-amber-800/80">Manage walk-in patients dispatched by the admin.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {currentWalkIn ? (
                                <div className="space-y-4">
                                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-100 p-4 shadow-sm">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                                        {currentWalkIn.queue_number}
                                                    </span>
                                                    <h4 className="font-bold text-slate-900 text-base">
                                                        {currentWalkIn.patient_name}
                                                    </h4>
                                                </div>
                                                {currentWalkIn.patient_phone && (
                                                    <p className="text-xs text-slate-500 font-medium">WhatsApp: {currentWalkIn.patient_phone}</p>
                                                )}
                                                {currentWalkIn.complaint_notes && (
                                                    <div className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2 max-w-xl">
                                                        <span className="text-xs font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">Complaint Notes</span>
                                                        {currentWalkIn.complaint_notes}
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-slate-400 block pt-1">
                                                    Assigned at: {formatDateTime(currentWalkIn.assigned_at)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 justify-end">
                                        {currentWalkIn.status === 'assigned' && (
                                            <Button
                                                onClick={handleStartConsultation}
                                                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm px-4 py-2 rounded-xl"
                                            >
                                                Start Consultation
                                            </Button>
                                        )}
                                        {currentWalkIn.status === 'in_consultation' && (
                                            <Link
                                                href={currentWalkIn.workspace_href ?? route('doctor.queue.workspace', currentWalkIn.id)}
                                                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                                            >
                                                Open in-room workspace
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-6 bg-white/50 rounded-xl border border-dashed border-slate-200">
                                    No walk-in patient is currently assigned to you.
                                </p>
                            )}
                        </CardContent>
                    </Card>

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
                                <CardTitle>Clinic schedule</CardTitle>
                                <CardDescription>All doctors follow these shared appointment windows.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {clinicSchedule.length > 0 ? clinicSchedule.map((window) => (
                                <div key={window.id} className="rounded-2xl border border-slate-200 p-4">
                                    <p className="text-sm font-semibold text-slate-900">{dayLabels[window.day_of_week]}</p>
                                    <p className="mt-1 text-sm text-slate-500">{window.start_time} - {window.end_time}</p>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-500">No clinic schedule is configured yet.</p>
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
