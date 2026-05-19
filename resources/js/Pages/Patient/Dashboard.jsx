import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

const statusVariant = {
    confirmed: 'success',
    paid: 'success',
    pending: 'warning',
    cancelled: 'danger',
};

export default function Dashboard({ stats, bookings }) {
    return (
        <AppLayout title="Patient Dashboard" description="Manage your profile, upcoming consultations, and payment status.">
            <Head title="Patient Dashboard" />

            <div className="grid gap-4 md:grid-cols-3">
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
                        <CardDescription>Book a new consultation and lock your preferred slot before payment.</CardDescription>
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
