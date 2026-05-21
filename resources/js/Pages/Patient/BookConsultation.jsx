import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import PatientLayout from '@/Layouts/PatientLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import axios from 'axios';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function BookConsultation({ doctors, filters, slots }) {
    const [lockMessage, setLockMessage] = useState('');
    const [lockingSlotId, setLockingSlotId] = useState(null);
    const { data, setData, post, processing, errors } = useForm({
        doctor_id: filters.doctor_id ?? '',
        slot_id: '',
        notes: '',
    });

    const selectedDoctor = doctors.find((doctor) => doctor.id === data.doctor_id) ?? doctors.find((doctor) => doctor.id === filters.doctor_id);

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

    const lockSlot = async (slotId) => {
        setLockMessage('');
        setLockingSlotId(slotId);

        try {
            const response = await axios.post(route('slots.lock'), { slot_id: slotId });
            setData('slot_id', slotId);
            setLockMessage(response.data.message);
        } catch (error) {
            setLockMessage(error.response?.data?.message ?? 'Unable to lock this slot.');
        } finally {
            setLockingSlotId(null);
        }
    };

    const submit = (event) => {
        event.preventDefault();
        post(route('bookings.store'));
    };

    return (
        <PatientLayout>
            <Head title="Book Consultation" />

            <section className="mb-8 flex flex-col gap-3">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-clinical-gold">Consultation</p>
                    <h1 className="mt-2 font-headline text-3xl text-slate-900 md:text-4xl">Book a consultation</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
                        Choose a doctor, review generated time slots, lock one for 15 minutes, and move into checkout.
                    </p>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Choose your doctor</CardTitle>
                            <CardDescription>Available clinic doctors are listed here with consultation pricing.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            {doctors.map((doctor) => {
                                const isSelected = (data.doctor_id || filters.doctor_id) === doctor.id;

                                return (
                                    <button
                                        key={doctor.id}
                                        type="button"
                                        onClick={() => {
                                            setData('doctor_id', doctor.id);
                                            setData('slot_id', '');
                                            updateFilters(doctor.id, filters.date);
                                        }}
                                        className={`rounded-2xl border p-4 text-left transition ${isSelected ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-semibold text-slate-500">
                                                {doctor.avatar_url ? (
                                                    <img src={doctor.avatar_url} alt={doctor.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    doctor.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-slate-900">{doctor.name}</p>
                                                <p className="text-sm text-slate-500">{doctor.specialization}</p>
                                                <p className="mt-3 text-sm text-slate-600">{doctor.bio}</p>
                                                <p className="mt-4 text-sm font-medium text-amber-700">{formatCurrency(doctor.consultation_fee)}</p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>2. Pick a date and lock a slot</CardTitle>
                            <CardDescription>Slots are generated from doctor availability and can be reserved for 15 minutes.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 max-w-xs">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Consultation date</label>
                                <Input
                                    type="date"
                                    value={filters.date}
                                    onChange={(event) => updateFilters(data.doctor_id || filters.doctor_id, event.target.value)}
                                />
                            </div>

                            {lockMessage ? (
                                <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                    {lockMessage}
                                </div>
                            ) : null}

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {slots.length ? (
                                    slots.map((slot) => {
                                        const isLocked = Number(data.slot_id) === slot.id;

                                        return (
                                            <div key={slot.id} className="rounded-2xl border border-slate-200 p-4">
                                                <p className="font-medium text-slate-900">{formatDateTime(slot.start_time)}</p>
                                                <p className="mt-1 text-sm text-slate-500">Ends {new Date(slot.end_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                                                <Button
                                                    type="button"
                                                    variant={isLocked ? 'success' : 'outline'}
                                                    className="mt-4 w-full"
                                                    onClick={() => lockSlot(slot.id)}
                                                    disabled={lockingSlotId === slot.id}
                                                >
                                                    {isLocked ? 'Locked' : lockingSlotId === slot.id ? 'Locking...' : 'Lock slot'}
                                                </Button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-slate-500">No slots available for this date yet.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>3. Confirm the booking</CardTitle>
                        <CardDescription>Add optional notes and continue to payment.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <input type="hidden" value={data.doctor_id || ''} name="doctor_id" />
                            <input type="hidden" value={data.slot_id || ''} name="slot_id" />

                            <div>
                                <p className="text-sm font-medium text-slate-700">Selected doctor</p>
                                <p className="mt-1 text-sm text-slate-500">{selectedDoctor ? `${selectedDoctor.name} • ${selectedDoctor.specialization}` : 'Choose a doctor first.'}</p>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-slate-700">Locked slot</p>
                                <div className="mt-2">
                                    {data.slot_id ? <Badge variant="success">Slot #{data.slot_id} locked</Badge> : <Badge>No slot locked</Badge>}
                                </div>
                                {errors.slot_id ? <p className="mt-2 text-sm text-rose-600">{errors.slot_id}</p> : null}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Notes for the clinic</label>
                                <Textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} placeholder="Skin concern, preferred treatment topic, or anything the doctor should know before the call." />
                                {errors.notes ? <p className="mt-2 text-sm text-rose-600">{errors.notes}</p> : null}
                            </div>

                            <Button className="w-full" disabled={processing || !data.slot_id || !data.doctor_id}>
                                {processing ? 'Creating booking...' : 'Continue to checkout'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PatientLayout>
    );
}
