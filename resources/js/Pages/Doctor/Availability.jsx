import { Button } from '@/components/ui/button';
import { dayLabels } from '@/lib/format';
import DoctorLayout from '@/Layouts/DoctorLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { useMemo } from 'react';

const formatTime = (value) =>
    new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(value));

const formatDate = (value) =>
    new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
    }).format(new Date(value));

const calculateSlotCount = (a) => {
    const [sh, sm] = a.start_time.split(':').map(Number);
    const [eh, em] = a.end_time.split(':').map(Number);
    const diff = eh * 60 + em - (sh * 60 + sm);
    return diff > 0 && a.slot_duration_minutes > 0
        ? Math.floor(diff / a.slot_duration_minutes)
        : 0;
};

const statusStyle = {
    open: 'bg-surface-cream/50 border-border-subtle text-on-background',
    locked: 'bg-amber-50 border-amber-200 text-amber-800',
    booked: 'bg-charcoal-depth border-charcoal-depth text-white',
};

const statusLabel = {
    open: 'Open',
    locked: 'Locked',
    booked: 'Booked',
};

export default function Availability({ doctor, availabilities, upcomingSlots }) {
    const { data, setData, post, processing, errors } = useForm({
        day_of_week: 1,
        start_time: '09:00',
        end_time: '12:00',
        slot_duration_minutes: 30,
    });

    const groupedAvailabilities = useMemo(() => {
        const groups = {};
        availabilities.forEach((a) => {
            const key = a.day_of_week;
            if (!groups[key]) groups[key] = [];
            groups[key].push(a);
        });
        return Object.entries(groups)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([day, items]) => ({
                day: Number(day),
                label: dayLabels[day],
                items,
            }));
    }, [availabilities]);

    const groupedSlots = useMemo(() => {
        const groups = {};
        upcomingSlots.forEach((slot) => {
            const key = new Date(slot.start_time).toLocaleDateString('en-CA');
            if (!groups[key]) groups[key] = [];
            groups[key].push(slot);
        });
        return Object.entries(groups)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, items]) => ({
                date,
                label: formatDate(items[0].start_time),
                items: items.sort(
                    (a, b) => new Date(a.start_time) - new Date(b.start_time),
                ),
            }));
    }, [upcomingSlots]);

    const slotPreview = useMemo(() => {
        const [sh, sm] = data.start_time.split(':').map(Number);
        const [eh, em] = data.end_time.split(':').map(Number);
        const diff = eh * 60 + em - (sh * 60 + sm);
        if (diff <= 0 || data.slot_duration_minutes <= 0) return null;
        return {
            count: Math.floor(diff / data.slot_duration_minutes),
            day: data.day_of_week === 7 ? 'every day' : dayLabels[data.day_of_week],
        };
    }, [data.start_time, data.end_time, data.slot_duration_minutes, data.day_of_week]);

    const submit = (event) => {
        event.preventDefault();
        post(route('doctor.availability.store'));
    };

    const removeAvailability = (id) => {
        if (confirm('Remove this availability block? Future open slots will also be deleted.')) {
            router.delete(route('doctor.availability.destroy', id));
        }
    };

    const totalBlocks = availabilities.length;

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Doctor Availability" />

            {/* Section: Page Header */}
            <header className="mb-stack-lg">
                <h2 className="font-headline-lg text-headline-lg text-charcoal-depth">
                    Availability
                </h2>
                <p className="font-body-md text-body-md text-secondary mt-1">
                    Define weekly availability and let the system generate consultation slots for
                    patients.
                </p>
            </header>

            {/* Section: Two-Column Grid */}
            <div className="grid gap-gutter lg:grid-cols-[380px_1fr]">
                {/* Section: Add Availability Form */}
                <section className="bg-white border border-border-subtle rounded-xl soft-lift p-stack-md h-fit lg:sticky lg:top-6">
                    <h3 className="font-title-lg text-title-lg text-charcoal-depth mb-stack-md">
                        Add availability block
                    </h3>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">
                                Day of week
                            </label>
                            <select
                                className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold"
                                value={data.day_of_week}
                                onChange={(e) => setData('day_of_week', Number(e.target.value))}
                            >
                                <option value={7}>Everyday</option>
                                {dayLabels.map((label, index) => (
                                    <option key={label} value={index}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">
                                    Start time
                                </label>
                                <input
                                    type="time"
                                    value={data.start_time}
                                    onChange={(e) => setData('start_time', e.target.value)}
                                    className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">
                                    End time
                                </label>
                                <input
                                    type="time"
                                    value={data.end_time}
                                    onChange={(e) => setData('end_time', e.target.value)}
                                    className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block font-label-sm text-label-sm font-bold text-on-background">
                                Slot duration (minutes)
                            </label>
                            <input
                                type="number"
                                min="15"
                                max="120"
                                value={data.slot_duration_minutes}
                                onChange={(e) =>
                                    setData('slot_duration_minutes', Number(e.target.value))
                                }
                                className="w-full rounded-md border border-border-subtle px-3 py-2 font-body-md text-body-md text-on-background focus:ring-clinical-gold"
                            />
                        </div>

                        {slotPreview && (
                            <div className="rounded-lg bg-surface-cream border border-border-subtle px-3 py-2.5">
                                <p className="font-body-md text-body-md text-secondary leading-relaxed">
                                    This will create{' '}
                                    <strong className="text-on-background">
                                        {slotPreview.count * (data.day_of_week === 7 ? 7 : 1)} slot{slotPreview.count * (data.day_of_week === 7 ? 7 : 1) !== 1 ? 's' : ''}
                                    </strong>{' '}
                                    on{' '}
                                    <strong className="text-on-background">
                                        {slotPreview.day}{data.day_of_week !== 7 ? 's' : ''}
                                    </strong>
                                    , from {data.start_time}–{data.end_time} at{' '}
                                    {data.slot_duration_minutes}-minute intervals.
                                </p>
                            </div>
                        )}

                        {Object.values(errors).length > 0 && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 font-body-md text-body-md text-rose-700">
                                {Object.values(errors)[0]}
                            </div>
                        )}

                        <Button
                            className="w-full bg-clinical-gold text-white hover:bg-clinical-gold hover:opacity-90 transition-opacity shadow-sm font-label-md text-label-md"
                            disabled={processing}
                        >
                            {processing ? 'Saving...' : 'Save availability'}
                        </Button>
                    </form>
                </section>

                {/* Section: Right Column */}
                <div className="space-y-gutter">
                    {/* Section: Weekly Schedule */}
                    <section className="bg-white border border-border-subtle rounded-xl soft-lift p-stack-md">
                        <div className="flex items-center justify-between mb-stack-md">
                            <h3 className="font-title-lg text-title-lg text-charcoal-depth">
                                Weekly schedule
                            </h3>
                            {totalBlocks > 0 && (
                                <span className="font-label-sm text-label-sm text-secondary">
                                    {totalBlocks} block{totalBlocks !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        {groupedAvailabilities.length > 0 ? (
                            <div className="space-y-4">
                                {groupedAvailabilities.map(({ day, label, items }) => (
                                    <div key={day}>
                                        <p className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary mb-2">
                                            {label}
                                        </p>
                                        <div className="space-y-2">
                                            {items.map((a) => (
                                                <div
                                                    key={a.id}
                                                    className="flex items-center justify-between rounded-lg bg-surface-cream/50 border border-border-subtle px-4 py-3"
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <span className="font-label-md text-label-md font-semibold tabular-nums text-charcoal-depth">
                                                            {a.start_time}
                                                        </span>
                                                        <span className="text-border-subtle">
                                                            →
                                                        </span>
                                                        <span className="font-label-md text-label-md font-semibold tabular-nums text-charcoal-depth">
                                                            {a.end_time}
                                                        </span>
                                                        <span className="font-body-md text-body-md text-secondary hidden sm:inline">
                                                            {a.slot_duration_minutes} min
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-[10px] font-bold uppercase tracking-wide bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full">
                                                            {calculateSlotCount(a)} slots
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeAvailability(a.id)
                                                            }
                                                            className="text-secondary hover:text-rose-600 transition-colors p-1"
                                                            title="Remove"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                delete
                                                            </span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="font-body-md text-body-md text-secondary py-4 text-center">
                                No availability configured yet. Add your first block using the form.
                            </p>
                        )}
                    </section>

                    {/* Section: Upcoming Generated Slots */}
                    <section className="bg-white border border-border-subtle rounded-xl soft-lift p-stack-md">
                        <div className="flex items-center justify-between mb-stack-md">
                            <h3 className="font-title-lg text-title-lg text-charcoal-depth">
                                Upcoming slots
                            </h3>
                            <span className="font-label-sm text-label-sm text-secondary">
                                Next 21 days
                            </span>
                        </div>

                        {groupedSlots.length > 0 ? (
                            <div className="space-y-5">
                                {groupedSlots.map(({ date, label, items }) => (
                                    <div key={date}>
                                        <p className="font-label-sm text-label-sm font-bold uppercase tracking-wider text-secondary mb-2">
                                            {label}
                                        </p>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {items.map((slot) => {
                                                const style =
                                                    statusStyle[slot.status] ?? statusStyle.open;
                                                const slotLabel =
                                                    statusLabel[slot.status] ?? slot.status;
                                                return (
                                                    <div
                                                        key={slot.id}
                                                        className={`text-center rounded-lg border px-2 py-2.5 ${style}`}
                                                    >
                                                        <p className="font-label-md text-label-md font-semibold tabular-nums">
                                                            {formatTime(slot.start_time)}
                                                        </p>
                                                        <p
                                                            className={`text-[10px] font-bold uppercase tracking-wide mt-0.5 ${
                                                                slot.status === 'booked'
                                                                    ? 'text-white/70'
                                                                    : 'text-secondary'
                                                            }`}
                                                        >
                                                            {slotLabel}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Slot Legend */}
                                <div className="flex items-center gap-5 pt-4 border-t border-border-subtle">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded bg-surface-cream border border-border-subtle" />
                                        <span className="font-label-sm text-label-sm text-secondary">
                                            Open
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded bg-amber-50 border border-amber-200" />
                                        <span className="font-label-sm text-label-sm text-secondary">
                                            Locked
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-3 h-3 rounded bg-charcoal-depth" />
                                        <span className="font-label-sm text-label-sm text-secondary">
                                            Booked
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="font-body-md text-body-md text-secondary py-4 text-center">
                                No upcoming slots generated yet. Add an availability block to get
                                started.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </DoctorLayout>
    );
}
