import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatDateTime, formatTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

const fieldClass = 'h-12 w-full rounded-2xl border border-border-subtle bg-white px-4 text-sm font-medium text-charcoal-depth shadow-sm outline-none transition focus:border-clinical-gold focus:ring-2 focus:ring-clinical-gold/20';
const dayAbbreviations = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const weekDisplayOrder = [1, 2, 3, 4, 5, 6, 0];

function formatClock(time) {
    const [hour = 0, minute = 0] = String(time).split(':').map(Number);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;

    return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function hasExactDays(days, expectedDays) {
    return days.length === expectedDays.length && expectedDays.every((day) => days.includes(day));
}

function formatDays(days) {
    if (hasExactDays(days, [1, 2, 3, 4, 5])) return 'Weekdays (Mon–Fri)';
    if (hasExactDays(days, [0, 6])) return 'Weekends (Sat–Sun)';
    if (hasExactDays(days, [0, 1, 2, 3, 4, 5, 6])) return 'Every day';

    return [...days]
        .sort((a, b) => weekDisplayOrder.indexOf(a) - weekDisplayOrder.indexOf(b))
        .map((day) => dayAbbreviations[day])
        .join(', ');
}

function buildWeeklyClinicRows(clinicSchedule) {
    const grouped = clinicSchedule.reduce((rows, hour) => {
        const key = `${hour.start_time}-${hour.end_time}`;
        rows[key] ??= { start_time: hour.start_time, end_time: hour.end_time, days: [] };
        rows[key].days.push(hour.day_of_week);

        return rows;
    }, {});

    return Object.values(grouped)
        .sort((a, b) => Math.min(...a.days.map((day) => weekDisplayOrder.indexOf(day))) - Math.min(...b.days.map((day) => weekDisplayOrder.indexOf(day))))
        .map((row) => ({
            label: formatDays(row.days),
            time: `${formatClock(row.start_time)} – ${formatClock(row.end_time)}`,
        }));
}

function StepPill({ active, label }) {
    return (
        <div className={`rounded-2xl border px-4 py-3 text-sm font-bold ${active ? 'border-charcoal-depth bg-charcoal-depth text-white shadow-sm' : 'border-border-subtle bg-white text-secondary'}`}>
            {label}
        </div>
    );
}

export default function Bookings({ doctors, patients, clinicSchedule = [] }) {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [clinicHours, setClinicHours] = useState([]);
    const [hasSearchedSlots, setHasSearchedSlots] = useState(false);

    const form = useForm({
        doctor_id: doctors[0]?.id ?? '',
        date: new Date().toISOString().split('T')[0],
        slot_id: '',
        consultation_mode: 'offline',
        patient_type: 'registered',
        user_id: patients[0]?.id ?? '',
        guest_patient_name: '',
        guest_whatsapp: '',
        notes: '',
        override_clinic_hours: false,
        override_reason: '',
    });

    const selectedDoctor = doctors.find((doctor) => String(doctor.id) === String(form.data.doctor_id));
    const selectedPatient = patients.find((patient) => String(patient.id) === String(form.data.user_id));
    const selectedSlot = availableSlots.find((slot) => String(slot.id) === String(form.data.slot_id));
    const patientLabel = form.data.patient_type === 'registered'
        ? selectedPatient?.name
        : form.data.guest_patient_name || null;
    const weeklyClinicRows = buildWeeklyClinicRows(clinicSchedule);
    const searchedClinicRows = clinicHours.map((hour, index) => ({
            label: clinicHours.length > 1 ? `Selected date ${index + 1}` : 'Selected date',
            time: `${formatClock(hour.start_time)} – ${formatClock(hour.end_time)}`,
        }));
    const clinicHourRows = hasSearchedSlots && searchedClinicRows.length
        ? searchedClinicRows
        : weeklyClinicRows;
    const patientReady = form.data.patient_type === 'registered'
        ? Boolean(form.data.user_id)
        : Boolean(form.data.guest_patient_name.trim() && form.data.guest_whatsapp.trim());
    const overrideReady = !form.data.override_clinic_hours || Boolean(form.data.override_reason.trim());
    const canConfirm = Boolean(form.data.slot_id && patientReady && overrideReady);

    const fetchSlots = async () => {
        if (!form.data.doctor_id || !form.data.date) return;

        setHasSearchedSlots(true);

        try {
            const response = await fetch(
                route('admin.admin.slots') + `?doctor_id=${form.data.doctor_id}&date=${form.data.date}&include_outside_hours=${form.data.override_clinic_hours ? 1 : 0}`,
                { headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } },
            );
            const json = await response.json();
            setAvailableSlots(json.data ?? []);
            setClinicHours(json.clinic_hours ?? []);
            form.setData('slot_id', '');
        } catch {
            setAvailableSlots([]);
            setClinicHours([]);
        }
    };

    const submit = (event) => {
        event.preventDefault();
        form.post(route('admin.bookings.store'));
    };

    const resetBooking = () => {
        form.reset();
        setAvailableSlots([]);
        setClinicHours([]);
        setHasSearchedSlots(false);
    };

    return (
        <AdminLayout>
            <Head title="Admin Booking Assistance" />

            <form onSubmit={submit} className="space-y-5">
                <section className="overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-sm">
                    <div className="grid gap-5 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-6">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-clinical-gold">Admin assisted booking</p>
                            <h1 className="font-headline-lg mt-1 text-headline-lg font-bold tracking-tight text-charcoal-depth sm:text-4xl">Create booking</h1>
                            <p className="mt-2 max-w-2xl text-sm text-secondary">No payment checkout. Confirmed immediately after submission.</p>
                        </div>
                        <div className="rounded-2xl border border-border-subtle bg-surface-cream px-4 py-3 text-sm font-semibold text-secondary">
                            {availableSlots.length ? `${availableSlots.length} slots found` : 'Ready to search'}
                        </div>
                    </div>
                </section>

                <section className="grid gap-2 sm:grid-cols-3">
                    <StepPill active label="1. Schedule" />
                    <StepPill active={Boolean(form.data.slot_id)} label="2. Patient" />
                    <StepPill active={Boolean(form.data.slot_id && patientReady)} label="3. Confirm" />
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.75fr)]">
                    <div className="space-y-5">
                        <section className="rounded-3xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
                            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-charcoal-depth">Schedule</h2>
                                    <p className="text-sm text-secondary">Search availability.</p>
                                </div>
                                <Button type="button" variant="outline" onClick={resetBooking} className="h-10 rounded-xl font-bold text-secondary hover:text-charcoal-depth">
                                    Reset
                                </Button>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto] md:items-end">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-charcoal-depth">Doctor</label>
                                    <select className={fieldClass} value={form.data.doctor_id} onChange={(event) => form.setData('doctor_id', event.target.value)}>
                                        {doctors.map((doctor) => (
                                            <option key={doctor.id} value={doctor.id}>
                                                {doctor.name} · {doctor.specialization}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.doctor_id ? <p className="mt-2 text-sm text-rose-600">{form.errors.doctor_id}</p> : null}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-charcoal-depth">Date</label>
                                    <Input className="h-12 rounded-2xl border-border-subtle px-4 font-medium focus:border-clinical-gold focus:ring-clinical-gold/20" type="date" value={form.data.date} onChange={(event) => { form.setData('date', event.target.value); }} />
                                </div>
                                <Button type="button" onClick={fetchSlots} disabled={form.processing} className="h-12 rounded-2xl bg-charcoal-depth px-5 font-bold hover:bg-black md:min-w-36">
                                    Search
                                </Button>
                            </div>

                            <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.6fr)]">
                                <div className="rounded-2xl border border-border-subtle bg-surface-container-low px-4 py-3 text-sm font-semibold text-secondary">
                                    <p className="font-bold text-charcoal-depth">Clinic hours</p>
                                    <div className="mt-2 space-y-1">
                                        {clinicHourRows.length ? clinicHourRows.map((row) => (
                                            <div key={`${row.label}-${row.time}`} className="flex items-center justify-between gap-4">
                                                <span>{row.label}</span>
                                                <span className="text-right text-charcoal-depth">{row.time}</span>
                                            </div>
                                        )) : 'No clinic hours configured.'}
                                    </div>
                                </div>
                                <div className="space-y-3 rounded-2xl border border-clinical-gold/30 bg-clinical-gold/5 p-4">
                                    <label className="flex items-start gap-3 text-sm">
                                        <input className="mt-1 rounded border-border-subtle text-clinical-gold focus:ring-clinical-gold" type="checkbox" checked={form.data.override_clinic_hours} onChange={(event) => form.setData('override_clinic_hours', event.target.checked)} />
                                        <span>
                                            <span className="block font-bold text-charcoal-depth">Outside-hours override</span>
                                            <span className="block text-secondary">Requires reason.</span>
                                        </span>
                                    </label>
                                    {form.data.override_clinic_hours ? (
                                        <Input className="h-11 rounded-xl border-clinical-gold/30 focus:border-clinical-gold focus:ring-clinical-gold/20" value={form.data.override_reason} onChange={(event) => form.setData('override_reason', event.target.value)} placeholder="Required override reason" />
                                    ) : null}
                                    {form.errors.override_reason ? <p className="text-sm text-rose-600">{form.errors.override_reason}</p> : null}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
                            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-charcoal-depth">Available slots</h2>
                                    <p className="text-sm text-secondary">Choose one time.</p>
                                </div>
                                <div className="rounded-full bg-surface-cream px-3 py-1 text-sm font-bold text-secondary">
                                    {availableSlots.length ? `${availableSlots.length} slots` : 'No search yet'}
                                </div>
                            </div>

                            {availableSlots.length > 0 ? (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4">
                                    {availableSlots.map((slot) => {
                                        const selected = String(form.data.slot_id) === String(slot.id);
                                        const outsideHours = slot.within_clinic_hours === false;

                                        return (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => form.setData('slot_id', String(slot.id))}
                                                className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-clinical-gold/30 ${selected ? 'border-charcoal-depth bg-charcoal-depth text-white' : outsideHours ? 'border-clinical-gold/40 bg-clinical-gold/5 text-charcoal-depth hover:border-clinical-gold' : 'border-border-subtle bg-white text-charcoal-depth hover:border-clinical-gold'}`}
                                            >
                                                <span className="block text-base font-bold">{formatTime(slot.start_time)}</span>
                                                <span className={`mt-1 block text-xs font-semibold ${selected ? 'text-white/70' : 'text-secondary'}`}>
                                                    {outsideHours ? 'Outside hours' : selected ? 'Selected' : 'Available'}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-border-subtle bg-surface-cream px-4 py-8 text-center text-sm font-medium text-secondary">
                                    Search slots to start.
                                </div>
                            )}
                            {form.errors.slot_id ? <p className="mt-2 text-sm text-rose-600">{form.errors.slot_id}</p> : null}
                        </section>

                        <section className="rounded-3xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-charcoal-depth">Patient</h2>
                                <p className="text-sm text-secondary">Registered or guest.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-charcoal-depth">Patient type</label>
                                    <select className={fieldClass} value={form.data.patient_type} onChange={(event) => form.setData('patient_type', event.target.value)}>
                                        <option value="registered">Registered patient</option>
                                        <option value="guest">Guest (no account)</option>
                                    </select>
                                </div>

                                {form.data.patient_type === 'registered' ? (
                                    <div>
                                        <label className="mb-2 block text-sm font-bold text-charcoal-depth">Patient</label>
                                        <select className={fieldClass} value={form.data.user_id} onChange={(event) => form.setData('user_id', event.target.value)}>
                                            {patients.map((patient) => (
                                                <option key={patient.id} value={patient.id}>
                                                    {patient.name} · {patient.phone}
                                                </option>
                                            ))}
                                        </select>
                                        {form.errors.user_id ? <p className="mt-2 text-sm text-rose-600">{form.errors.user_id}</p> : null}
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-charcoal-depth">Guest name</label>
                                            <Input className="h-12 rounded-2xl border-border-subtle px-4 font-medium focus:border-clinical-gold focus:ring-clinical-gold/20" value={form.data.guest_patient_name} onChange={(event) => form.setData('guest_patient_name', event.target.value)} placeholder="Guest patient name" />
                                            {form.errors.guest_patient_name ? <p className="mt-2 text-sm text-rose-600">{form.errors.guest_patient_name}</p> : null}
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-bold text-charcoal-depth">WhatsApp number</label>
                                            <Input className="h-12 rounded-2xl border-border-subtle px-4 font-medium focus:border-clinical-gold focus:ring-clinical-gold/20" value={form.data.guest_whatsapp} onChange={(event) => form.setData('guest_whatsapp', event.target.value)} placeholder="e.g. 6281234567890" />
                                            {form.errors.guest_whatsapp ? <p className="mt-2 text-sm text-rose-600">{form.errors.guest_whatsapp}</p> : null}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-3xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
                            <div className="mb-5">
                                <h2 className="text-lg font-bold text-charcoal-depth">Consultation</h2>
                                <p className="text-sm text-secondary">Mode and notes.</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-charcoal-depth">Mode</label>
                                    <select className={fieldClass} value={form.data.consultation_mode} onChange={(event) => form.setData('consultation_mode', event.target.value)}>
                                        <option value="offline">Offline (clinic visit)</option>
                                        <option value="online">Online (Google Meet)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-charcoal-depth">Notes</label>
                                    <Textarea className="min-h-24 rounded-2xl border-border-subtle px-4 py-3 font-medium focus:border-clinical-gold focus:ring-clinical-gold/20" value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} placeholder="Optional notes" />
                                </div>
                            </div>
                        </section>
                    </div>

                    <aside className="xl:sticky xl:top-8 xl:self-start">
                        <section className="rounded-3xl border border-border-subtle bg-white p-5 shadow-sm lg:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-charcoal-depth">Summary</h2>
                                    <p className="mt-1 text-sm text-secondary">{canConfirm ? 'Ready to confirm.' : 'Complete required fields.'}</p>
                                </div>
                                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-bold text-secondary">Draft</span>
                            </div>

                            <div className="mt-5 space-y-3 text-sm">
                                <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-3">
                                    <span className="text-secondary">Doctor</span>
                                    <span className="text-right font-bold text-charcoal-depth">{selectedDoctor?.name ?? 'Not selected'}</span>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-3">
                                    <span className="text-secondary">Time</span>
                                    <span className="text-right font-bold text-charcoal-depth">{selectedSlot ? formatDateTime(selectedSlot.start_time) : 'Not selected'}</span>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-3">
                                    <span className="text-secondary">Patient</span>
                                    <span className="text-right font-bold text-charcoal-depth">{patientLabel ?? 'Not selected'}</span>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-3">
                                    <span className="text-secondary">Mode</span>
                                    <span className="text-right font-bold capitalize text-charcoal-depth">{form.data.consultation_mode}</span>
                                </div>
                            </div>

                            {Object.values(form.errors).length > 0 ? (
                                <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {Object.values(form.errors)[0]}
                                </div>
                            ) : null}

                            <div className="mt-6 space-y-3">
                                <Button className="h-12 w-full rounded-2xl bg-clinical-gold px-5 font-bold text-white shadow-sm hover:bg-clinical-gold-light" disabled={form.processing || !canConfirm}>
                                    {form.processing ? 'Confirming...' : 'Confirm booking'}
                                </Button>
                                <p className="text-center text-xs font-medium text-secondary">No payment checkout.</p>
                            </div>
                        </section>
                    </aside>
                </section>
            </form>
        </AdminLayout>
    );
}
