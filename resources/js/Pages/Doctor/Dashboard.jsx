import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { dayLabels, formatDateTime } from '@/lib/format';
import { Head, router } from '@inertiajs/react';

export default function Dashboard({ doctor, upcomingBookings, availabilities }) {
    return (
        <AppLayout title="Doctor Dashboard" description="Review upcoming consultations, mark completed sessions, and manage your availability calendar.">
            <Head title="Doctor Dashboard" />

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Upcoming consultations</CardTitle>
                        <CardDescription>Bookings remain pending until payment is confirmed through the callback flow.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {upcomingBookings.length ? (
                            upcomingBookings.map((booking) => (
                                <div key={booking.id} className="rounded-2xl border border-slate-200 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900">{booking.patient}</p>
                                            <p className="text-sm text-slate-500">{formatDateTime(booking.start_time)}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>{booking.status}</Badge>
                                            <Badge variant={booking.payment_status === 'paid' ? 'success' : 'warning'}>{booking.payment_status ?? 'unpaid'}</Badge>
                                        </div>
                                    </div>
                                    {booking.status === 'confirmed' ? (
                                        <Button className="mt-4" variant="outline" onClick={() => router.post(route('doctor.bookings.complete', booking.id))}>
                                            Mark as completed
                                        </Button>
                                    ) : null}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500">No upcoming consultations yet.</p>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{doctor.name}</CardTitle>
                            <CardDescription>{doctor.specialization}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-600">{doctor.bio}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Active availability blocks</CardTitle>
                            <CardDescription>These blocks generate the patient-facing consultation slots.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {availabilities.length ? (
                                availabilities.map((availability) => (
                                    <div key={availability.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-600">
                                        <p className="font-medium text-slate-900">{dayLabels[availability.day_of_week]}</p>
                                        <p>
                                            {availability.start_time} - {availability.end_time}
                                        </p>
                                        <p>{availability.slot_duration_minutes} minute slots</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">No availability blocks yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
