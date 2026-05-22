import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { useForm, usePage } from '@inertiajs/react';

const inputClassName =
    'rounded-2xl border-border-subtle bg-surface-cream px-4 py-3 text-sm text-on-background focus:border-clinical-gold';

export default function UpdateProfileInformation({ role, doctorProfile, className = '' }) {
    const user = usePage().props.auth.user;

    const {
        data,
        setData,
        patch,
        errors,
        processing,
        recentlySuccessful,
        reset,
        clearErrors,
    } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        date_of_birth: user.date_of_birth ?? '',
        address: user.address ?? '',
        medical_notes: user.medical_notes ?? '',
        avatar: null,
    });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const resetForm = () => {
        reset();
        clearErrors();
    };

    return (
        <div className={className}>
            <form onSubmit={submit} className="space-y-8">
                <div>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">
                            Contact details
                        </h3>
                        <p className="text-xs text-secondary">
                            Used for reminders and confirmations
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <InputLabel htmlFor="name" value="Full name" />
                            <TextInput
                                id="name"
                                className={`mt-2 block w-full ${inputClassName}`}
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                isFocused
                                autoComplete="name"
                            />
                            <InputError className="mt-2" message={errors.name} />
                        </div>

                        <div>
                            <InputLabel htmlFor="email" value="Email address" />
                            <TextInput
                                id="email"
                                type="email"
                                className={`mt-2 block w-full ${inputClassName}`}
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                autoComplete="username"
                            />
                            <InputError className="mt-2" message={errors.email} />
                        </div>

                        <div>
                            <InputLabel htmlFor="phone" value="WhatsApp number" />
                            <TextInput
                                id="phone"
                                type="text"
                                className={`mt-2 block w-full ${inputClassName}`}
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                required
                                autoComplete="tel"
                            />
                            <InputError className="mt-2" message={errors.phone} />
                        </div>

                        {role === 'patient' ? (
                            <div>
                                <InputLabel
                                    htmlFor="date_of_birth"
                                    value="Date of birth"
                                />
                                <TextInput
                                    id="date_of_birth"
                                    type="date"
                                    className={`mt-2 block w-full ${inputClassName}`}
                                    value={data.date_of_birth ?? ''}
                                    onChange={(e) =>
                                        setData('date_of_birth', e.target.value)
                                    }
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.date_of_birth}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>

                {role === 'patient' ? (
                    <div className="rounded-[24px] border border-border-subtle bg-surface-cream/70 p-4 sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">
                                Patient details
                            </h3>
                            <p className="text-xs text-secondary">
                                Shown only for patients
                            </p>
                        </div>

                        <div className="grid gap-4">
                            <div>
                                <InputLabel htmlFor="address" value="Address" />
                                <TextInput
                                    id="address"
                                    type="text"
                                    className={`mt-2 block w-full ${inputClassName} bg-white`}
                                    value={data.address}
                                    onChange={(e) =>
                                        setData('address', e.target.value)
                                    }
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.address}
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="medical_notes"
                                    value="Medical notes"
                                />
                                <textarea
                                    id="medical_notes"
                                    className="form-glow mt-2 block w-full rounded-2xl border border-border-subtle bg-white px-4 py-3 text-sm leading-6 text-on-background outline-none transition-all duration-300 focus:border-clinical-gold"
                                    value={data.medical_notes}
                                    onChange={(e) =>
                                        setData('medical_notes', e.target.value)
                                    }
                                    rows={5}
                                />
                                <InputError
                                    className="mt-2"
                                    message={errors.medical_notes}
                                />
                            </div>
                        </div>
                    </div>
                ) : null}

                {role === 'doctor' ? (
                    <div className="rounded-[24px] border border-border-subtle bg-surface-cream/70 p-4 sm:p-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">
                                Doctor profile photo
                            </h3>
                            <p className="text-xs text-secondary">
                                Used on patient-facing doctor cards
                            </p>
                        </div>

                        {doctorProfile?.avatar_url ? (
                            <div className="mb-4 h-28 w-28 overflow-hidden rounded-3xl border border-border-subtle bg-white shadow-sm">
                                <img src={doctorProfile.avatar_url} alt={`${user.name} profile`} className="h-full w-full object-cover" />
                            </div>
                        ) : (
                            <p className="mb-4 text-sm text-secondary">
                                Upload your photo to publish your doctor profile to patients.
                            </p>
                        )}

                        <div>
                            <InputLabel htmlFor="avatar" value="Profile photo" />
                            <input
                                id="avatar"
                                type="file"
                                accept="image/*"
                                onChange={(e) => setData('avatar', e.target.files?.[0] ?? null)}
                                className="mt-2 block w-full rounded-2xl border border-border-subtle bg-white px-4 py-3 text-sm text-on-background file:mr-4 file:rounded-xl file:border-0 file:bg-clinical-gold/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-clinical-gold"
                            />
                            <InputError className="mt-2" message={errors.avatar} />
                        </div>
                    </div>
                ) : null}

                <div className="flex flex-col gap-3 border-t border-border-subtle pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-sm leading-6 text-secondary">
                        Save profile changes after reviewing contact details used for clinic communication.
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-surface-cream"
                        >
                            Reset
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-clinical-gold px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-clinical-gold-light focus:outline-none focus:ring-2 focus:ring-clinical-gold focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Saving...' : 'Save profile'}
                        </button>

                        <Transition
                            show={recentlySuccessful}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm font-medium text-emerald-700">
                                Saved.
                            </p>
                        </Transition>
                    </div>
                </div>
            </form>
        </div>
    );
}
