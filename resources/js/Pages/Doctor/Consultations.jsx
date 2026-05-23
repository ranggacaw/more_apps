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

export default function Consultations({ doctor, stats, bookings }) {
    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Consultations" />

            <DoctorPageHeader title="Consultation Workload" subtitle="Review confirmed bookings in schedule order and open a dedicated workspace for each consultation completion flow." />

            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Confirmed" value={stats.total} helper="Confirmed bookings in the active workload" />
                <StatCard label="Today" value={stats.today} helper="Consultations scheduled for today" />
                <StatCard label="Ready" value={stats.ready} helper="Bookings ready to complete" />
            </div>

            <Card className="mt-6 border-border-subtle bg-white">
                <CardHeader>
                    <CardTitle>Consultation queue</CardTitle>
                    <CardDescription>The dashboard stays short. Use this page when you need to work through the full confirmed consultation list.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {bookings.length > 0 ? bookings.map((booking) => (
                        <div key={booking.id} className="rounded-2xl border border-slate-200 p-5">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <p className="text-lg font-semibold text-slate-950">{booking.patient.name}</p>
                                    <p className="mt-1 text-sm text-slate-500">{formatDateTime(booking.start_time)}</p>
                                    <p className="mt-1 text-sm text-slate-500">{booking.patient.email} · {booking.patient.phone}</p>
                                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{booking.payment_status ?? 'unpaid'} payment · {booking.is_today ? 'today' : 'upcoming'}</p>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                                    {booking.meeting_link ? (
                                        <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                                            Open meeting
                                        </a>
                                    ) : null}
                                    <Link href={booking.workspace_href} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
                                        Open workspace
                                    </Link>
                                </div>
                            </div>

                            {booking.intake?.notes || booking.intake?.patient_upload_name ? (
                                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    <p className="font-medium text-slate-900">Intake preview</p>
                                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap">{booking.intake.notes ?? 'No notes provided.'}</p>
                                    {booking.intake.patient_upload_name ? <p className="mt-2 text-xs text-slate-500">File: {booking.intake.patient_upload_name}</p> : null}
                                </div>
                            ) : null}
                        </div>
                    )) : (
                        <p className="text-sm text-slate-500">No confirmed consultations are waiting for completion right now.</p>
                    )}
                </CardContent>
            </Card>
        </DoctorLayout>
    );
}
