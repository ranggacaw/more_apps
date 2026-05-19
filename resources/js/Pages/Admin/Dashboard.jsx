import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head } from '@inertiajs/react';

export default function Dashboard({ stats, recentBookings }) {
    return (
        <AppLayout title="Admin Dashboard" description="Monitor operational health, revenue, and the latest patient booking activity.">
            <Head title="Admin Dashboard" />

            <div className="grid gap-4 md:grid-cols-4">
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
            </div>

            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Recent bookings</CardTitle>
                    <CardDescription>Track role-based operations from booking creation through payment confirmation.</CardDescription>
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
        </AppLayout>
    );
}
