import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';

function compactParams(params) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
}

function paymentDescription(payment) {
    if (payment.type === 'package') {
        return payment.package ?? 'Package checkout';
    }

    if (payment.type === 'consultation_treatment') {
        return `Treatment handoff${payment.doctor ? ` with ${payment.doctor}` : ''}`;
    }

    return `Consultation${payment.doctor ? ` with ${payment.doctor}` : ''}`;
}

function statusVariant(status) {
    if (status === 'paid' || status === 'confirmed') return 'success';
    if (status === 'failed' || status === 'cancelled') return 'danger';
    return 'warning';
}

function tablePages(meta) {
    if (!meta?.last_page) return [];

    const pages = [];
    for (let page = 1; page <= meta.last_page; page += 1) {
        if (page === 1 || page === meta.last_page || (page >= meta.current_page - 1 && page <= meta.current_page + 1)) {
            pages.push(page);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    return pages;
}

function SearchField({ id, label, value, onChange, onClear, active }) {
    return (
        <div className="rounded-2xl border border-outline-variant bg-surface-cream p-3">
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-secondary" htmlFor={id}>{label}</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                    id={id}
                    type="search"
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="Type patient name"
                    className="rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-sm outline-none transition focus:border-clinical-gold focus:ring-2 focus:ring-clinical-gold/20 sm:w-64"
                />
                <span className="text-xs font-semibold text-secondary">
                    {active ? (
                        <button type="button" onClick={onClear} className="mt-2 text-sm font-semibold text-secondary underline decoration-outline-variant underline-offset-4 transition hover:text-charcoal-depth">
                            Clear
                        </button>
                    ) : null}
                </span>
            </div>
        </div>
    );
}

function PaginationControls({ meta, onPageChange, label }) {
    if (!meta) return null;

    const from = meta.from ?? 0;
    const to = meta.to ?? 0;
    const pages = tablePages(meta);

    return (
        <div className="flex flex-col gap-3 border-t border-border-subtle p-4 sm:flex-row sm:items-center sm:justify-between md:p-5">
            <p className="text-sm text-secondary">
                Showing {from}-{to} of {meta.total} {label}
            </p>
            {meta.last_page > 1 ? (
                <div className="flex flex-wrap items-center gap-1">
                    <button
                        type="button"
                        disabled={meta.current_page <= 1}
                        onClick={() => onPageChange(meta.current_page - 1)}
                        className="rounded-xl border border-border-subtle px-3 py-2 text-sm text-secondary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Prev
                    </button>
                    {pages.map((page, index) => page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-sm text-secondary">...</span>
                    ) : (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={`rounded-xl border px-3 py-2 text-sm transition ${page === meta.current_page ? 'border-charcoal-depth bg-charcoal-depth text-white' : 'border-border-subtle hover:bg-surface-container-low'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        type="button"
                        disabled={meta.current_page >= meta.last_page}
                        onClick={() => onPageChange(meta.current_page + 1)}
                        className="rounded-xl border border-border-subtle px-3 py-2 text-sm text-secondary transition hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            ) : null}
        </div>
    );
}

function ActionCard({ title, value, description, href, children, emphasized = false }) {
    const content = (
        <Card className={`h-full transition hover:-translate-y-0.5 ${emphasized ? 'border-clinical-gold/40 ring-1 ring-clinical-gold/10' : ''}`}>
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-sm font-semibold text-secondary">{title}</p>
                        <p className="mt-2 text-4xl font-bold text-charcoal-depth">{value}</p>
                        <p className="mt-1 text-sm text-secondary">{description}</p>
                    </div>
                    {children}
                </div>
            </CardHeader>
        </Card>
    );

    if (!href) return content;

    return <a href={href}>{content}</a>;
}

function MetricCard({ label, value }) {
    return (
        <Card>
            <CardHeader className="p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-secondary">{label}</p>
                <p className="mt-2 text-xl font-bold text-charcoal-depth">{value}</p>
            </CardHeader>
        </Card>
    );
}

export default function Dashboard({ stats, recentBookings = [], recentPayments = [], bookingTable, paymentTable }) {
    const bookingRows = bookingTable?.data ?? recentBookings;
    const paymentRows = paymentTable?.data ?? recentPayments;
    const bookingMeta = bookingTable?.meta;
    const paymentMeta = paymentTable?.meta;
    const activeBookingSearch = bookingTable?.filters?.search ?? '';
    const activePaymentSearch = paymentTable?.filters?.search ?? '';
    const [bookingSearch, setBookingSearch] = useState(activeBookingSearch);
    const [paymentSearch, setPaymentSearch] = useState(activePaymentSearch);

    const visitDashboard = (params, options = {}) => {
        router.get(route('admin.dashboard'), compactParams(params), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
            ...options,
        });
    };

    useEffect(() => {
        const search = bookingSearch.trim();
        if (search === activeBookingSearch) return undefined;

        const timeout = window.setTimeout(() => {
            visitDashboard({
                booking_search: search,
                bookings_page: 1,
                payment_search: activePaymentSearch,
                payments_page: paymentMeta?.current_page,
            }, { only: ['bookingTable'] });
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [bookingSearch, activeBookingSearch, activePaymentSearch, paymentMeta?.current_page]);

    useEffect(() => {
        const search = paymentSearch.trim();
        if (search === activePaymentSearch) return undefined;

        const timeout = window.setTimeout(() => {
            visitDashboard({
                booking_search: activeBookingSearch,
                bookings_page: bookingMeta?.current_page,
                payment_search: search,
                payments_page: 1,
            }, { only: ['paymentTable'] });
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [paymentSearch, activePaymentSearch, activeBookingSearch, bookingMeta?.current_page]);

    const handleBookingClear = () => {
        setBookingSearch('');
    };

    const handlePaymentClear = () => {
        setPaymentSearch('');
    };

    const handleBookingPageChange = (page) => {
        visitDashboard({
            booking_search: activeBookingSearch,
            bookings_page: page,
            payment_search: activePaymentSearch,
            payments_page: paymentMeta?.current_page,
        }, { only: ['bookingTable'] });
    };

    const handlePaymentPageChange = (page) => {
        visitDashboard({
            booking_search: activeBookingSearch,
            bookings_page: bookingMeta?.current_page,
            payment_search: activePaymentSearch,
            payments_page: page,
        }, { only: ['paymentTable'] });
    };

    const waitingQueue = stats.queue_summary?.waiting ?? 0;
    const activeQueue = stats.queue_summary?.active ?? 0;
    const queueTotal = waitingQueue + activeQueue;

    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />

            <section className="mb-5 overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-sm">
                <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-center md:p-6">
                    <div className="max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-clinical-gold">Today overview</p>
                        <h1 className="font-headline-lg mt-1 text-headline-lg font-bold tracking-tight text-charcoal-depth sm:text-4xl">Admin Dashboard</h1>
                        <p className="mt-2 max-w-xl text-sm leading-6 text-secondary">A tablet-first command center for queue movement, booking readiness, and payment handoffs.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap md:justify-end">
                        <Link href={route('admin.bookings.index')} className="rounded-xl bg-charcoal-depth px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-black">
                            New Booking
                        </Link>
                        <Link href={route('admin.queue.index')} className="rounded-xl border border-outline-variant bg-white px-4 py-3 text-center text-sm font-semibold text-charcoal-depth transition hover:bg-surface-container-low">
                            Manage Queue
                        </Link>
                    </div>
                </div>
                <div className="border-t border-border-subtle bg-surface-container-low/70 px-5 py-3 text-sm font-medium text-secondary md:px-6">
                    Recommended focus: collect pending handoffs first, then confirm the next appointment wave.
                </div>
            </section>

            <section className="mb-5 grid gap-3 md:grid-cols-3">
                <ActionCard title="Walk-in queue" value={queueTotal} description={`${waitingQueue} waiting, ${activeQueue} active`} href={route('admin.queue.index')} emphasized>
                    <Badge variant="warning" className="font-bold">Act now</Badge>
                </ActionCard>
                <ActionCard title="Pending bookings" value={stats.pending_bookings} description="Need confirmation or payment check" href="#recent-bookings" />
                <ActionCard title="Treatment handoffs" value={stats.pending_treatment_handoffs ?? 0} description="Ready for on-site collection" href="#recent-payments" />
            </section>

            <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                <MetricCard label="Paid revenue" value={formatCurrency(stats.revenue)} />
                <MetricCard label="Confirmed" value={stats.confirmed_bookings} />
                <MetricCard label="Patients" value={stats.patients} />
                <MetricCard label="Doctors" value={stats.doctors} />
                <MetricCard label="Packages" value={stats.active_packages} />
                <MetricCard label="Entitlements" value={stats.active_entitlements} />
            </section>

            <section id="recent-bookings" className="mb-5 scroll-mt-24 overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border-subtle p-4 md:flex-row md:items-center md:justify-between md:p-5">
                    <div>
                        <h2 className="text-lg font-bold text-charcoal-depth">Recent bookings</h2>
                        <p className="mt-1 text-sm text-secondary">Search by patient name. Showing 10 rows per page.</p>
                    </div>
                    <SearchField
                        id="booking-patient-search"
                        label="Patient name"
                        value={bookingSearch}
                        onChange={setBookingSearch}
                        onClear={handleBookingClear}
                        active={bookingSearch !== '' || activeBookingSearch !== ''}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[760px] w-full text-left text-sm">
                        <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-secondary">
                            <tr>
                                <th className="px-5 py-3 font-bold">Patient</th>
                                <th className="px-5 py-3 font-bold">Doctor</th>
                                <th className="px-5 py-3 font-bold">Schedule</th>
                                <th className="px-5 py-3 font-bold">Booking</th>
                                <th className="px-5 py-3 font-bold">Payment</th>
                                <th className="px-5 py-3 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {bookingRows.length ? bookingRows.map((booking) => (
                                <tr key={booking.id} className="transition hover:bg-surface-cream">
                                    <td className="px-5 py-4 font-semibold text-charcoal-depth">{booking.patient}</td>
                                    <td className="px-5 py-4 text-secondary">{booking.doctor}</td>
                                    <td className="px-5 py-4 text-secondary">{formatDateTime(booking.start_time)}</td>
                                    <td className="px-5 py-4"><Badge variant={statusVariant(booking.status)}>{booking.status}</Badge></td>
                                    <td className="px-5 py-4"><Badge variant={statusVariant(booking.payment_status)}>{booking.payment_status ?? 'unpaid'}</Badge></td>
                                    <td className="px-5 py-4 text-right">
                                        <Link href={route('admin.bookings.index')} className="font-semibold text-clinical-gold hover:underline">
                                            Review
                                        </Link>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-5 py-10 text-center text-sm text-secondary">No booking activity found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls meta={bookingMeta} onPageChange={handleBookingPageChange} label="bookings" />
            </section>

            <section id="recent-payments" className="scroll-mt-24 overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-border-subtle p-4 md:flex-row md:items-center md:justify-between md:p-5">
                    <div>
                        <h2 className="text-lg font-bold text-charcoal-depth">Recent payments</h2>
                        <p className="mt-1 text-sm text-secondary">Collection status and handoff actions. Showing 10 rows per page.</p>
                    </div>
                    <SearchField
                        id="payment-patient-search"
                        label="Patient name"
                        value={paymentSearch}
                        onChange={setPaymentSearch}
                        onClear={handlePaymentClear}
                        active={paymentSearch !== '' || activePaymentSearch !== ''}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-[820px] w-full text-left text-sm">
                        <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-secondary">
                            <tr>
                                <th className="px-5 py-3 font-bold">Patient</th>
                                <th className="px-5 py-3 font-bold">Type</th>
                                <th className="px-5 py-3 font-bold">Source</th>
                                <th className="px-5 py-3 font-bold">Amount</th>
                                <th className="px-5 py-3 font-bold">Status</th>
                                <th className="px-5 py-3 font-bold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-subtle">
                            {paymentRows.length ? paymentRows.map((payment) => (
                                <tr key={payment.id} className="transition hover:bg-surface-cream">
                                    <td className="px-5 py-4">
                                        <p className="font-semibold text-charcoal-depth">{payment.patient}</p>
                                        {payment.patient_phone ? <p className="text-xs text-secondary">{payment.patient_phone}</p> : null}
                                    </td>
                                    <td className="px-5 py-4 text-secondary">{paymentDescription(payment)}</td>
                                    <td className="px-5 py-4 text-secondary">{payment.source}</td>
                                    <td className="px-5 py-4 font-medium text-charcoal-depth">{formatCurrency(payment.amount)}</td>
                                    <td className="px-5 py-4"><Badge variant={statusVariant(payment.status)}>{payment.status}</Badge></td>
                                    <td className="px-5 py-4 text-right">
                                        {payment.can_mark_paid && payment.finalize_href ? (
                                            <Link
                                                href={payment.finalize_href}
                                                method="patch"
                                                as="button"
                                                preserveScroll
                                                className="rounded-xl border border-clinical-gold bg-clinical-gold px-3 py-2 text-xs font-bold text-charcoal-depth shadow-sm transition hover:bg-clinical-gold-light focus:outline-none focus:ring-2 focus:ring-clinical-gold focus:ring-offset-2"
                                            >
                                                Mark paid
                                            </Link>
                                        ) : payment.type === 'package' && payment.provider === 'internal' && payment.status === 'pending' ? (
                                            <Link href={route('admin.invoices.index')} className="font-semibold text-clinical-gold hover:underline">
                                                Invoices
                                            </Link>
                                        ) : (
                                            <span className="text-xs font-medium text-secondary">Recorded</span>
                                        )}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-5 py-10 text-center text-sm text-secondary">No payment activity found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <PaginationControls meta={paymentMeta} onPageChange={handlePaymentPageChange} label="payments" />
            </section>
        </AdminLayout>
    );
}
