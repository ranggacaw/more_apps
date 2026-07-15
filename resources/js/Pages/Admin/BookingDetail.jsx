import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import AdminLayout from '@/Layouts/AdminLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head, Link } from '@inertiajs/react';

function statusVariant(status) {
    if (status === 'paid' || status === 'confirmed' || status === 'completed' || status === 'active') return 'success';
    if (status === 'failed' || status === 'cancelled' || status === 'no_show') return 'danger';
    return 'warning';
}

function labelize(value) {
    if (value === null || value === undefined || value === '') return '—';

    return value;
}

function DetailRow({ label, children }) {
    return (
        <div className="flex flex-col gap-1 border-b border-border-subtle py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <dt className="text-sm font-semibold text-secondary">{label}</dt>
            <dd className="text-sm font-bold text-charcoal-depth sm:text-right sm:max-w-[65%] break-words">{children ?? '—'}</dd>
        </div>
    );
}

function SectionCard({ title, description, children, action }) {
    return (
        <Card className="shadow-sm">
            <CardHeader className="flex flex-col gap-2 border-b border-border-subtle sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-charcoal-depth">{title}</h2>
                    {description ? <p className="mt-1 text-sm text-secondary">{description}</p> : null}
                </div>
                {action}
            </CardHeader>
            <div className="p-5 lg:p-6">
                <dl className="space-y-1">{children}</dl>
            </div>
        </Card>
    );
}

function sourceLabel(source) {
    if (source === 'admin_assisted') return 'Admin assisted';
    if (source === 'self_service') return 'Self service';

    return labelize(source);
}

function modeLabel(mode) {
    if (mode === 'online') return 'Online (Google Meet)';
    if (mode === 'offline') return 'Offline (clinic visit)';

    return labelize(mode);
}

