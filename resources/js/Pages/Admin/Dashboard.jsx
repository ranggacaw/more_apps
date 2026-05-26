import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

export default function Dashboard({ stats, recentBookings, recentPayments }) {
    return (
        <AppLayout title="Admin Dashboard" description="Monitor users, bookings, revenue, packages, and the latest operational transitions from one admin surface.">
            <Head title="Admin Dashboard" />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Card>
                    <CardHeader>
                        <CardDescription>Patients</CardDescription>
                        <CardTitle>{stats.patients}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Doctors</CardDescription>
                        <CardTitle>{stats.doctors}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Admins</CardDescription>
                        <CardTitle>{stats.admins}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Paid revenue</CardDescription>
                        <CardTitle>{formatCurrency(stats.revenue)}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Pending bookings</CardDescription>
                        <CardTitle>{stats.pending_bookings}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Confirmed bookings</CardDescription>
                        <CardTitle>{stats.confirmed_bookings}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Active packages</CardDescription>
                        <CardTitle>{stats.active_packages}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader>
                        <CardDescription>Active entitlements</CardDescription>
                        <CardTitle>{stats.active_entitlements}</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="border-amber-200 bg-amber-50/10">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-amber-800 font-semibold">Walk-In Queue</CardDescription>
                        <CardTitle className="text-amber-900">{stats.queue_summary.waiting} Waiting / {stats.queue_summary.active} Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Link href={route('admin.queue.index')} className="text-xs text-amber-700 hover:text-amber-800 font-bold underline">
                            Manage Queue →
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent bookings</CardTitle>
                        <CardDescription>Track schedules, booking state, and payment readiness.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentBookings.length ? (
                            recentBookings.map((booking) => (
                                <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{booking.patient}</p>
                                            <p className="text-sm text-slate-500">with {booking.doctor}</p>
                                            <p className="mt-2 text-sm text-slate-600">{formatDateTime(booking.start_time)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={booking.status === 'confirmed' ? 'success' : booking.status === 'cancelled' ? 'danger' : 'warning'}>{booking.status}</Badge>
                                            <Badge variant={booking.payment_status === 'paid' ? 'success' : booking.payment_status === 'failed' ? 'danger' : 'warning'}>
                                                {booking.payment_status ?? 'unpaid'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">No booking activity yet.</p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent payments</CardTitle>
                        <CardDescription>Review the latest consultation and package payment transitions.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {recentPayments.length ? (
                            recentPayments.map((payment) => (
                                <div key={payment.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{payment.patient}</p>
                                            <p className="text-sm text-slate-500">
                                                {payment.type === 'package' ? payment.package ?? 'Package checkout' : `Consultation with ${payment.doctor ?? 'assigned doctor'}`}
                                            </p>
                                            <p className="mt-2 text-sm text-slate-600">{formatCurrency(payment.amount)}</p>
                                            <p className="text-xs text-slate-500">{formatDateTime(payment.paid_at ?? payment.created_at)}</p>
                                            {payment.schedule ? <p className="text-xs text-slate-500">Schedule: {formatDateTime(payment.schedule)}</p> : null}
                                        </div>
                                        <Badge variant={payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'danger' : 'warning'}>{payment.status}</Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">No payment activity yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
