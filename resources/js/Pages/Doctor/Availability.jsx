import { Button } from '@/components/ui/button';
import { dayLabels, formatDateTime } from '@/lib/format';
import DoctorLayout from '@/Layouts/DoctorLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Availability({ doctor, availabilities, upcomingSlots }) {
    const { data, setData, post, processing, errors } = useForm({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
        slot_duration_minutes: 30,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('doctor.availability.store'));
    };

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Doctor Availability" />

            <header className="mb-stack-lg">
                <h2 className="font-headline-lg text-headline-lg text-charcoal-depth">Availability</h2>
                <p className="font-body-md text-body-md text-secondary mt-1">Define weekly availability and let the system generate consultation slots for patients.</p>
            </header>

            <div className="grid gap-gutter lg:grid-cols-[0.9fr_1.1fr]">
                <section className="bg-white border border-border-subtle rounded-xl soft-lift p-stack-md">
                    <h3 className="font-title-lg text-title-lg text-charcoal-depth mb-stack-md">Add availability block</h3>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">Day of week</label>
                            <select className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold" value={data.day_of_week} onChange={(event) => setData('day_of_week', Number(event.target.value))}>
                                {dayLabels.map((label, index) => <option key={label} value={index}>{label}</option>)}
                            </select>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">Start time</label>
                                <input type="time" value={data.start_time} onChange={(event) => setData('start_time', event.target.value)} className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold" />
                            </div>
                            <div>
                                <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">End time</label>
                                <input type="time" value={data.end_time} onChange={(event) => setData('end_time', event.target.value)} className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold" />
                            </div>
                        </div>
                        <div>
                            <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">Slot duration (minutes)</label>
                            <input type="number" min="15" max="120" value={data.slot_duration_minutes} onChange={(event) => setData('slot_duration_minutes', Number(event.target.value))} className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold" />
                        </div>

                        {Object.values(errors).length ? (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 font-body-md text-body-md text-rose-700">
                                {Object.values(errors)[0]}
                            </div>
                        ) : null}

                        <Button className="w-full bg-clinical-gold text-white hover:opacity-90 transition-opacity shadow-sm font-label-md text-label-md" disabled={processing}>
                            {processing ? 'Saving...' : 'Save availability'}
                        </Button>
                    </form>
                </section>

                <div className="space-y-gutter">
                    <section className="bg-white border border-border-subtle rounded-xl soft-lift p-stack-md">
                        <h3 className="font-title-lg text-title-lg text-charcoal-depth mb-stack-md">Weekly availability</h3>
                        <div className="space-y-3">
                            {availabilities.length ? availabilities.map((availability) => (
                                <div key={availability.id} className="rounded-lg border border-border-subtle bg-surface-cream/50 p-4">
                                    <p className="font-label-md text-label-md font-bold text-charcoal-depth">{dayLabels[availability.day_of_week]}</p>
                                    <p className="font-body-md text-body-md text-secondary">{availability.start_time} - {availability.end_time}</p>
                                    <p className="font-body-md text-body-md text-secondary">{availability.slot_duration_minutes} minute intervals</p>
                                </div>
                            )) : (
                                <p className="font-body-md text-body-md text-secondary">No availability configured yet.</p>
                            )}
                        </div>
                    </section>

                    <section className="bg-white border border-border-subtle rounded-xl soft-lift p-stack-md">
                        <h3 className="font-title-lg text-title-lg text-charcoal-depth mb-stack-md">Upcoming generated slots</h3>
                        <div className="space-y-3">
                            {upcomingSlots.length ? upcomingSlots.map((slot) => (
                                <div key={slot.id} className="rounded-lg border border-border-subtle bg-surface-cream/50 p-4">
                                    <p className="font-label-md text-label-md font-bold text-charcoal-depth">{formatDateTime(slot.start_time)}</p>
                                    <p className="font-body-md text-body-md text-secondary">Status: {slot.status}</p>
                                </div>
                            )) : (
                                <p className="font-body-md text-body-md text-secondary">No upcoming slots yet.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </DoctorLayout>
    );
}