export default function BookingDetail({ booking }) {
    const payment = booking.payment;

    return (
        <AdminLayout>
            <Head title={`Booking #${booking.id}`} />

            <section className="mb-5 overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-sm">
                <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-start md:p-6">
                    <div className="flex flex-col gap-3">
                        <Link href={route('admin.bookings.index')} className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-secondary transition hover:text-charcoal-depth">
                            <span className="material-symbols-outlined text-base">arrow_back</span>
                            Back to bookings
                        </Link>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clinical-gold">Booking detail</p>
                            <h1 className="mt-1 font-headline-lg text-headline-lg font-bold tracking-tight text-charcoal-depth sm:text-4xl">
                                #{booking.id} · {booking.display_name}
                            </h1>
                            <p className="mt-2 text-sm text-secondary">
                                Created {formatDateTime(booking.created_at)}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
                            <Badge variant="warning">{sourceLabel(booking.booking_source)}</Badge>
                            <Badge variant="warning">{modeLabel(booking.consultation_mode)}</Badge>
                            {booking.is_guest_booking ? <Badge variant="warning">Guest</Badge> : null}
                            {booking.needs_meeting_link ? <Badge variant="danger">Link pending</Badge> : null}
                        </div>
                    </div>
                    <div className="flex sm:justify-end">
                        <Link href={route('admin.bookings.index')} className="rounded-xl border border-border-subtle bg-white px-4 py-3 text-center text-sm font-bold text-secondary transition hover:bg-surface-container-low hover:text-charcoal-depth">
                            New booking
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-2">
                <SectionCard title="Patient" description={booking.is_guest_booking ? 'Guest patient (no account).' : 'Registered patient.'}>
                    <DetailRow label="Name">{booking.display_name}</DetailRow>
                    <DetailRow label="Phone / WhatsApp">{booking.display_phone}</DetailRow>
                    <DetailRow label="Email">{booking.display_email}</DetailRow>
                    {booking.patient ? (
                        <DetailRow label="Account">
                            <Link href={route('admin.users.index')} className="text-clinical-gold hover:underline">
                                User #{booking.patient.id}
                            </Link>
                        </DetailRow>
                    ) : null}
                    {booking.guest_whatsapp ? <DetailRow label="Guest WhatsApp">{booking.guest_whatsapp}</DetailRow> : null}
                </SectionCard>

                <SectionCard title="Schedule" description="Appointment time and doctor.">
                    <DetailRow label="Start">{booking.slot?.start_time ? formatDateTime(booking.slot.start_time) : '—'}</DetailRow>
                    <DetailRow label="End">{booking.slot?.end_time ? formatDateTime(booking.slot.end_time) : '—'}</DetailRow>
                    <DetailRow label="Consultation mode">{modeLabel(booking.consultation_mode)}</DetailRow>
                    <DetailRow label="Doctor">{booking.doctor?.name}</DetailRow>
                    <DetailRow label="Specialization">{booking.doctor?.specialization}</DetailRow>
                    {booking.doctor ? (
                        <DetailRow label="Doctor status">
                            <Badge variant={booking.doctor.is_active ? 'success' : 'danger'}>
                                {booking.doctor.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </DetailRow>
                    ) : null}
                </SectionCard>

                {booking.consultation_mode === 'online' ? (
                    <SectionCard
                        title="Meeting link"
                        description={booking.needs_meeting_link ? 'Awaiting doctor Google Meet link.' : 'Online consultation link.'}
                    >
                        {booking.meeting_link ? (
                            <DetailRow label="Link">
                                <a href={booking.meeting_link} target="_blank" rel="noopener noreferrer" className="break-all text-clinical-gold hover:underline">
                                    {booking.meeting_link}
                                </a>
                            </DetailRow>
                        ) : (
                            <DetailRow label="Link">Not provided yet</DetailRow>
                        )}
                        <DetailRow label="Requested at">{booking.meeting_link_requested_at ? formatDateTime(booking.meeting_link_requested_at) : '—'}</DetailRow>
                        <DetailRow label="Submitted at">{booking.meeting_link_submitted_at ? formatDateTime(booking.meeting_link_submitted_at) : '—'}</DetailRow>
                    </SectionCard>
                ) : null}

                <SectionCard
                    title="Payment"
                    description={payment ? 'Latest payment record for this booking.' : 'No payment record linked to this booking.'}
                >
                    {payment ? (
                        <>
                            <DetailRow label="Status">
                                <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
                            </DetailRow>
                            <DetailRow label="Amount">{formatCurrency(payment.amount)}</DetailRow>
                            {payment.return_amount ? <DetailRow label="Return amount">{formatCurrency(payment.return_amount)}</DetailRow> : null}
                            <DetailRow label="Type">{labelize(payment.type)}</DetailRow>
                            <DetailRow label="Provider">{labelize(payment.provider)}</DetailRow>
                            {payment.midtrans_order_id ? <DetailRow label="Order ID">{payment.midtrans_order_id}</DetailRow> : null}
                            <DetailRow label="Paid at">{payment.paid_at ? formatDateTime(payment.paid_at) : '—'}</DetailRow>
                        </>
                    ) : (
                        <DetailRow label="Payment">None</DetailRow>
                    )}
                </SectionCard>

                {booking.queue_entry ? (
                    <SectionCard title="Queue entry" description="Live queue linkage for this booking.">
                        <DetailRow label="Queue number">{booking.queue_entry.queue_number ?? '—'}</DetailRow>
                        <DetailRow label="Source">{labelize(booking.queue_entry.source)}</DetailRow>
                        <DetailRow label="Queue status">
                            <Badge variant={statusVariant(booking.queue_entry.status)}>{booking.queue_entry.status}</Badge>
                        </DetailRow>
                    </SectionCard>
                ) : null}

                <SectionCard title="Notes" description="Internal booking notes.">
                    <DetailRow label="Notes">{booking.notes?.trim() ? booking.notes : 'No notes recorded.'}</DetailRow>
                </SectionCard>

                {booking.override_log ? (
                    <SectionCard title="Outside-hours override" description="Admin approved an appointment outside clinic hours.">
                        <DetailRow label="Override date">{booking.override_log.override_date}</DetailRow>
                        <DetailRow label="Time">{booking.override_log.start_time} – {booking.override_log.end_time}</DetailRow>
                        <DetailRow label="Reason">{booking.override_log.reason}</DetailRow>
                    </SectionCard>
                ) : null}

                <SectionCard title="Audit trail" description="Booking source, reminders, and lifecycle timestamps.">
                    <DetailRow label="Booked by admin">
                        {booking.booked_by_admin ? (
                            <span>{booking.booked_by_admin.name} (#{booking.booked_by_admin.id})</span>
                        ) : (
                            <span className="text-secondary">Self-service (no admin)</span>
                        )}
                    </DetailRow>
                    <DetailRow label="Booking source">{sourceLabel(booking.booking_source)}</DetailRow>
                    <DetailRow label="Created">{formatDateTime(booking.created_at)}</DetailRow>
                    <DetailRow label="Last updated">{formatDateTime(booking.updated_at)}</DetailRow>
                    <DetailRow label="Day-before reminder">{booking.day_before_reminder_sent_at ? formatDateTime(booking.day_before_reminder_sent_at) : 'Not sent'}</DetailRow>
                    <DetailRow label="Same-day reminder">{booking.same_day_reminder_sent_at ? formatDateTime(booking.same_day_reminder_sent_at) : 'Not sent'}</DetailRow>
                    {booking.no_show_at ? <DetailRow label="No-show marked">{formatDateTime(booking.no_show_at)}</DetailRow> : null}
                </SectionCard>

                {booking.payments?.length > 1 ? (
                    <SectionCard title="Payment history" description="All payment attempts for this booking.">
                        <div className="space-y-3">
                            {booking.payments.map((entry) => (
                                <div key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-cream px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Badge variant={statusVariant(entry.status)}>{entry.status}</Badge>
                                        <span className="text-sm font-bold text-charcoal-depth">{formatCurrency(entry.amount)}</span>
                                        <span className="text-xs font-semibold uppercase text-secondary">{labelize(entry.provider)}</span>
                                        {entry.midtrans_order_id ? <span className="text-xs text-secondary">{entry.midtrans_order_id}</span> : null}
                                    </div>
                                    <span className="text-xs text-secondary">{formatDateTime(entry.created_at)}</span>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                ) : null}
            </section>
        </AdminLayout>
    );
}
