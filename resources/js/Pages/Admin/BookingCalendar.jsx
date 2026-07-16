import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import AdminLayout, { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatDate, formatTime } from '@/lib/format';
import { Head, Link, router } from '@inertiajs/react';

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function compactParams(params) {
    return Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    );
}

function statusVariant(status) {
    if (status === 'confirmed' || status === 'completed') return 'success';
    if (status === 'cancelled' || status === 'no_show') return 'danger';
    return 'warning';
}

function statusLabel(status) {
    return status.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function modeBadge(mode) {
    if (mode === 'online') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">
                <span className="material-symbols-outlined text-[14px]">videocam</span>
                Online
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-container-low px-2.5 py-1 text-xs font-medium text-secondary">
            <span className="material-symbols-outlined text-[14px]">place</span>
            On-site
        </span>
    );
}

function ViewToggle({ view, onChange }) {
    const views = [
        { value: 'month', label: 'Month' },
        { value: 'week', label: 'Week' },
        { value: 'day', label: 'Day' },
    ];

    return (
        <div className="inline-flex rounded-xl border border-border-subtle bg-white p-1">
            {views.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                        view === option.value
                            ? 'bg-charcoal-depth text-white shadow-sm'
                            : 'text-secondary hover:bg-surface-container-low'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

function FilterSelect({ label, value, options, onChange }) {
    return (
        <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-secondary">{label}</span>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-10 rounded-xl border border-border-subtle bg-white px-3 text-sm text-charcoal-depth focus:border-clinical-gold focus:outline-none focus:ring-1 focus:ring-clinical-gold"
            >
                <option value="">All</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </label>
    );
}

function CalendarGrid({ days, onSelect }) {
    return (
        <div>
            <div className="grid grid-cols-7 gap-1 border-b border-border-subtle pb-2">
                {WEEKDAY_HEADERS.map((label) => (
                    <div key={label} className="text-center text-xs font-bold uppercase tracking-wide text-secondary">
                        {label}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1 pt-2">
                {days.map((day) => {
                    const base = 'flex h-[64px] flex-col items-start justify-between rounded-lg border p-1.5 transition sm:h-[76px] sm:rounded-xl sm:p-2';
                    const tone = !day.is_current_month
                        ? 'border-transparent bg-transparent text-tertiary hover:bg-surface-container-low'
                        : day.is_selected
                            ? 'border-clinical-gold bg-clinical-gold/10 text-charcoal-depth shadow-sm'
                            : day.is_today
                                ? 'border-charcoal-depth/40 bg-white text-charcoal-depth'
                                : 'border-border-subtle bg-white text-charcoal-depth hover:bg-surface-container-low';

                    return (
                        <button
                            key={day.date}
                            type="button"
                            onClick={() => onSelect(day.date)}
                            className={`${base} ${tone}`}
                        >
                            <span className="text-sm font-semibold">{day.day}</span>
                            {day.booking_count > 0 ? (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-clinical-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-clinical-gold">
                                    <span className="material-symbols-outlined text-[11px]">event</span>
                                    {day.booking_count}
                                </span>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function BookingRow({ booking }) {
    return (
        <div className="rounded-2xl border border-border-subtle bg-white p-4 transition hover:bg-surface-cream">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-charcoal-depth">{booking.patient_name}</span>
                        <Badge variant={booking.is_guest ? 'neutral' : 'success'}>{booking.patient_type_label}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-secondary">
                        {booking.start_time ? formatTime(booking.start_time) : '—'}
                        {booking.end_time ? ` – ${formatTime(booking.end_time)}` : ''}
                    </p>
                </div>
                <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
            </div>

            <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">stethoscope</span>
                    <span>{booking.doctor_name}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">call</span>
                    <span className="truncate">{booking.patient_phone ?? 'No contact on file'}</span>
                </div>
                <div className="flex items-center gap-2 text-secondary">
                    {modeBadge(booking.consultation_mode)}
                </div>
                <div className="flex items-center gap-2 text-secondary">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">confirmation_number</span>
                    {booking.queue_number ? (
                        <span>
                            <span className="font-semibold text-charcoal-depth">{booking.queue_number}</span>
                            <span className="text-tertiary"> · {booking.queue_status}</span>
                        </span>
                    ) : (
                        <span className="text-tertiary">Not checked in</span>
                    )}
                </div>
            </dl>

            <div className="mt-3 border-t border-border-subtle pt-3 text-right">
                <Link href={booking.review_href} className="font-semibold text-clinical-gold hover:underline">
                    Review
                </Link>
            </div>
        </div>
    );
}

export default function BookingCalendar({
    view,
    selectedDate,
    today,
    rangeLabel,
    prevDate,
    nextDate,
    calendarDays,
    selectedBookings,
    doctors,
    statuses,
    modes,
    filters,
    summary,
}) {
    const [doctorId, setDoctorId] = useState(filters.doctor_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [mode, setMode] = useState(filters.mode ?? '');

    const baseParams = {
        view,
        date: selectedDate,
        doctor_id: doctorId,
        status,
        mode,
    };

    const visit = (overrides) => {
        router.get(route('admin.calendar.index'), compactParams({ ...baseParams, ...overrides }), {
            preserveScroll: true,
            preserveState: true,
            replace: true,
        });
    };

    const handleFilterChange = (key, value) => {
        if (key === 'doctor_id') setDoctorId(value);
        if (key === 'status') setStatus(value);
        if (key === 'mode') setMode(value);
        visit({ [key]: value });
    };

    const showGrid = view !== 'day';

    return (
        <AdminLayout>
            <Head title="Booking Calendar" />

            <AdminPageHeader
                title="Booking Calendar"
                subtitle="See who is booked by day, week, or month. Read-only visibility for listed patients."
                actions={
                    <div className="flex flex-wrap items-center gap-2">
                        <ViewToggle view={view} onChange={(value) => visit({ view: value })} />
                        <Link
                            href={route('admin.bookings.index')}
                            className="rounded-xl bg-charcoal-depth px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-black"
                        >
                            New Booking
                        </Link>
                    </div>
                }
            />

            <section className="mb-4 rounded-3xl border border-border-subtle bg-white p-4 shadow-sm">
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <FilterSelect label="Doctor" value={doctorId} options={doctors.map((doctor) => ({ value: String(doctor.id), label: doctor.name }))} onChange={(value) => handleFilterChange('doctor_id', value)} />
                    <FilterSelect label="Status" value={status} options={statuses} onChange={(value) => handleFilterChange('status', value)} />
                    <FilterSelect label="Mode" value={mode} options={modes} onChange={(value) => handleFilterChange('mode', value)} />
                    <div className="flex items-end">
                        <Link
                            href={route('admin.calendar.index')}
                            className="h-10 w-full rounded-xl border border-border-subtle bg-white px-3 text-sm font-semibold text-secondary transition hover:bg-surface-container-low"
                        >
                            Reset
                        </Link>
                    </div>
                </div>
            </section>

            <div className={`grid gap-4 ${showGrid ? 'xl:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}>
                <section className="rounded-3xl border border-border-subtle bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle p-4">
                        <button
                            type="button"
                            onClick={() => visit({ date: prevDate })}
                            className="touch-target flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-secondary transition hover:bg-surface-container-low"
                            aria-label="Previous range"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <div className="text-center">
                            <p className="font-headline-md text-headline-md font-bold text-charcoal-depth">{rangeLabel}</p>
                            <button
                                type="button"
                                onClick={() => visit({ date: today })}
                                className="text-xs font-semibold text-clinical-gold hover:underline"
                            >
                                Jump to today
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => visit({ date: nextDate })}
                            className="touch-target flex h-9 w-9 items-center justify-center rounded-lg border border-border-subtle text-secondary transition hover:bg-surface-container-low"
                            aria-label="Next range"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>

                    {showGrid ? (
                        <div className="p-4">
                            <CalendarGrid days={calendarDays} onSelect={(date) => visit({ date })} />
                        </div>
                    ) : (
                        <div className="p-4">
                            <p className="text-sm text-secondary">
                                Showing the agenda for <span className="font-semibold text-charcoal-depth">{formatDate(selectedDate)}</span>. Switch to month or week to see surrounding dates.
                            </p>
                        </div>
                    )}
                </section>

                <section className="rounded-3xl border border-border-subtle bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 border-b border-border-subtle p-4">
                        <div>
                            <p className="font-headline-md text-headline-md font-bold text-charcoal-depth">{formatDate(selectedDate)}</p>
                            <p className="text-xs text-secondary">{summary.selected_bookings} booking{summary.selected_bookings === 1 ? '' : 's'} listed</p>
                        </div>
                        <Badge variant="neutral">{summary.visible_bookings} in range</Badge>
                    </div>

                    <div className="max-h-[640px] space-y-3 overflow-y-auto p-4">
                        {selectedBookings.length ? (
                            selectedBookings.map((booking) => <BookingRow key={booking.id} booking={booking} />)
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                                <span className="material-symbols-outlined text-4xl text-tertiary">event_busy</span>
                                <p className="text-sm font-semibold text-secondary">No bookings for this date</p>
                                <p className="text-xs text-tertiary">Pick another day or adjust the filters above.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
