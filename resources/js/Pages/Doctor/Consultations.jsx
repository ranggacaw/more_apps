import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import DoctorLayout from '@/Layouts/DoctorLayout';
import { formatDateTime, formatTime } from '@/lib/format';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

function StatCard({ label, value, helper }) {
    return (
        <div className="rounded-[22px] border border-border-subtle bg-white p-4 shadow-[0_10px_30px_-24px_rgba(17,24,39,0.4)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-clinical-gold">{label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
            <p className="mt-1 text-sm text-secondary">{helper}</p>
        </div>
    );
}

function PatientAvatar({ name }) {
    const initials = (name || 'Patient')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs font-bold text-on-secondary-container">
            {initials}
        </div>
    );
}

function PatientContact({ patient }) {
    const contact = [patient?.email, patient?.phone].filter(Boolean).join(' · ');

    return contact ? <p className="mt-1 text-xs text-secondary">{contact}</p> : null;
}

function BookingBadges({ booking, compact = false }) {
    const paymentStatus = booking.payment_status ?? 'unpaid';
    const arrivalLabel = {
        not_arrived: 'Not arrived',
        waiting_queue: 'Waiting queue',
        called: 'Called',
        in_consultation: 'In room',
    }[booking.arrival_status];

    return (
        <div className="flex flex-wrap gap-2">
            {booking.needs_meeting_link ? (
                <Badge variant="warning" className="font-bold">Needs link</Badge>
            ) : booking.can_complete ? (
                <Badge variant="neutral" className="bg-slate-950 font-bold text-white">Ready</Badge>
            ) : arrivalLabel ? (
                <Badge variant="warning" className="font-bold">{arrivalLabel}</Badge>
            ) : null}
            {booking.queue?.queue_number ? <Badge variant="neutral" className="font-semibold">{booking.queue.queue_number}</Badge> : null}
            <Badge variant={paymentStatus === 'paid' ? 'success' : 'neutral'} className="font-bold capitalize">
                {paymentStatus}
            </Badge>
            {!compact ? <Badge variant="neutral" className="font-semibold capitalize">{booking.consultation_mode ?? 'offline'}</Badge> : null}
        </div>
    );
}

function IntakePreview({ booking, className = '' }) {
    const notes = booking.intake?.notes;
    const uploadName = booking.intake?.patient_upload_name;

    if (!notes && !uploadName) {
        return <p className={`text-sm text-secondary ${className}`}>No intake notes.</p>;
    }

    return (
        <div className={className}>
            {notes ? <p className="line-clamp-2 text-sm leading-6 text-secondary">{notes}</p> : null}
            {uploadName ? <p className="mt-1 text-xs font-medium text-slate-500">File: {uploadName}</p> : null}
        </div>
    );
}

function BookingActions({ booking, stacked = false }) {
    return (
        <div className={stacked ? 'grid gap-2 sm:grid-cols-2 lg:grid-cols-1' : 'flex flex-wrap justify-end gap-2'}>
            <Link href={booking.workspace_href} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-gold">
                Workspace
            </Link>
            {booking.meeting_link ? (
                <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-bold text-secondary transition hover:bg-surface-container-low hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-gold">
                    Meeting
                </a>
            ) : booking.needs_meeting_link ? (
                <Link href={booking.workspace_href} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border-subtle bg-white px-4 py-2 text-sm font-bold text-secondary transition hover:bg-surface-container-low hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-gold">
                    Add link
                </Link>
            ) : null}
        </div>
    );
}

