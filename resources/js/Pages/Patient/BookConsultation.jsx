import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PatientLayout from '@/Layouts/PatientLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import axios from 'axios';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function BookConsultation({ doctors, filters, slots }) {
    const [lockMessage, setLockMessage] = useState('');
    const [lockMessageType, setLockMessageType] = useState('neutral');
    const [lockingSlotId, setLockingSlotId] = useState(null);
    const { data, setData, post, processing, errors } = useForm({
        doctor_id: filters.doctor_id ?? '',
        slot_id: '',
        notes: '',
    });

    const selectedDoctorId = String(data.doctor_id || filters.doctor_id || '');
    const selectedDoctor = doctors.find((doctor) => String(doctor.id) === selectedDoctorId) ?? null;
    const selectedSlot = slots.find((slot) => String(slot.id) === String(data.slot_id)) ?? null;
    const slotGroups = [
        {
            key: 'morning',
            title: 'Morning availability',
            slots: slots.filter((slot) => new Date(slot.start_time).getHours() < 12),
        },
        {
            key: 'afternoon',
            title: 'Afternoon availability',
            slots: slots.filter((slot) => new Date(slot.start_time).getHours() >= 12),
        },
    ].filter((group) => group.slots.length > 0);

    const updateFilters = (nextDoctorId, nextDate) => {
        router.get(
            route('bookings.create'),
            {
                doctor_id: nextDoctorId,
                date: nextDate,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const resetSlotState = () => {
        setData('slot_id', '');
        setLockMessage('');
        setLockMessageType('neutral');
    };

    const handleDoctorSelect = (doctorId) => {
        setData('doctor_id', doctorId);
        resetSlotState();
        updateFilters(doctorId, filters.date);
    };

    const handleDateChange = (nextDate) => {
        resetSlotState();
        updateFilters(data.doctor_id || filters.doctor_id, nextDate);
    };

    const lockSlot = async (slotId) => {
        if (String(data.slot_id) === String(slotId)) {
            setLockMessage('');
            setLockMessageType('neutral');
            setLockingSlotId(slotId);

            try {
                const response = await axios.post(route('slots.unlock'), { slot_id: slotId });
                setData('slot_id', '');
                setLockMessage(response.data.message);
                setLockMessageType('success');
            } catch (error) {
                setLockMessage(error.response?.data?.message ?? 'Unable to unlock this slot.');
                setLockMessageType('danger');
            } finally {
                setLockingSlotId(null);
            }
            return;
        }

        setLockMessage('');
        setLockMessageType('neutral');
        setLockingSlotId(slotId);

        try {
            const response = await axios.post(route('slots.lock'), { slot_id: slotId });
            setData('slot_id', slotId);
            setLockMessage(response.data.message);
            setLockMessageType('success');
        } catch (error) {
            setLockMessage(error.response?.data?.message ?? 'Unable to lock this slot.');
            setLockMessageType('danger');
        } finally {
            setLockingSlotId(null);
        }
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('bookings.store'));
    };

    useEffect(() => {
        if (data.slot_id && !selectedSlot) {
            setData('slot_id', '');
        }
    }, [data.slot_id, selectedSlot, setData]);

    const summarySlotLabel = selectedSlot ? formatDateTime(selectedSlot.start_time) : 'Lock a slot to continue.';
    const summarySlotEndLabel = selectedSlot
        ? new Date(selectedSlot.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
        : null;

    return (
        <PatientLayout>
            <Head title="Book Consultation" />

            <div className="space-y-6">
                <section className="rounded-[24px] border border-border-subtle bg-white p-6 soft-lift">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clinical-gold">Book Consultation</p>
                    <h1 className="mt-2 font-headline text-3xl text-slate-900 md:text-4xl">Book a consultation</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
                        Follow these simple steps to secure your appointment.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-2 text-sm sm:gap-4">
                        <div className="flex items-center gap-3 rounded-full border border-border-subtle bg-surface-cream py-2 pl-2 pr-4 text-slate-900">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold shadow-sm">1</span>
                            <span className="font-medium">Choose doctor</span>
                        </div>
                        <span className="hidden text-secondary sm:block">&rarr;</span>
                        <div className="flex items-center gap-3 rounded-full border border-border-subtle bg-surface-cream py-2 pl-2 pr-4 text-slate-900">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold shadow-sm">2</span>
                            <span className="font-medium">Lock time</span>
                        </div>
                        <span className="hidden text-secondary sm:block">&rarr;</span>
                        <div className="flex items-center gap-3 rounded-full border border-clinical-gold/20 bg-clinical-gold/5 py-2 pl-2 pr-4 text-clinical-gold">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-semibold shadow-sm">3</span>
                            <span className="font-medium">Review and pay</span>
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
                    <div className="space-y-6">
                        <Card className="rounded-[28px] border-border-subtle soft-lift">
                            <CardContent className="p-5 sm:p-6">
                                <div className="flex flex-col gap-3 border-b border-border-subtle pb-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">Step 1</p>
                                        <h2 className="mt-2 font-headline text-3xl text-slate-950">Select your doctor first</h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-7 text-secondary">
                                            Doctor choice drives the rest of the flow, so the page gives that decision more space and clearer context.
                                        </p>
                                    </div>
                                    <div className="inline-flex rounded-full border border-outline-variant bg-surface-cream px-4 py-2 text-sm text-secondary">
                                        {doctors.length} specialist{doctors.length === 1 ? '' : 's'} available
                                    </div>
                                </div>

                                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                                    {doctors.map((doctor, index) => {
                                        const isSelected = String(doctor.id) === selectedDoctorId;

                                        return (
                                            <button
                                                key={doctor.id}
                                                type="button"
                                                onClick={() => handleDoctorSelect(doctor.id)}
                                                className={`rounded-[26px] border p-5 text-left transition ${
                                                    isSelected
                                                        ? 'border-clinical-gold bg-[linear-gradient(180deg,rgba(181,146,42,0.08),rgba(181,146,42,0.02))] shadow-sm'
                                                        : 'border-border-subtle bg-white hover:border-outline-variant hover:shadow-sm'
                                                } ${index === doctors.length - 1 && doctors.length % 2 === 1 ? 'lg:col-span-2' : ''}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    <div className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[22px] text-sm font-semibold ${isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                                        {doctor.avatar_url ? (
                                                            <img src={doctor.avatar_url} alt={doctor.name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            doctor.name.charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-lg font-semibold text-slate-950">{doctor.name}</p>
                                                                <p className="mt-1 text-sm text-secondary">{doctor.specialization}</p>
                                                            </div>
                                                            {isSelected ? <Badge className="bg-slate-900 text-white">selected</Badge> : null}
                                                        </div>
                                                        <p className="mt-4 text-sm leading-6 text-secondary">{doctor.bio}</p>
                                                        <div className="mt-5 flex flex-wrap items-center gap-2">
                                                            <Badge variant="neutral" className={isSelected ? 'bg-white text-slate-700' : ''}>
                                                                {formatCurrency(doctor.consultation_fee)} consult
                                                            </Badge>
                                                            <Badge variant="neutral" className={isSelected ? 'bg-white text-slate-700' : ''}>
                                                                {isSelected
                                                                    ? `${slots.length} slot${slots.length === 1 ? '' : 's'} on this date`
                                                                    : 'Select to view times'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[28px] border-border-subtle soft-lift">
                            <CardContent className="p-5 sm:p-6">
                                <div className="flex flex-col gap-4 border-b border-border-subtle pb-5 lg:flex-row lg:items-end lg:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">Step 2</p>
                                        <h2 className="mt-2 font-headline text-3xl text-slate-950">Choose a day and lock one slot</h2>
                                        <p className="mt-2 max-w-2xl text-sm leading-7 text-secondary">
                                            Grouped availability makes the schedule easier to scan, and the lock message stays close to the decision point.
                                        </p>
                                    </div>

                                    <div className="w-full max-w-sm rounded-[24px] border border-border-subtle bg-surface-cream p-4">
                                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Consultation date</label>
                                        <Input
                                            type="date"
                                            className="mt-2 border-outline-variant bg-white"
                                            value={filters.date}
                                            onChange={(event) => handleDateChange(event.target.value)}
                                        />
                                    </div>
                                </div>

                                {lockMessage ? (
                                    <div
                                        className={`mt-5 rounded-[24px] border px-4 py-4 text-sm leading-6 ${
                                            lockMessageType === 'success'
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                : lockMessageType === 'danger'
                                                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                                                  : 'border-slate-200 bg-slate-50 text-slate-600'
                                        }`}
                                    >
                                        {lockMessage}
                                    </div>
                                ) : null}

                                <div className="mt-5 space-y-5">
                                    {slotGroups.length ? (
                                        slotGroups.map((group) => (
                                            <div key={group.key} className="rounded-[24px] border border-border-subtle bg-surface-cream p-4">
                                                <div className="flex items-center justify-between gap-3">
                                                    <h3 className="text-base font-semibold text-slate-950">{group.title}</h3>
                                                    <span className="text-sm text-secondary">
                                                        {group.slots.length} option{group.slots.length === 1 ? '' : 's'}
                                                    </span>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4">
                                                    {group.slots.map((slot) => {
                                                        const isLocked = String(data.slot_id) === String(slot.id);
                                                        const startTime = new Date(slot.start_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                                        const endTime = new Date(slot.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                                                        const isLocking = lockingSlotId === slot.id;

                                                        return (
                                                            <button
                                                                key={slot.id}
                                                                type="button"
                                                                onClick={() => lockSlot(slot.id)}
                                                                disabled={isLocking}
                                                                className={`flex flex-col items-center justify-center rounded-xl border p-2.5 transition-all ${
                                                                    isLocked
                                                                        ? 'border-clinical-gold bg-clinical-gold text-white shadow-md ring-2 ring-clinical-gold/20 ring-offset-1'
                                                                        : 'border-border-subtle bg-white hover:border-slate-300 hover:shadow-sm'
                                                                } ${isLocking ? 'cursor-wait opacity-50' : ''}`}
                                                            >
                                                                <span className={`text-sm font-semibold ${isLocked ? 'text-white' : 'text-slate-900'}`}>
                                                                    {startTime}
                                                                </span>
                                                                <span className={`mt-0.5 text-[11px] ${isLocked ? 'text-white/90' : 'text-slate-500'}`}>
                                                                    {isLocking ? (isLocked ? 'Unlocking...' : 'Locking...') : isLocked ? 'Locked' : endTime}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="rounded-[24px] border border-dashed border-border-subtle bg-surface-cream px-4 py-6 text-sm text-secondary">
                                            No slots available for this date yet.
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[28px] border-border-subtle soft-lift">
                            <CardContent className="p-5 sm:p-6">
                                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start">
                                    <form onSubmit={submit} className="space-y-5">
                                        <input type="hidden" value={data.doctor_id || ''} name="doctor_id" />
                                        <input type="hidden" value={data.slot_id || ''} name="slot_id" />

                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">Step 3</p>
                                            <h2 className="mt-2 font-headline text-3xl text-slate-950">Add optional notes for the clinic</h2>
                                            <p className="mt-2 max-w-2xl text-sm leading-7 text-secondary">
                                                Include any treatment concerns or context the doctor should see before the consultation.
                                            </p>
                                        </div>

                                        <div className="overflow-hidden rounded-[24px] border border-border-subtle bg-surface-cream p-4">
                                            <label className="mb-3 block text-sm font-medium text-slate-900">Notes for the clinic</label>
                                            <Textarea
                                                value={data.notes}
                                                onChange={(event) => setData('notes', event.target.value)}
                                                placeholder="Skin concern, preferred treatment topic, or anything the doctor should know before the call."
                                                className="border-outline-variant bg-white"
                                            />
                                            {errors.notes ? <p className="mt-2 text-sm text-rose-600">{errors.notes}</p> : null}
                                        </div>

                                        {errors.slot_id ? <p className="text-sm text-rose-600">{errors.slot_id}</p> : null}
                                    </form>

                                    <div className="rounded-[24px] border border-border-subtle bg-surface-cream p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Why this stays optional</p>
                                        <ul className="mt-4 space-y-3 text-sm leading-6 text-secondary">
                                            <li>Faster path to payment</li>
                                            <li>Less form fatigue on mobile</li>
                                            <li>Still enough room for useful context</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <aside className="xl:sticky xl:top-28 xl:self-start">
                        <Card className="overflow-hidden rounded-[30px] border-slate-800 bg-slate-900 text-white soft-lift">
                            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">Booking Summary</p>
                                        <h2 className="mt-3 text-2xl font-semibold">Ready for checkout</h2>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">Review the selected doctor, locked time, and fee before payment.</p>
                                    </div>
                                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
                                        15 min hold
                                    </div>
                                </div>
                            </div>

                            <CardContent className="space-y-4 px-5 py-5 sm:px-6">
                                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Selected doctor</p>
                                    <p className="mt-2 text-lg font-semibold text-white">{selectedDoctor?.name ?? 'Choose a doctor first'}</p>
                                    <p className="mt-1 text-sm text-slate-300">{selectedDoctor?.specialization ?? 'The schedule updates after doctor selection.'}</p>
                                </div>

                                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Locked time</p>
                                    <p className="mt-2 text-lg font-semibold text-white">{summarySlotLabel}</p>
                                    <p className="mt-1 text-sm text-slate-300">{summarySlotEndLabel ? `Ends ${summarySlotEndLabel}` : 'Lock one slot to hold it for 15 minutes.'}</p>
                                </div>

                                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">Booking status</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <Badge className={selectedSlot ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/10 text-slate-200'}>
                                            {selectedSlot ? 'slot locked' : 'slot not locked'}
                                        </Badge>
                                        <Badge className="bg-amber-500/15 text-amber-200">awaiting payment</Badge>
                                    </div>
                                </div>

                                <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">What happens next</p>
                                    <ol className="mt-3 space-y-3 text-sm leading-6 text-slate-200">
                                        <li>1. Review your selected doctor and locked time.</li>
                                        <li>2. Continue into Midtrans checkout.</li>
                                        <li>3. Booking confirms after the payment callback succeeds.</li>
                                    </ol>
                                </div>

                                <div className="rounded-[24px] bg-white px-4 py-4 text-slate-900">
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">Consultation fee</p>
                                            <p className="mt-2 text-3xl font-semibold text-slate-950">
                                                {formatCurrency(selectedDoctor?.consultation_fee ?? 500000)}
                                            </p>
                                        </div>
                                        <div className="text-right text-sm leading-6 text-secondary">
                                            <p>Fixed clinic fee</p>
                                            <p>Paid during checkout</p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={submit}>
                                    <Button className="w-full bg-clinical-gold py-3.5 text-white hover:bg-clinical-gold-light" disabled={processing || !data.slot_id || !data.doctor_id}>
                                        {processing ? 'Creating booking...' : 'Continue to checkout'}
                                    </Button>
                                </form>
                                <p className="text-center text-xs leading-5 text-slate-400">
                                    If the timer expires, this time slot is released automatically and you will need to lock another one.
                                </p>
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </PatientLayout>
    );
}
