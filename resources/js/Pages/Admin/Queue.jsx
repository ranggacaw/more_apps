import { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminPageHeader } from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/format';

export default function Queue({ queue: initialQueue, doctors: initialDoctors }) {
    const [queue, setQueue] = useState(initialQueue);
    const [doctors, setDoctors] = useState(initialDoctors);
    const [selectedDoctors, setSelectedDoctors] = useState({});

    // Polling effect every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetch(route('admin.queue.api'))
                .then((res) => res.json())
                .then((data) => {
                    setQueue(data.queue);
                    setDoctors(data.doctors);
                })
                .catch((err) => console.error('Error polling queue data:', err));
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    // Sync state when Inertia props change
    useEffect(() => {
        setQueue(initialQueue);
        setDoctors(initialDoctors);
    }, [initialQueue, initialDoctors]);

    const { data, setData, post, processing, errors, reset } = useForm({
        patient_name: '',
        patient_phone: '',
        complaint_notes: '',
    });

    const submitAdd = (e) => {
        e.preventDefault();
        post(route('admin.queue.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleAssign = (entryId) => {
        const doctorId = selectedDoctors[entryId];
        if (!doctorId) return;

        router.patch(
            route('admin.queue.assign', entryId),
            { doctor_id: doctorId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSelectedDoctors((prev) => {
                        const next = { ...prev };
                        delete next[entryId];
                        return next;
                    });
                },
            }
        );
    };

    const handleCancel = (entryId) => {
        if (confirm('Are you sure you want to cancel this queue entry?')) {
            router.patch(route('admin.queue.cancel', entryId), {}, { preserveScroll: true });
        }
    };

    const handleDoctorSelectChange = (entryId, doctorId) => {
        setSelectedDoctors((prev) => ({
            ...prev,
            [entryId]: doctorId,
        }));
    };

    return (
        <AdminLayout>
            <Head title="Walk-In Queue" />
            <AdminPageHeader title="Walk-In Queue Management" subtitle="Manage waiting list patients, assign them to doctors, and monitor doctor availability in real-time." />

            <div className="grid gap-6 lg:grid-cols-4">
                {/* Main Queue Workspace (Left 3 columns) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Add Walk-In Form */}
                    <Card className="overflow-hidden border-slate-200 shadow-sm">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                            <CardTitle className="text-slate-900 text-lg font-bold">Add Walk-In Patient</CardTitle>
                            <CardDescription>Enter patient details to assign a queue number.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <form onSubmit={submitAdd} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">Patient Name *</label>
                                        <Input
                                            required
                                            placeholder="Jane Doe"
                                            value={data.patient_name}
                                            onChange={(e) => setData('patient_name', e.target.value)}
                                        />
                                        {errors.patient_name && (
                                            <p className="mt-1 text-xs text-rose-600">{errors.patient_name}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-semibold text-slate-700">WhatsApp / Phone Number</label>
                                        <Input
                                            placeholder="e.g. +628123456789"
                                            value={data.patient_phone}
                                            onChange={(e) => setData('patient_phone', e.target.value)}
                                        />
                                        {errors.patient_phone && (
                                            <p className="mt-1 text-xs text-rose-600">{errors.patient_phone}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">Complaint Notes / Reason for Visit</label>
                                    <Textarea
                                        placeholder="Brief details about the patient's symptoms or requests"
                                        className="min-h-[80px]"
                                        value={data.complaint_notes}
                                        onChange={(e) => setData('complaint_notes', e.target.value)}
                                    />
                                    {errors.complaint_notes && (
                                        <p className="mt-1 text-xs text-rose-600">{errors.complaint_notes}</p>
                                    )}
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing} className="px-5">
                                        {processing ? 'Adding...' : 'Add to Queue'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Waiting List Section */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-amber-50/20 border-b border-amber-100/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-900 text-lg font-bold flex items-center gap-2">
                                        Waiting Patients
                                        <Badge variant="warning" className="rounded-full px-2.5 py-0.5">
                                            {queue.waiting.length}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>Patients waiting to be assigned to a doctor.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {queue.waiting.length ? (
                                <div className="divide-y divide-slate-100">
                                    {queue.waiting.map((entry) => (
                                        <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-sm font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                                            {entry.queue_number}
                                                        </span>
                                                        <span className="font-semibold text-slate-900 text-base">
                                                            {entry.patient_name}
                                                        </span>
                                                    </div>
                                                    {entry.patient_phone && (
                                                        <p className="text-xs text-slate-500 font-medium">WhatsApp: {entry.patient_phone}</p>
                                                    )}
                                                    {entry.complaint_notes && (
                                                        <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 max-w-xl">
                                                            <span className="text-xs font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">Complaint</span>
                                                            {entry.complaint_notes}
                                                        </p>
                                                    )}
                                                    <p className="text-[11px] text-slate-400">
                                                        Queued: {formatDateTime(entry.queued_at)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 sm:self-center">
                                                    <select
                                                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-slate-500 focus:outline-none"
                                                        value={selectedDoctors[entry.id] || ''}
                                                        onChange={(e) => handleDoctorSelectChange(entry.id, e.target.value)}
                                                    >
                                                        <option value="">Select Doctor...</option>
                                                        {doctors.map((doctor) => (
                                                            <option key={doctor.id} value={doctor.id}>
                                                                {doctor.name} ({doctor.specialization}) {doctor.current_patient ? '· Busy' : '· Available'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <Button
                                                        size="sm"
                                                        disabled={!selectedDoctors[entry.id]}
                                                        onClick={() => handleAssign(entry.id)}
                                                        className="text-xs px-3 py-1.5"
                                                    >
                                                        Assign
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCancel(entry.id)}
                                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2"
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    No patients currently waiting.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Consultations Section */}
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="bg-emerald-50/20 border-b border-emerald-100/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-slate-900 text-lg font-bold flex items-center gap-2">
                                        Active Consultations
                                        <Badge variant="success" className="rounded-full px-2.5 py-0.5">
                                            {queue.assigned.length + queue.in_consultation.length}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription>Patients currently assigned or inside a consultation with a doctor.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {queue.assigned.length || queue.in_consultation.length ? (
                                <div className="divide-y divide-slate-100">
                                    {[...queue.assigned, ...queue.in_consultation].map((entry) => (
                                        <div key={entry.id} className="py-4 first:pt-0 last:pb-0">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                            {entry.queue_number}
                                                        </span>
                                                        <span className="font-semibold text-slate-900 text-base">
                                                            {entry.patient_name}
                                                        </span>
                                                        <Badge variant={entry.status === 'in_consultation' ? 'success' : 'warning'} className="text-xs uppercase px-2 py-0.5 font-bold">
                                                            {entry.status === 'in_consultation' ? 'In Consultation' : 'Assigned'}
                                                        </Badge>
                                                    </div>
                                                    {entry.patient_phone && (
                                                        <p className="text-xs text-slate-500 font-medium">WhatsApp: {entry.patient_phone}</p>
                                                    )}
                                                    <div className="text-sm text-slate-600 mt-1">
                                                        <span className="font-semibold text-slate-700">Doctor:</span> {entry.doctor_name}
                                                    </div>
                                                    {entry.complaint_notes && (
                                                        <p className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 max-w-xl">
                                                            <span className="text-xs font-semibold text-slate-400 block mb-0.5 uppercase tracking-wide">Complaint</span>
                                                            {entry.complaint_notes}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                                                        <span>Queued: {formatDateTime(entry.queued_at)}</span>
                                                        {entry.assigned_at && (
                                                            <span>Assigned: {formatDateTime(entry.assigned_at)}</span>
                                                        )}
                                                        {entry.consultation_started_at && (
                                                            <span>Started: {formatDateTime(entry.consultation_started_at)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 sm:self-center">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCancel(entry.id)}
                                                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5"
                                                    >
                                                        Cancel / Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 text-center py-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    No active consultations at the moment.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Doctor Availability Sidebar (Right 1 column) */}
                <div className="lg:col-span-1">
                    <Card className="border-slate-200 shadow-sm sticky top-6">
                        <CardHeader className="bg-slate-50 border-b border-slate-100">
                            <CardTitle className="text-slate-900 text-base font-bold">Doctor Availability</CardTitle>
                            <CardDescription>Live availability of active doctors.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {doctors.length ? (
                                <div className="space-y-4">
                                    {doctors.map((doctor) => (
                                        <div
                                            key={doctor.id}
                                            className={`rounded-2xl border p-4 ${
                                                doctor.current_patient
                                                    ? 'border-amber-100 bg-amber-50/10'
                                                    : 'border-emerald-100 bg-emerald-50/10'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-900 leading-tight">
                                                        {doctor.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                                                        {doctor.specialization}
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={doctor.current_patient ? (doctor.current_patient.status === 'in_consultation' ? 'success' : 'warning') : 'success'}
                                                    className="text-[10px] font-bold uppercase py-0.5 px-2 rounded-full"
                                                >
                                                    {doctor.current_patient
                                                        ? (doctor.current_patient.status === 'in_consultation' ? 'In Room' : 'Assigned')
                                                        : 'Available'}
                                                </Badge>
                                            </div>

                                            {doctor.current_patient && (
                                                <div className={`mt-3 rounded-xl p-3 border ${
                                                    doctor.current_patient.status === 'in_consultation'
                                                        ? 'bg-emerald-50/60 border-emerald-200/60'
                                                        : 'bg-amber-50/50 border-amber-100/50'
                                                }`}>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide block mb-1 ${
                                                        doctor.current_patient.status === 'in_consultation'
                                                            ? 'text-emerald-800'
                                                            : 'text-amber-800'
                                                    }`}>
                                                        {doctor.current_patient.status === 'in_consultation' ? 'In Consultation' : 'Current Walk-In Patient'}
                                                    </span>
                                                    <p className="font-bold text-xs text-slate-900">
                                                        {doctor.current_patient.patient_name}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.25 rounded border ${
                                                            doctor.current_patient.status === 'in_consultation'
                                                                ? 'text-emerald-600 bg-white border-emerald-200'
                                                                : 'text-slate-500 bg-white border-slate-200'
                                                        }`}>
                                                            {doctor.current_patient.queue_number}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                                            {doctor.current_patient.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                    No active doctors found.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
