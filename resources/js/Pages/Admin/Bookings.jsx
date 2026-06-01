import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

export default function Bookings({ doctors, patients }) {
    const [availableSlots, setAvailableSlots] = useState([]);
    const [clinicHours, setClinicHours] = useState([]);

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

    const fetchSlots = async () => {
        if (!form.data.doctor_id || !form.data.date) return;

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

    return (
        <AdminLayout>
            <Head title="Admin Booking Assistance" />
            <AdminPageHeader title="Admin Booking Assistance" subtitle="Search active doctors and available slots, then confirm bookings for registered patients or guest walk-ins without payment checkout." />

            <Card>
                <CardHeader>
                    <CardTitle>Create admin-assisted booking</CardTitle>
                    <CardDescription>Select a doctor, date, and slot. Choose a registered patient or enter guest details, pick the consultation mode, and confirm.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-6">
                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                            <p className="text-sm font-medium text-slate-900">Doctor and slot</p>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Doctor</label>
                                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.doctor_id} onChange={(event) => form.setData('doctor_id', event.target.value)}>
                                        {doctors.map((doctor) => (
                                            <option key={doctor.id} value={doctor.id}>
                                                {doctor.name} · {doctor.specialization}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.doctor_id ? <p className="mt-1 text-sm text-rose-600">{form.errors.doctor_id}</p> : null}
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Date</label>
                                    <Input type="date" value={form.data.date} onChange={(event) => { form.setData('date', event.target.value); }} />
                                </div>
                                <div className="flex items-end">
                                    <Button type="button" variant="outline" onClick={fetchSlots} disabled={form.processing}>
                                        Search slots
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                                Clinic hours: {clinicHours.length ? clinicHours.map((hour) => `${hour.start_time}-${hour.end_time}`).join(', ') : 'Search slots to show clinic hours for this date.'}
                            </div>

                            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-amber-900">
                                    <input type="checkbox" checked={form.data.override_clinic_hours} onChange={(event) => form.setData('override_clinic_hours', event.target.checked)} />
                                    Show and allow outside-hours slots with admin override
                                </label>
                                {form.data.override_clinic_hours ? (
                                    <Input value={form.data.override_reason} onChange={(event) => form.setData('override_reason', event.target.value)} placeholder="Required override reason" />
                                ) : null}
                            </div>

                            {availableSlots.length > 0 ? (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Available slots</label>
                                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.id}
                                                type="button"
                                                onClick={() => form.setData('slot_id', slot.id)}
                                                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${form.data.slot_id === String(slot.id) ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 hover:border-slate-400'} ${slot.within_clinic_hours === false ? 'border-amber-300 bg-amber-50' : ''}`}
                                            >
                                                <p className="font-medium">{formatDateTime(slot.start_time)}</p>
                                                {slot.within_clinic_hours === false ? <p className="mt-1 text-xs">Outside clinic hours</p> : null}
                                            </button>
                                        ))}
                                    </div>
                                    {form.errors.slot_id ? <p className="mt-1 text-sm text-rose-600">{form.errors.slot_id}</p> : null}
                                </div>
                            ) : null}
                        </div>

                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                            <p className="text-sm font-medium text-slate-900">Patient information</p>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Patient type</label>
                                <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.patient_type} onChange={(event) => form.setData('patient_type', event.target.value)}>
                                    <option value="registered">Registered patient</option>
                                    <option value="guest">Guest (no account)</option>
                                </select>
                            </div>

                            {form.data.patient_type === 'registered' ? (
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Patient</label>
                                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.user_id} onChange={(event) => form.setData('user_id', event.target.value)}>
                                        {patients.map((patient) => (
                                            <option key={patient.id} value={patient.id}>
                                                {patient.name} · {patient.phone}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.user_id ? <p className="mt-1 text-sm text-rose-600">{form.errors.user_id}</p> : null}
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Guest name</label>
                                        <Input value={form.data.guest_patient_name} onChange={(event) => form.setData('guest_patient_name', event.target.value)} placeholder="Guest patient name" />
                                        {form.errors.guest_patient_name ? <p className="mt-1 text-sm text-rose-600">{form.errors.guest_patient_name}</p> : null}
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">WhatsApp number</label>
                                        <Input value={form.data.guest_whatsapp} onChange={(event) => form.setData('guest_whatsapp', event.target.value)} placeholder="e.g. 6281234567890" />
                                        {form.errors.guest_whatsapp ? <p className="mt-1 text-sm text-rose-600">{form.errors.guest_whatsapp}</p> : null}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                            <p className="text-sm font-medium text-slate-900">Consultation details</p>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Consultation mode</label>
                                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.consultation_mode} onChange={(event) => form.setData('consultation_mode', event.target.value)}>
                                        <option value="offline">Offline (clinic visit)</option>
                                        <option value="online">Online (Google Meet)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                                <Textarea value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} placeholder="Optional booking notes" />
                            </div>
                        </div>

                        {Object.values(form.errors).length > 0 ? (
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {Object.values(form.errors)[0]}
                            </div>
                        ) : null}

                        <Button className="w-full bg-clinical-gold text-white hover:opacity-90" disabled={form.processing || !form.data.slot_id}>
                            {form.processing ? 'Confirming booking...' : 'Confirm booking'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