function PriorityPatient({ booking }) {
    if (!booking) {
        return (
            <section className="mt-5 rounded-[28px] border border-border-subtle bg-white p-5 shadow-[0_18px_50px_-34px_rgba(17,24,39,0.45)] sm:p-6">
                <Badge variant="success" className="font-bold uppercase tracking-[0.14em]">Clear</Badge>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">No confirmed consultations waiting.</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">New confirmed bookings will appear here in schedule order.</p>
            </section>
        );
    }

    const arrivalLabel = {
        not_arrived: 'Not arrived',
        waiting_queue: 'Waiting queue',
        called: 'Called',
        in_consultation: 'In room',
    }[booking.arrival_status];

    return (
        <section className="mt-5 overflow-hidden rounded-[30px] border border-[#DECFA8] bg-white shadow-[0_18px_50px_-34px_rgba(17,24,39,0.55)]">
            <div className="border-b border-[#F0E4C5] bg-[#FBF6E8] px-4 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-slate-950 font-bold uppercase tracking-[0.14em] text-white">Do first</Badge>
                    <Badge variant={booking.needs_meeting_link || arrivalLabel ? 'warning' : 'neutral'} className="border border-[#D8C58C] bg-white font-semibold text-[#836615]">
                        {booking.needs_meeting_link ? 'Needs link' : (arrivalLabel ?? 'Ready')}
                    </Badge>
                    {booking.queue?.queue_number ? <Badge variant="neutral" className="border border-[#D8C58C] bg-white font-semibold text-[#836615]">{booking.queue.queue_number}</Badge> : null}
                </div>
            </div>

            <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch lg:p-7">
                <div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="w-full rounded-2xl border border-border-subtle bg-surface-container-low p-4 text-center sm:w-32">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Next</p>
                            <p className="mt-2 text-2xl font-bold text-slate-950">{formatTime(booking.start_time)}</p>
                            <p className="mt-1 text-xs font-semibold text-secondary">{booking.is_today ? 'Today' : 'Upcoming'}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">{booking.patient.name}</h2>
                            <PatientContact patient={booking.patient} />
                            <div className="mt-4">
                                <BookingBadges booking={booking} />
                            </div>
                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-border-subtle bg-surface-container-low p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-secondary">Intake</p>
                        <IntakePreview booking={booking} className="mt-2" />
                    </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-border-subtle bg-slate-950 p-4 text-white">
                    <div>
                        <p className="text-sm font-bold">Recommended action</p>
                        <p className="mt-2 text-sm leading-6 text-slate-300">
                            {booking.needs_meeting_link ? 'Add the meeting link before completing this online consultation.' : (booking.can_complete ? 'Open the workspace and complete the consultation.' : 'Wait for arrival check-in and queue start before completion.')}
                        </p>
                    </div>
                    <div className="mt-5 grid gap-2">
                        <Link href={booking.workspace_href} className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-gold">
                            Open workspace
                        </Link>
                        {booking.meeting_link ? (
                            <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-gold">
                                Open meeting
                            </a>
                        ) : null}
                    </div>
                </div>
            </div>
        </section>
    );
}

function ConsultationsHeader() {
    return (
        <section className="mb-stack-lg flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-clinical-gold">Confirmed workload</p>
                <h1 className="mt-2 font-headline text-4xl leading-tight tracking-tight text-charcoal-depth sm:text-5xl">Consultations</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">Start with the next patient. Keep the queue short and scannable.</p>
            </div>
            <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-border-subtle bg-white px-3 py-2 text-xs font-bold text-secondary shadow-[0_10px_30px_-24px_rgba(17,24,39,0.4)]">Today</span>
                <span className="rounded-full border border-border-subtle bg-white px-3 py-2 text-xs font-bold text-secondary shadow-[0_10px_30px_-24px_rgba(17,24,39,0.4)]">Schedule order</span>
            </div>
        </section>
    );
}

