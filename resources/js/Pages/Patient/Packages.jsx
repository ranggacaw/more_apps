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
            return <p className="text-sm leading-6 text-slate-500">Select a package to start a new checkout. Your active consultation credit will be applied automatically.</p>;
        }

        if (checkout.payment.status === 'paid') {
            return <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Your package purchase is complete and the entitlement has been activated.</p>;
        }

        if (isDemoCheckout && canContinueCheckout) {
            return (
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
            );
        }

        if (canContinueCheckout) {
            return (
                <Button className="w-full bg-slate-900 py-3 text-white hover:bg-slate-800" onClick={launchMidtrans} disabled={!scriptReady}>
                    {scriptReady ? 'Continue payment' : 'Preparing payment gateway...'}
                </Button>
            );
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

        return pkg.checkout.final_amount === 0 ? 'Activate with credit' : 'Start package checkout';
    };

    const isPackageDisabled = (pkg) => !pkg.checkout.is_eligible || loadingPackageId === pkg.id || (hasActivePendingCheckout && !isCurrentPackage(pkg));

    const featuredPackage =
        packages.find((pkg) => isCurrentPackage(pkg)) ??
        packages.find((pkg) => pkg.checkout.is_eligible && pkg.checkout.final_amount > 0) ??
        packages.find((pkg) => pkg.checkout.is_eligible) ??
        packages[0] ??
        null;

    const secondaryPackages = featuredPackage ? packages.filter((pkg) => pkg.id !== featuredPackage.id) : [];

    return (
        <PatientLayout>
            <Head title="Wellness Packages" />

            <div className="space-y-6">
                <Card className="overflow-hidden border-border-subtle bg-white soft-lift">
                    <CardContent className="p-0">
                        <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:p-8">
                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clinical-gold">Patient Packages</p>
                                    <h1 className="mt-3 font-headline text-4xl leading-tight text-slate-950 sm:text-5xl">Choose your next care package with the consultation credit already applied.</h1>
                                    <p className="mt-4 max-w-3xl text-sm leading-7 text-secondary sm:text-base">This page is structured like part of the patient workspace: one clear recommendation, quieter supporting detail, and payment progress that stays visible without taking over.</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant={credit.is_eligible ? 'success' : badgeByStatus[credit.eligibility_reason] ?? 'neutral'} className="px-3 py-1">
                                        {credit.is_eligible ? 'credit eligible' : labelFromReason(credit.eligibility_reason)}
                                    </Badge>
                                    <Badge variant="neutral" className="px-3 py-1">
                                        {packages.length} active option{packages.length === 1 ? '' : 's'}
                                    </Badge>
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
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_340px]">
                    <div className="space-y-6">
                        <Card className="border-border-subtle bg-white soft-lift">
                            <CardContent className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start sm:p-7">
                                <div>
                                    <h2 className="font-headline text-3xl leading-tight text-slate-950">Your consultation credit is ready to unlock a program, not just discount a purchase.</h2>
                                    <p className="mt-3 max-w-2xl text-sm leading-7 text-secondary">The page explains the credit first, then leaves dates and source as supporting context. That feels closer to the treatment-plan workspace than opening with a bank of utility cards.</p>
                                </div>
                                <div className="rounded-[20px] border border-border-subtle bg-surface-cream p-4 text-sm leading-6 text-secondary">
                                    <p><span className="font-medium text-slate-900">Source:</span> {credit.source_booking_status ? `Booking ${credit.source_booking_status}` : 'Consultation credit'}</p>
                                    <p className="mt-2"><span className="font-medium text-slate-900">Status:</span> {credit.is_eligible ? 'Eligible' : labelFromReason(credit.eligibility_reason)}</p>
                                    <p className="mt-2"><span className="font-medium text-slate-900">Coverage:</span> Applied automatically at checkout</p>
                                </div>
                            </CardContent>
                        </Card>

                        {featuredPackage ? (
                            <Card className="overflow-hidden border-amber-200 bg-white soft-lift">
                                <div className="border-b border-amber-100 bg-[linear-gradient(135deg,rgba(181,146,42,0.12),rgba(181,146,42,0.02))] px-6 py-5 sm:px-7">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Badge className="bg-amber-700 px-3 py-1 text-white">{isCurrentPackage(featuredPackage) ? 'current checkout' : 'recommended'}</Badge>
                                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-secondary">
                                                    {isCurrentPackage(featuredPackage) ? 'Continue this path' : 'Primary path'}
                                                </p>
                                                {featuredPackage.checkout.final_amount === 0 && featuredPackage.checkout.is_eligible ? (
                                                    <Badge variant="success">activates immediately</Badge>
                                                ) : null}
                                            </div>
                                            <h2 className="mt-3 text-2xl font-semibold text-slate-950 sm:text-3xl">{featuredPackage.name}</h2>
                                            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
                                                {featuredPackage.description || 'Structured follow-up support with package-backed consultation credits.'}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white/60 bg-white/80 px-4 py-3 backdrop-blur md:min-w-44 md:text-right">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Included</p>
                                            <p className="mt-1 text-sm font-semibold text-slate-950">{featuredPackage.consultation_credits} consultation sessions</p>
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="grid gap-6 px-6 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_260px]">
                                    <div className="grid gap-3 sm:grid-cols-3">
                                        <div className="rounded-[20px] border border-border-subtle bg-surface-cream p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Package price</p>
                                            <p className="mt-3 text-xl font-semibold text-slate-950">{formatCurrency(featuredPackage.price)}</p>
                                        </div>
                                        <div className="rounded-[20px] border border-emerald-100 bg-emerald-50 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Credit applied</p>
                                            <p className="mt-3 text-xl font-semibold text-slate-950">{formatCurrency(featuredPackage.checkout.applied_credit)}</p>
                                        </div>
                                        <div className={`rounded-[20px] border p-4 ${featuredPackage.checkout.final_amount === 0 ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
                                            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${featuredPackage.checkout.final_amount === 0 ? 'text-emerald-700' : 'text-secondary'}`}>You pay now</p>
                                            <p className="mt-3 text-xl font-semibold text-slate-950">{formatCurrency(featuredPackage.checkout.final_amount)}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="rounded-[20px] border border-border-subtle bg-white p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Why this stands out</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <Badge variant={featuredPackage.checkout.is_eligible ? 'success' : badgeByStatus[featuredPackage.checkout.eligibility_reason] ?? 'neutral'}>
                                                    {featuredPackage.checkout.is_eligible ? 'checkout eligible' : labelFromReason(featuredPackage.checkout.eligibility_reason)}
                                                </Badge>
                                                {featuredPackage.checkout.final_amount === 0 && featuredPackage.checkout.is_eligible ? <Badge variant="success">fully covered</Badge> : null}
                                            </div>
                                            <p className="mt-3 text-sm leading-6 text-secondary">
                                                {isCurrentPackage(featuredPackage)
                                                    ? 'You already started this checkout, so the page keeps it in the lead position until payment is resolved.'
                                                    : featuredPackage.checkout.final_amount === 0
                                                      ? 'This is the fastest path because your consultation credit covers the full balance.'
                                                      : 'This package balances program depth, guidance, and out-of-pocket cost for most patients.'}
                                            </p>
                                        </div>

                                        <Button
                                            onClick={() => startCheckout(featuredPackage)}
                                            disabled={isPackageDisabled(featuredPackage)}
                                            className={featuredPackage.checkout.final_amount === 0 ? 'w-full bg-clinical-gold py-3 text-white hover:bg-clinical-gold-light' : 'w-full bg-slate-900 py-3 text-white hover:bg-slate-800'}
                                        >
                                            {getPackageActionLabel(featuredPackage)}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="border-border-subtle bg-white soft-lift">
                                <CardContent className="rounded-[24px] p-6 text-sm leading-6 text-secondary">
                                    No active packages are available right now. Once packages are configured, they will appear here with your applied consultation credit.
                                </CardContent>
                            </Card>
                        )}

                        {secondaryPackages.length ? (
                            <section className="space-y-4">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h2 className="font-headline text-3xl text-slate-950">Other package options</h2>
                                        <p className="mt-1 text-sm leading-6 text-secondary">Secondary options stay available, but they sit beneath the main recommendation so the decision feels simpler.</p>
                                    </div>
                                    <p className="text-sm text-secondary">{secondaryPackages.length} alternative{secondaryPackages.length === 1 ? '' : 's'}</p>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    {secondaryPackages.map((pkg) => (
                                        <Card key={pkg.id} className="border-border-subtle bg-white soft-lift">
                                            <CardContent className="space-y-4 p-6">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <CardTitle className="text-xl">{pkg.name}</CardTitle>
                                                        {pkg.checkout.final_amount === 0 && pkg.checkout.is_eligible ? <Badge variant="success">immediate activation</Badge> : null}
                                                    </div>
                                                    <CardDescription className="mt-2 leading-6">{pkg.description || 'Structured follow-up support with package-backed consultation credits.'}</CardDescription>
                                                </div>

                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    <div className="rounded-[20px] border border-border-subtle bg-surface-cream p-4">
                                                        <p className="text-xs uppercase tracking-wide text-secondary">Price</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(pkg.price)}</p>
                                                    </div>
                                                    <div className="rounded-[20px] border border-border-subtle bg-surface-cream p-4">
                                                        <p className="text-xs uppercase tracking-wide text-secondary">Credit</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(pkg.checkout.applied_credit)}</p>
                                                    </div>
                                                    <div className={`rounded-[20px] border p-4 ${pkg.checkout.final_amount === 0 ? 'border-emerald-100 bg-emerald-50' : 'border-border-subtle bg-white'}`}>
                                                        <p className={`text-xs uppercase tracking-wide ${pkg.checkout.final_amount === 0 ? 'text-emerald-700' : 'text-secondary'}`}>Due</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-950">{formatCurrency(pkg.checkout.final_amount)}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3">
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant={pkg.checkout.is_eligible ? 'success' : badgeByStatus[pkg.checkout.eligibility_reason] ?? 'neutral'}>
                                                            {pkg.checkout.is_eligible ? 'checkout eligible' : labelFromReason(pkg.checkout.eligibility_reason)}
                                                        </Badge>
                                                        <Badge variant="neutral">{pkg.consultation_credits} sessions</Badge>
                                                    </div>

                                                    <Button
                                                        onClick={() => startCheckout(pkg)}
                                                        disabled={isPackageDisabled(pkg)}
                                                        className={pkg.checkout.final_amount === 0 ? 'w-full bg-clinical-gold text-white hover:bg-clinical-gold-light' : 'w-full bg-white text-slate-900 border border-border-subtle hover:border-clinical-gold hover:text-clinical-gold'}
                                                    >
                                                        {getPackageActionLabel(pkg)}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        ) : null}
                    </div>

                    <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
                        <Card className="overflow-hidden border-border-subtle bg-white soft-lift">
                            <div className="border-b border-slate-800 bg-slate-900 px-6 py-5 text-white">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Current checkout</p>
                                <h2 className="mt-2 font-headline text-3xl leading-tight text-white">{checkout?.package?.name ?? 'No active checkout'}</h2>
                                <p className="mt-2 text-sm leading-6 text-slate-300">The active payment stays visible, but it now supports the package decision instead of competing with it.</p>
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
                                                <div className="flex items-center justify-between gap-4">
                                                    <span>Package total</span>
                                                    <span className="font-medium text-slate-900">{formatCurrency(checkout.package.price)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4">
                                                    <span>Credit applied</span>
                                                    <span className="font-medium text-slate-900">- {formatCurrency(checkout.payment.consultation_credit_applied)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-3 text-base font-semibold text-slate-900">
                                                    <span>Amount due</span>
                                                    <span>{formatCurrency(checkout.payment.amount)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {activeCheckoutAction()}
                                    </>
                                ) : (
                                    <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                                        No package checkout has been started yet. Choose a package from the list to begin.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-border-subtle bg-white soft-lift">
                            <CardHeader>
                                <CardTitle className="text-lg">How this works</CardTitle>
                                <CardDescription>Patients should be able to understand the full path at a glance.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm leading-6 text-secondary">
                                <div className="flex gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-clinical-gold/10 text-xs font-semibold text-clinical-gold">1</span>
                                    <p>Confirm that your consultation credit is active and ready to use.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-clinical-gold/10 text-xs font-semibold text-clinical-gold">2</span>
                                    <p>Review the recommended package first, then compare alternatives if needed.</p>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-clinical-gold/10 text-xs font-semibold text-clinical-gold">3</span>
                                    <p>Finish payment only if there is already a pending checkout waiting.</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PatientLayout>
    );
}
