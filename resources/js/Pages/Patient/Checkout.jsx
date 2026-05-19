import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Checkout({ booking, payment, midtrans }) {
    const [scriptReady, setScriptReady] = useState(false);

    useEffect(() => {
        if (midtrans.is_demo || !midtrans.client_key) {
            return undefined;
        }

        const script = document.createElement('script');
        script.src = midtrans.is_production ? 'https://app.midtrans.com/snap/snap.js' : 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.dataset.clientKey = midtrans.client_key;
        script.onload = () => setScriptReady(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [midtrans.client_key, midtrans.is_demo, midtrans.is_production]);

    const launchMidtrans = () => {
        if (!window.snap || !payment.snap_token) {
            return;
        }

        window.snap.pay(payment.snap_token, {
            onSuccess: () => router.visit(route('patient.dashboard')),
            onPending: () => router.reload(),
            onError: () => router.reload(),
            onClose: () => router.reload(),
        });
    };

    const simulate = (status) => {
        router.post(route('payments.simulate', payment.id), { status });
    };

    return (
        <AppLayout title="Consultation Checkout" description="Bookings are only confirmed after the Midtrans payment callback marks the payment as successful.">
            <Head title="Consultation Checkout" />

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Booking summary</CardTitle>
                        <CardDescription>Review your selected doctor, schedule, and note before payment.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-slate-600">
                        <div>
                            <p className="font-medium text-slate-900">{booking.doctor}</p>
                            <p>{booking.specialization}</p>
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Consultation time</p>
                            <p>{formatDateTime(booking.start_time)}</p>
                        </div>
                        <div>
                            <p className="font-medium text-slate-900">Booking status</p>
                            <div className="mt-2 flex gap-2">
                                <Badge variant={booking.status === 'confirmed' ? 'success' : 'warning'}>{booking.status}</Badge>
                                <Badge variant={payment.status === 'paid' ? 'success' : payment.status === 'failed' ? 'danger' : 'warning'}>
                                    {payment.status}
                                </Badge>
                            </div>
                        </div>
                        {booking.notes ? (
                            <div>
                                <p className="font-medium text-slate-900">Clinic note</p>
                                <p>{booking.notes}</p>
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment</CardTitle>
                        <CardDescription>Consultation fees are processed through Midtrans. A successful callback confirms the booking.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Amount due</p>
                            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                        </div>

                        {midtrans.is_demo ? (
                            <div className="space-y-3">
                                <p className="text-sm text-slate-500">Midtrans keys are not configured in this environment, so demo callbacks are available for local MVP testing.</p>
                                <Button variant="success" className="w-full" onClick={() => simulate('success')}>
                                    Simulate payment success
                                </Button>
                                <Button variant="outline" className="w-full" onClick={() => simulate('pending')}>
                                    Simulate payment pending
                                </Button>
                                <Button variant="danger" className="w-full" onClick={() => simulate('failed')}>
                                    Simulate payment failure
                                </Button>
                            </div>
                        ) : (
                            <Button className="w-full" onClick={launchMidtrans} disabled={!scriptReady || payment.status === 'paid'}>
                                {payment.status === 'paid' ? 'Already paid' : scriptReady ? 'Open Midtrans payment' : 'Preparing payment gateway...'}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