function SortButton({ label, sortKey, sortBy, sortDir, filters }) {
    const isActive = sortBy === sortKey;
    const nextDir = isActive && sortDir === 'asc' ? 'desc' : 'asc';

    const handleSort = () => {
        router.get(route('doctor.consultations.index'), {
            ...filters,
            sort_by: sortKey,
            sort_dir: nextDir,
            page: 1,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <button type="button" onClick={handleSort} className="inline-flex items-center gap-1 font-bold transition hover:text-slate-950">
            {label}
            <span className="material-symbols-outlined text-[16px]">{isActive ? (sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'}</span>
        </button>
    );
}

function ConsultationFilters({ filters, sortBy, sortDir }) {
    const firstRender = useRef(true);
    const form = useForm({
        search: filters.search ?? '',
        status: filters.status ?? '',
        date_window: filters.date_window ?? 'all',
    });

    const applyFilters = (data = form.data) => {
        router.get(route('doctor.consultations.index'), {
            ...data,
            sort_by: sortBy,
            sort_dir: sortDir,
            page: 1,
        }, {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const submit = (event) => {
        event.preventDefault();
        applyFilters();
    };

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return undefined;
        }

        const timeout = window.setTimeout(() => applyFilters(), 350);

        return () => window.clearTimeout(timeout);
    }, [form.data.search, form.data.status, form.data.date_window]);

    return (
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_150px_150px] xl:min-w-[620px]">
            <label className="sr-only" htmlFor="queue-search">Search consultations</label>
            <input id="queue-search" value={form.data.search} onChange={(event) => form.setData('search', event.target.value)} placeholder="Search patient, phone, email" className="min-h-11 rounded-xl border border-border-subtle bg-white px-4 text-sm outline-none transition focus:border-clinical-gold focus:ring-2 focus:ring-clinical-gold/20" />
            <select className="min-h-11 rounded-xl border border-border-subtle bg-white px-4 text-sm font-semibold text-secondary outline-none transition focus:border-clinical-gold focus:ring-2 focus:ring-clinical-gold/20" value={form.data.status} onChange={(event) => form.setData('status', event.target.value)}>
                <option value="">All status</option>
                <option value="ready">Ready</option>
                <option value="needs_link">Needs link</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
            </select>
            <select className="min-h-11 rounded-xl border border-border-subtle bg-white px-4 text-sm font-semibold text-secondary outline-none transition focus:border-clinical-gold focus:ring-2 focus:ring-clinical-gold/20" value={form.data.date_window} onChange={(event) => form.setData('date_window', event.target.value)}>
                <option value="all">All dates</option>
                <option value="today">Today</option>
                <option value="upcoming">Upcoming</option>
            </select>
        </form>
    );
}

function PaginationControls({ filters, pagination, sortBy, sortDir }) {
    if (!pagination || pagination.total === 0) {
        return null;
    }

    const pages = [];

    for (let page = 1; page <= pagination.last_page; page += 1) {
        if (page === 1 || page === pagination.last_page || Math.abs(page - pagination.current_page) <= 1) {
            pages.push(page);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    const visitPage = (page) => {
        router.get(route('doctor.consultations.index'), {
            ...filters,
            sort_by: sortBy,
            sort_dir: sortDir,
            page,
        }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <div className="flex flex-col gap-3 border-t border-border-subtle px-4 py-4 text-sm text-secondary sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p>Showing {pagination.from}-{pagination.to} of {pagination.total} consultations</p>
            {pagination.has_pages ? (
                <div className="flex flex-wrap items-center gap-1">
                    <button type="button" className="rounded-lg border border-border-subtle bg-white px-3 py-2 font-semibold disabled:opacity-50" onClick={() => visitPage(pagination.current_page - 1)} disabled={pagination.current_page <= 1}>Previous</button>
                    {pages.map((page, index) => page === '...' ? (
                        <span key={`ellipsis-${index}`} className="px-2">...</span>
                    ) : (
                        <button key={page} type="button" className={`rounded-lg border px-3 py-2 font-semibold transition ${page === pagination.current_page ? 'border-slate-950 bg-slate-950 text-white' : 'border-border-subtle bg-white hover:bg-surface-container-low'}`} onClick={() => visitPage(page)}>
                            {page}
                        </button>
                    ))}
                    <button type="button" className="rounded-lg border border-border-subtle bg-white px-3 py-2 font-semibold transition hover:bg-surface-container-low disabled:opacity-50" onClick={() => visitPage(pagination.current_page + 1)} disabled={pagination.current_page >= pagination.last_page}>Next</button>
                </div>
            ) : null}
        </div>
    );
}

function ConsultationTable({ bookings, filters, pagination, sortBy, sortDir }) {
    return (
        <section className="mt-4 overflow-hidden rounded-[28px] border border-border-subtle bg-white shadow-[0_16px_40px_-30px_rgba(17,24,39,0.45)]">
            <div className="border-b border-border-subtle p-4 sm:p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold tracking-tight text-slate-950">All consultations</h3>
                            <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-secondary">{pagination.total} rows</span>
                        </div>
                        <p className="mt-1 text-sm text-secondary">
                            {pagination.total > 0 ? `Showing ${pagination.from}-${pagination.to} of ${pagination.total} consultations.` : 'No matching consultations.'}
                        </p>
                    </div>
                    <ConsultationFilters filters={filters} sortBy={sortBy} sortDir={sortDir} />
                </div>
            </div>

            {bookings.length > 0 ? (
                <>
                    <div className="space-y-3 p-4 md:hidden">
                        {bookings.map((booking) => (
                            <article key={booking.id} className="rounded-2xl border border-border-subtle bg-surface-cream p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-base font-bold text-slate-950">{booking.patient.name}</p>
                                        <p className="mt-1 text-sm text-secondary">{formatDateTime(booking.start_time)}</p>
                                    </div>
                                    <BookingBadges booking={booking} compact />
                                </div>
                                <p className="mt-3 text-sm capitalize text-secondary">{booking.consultation_mode ?? 'offline'}</p>
                                <div className="mt-4">
                                    <BookingActions booking={booking} stacked />
                                </div>
                            </article>
                        ))}
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <Table>
                            <TableHeader className="bg-surface-container-low text-xs uppercase tracking-[0.14em] text-secondary">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="px-5 py-4"><SortButton label="Patient" sortKey="patient" sortBy={sortBy} sortDir={sortDir} filters={filters} /></TableHead>
                                    <TableHead className="px-5 py-4"><SortButton label="Schedule" sortKey="start_time" sortBy={sortBy} sortDir={sortDir} filters={filters} /></TableHead>
                                    <TableHead className="px-5 py-4"><SortButton label="Status" sortKey="status" sortBy={sortBy} sortDir={sortDir} filters={filters} /></TableHead>
                                    <TableHead className="px-5 py-4"><SortButton label="Intake" sortKey="intake" sortBy={sortBy} sortDir={sortDir} filters={filters} /></TableHead>
                                    <TableHead className="px-5 py-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {bookings.map((booking) => (
                                    <TableRow key={booking.id} className="hover:bg-amber-50/30">
                                        <TableCell className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <PatientAvatar name={booking.patient.name} />
                                                <div>
                                                    <p className="font-bold text-slate-950">{booking.patient.name}</p>
                                                    <PatientContact patient={booking.patient} />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-4">
                                            <p className="font-bold text-slate-950">{formatDateTime(booking.start_time)}</p>
                                            <p className="text-xs capitalize text-secondary">{booking.consultation_mode ?? 'offline'}</p>
                                        </TableCell>
                                        <TableCell className="px-5 py-4"><BookingBadges booking={booking} compact /></TableCell>
                                        <TableCell className="max-w-[260px] px-5 py-4"><IntakePreview booking={booking} /></TableCell>
                                        <TableCell className="px-5 py-4"><BookingActions booking={booking} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <PaginationControls filters={filters} pagination={pagination} sortBy={sortBy} sortDir={sortDir} />
                </>
            ) : (
                <div className="m-4 rounded-[28px] border border-dashed border-border-subtle bg-surface-cream px-6 py-12 text-center sm:m-5">
                    <p className="text-lg font-semibold text-slate-900">No consultations match your filters.</p>
                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-secondary">Reset filters to return to the full confirmed workload.</p>
                </div>
            )}
        </section>
    );
}

function QueueFilterChip({ label, active, params, filters, sortBy, sortDir }) {
    const applyChip = () => {
        router.get(route('doctor.consultations.index'), {
            search: filters.search ?? '',
            status: '',
            date_window: 'all',
            sort_by: sortBy,
            sort_dir: sortDir,
            page: 1,
            ...params,
        }, {
            preserveScroll: true,
        });
    };

    return (
        <button
            type="button"
            onClick={applyChip}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${active ? 'bg-slate-950 text-white' : 'border border-border-subtle bg-white text-secondary hover:bg-surface-container-low'}`}
        >
            {label}
        </button>
    );
}

export default function Consultations({ doctor, stats, nextBooking, bookings = [], filters = {}, pagination, sortBy = 'start_time', sortDir = 'asc' }) {
    const activeStatus = filters.status ?? '';
    const activeDateWindow = filters.date_window ?? 'all';

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Consultations" />

            <ConsultationsHeader />

            <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Confirmed" value={stats.total} helper="Active workload" />
                <StatCard label="Today" value={stats.today} helper="Scheduled today" />
                <StatCard label="Ready" value={stats.ready} helper="Can complete" />
            </div>

            <PriorityPatient booking={nextBooking} />

            <section className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="font-headline text-2xl text-slate-950">Queue</h2>
                    <p className="mt-1 text-sm text-secondary">Searchable table for the full confirmed workload.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
                    <QueueFilterChip label="All" active={!activeStatus && activeDateWindow === 'all'} params={{ status: '', date_window: 'all' }} filters={filters} sortBy={sortBy} sortDir={sortDir} />
                    <QueueFilterChip label="Today" active={activeDateWindow === 'today'} params={{ status: '', date_window: 'today' }} filters={filters} sortBy={sortBy} sortDir={sortDir} />
                    <QueueFilterChip label="Needs link" active={activeStatus === 'needs_link'} params={{ status: 'needs_link', date_window: 'all' }} filters={filters} sortBy={sortBy} sortDir={sortDir} />
                </div>
            </section>

            <ConsultationTable bookings={bookings} filters={filters} pagination={pagination} sortBy={sortBy} sortDir={sortDir} />
        </DoctorLayout>
    );
}
