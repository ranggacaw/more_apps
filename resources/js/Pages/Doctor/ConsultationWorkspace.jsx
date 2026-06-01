import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';

function dosageMissing(line) {
    return line && (line.dosage_value === null || line.dosage_value === undefined || String(line.dosage_value).trim() === '');
}

const slimmingFields = [
    ['slimming_weight_kg', 'Weight', 'kg'],
    ['slimming_bmi', 'BMI', ''],
    ['slimming_vfa', 'VFA', ''],
    ['slimming_body_fat_percentage', 'Body Fat %', '%'],
    ['slimming_body_age', 'Body Age', 'years'],
    ['slimming_muscle_mass', 'Muscle Mass', 'kg'],
    ['slimming_upper_arm_cm', 'Upper Arm', 'cm'],
    ['slimming_waist_cm', 'Waist', 'cm'],
    ['slimming_abdomen_cm', 'Abdomen', 'cm'],
    ['slimming_hip_cm', 'Hip', 'cm'],
    ['slimming_thigh_cm', 'Thigh', 'cm'],
    ['slimming_calf_cm', 'Calf', 'cm'],
    ['slimming_metabolism_bmr', 'Metabolism / BMR', ''],
    ['slimming_anti_oxidant', 'Anti-Oxidant', ''],
];

