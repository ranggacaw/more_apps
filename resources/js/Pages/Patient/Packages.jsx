import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/Layouts/AppLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const badgeByStatus = {
    eligible: 'success',
    pending: 'warning',
    paid: 'success',
    failed: 'danger',
    missing: 'neutral',
    consultation_incomplete: 'warning',
    expired: 'danger',
    consumed: 'neutral',
    invalid_source: 'danger',
};

export default function Packages({ credit, packages, packageCheckout, midtrans }) {
    const [checkout, setCheckout] = useState(packageCheckout);
    const [scriptReady, setScriptReady] = useState(false);
    const [loadingPackageId, setLoadingPackageId] = useState(null);

    const canContinueCheckout = checkout?.payment?.can_continue_checkout;
    const isDemoCheckout = canContinueCheckout && checkout?.payment?.snap_token?.startsWith('demo-');

    useEffect(() => {
        setCheckout(packageCheckout);
    }, [packageCheckout]);

    useEffect(() => {
        setScriptReady(false);

        if (!canContinueCheckout || isDemoCheckout || !midtrans.client_key) {
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
    }, [canContinueCheckout, isDemoCheckout, midtrans.client_key, midtrans.is_production]);

    const refreshPage = () => {
        router.visit(route('patient.packages.index'));
    };

    const launchMidtrans = () => {
        if (!canContinueCheckout || !window.snap || !checkout?.payment?.snap_token) {
            return;
        }

        window.snap.pay(checkout.payment.snap_token, {
            onSuccess: refreshPage,
            onPending: refreshPage,
            onError: refreshPage,
            onClose: refreshPage,
        });
    };

    const simulate = (status) => {
        if (!checkout?.payment?.id) {
            return;
        }

        router.post(route('payments.simulate', checkout.payment.id), { status });
    };

    const startCheckout = async (pkg) => {
        setLoadingPackageId(pkg.id);

        try {
            const response = await window.axios.post(route('payments.packages.init'), {
                package_id: pkg.id,
            });

            setCheckout(response.data.data);
        } catch (error) {
            const message = error?.response?.data?.message;

            if (message) {
                window.alert(message);
            }
        } finally {
            setLoadingPackageId(null);
        }
    };

    return (
        <AppLayout title="Wellness Packages" description="Apply your paid consultation credit to active wellness packages after the qualifying consultation is completed.">
            <Head title="Wellness Packages" />

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Consultation credit</CardTitle>
                            <CardDescription>Your package checkout eligibility is controlled by the credit awarded from a paid consultation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-slate-600">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Available credit</p>
                                <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(credit.amount)}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Badge variant={badgeByStatus[credit.eligibility_reason] ?? 'neutral'}>
                                        {credit.is_eligible ? 'eligible' : credit.eligibility_reason.replaceAll('_', ' ')}
                                    </Badge>
                                    {credit.source_booking_status ? <Badge variant="neutral">booking {credit.source_booking_status}</Badge> : null}
                                </div>
                            </div>

                            <p>{credit.message}</p>

                            {credit.awarded_at ? <p>Awarded: {formatDateTime(credit.awarded_at)}</p> : null}
                            {credit.expires_at ? <p>Expires: {formatDateTime(credit.expires_at)}</p> : null}
                            {credit.consumed_at ? <p>Consumed: {formatDateTime(credit.consumed_at)}</p> : null}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Current checkout</CardTitle>
                            <CardDescription>Funded package purchases wait for the authoritative server-side payment callback.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-slate-600">
                            {checkout ? (
                                <>
                                    <div>
                                        <p className="font-medium text-slate-900">{checkout.package.name}</p>
                                        <p>{checkout.package.consultation_credits} consultation credits</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant={badgeByStatus[checkout.payment.status] ?? 'neutral'}>{checkout.payment.status}</Badge>
                                        <Badge variant="neutral">Credit applied {formatCurrency(checkout.payment.consultation_credit_applied)}</Badge>
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Final payable amount</p>
                                        <p>{formatCurrency(checkout.payment.amount)}</p>
                                        <p className="break-all text-xs text-slate-500">Order ID: {checkout.payment.order_id}</p>
                                    </div>

                                    {checkout.payment.status === 'paid' ? (
                                        <p className="text-emerald-700">Your package purchase is complete and the entitlement has been activated.</p>
                                    ) : isDemoCheckout && canContinueCheckout ? (
                                        <div className="space-y-3">
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
                                    ) : canContinueCheckout ? (
                                        <Button className="w-full" onClick={launchMidtrans} disabled={!scriptReady}>
                                            {scriptReady ? 'Continue package payment' : 'Preparing payment gateway...'}
                                        </Button>
                                    ) : (
                                        <p>The latest package checkout is not waiting for payment.</p>
                                    )}
                                </>
                            ) : (
                                <p>No package checkout has been started yet.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4">
                    {packages.map((pkg) => {
                        const isCurrentPackage = checkout?.package?.id === pkg.id && checkout?.payment?.status === 'pending';

                        return (
                            <Card key={pkg.id}>
                                <CardHeader>
                                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <CardTitle>{pkg.name}</CardTitle>
                                            <CardDescription>{pkg.description || 'Structured follow-up support with package-backed consultation credits.'}</CardDescription>
                                        </div>
                                        <Badge variant="neutral">{pkg.consultation_credits} sessions</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-2xl bg-slate-50 p-4">
                                            <p className="text-sm text-slate-500">Original price</p>
                                            <p className="mt-1 font-semibold text-slate-900">{formatCurrency(pkg.price)}</p>
                                        </div>
                                        <div className="rounded-2xl bg-emerald-50 p-4">
                                            <p className="text-sm text-emerald-700">Credit applied</p>
                                            <p className="mt-1 font-semibold text-emerald-900">{formatCurrency(pkg.checkout.applied_credit)}</p>
                                        </div>
                                        <div className="rounded-2xl bg-amber-50 p-4">
                                            <p className="text-sm text-amber-700">Final payable</p>
                                            <p className="mt-1 font-semibold text-amber-900">{formatCurrency(pkg.checkout.final_amount)}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                        <div className="flex gap-2">
                                            <Badge variant={pkg.checkout.is_eligible ? 'success' : badgeByStatus[pkg.checkout.eligibility_reason] ?? 'neutral'}>
                                                {pkg.checkout.is_eligible ? 'checkout eligible' : pkg.checkout.eligibility_reason.replaceAll('_', ' ')}
                                            </Badge>
                                            {pkg.checkout.final_amount === 0 && pkg.checkout.is_eligible ? <Badge variant="success">activates immediately</Badge> : null}
                                        </div>

                                        <Button
                                            onClick={() => startCheckout(pkg)}
                                            disabled={!pkg.checkout.is_eligible || loadingPackageId === pkg.id || (checkout?.payment?.status === 'pending' && !isCurrentPackage)}
                                        >
                                            {loadingPackageId === pkg.id
                                                ? 'Preparing checkout...'
                                                : isCurrentPackage
                                                  ? 'Checkout in progress'
                                                  : pkg.checkout.final_amount === 0
                                                    ? 'Activate with credit'
                                                    : 'Start package checkout'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}
