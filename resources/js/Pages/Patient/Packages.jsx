import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PatientLayout from '@/Layouts/PatientLayout';
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

const labelFromReason = (reason) => reason?.replaceAll('_', ' ') ?? 'unknown';

export default function Packages({ credit, packages, packageCheckout, midtrans }) {
    const [checkout, setCheckout] = useState(packageCheckout);
    const [scriptReady, setScriptReady] = useState(false);
    const [loadingPackageId, setLoadingPackageId] = useState(null);

    const canContinueCheckout = checkout?.payment?.can_continue_checkout;
    const isDemoCheckout = canContinueCheckout && checkout?.payment?.snap_token?.startsWith('demo-');
    const hasActivePendingCheckout = checkout?.payment?.status === 'pending';

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

    const activeCheckoutAction = () => {
        if (!checkout) {
            return <p className="text-sm leading-6 text-slate-500">Choose a package to start a checkout. Any eligible consultation credit is applied automatically.</p>;
        }

        if (checkout.payment.status === 'paid') {
            return <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Your package purchase is complete and the entitlement has been activated.</p>;
        }

        if (isDemoCheckout && canContinueCheckout) {
            return (
                <div className="space-y-3">
                    <Button variant="success" className="w-full" onClick={() => simulate('success')}>Simulate payment success</Button>
                    <Button variant="outline" className="w-full" onClick={() => simulate('pending')}>Simulate payment pending</Button>
                    <Button variant="danger" className="w-full" onClick={() => simulate('failed')}>Simulate payment failure</Button>
                </div>
            );
        }

        if (canContinueCheckout) {
            return <Button className="w-full bg-slate-900 py-3 text-white hover:bg-slate-800" onClick={launchMidtrans} disabled={!scriptReady}>{scriptReady ? 'Continue payment' : 'Preparing payment gateway...'}</Button>;
        }

        return <p className="text-sm leading-6 text-slate-500">The latest package checkout is not waiting for payment.</p>;
    };

    const isCurrentPackage = (pkg) => checkout?.package?.id === pkg.id && hasActivePendingCheckout;

    const getPackageActionLabel = (pkg) => {
        if (loadingPackageId === pkg.id) {
            return 'Preparing checkout...';
        }

        if (isCurrentPackage(pkg)) {
            return 'Checkout in progress';
        }

        return pkg.checkout.final_amount === 0 ? 'Activate with credit' : 'Start checkout';
    };

    const isPackageDisabled = (pkg) => !pkg.checkout.is_eligible || loadingPackageId === pkg.id || (hasActivePendingCheckout && !isCurrentPackage(pkg));

    return (
        <PatientLayout>
            <Head title="Packages" />

            <div className="space-y-6">
                <Card className="border-border-subtle bg-white">
                    <CardContent className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clinical-gold">Patient packages</p>
                            <h1 className="mt-3 font-headline text-3xl leading-tight text-slate-950 sm:text-4xl">Compare packages, see your credit, and continue checkout from one page.</h1>
                            <p className="mt-4 text-sm leading-7 text-secondary sm:text-base">Your current credit status stays clear, package pricing stays comparable, and any active checkout remains visible without taking over the page.</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Badge variant={credit.is_eligible ? 'success' : badgeByStatus[credit.eligibility_reason] ?? 'neutral'}>{credit.is_eligible ? 'credit eligible' : labelFromReason(credit.eligibility_reason)}</Badge>
                                <Badge variant="neutral">{packages.length} active package{packages.length === 1 ? '' : 's'}</Badge>
                            </div>
                        </div>

                        <div className="rounded-[28px] bg-slate-900 p-6 text-white">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Available credit</p>
                            <p className="mt-3 text-3xl font-semibold sm:text-4xl">{formatCurrency(credit.amount)}</p>
                            <p className="mt-4 text-sm leading-6 text-slate-300">{credit.message}</p>
                            <div className="mt-5 space-y-2 border-t border-white/10 pt-4 text-sm text-slate-300">
                                <p>{credit.awarded_at ? `Awarded ${formatDateTime(credit.awarded_at)}` : 'Award pending'}</p>
                                <p>{credit.expires_at ? `Expires ${formatDateTime(credit.expires_at)}` : 'No expiry set'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Package comparison</CardTitle>
                            <CardDescription>Compare the package price, credit applied, final amount due, included sessions, and checkout eligibility at a glance.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {packages.length > 0 ? (
                                <>
                                    <div className="hidden overflow-x-auto lg:block">
                                        <table className="min-w-full border-separate border-spacing-0">
                                            <thead>
                                                <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                                    <th className="px-4 py-3">Package</th>
                                                    <th className="px-4 py-3">Price</th>
                                                    <th className="px-4 py-3">Credit</th>
                                                    <th className="px-4 py-3">You pay</th>
                                                    <th className="px-4 py-3">Sessions</th>
                                                    <th className="px-4 py-3">Eligibility</th>
                                                    <th className="px-4 py-3 text-right">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {packages.map((pkg) => (
                                                    <tr key={pkg.id} className="border-t border-slate-100 align-top">
                                                        <td className="px-4 py-4">
                                                            <p className="text-sm font-medium text-slate-900">{pkg.name}</p>
                                                            <p className="mt-1 text-xs leading-5 text-slate-500">{pkg.description || 'Structured follow-up support with package-backed consultation credits.'}</p>
                                                        </td>
                                                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(pkg.price)}</td>
                                                        <td className="px-4 py-4 text-sm text-slate-600">{formatCurrency(pkg.checkout.applied_credit)}</td>
                                                        <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(pkg.checkout.final_amount)}</td>
                                                        <td className="px-4 py-4 text-sm text-slate-600">{pkg.consultation_credits}</td>
                                                        <td className="px-4 py-4">
                                                            <Badge variant={pkg.checkout.is_eligible ? 'success' : badgeByStatus[pkg.checkout.eligibility_reason] ?? 'neutral'}>
                                                                {pkg.checkout.is_eligible ? 'eligible' : labelFromReason(pkg.checkout.eligibility_reason)}
                                                            </Badge>
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <Button onClick={() => startCheckout(pkg)} disabled={isPackageDisabled(pkg)} className={pkg.checkout.final_amount === 0 ? 'bg-clinical-gold text-white hover:bg-clinical-gold-light' : 'bg-slate-900 text-white hover:bg-slate-800'}>
                                                                {getPackageActionLabel(pkg)}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="space-y-4 lg:hidden">
                                        {packages.map((pkg) => (
                                            <Card key={pkg.id} className="border-border-subtle bg-slate-50">
                                                <CardContent className="space-y-4 p-5">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-lg font-semibold text-slate-950">{pkg.name}</p>
                                                            <Badge variant={pkg.checkout.is_eligible ? 'success' : badgeByStatus[pkg.checkout.eligibility_reason] ?? 'neutral'}>
                                                                {pkg.checkout.is_eligible ? 'eligible' : labelFromReason(pkg.checkout.eligibility_reason)}
                                                            </Badge>
                                                        </div>
                                                        <p className="mt-2 text-sm leading-6 text-slate-500">{pkg.description || 'Structured follow-up support with package-backed consultation credits.'}</p>
                                                    </div>

                                                    <div className="grid gap-3 sm:grid-cols-2">
                                                        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-secondary">Price</p><p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(pkg.price)}</p></div>
                                                        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-secondary">Credit</p><p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(pkg.checkout.applied_credit)}</p></div>
                                                        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-secondary">You pay</p><p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(pkg.checkout.final_amount)}</p></div>
                                                        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-secondary">Sessions</p><p className="mt-2 text-sm font-semibold text-slate-950">{pkg.consultation_credits}</p></div>
                                                    </div>

                                                    <Button onClick={() => startCheckout(pkg)} disabled={isPackageDisabled(pkg)} className={pkg.checkout.final_amount === 0 ? 'w-full bg-clinical-gold text-white hover:bg-clinical-gold-light' : 'w-full bg-slate-900 text-white hover:bg-slate-800'}>
                                                        {getPackageActionLabel(pkg)}
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-slate-500">No active packages are available right now. Once packages are configured, they will appear here with your applied consultation credit.</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <Card className="border-border-subtle bg-white">
                            <div className="border-b border-slate-800 bg-slate-900 px-6 py-5 text-white">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Current checkout</p>
                                <h2 className="mt-2 font-headline text-3xl leading-tight text-white">{checkout?.package?.name ?? 'No active checkout'}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-300">Keep payment progress visible while package selection remains the primary task.</p>
                            </div>
                            <CardContent className="space-y-4 px-6 py-6 text-sm text-slate-600">
                                {checkout ? (
                                    <>
                                        <div className="rounded-[20px] border border-border-subtle bg-surface-cream p-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-medium text-slate-900">Payment status</p>
                                                    <p className="mt-1 text-sm text-slate-500">Order ID: <span className="break-all">{checkout.payment.order_id}</span></p>
                                                </div>
                                                <Badge variant={badgeByStatus[checkout.payment.status] ?? 'neutral'}>{checkout.payment.status}</Badge>
                                            </div>

                                            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                                                <div className="flex items-center justify-between gap-4"><span>Package total</span><span className="font-medium text-slate-900">{formatCurrency(checkout.package.price)}</span></div>
                                                <div className="flex items-center justify-between gap-4"><span>Credit applied</span><span className="font-medium text-slate-900">- {formatCurrency(checkout.payment.consultation_credit_applied)}</span></div>
                                                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 text-base font-semibold text-slate-900"><span>Amount due</span><span>{formatCurrency(checkout.payment.amount)}</span></div>
                                            </div>
                                        </div>

                                        {activeCheckoutAction()}
                                    </>
                                ) : (
                                    <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                                        No package checkout has been started yet. Choose a package from the comparison list to begin.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border-subtle bg-white">
                            <CardHeader>
                                <CardTitle className="text-lg">Decision flow</CardTitle>
                                <CardDescription>The page is intentionally short: understand credit, compare packages, then continue checkout only if one is already active.</CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </div>
        </PatientLayout>
    );
}