export default function ConsultationWorkspace({ doctor, booking, packages, packageOptions = [], aestheticPrograms = [], lastUsedPackageOptionId, backHref }) {
    const existingLineItems = booking.consultation?.line_items ?? [];
    const existingPackageLine = existingLineItems.find((item) => item.type === 'package_option');
    const existingAddonLine = existingLineItems.find((item) => item.type === 'package_addon');
    const initialPackageOptionId = existingPackageLine?.consultation_package_option_id ?? lastUsedPackageOptionId ?? '';
    const primaryPackageOptions = packageOptions.filter((option) => option.option_type === 'primary');
    const addonPackageOption = packageOptions.find((option) => option.option_type === 'addon');

    const { data, setData, post, processing, errors } = useForm({
        notes: booking.consultation?.notes ?? '',
        recommended_package_id: booking.consultation?.recommended_package_id ? String(booking.consultation.recommended_package_id) : '',
        ...Object.fromEntries(slimmingFields.map(([key]) => [key, booking.consultation?.[key] ?? ''])),
        meal_plan_summary: booking.consultation?.meal_plan_summary ?? '',
        package_option_id: initialPackageOptionId ? String(initialPackageOptionId) : '',
        diamond_oral_addon: Boolean(existingAddonLine),
        package_dosage_value: existingPackageLine?.dosage_value ?? '',
        package_dosage_unit: existingPackageLine?.dosage_unit ?? 'ml',
        package_notes: existingPackageLine?.notes ?? '',
        aesthetic_program_lines: existingLineItems.filter((item) => item.type === 'aesthetic_program').map((item) => ({
            aesthetic_program_id: item.aesthetic_program_id,
            quantity: item.quantity ?? 1,
            dosage_value: item.dosage_value ?? '',
            dosage_unit: item.dosage_unit ?? 'ml',
            notes: item.notes ?? '',
        })),
        manual_treatment_lines: existingLineItems.filter((item) => item.type === 'manual_treatment').map((item) => ({
            name: item.name,
            quantity: item.quantity ?? 1,
            unit_price: item.unit_price ?? 0,
            dosage_value: item.dosage_value ?? '',
            dosage_unit: item.dosage_unit ?? 'ml',
            notes: item.notes ?? '',
        })),
    });
    const [programSearch, setProgramSearch] = useState('');
    const [selectedProgramId, setSelectedProgramId] = useState(aestheticPrograms[0]?.id ? String(aestheticPrograms[0].id) : '');

    const linkForm = useForm({
        meeting_link: booking.meeting_link ?? '',
    });

    const submit = (event) => {
        event.preventDefault();

        const missingDosage = Boolean(data.package_option_id && dosageMissing({ dosage_value: data.package_dosage_value }))
            || data.aesthetic_program_lines.some(dosageMissing)
            || data.manual_treatment_lines.some(dosageMissing);

        if (missingDosage && !window.confirm('One or more treatment lines are missing dosage. Continue finalizing?')) {
            return;
        }

        post(route('doctor.bookings.complete', booking.id), {
            preserveScroll: true,
        });
    };

    const selectedPackageOption = packageOptions.find((option) => String(option.id) === String(data.package_option_id));
    const selectedRecommendedPackage = packages.find((pkg) => String(pkg.id) === String(data.recommended_package_id));
    const canSelectDiamondAddon = selectedPackageOption?.program_family === 'diamond';
    const filteredPrograms = aestheticPrograms.filter((program) => program.name.toLowerCase().includes(programSearch.toLowerCase()));
    const selectedProgram = aestheticPrograms.find((program) => String(program.id) === String(selectedProgramId));

    const updateProgramLine = (index, key, value) => {
        setData('aesthetic_program_lines', data.aesthetic_program_lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)));
    };

    const updateManualLine = (index, key, value) => {
        setData('manual_treatment_lines', data.manual_treatment_lines.map((line, lineIndex) => (lineIndex === index ? { ...line, [key]: value } : line)));
    };

    const totalTreatmentAmount = (selectedPackageOption?.price ?? 0)
        + (data.diamond_oral_addon && canSelectDiamondAddon ? (addonPackageOption?.price ?? 0) : 0)
        + data.aesthetic_program_lines.reduce((sum, line) => {
            const program = aestheticPrograms.find((item) => String(item.id) === String(line.aesthetic_program_id));
            return sum + ((program?.price ?? 0) * Number(line.quantity || 1));
        }, 0)
        + data.manual_treatment_lines.reduce((sum, line) => sum + (Number(line.unit_price || 0) * Number(line.quantity || 1)), 0);

    const submitLink = (event) => {
        event.preventDefault();
        linkForm.post(route('doctor.bookings.meeting-link', booking.id), {
            preserveScroll: true,
        });
    };

    return (
        <DoctorLayout doctor={doctor}>
            <Head title={`Consultation ${booking.patient.name}`} />

            <DoctorPageHeader
                title={`Consultation for ${booking.patient.name}`}
                subtitle="Review the intake context, complete the consultation, and keep unrelated dashboard content out of this workflow."
                actions={<Link href={backHref} className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Back to consultations</Link>}
            />

            {booking.needs_meeting_link ? (
                <Card className="mb-6 border-amber-200 bg-amber-50">
                    <CardHeader>
                        <CardTitle className="text-amber-800">Google Meet link required</CardTitle>
                        <CardDescription className="text-amber-700">This online admin-assisted consultation needs a Google Meet link before it can be completed. Add the link below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitLink} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <div className="flex-1">
                                <label className="mb-2 block text-sm font-medium text-slate-700">Google Meet URL</label>
                                <Input
                                    type="url"
                                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                                    value={linkForm.data.meeting_link}
                                    onChange={(event) => linkForm.setData('meeting_link', event.target.value)}
                                />
                                {linkForm.errors.meeting_link ? <p className="mt-1 text-sm text-rose-600">{linkForm.errors.meeting_link}</p> : null}
                            </div>
                            <Button className="bg-amber-700 text-white hover:bg-amber-800" disabled={linkForm.processing}>
                                {linkForm.processing ? 'Saving...' : 'Save link'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
                <div className="space-y-6">
                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Booking summary</CardTitle>
                            <CardDescription>{formatDateTime(booking.start_time)}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-slate-600">
                            <div>
                                <p className="font-medium text-slate-900">Patient</p>
                                <p className="mt-1">{booking.patient.name}</p>
                                {booking.patient.email ? <p className="mt-1">{booking.patient.email}</p> : null}
                                {booking.patient.phone ? <p className="mt-1">{booking.patient.phone}</p> : null}
                            </div>
                            {booking.is_guest ? (
                                <div>
                                    <p className="font-medium text-slate-900">Guest booking</p>
                                    <p className="mt-1 text-xs text-slate-500">No registered account · Admin-assisted</p>
                                </div>
                            ) : null}
                            {booking.is_admin_assisted ? (
                                <div>
                                    <p className="font-medium text-slate-900">Mode</p>
                                    <p className="mt-1 capitalize">{booking.consultation_mode}</p>
                                </div>
                            ) : null}
                            <div>
                                <p className="font-medium text-slate-900">Payment</p>
                                <p className="mt-1 capitalize">{booking.payment_status ?? 'unpaid'}</p>
                            </div>
                            {booking.meeting_link ? (
                                <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="inline-flex text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
                                    Open meeting link
                                </a>
                            ) : null}
                        </CardContent>
                    </Card>

                    <Card className="border-border-subtle bg-white">
                        <CardHeader>
                            <CardTitle>Pre-consultation intake</CardTitle>
                            <CardDescription>Use the submitted patient context before you complete the consultation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-slate-600">
                            <div>
                                <p className="font-medium text-slate-900">Patient notes</p>
                                <div className="mt-2 rounded-2xl bg-slate-50 p-4">
                                    <p className="whitespace-pre-wrap">{booking.intake?.notes ?? 'No intake context was provided.'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="font-medium text-slate-900">Uploaded document</p>
                                {booking.intake?.patient_upload_name ? (
                                    booking.intake?.patient_upload_url ? (
                                        <a href={booking.intake.patient_upload_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-medium text-clinical-gold underline underline-offset-4 hover:text-clinical-gold-light">
                                            {booking.intake.patient_upload_name}
                                        </a>
                                    ) : (
                                        <p className="mt-2">{booking.intake.patient_upload_name}</p>
                                    )
                                ) : (
                                    <p className="mt-2">No document uploaded.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-border-subtle bg-white">
                    <CardHeader>
                        <CardTitle>Complete consultation</CardTitle>
                        <CardDescription>Capture notes or Slimming Monitoring Form metrics, then select any package that should become an admin invoice.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Consultation notes</label>
                                <Textarea value={data.notes} onChange={(event) => setData('notes', event.target.value)} placeholder="Document the key outcomes, next steps, and care guidance for non-slimming consultations." />
                                {errors.notes ? <p className="mt-2 text-sm text-rose-600">{errors.notes}</p> : null}
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Slimming Monitoring Form</p>
                                    <p className="mt-1 text-xs text-slate-500">Use these measurements for Slimming Program consultations. Notes are optional when metrics are recorded.</p>
                                </div>
                                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {slimmingFields.map(([key, label, unit]) => (
                                        <div key={key}>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
                                            <Input type="number" min="0" step="0.01" value={data[key]} onChange={(event) => setData(key, event.target.value)} placeholder={unit} />
                                            {errors[key] ? <p className="mt-1 text-sm text-rose-600">{errors[key]}</p> : null}
                                        </div>
                                    ))}
                                </div>
                            </div>

                             <div>
                                  <label className="mb-2 block text-sm font-medium text-slate-700">Package invoice for admin</label>
                                 <select className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm text-on-background" value={data.recommended_package_id} onChange={(event) => setData('recommended_package_id', event.target.value)}>
                                     <option value="">No package invoice</option>
                                     {packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} · {formatCurrency(pkg.price)} · {pkg.consultation_credits} credits</option>)}
                                 </select>
                                 {errors.recommended_package_id ? <p className="mt-2 text-sm text-rose-600">{errors.recommended_package_id}</p> : null}
                             </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Consultation-room slimming option</p>
                                    <p className="mt-1 text-xs text-slate-500">Selected options are snapshotted for billing handoff and do not activate package entitlements.</p>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Primary option</label>
                                    <select className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm text-on-background" value={data.package_option_id} onChange={(event) => {
                                        const option = packageOptions.find((item) => String(item.id) === event.target.value);
                                        setData({ ...data, package_option_id: event.target.value, diamond_oral_addon: option?.program_family === 'diamond' ? data.diamond_oral_addon : false });
                                    }}>
                                        <option value="">No slimming option</option>
                                        {primaryPackageOptions.map((option) => <option key={option.id} value={option.id}>{option.name} · {formatCurrency(option.price)} · {option.injection_frequency ?? 'no frequency'} · {option.duration_label ?? 'no duration'}</option>)}
                                    </select>
                                    {errors.package_option_id ? <p className="mt-2 text-sm text-rose-600">{errors.package_option_id}</p> : null}
                                </div>
                                {data.package_option_id ? (
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Dosage</label>
                                            <Input type="number" min="0" step="0.01" value={data.package_dosage_value} onChange={(event) => setData('package_dosage_value', event.target.value)} />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Unit</label>
                                            <Input value={data.package_dosage_unit} onChange={(event) => setData('package_dosage_unit', event.target.value)} placeholder="ml" />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                                            <Input value={data.package_notes} onChange={(event) => setData('package_notes', event.target.value)} />
                                        </div>
                                    </div>
                                ) : null}
                                <label className={`flex items-center gap-2 text-sm ${canSelectDiamondAddon ? 'text-slate-700' : 'text-slate-400'}`}>
                                    <input type="checkbox" disabled={!canSelectDiamondAddon} checked={Boolean(data.diamond_oral_addon && canSelectDiamondAddon)} onChange={(event) => setData('diamond_oral_addon', event.target.checked)} />
                                    Add Diamond oral medication {addonPackageOption ? `(${formatCurrency(addonPackageOption.price)} / ${addonPackageOption.duration_label})` : ''}
                                </label>
                                {errors.diamond_oral_addon ? <p className="text-sm text-rose-600">{errors.diamond_oral_addon}</p> : null}
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">Aesthetic program treatments</p>
                                    <p className="mt-1 text-xs text-slate-500">Doctor search returns active program names and selling prices only.</p>
                                </div>
                                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
                                        <Input value={programSearch} onChange={(event) => setProgramSearch(event.target.value)} placeholder="Search active programs" />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Program</label>
                                        <select className="w-full rounded-md border border-border-subtle px-3 py-2 text-sm" value={selectedProgramId} onChange={(event) => setSelectedProgramId(event.target.value)}>
                                            {filteredPrograms.map((program) => <option key={program.id} value={program.id}>{program.name} · {formatCurrency(program.price)}</option>)}
                                        </select>
                                    </div>
                                    <Button type="button" variant="outline" disabled={!selectedProgram} onClick={() => selectedProgram && setData('aesthetic_program_lines', [...data.aesthetic_program_lines, { aesthetic_program_id: selectedProgram.id, quantity: 1, dosage_value: '', dosage_unit: 'ml', notes: '' }])}>Add program</Button>
                                </div>
                                {data.aesthetic_program_lines.map((line, index) => {
                                    const program = aestheticPrograms.find((item) => String(item.id) === String(line.aesthetic_program_id));
                                    return (
                                        <div key={`${line.aesthetic_program_id}-${index}`} className="rounded-xl border border-slate-200 p-3">
                                            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <p className="text-sm font-medium text-slate-900">{program?.name ?? 'Program'} · {formatCurrency((program?.price ?? 0) * Number(line.quantity || 1))}</p>
                                                <Button type="button" variant="outline" onClick={() => setData('aesthetic_program_lines', data.aesthetic_program_lines.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
                                            </div>
                                            <div className="grid gap-3 md:grid-cols-4">
                                                <Input type="number" min="1" value={line.quantity} onChange={(event) => updateProgramLine(index, 'quantity', event.target.value)} placeholder="Qty" />
                                                <Input type="number" min="0" step="0.01" value={line.dosage_value} onChange={(event) => updateProgramLine(index, 'dosage_value', event.target.value)} placeholder="Dosage" />
                                                <Input value={line.dosage_unit} onChange={(event) => updateProgramLine(index, 'dosage_unit', event.target.value)} placeholder="ml" />
                                                <Input value={line.notes} onChange={(event) => updateProgramLine(index, 'notes', event.target.value)} placeholder="Notes" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">Manual treatment lines</p>
                                        <p className="mt-1 text-xs text-slate-500">Use for doctor-only treatment details not covered by master data.</p>
                                    </div>
                                    <Button type="button" variant="outline" onClick={() => setData('manual_treatment_lines', [...data.manual_treatment_lines, { name: '', quantity: 1, unit_price: 0, dosage_value: '', dosage_unit: 'ml', notes: '' }])}>Add treatment</Button>
                                </div>
                                {data.manual_treatment_lines.map((line, index) => (
                                    <div key={index} className="rounded-xl border border-slate-200 p-3">
                                        <div className="mb-3 flex justify-between gap-3">
                                            <p className="text-sm font-medium text-slate-900">Manual line · {formatCurrency(Number(line.unit_price || 0) * Number(line.quantity || 1))}</p>
                                            <Button type="button" variant="outline" onClick={() => setData('manual_treatment_lines', data.manual_treatment_lines.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
                                        </div>
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <Input value={line.name} onChange={(event) => updateManualLine(index, 'name', event.target.value)} placeholder="Treatment name" />
                                            <Input type="number" min="1" value={line.quantity} onChange={(event) => updateManualLine(index, 'quantity', event.target.value)} placeholder="Qty" />
                                            <Input type="number" min="0" value={line.unit_price} onChange={(event) => updateManualLine(index, 'unit_price', event.target.value)} placeholder="Unit price" />
                                            <Input type="number" min="0" step="0.01" value={line.dosage_value} onChange={(event) => updateManualLine(index, 'dosage_value', event.target.value)} placeholder="Dosage" />
                                            <Input value={line.dosage_unit} onChange={(event) => updateManualLine(index, 'dosage_unit', event.target.value)} placeholder="ml" />
                                            <Input value={line.notes} onChange={(event) => updateManualLine(index, 'notes', event.target.value)} placeholder="Notes" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                             <div>
                                 <label className="mb-2 block text-sm font-medium text-slate-700">Meal plan summary</label>
                                 <Textarea value={data.meal_plan_summary} onChange={(event) => setData('meal_plan_summary', event.target.value)} placeholder="Optional meal plan summary for the patient PDF." />
                                 {errors.meal_plan_summary ? <p className="mt-2 text-sm text-rose-600">{errors.meal_plan_summary}</p> : null}
                             </div>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                Treatment handoff total: <span className="font-semibold">{formatCurrency(totalTreatmentAmount)}</span>
                                {selectedRecommendedPackage ? <span className="block mt-1">Package invoice: <span className="font-semibold">{selectedRecommendedPackage.name} · {formatCurrency(selectedRecommendedPackage.price)}</span></span> : null}
                            </div>

                            {booking.needs_meeting_link ? (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                    Add a Google Meet link above before completing this consultation.
                                </div>
                            ) : null}

                            <Button className="w-full bg-clinical-gold text-white hover:opacity-90" disabled={processing || !booking.can_complete}>
                                {processing ? 'Saving consultation...' : 'Complete consultation'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </DoctorLayout>
    );
}
