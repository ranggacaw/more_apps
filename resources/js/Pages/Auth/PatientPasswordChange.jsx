import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function PatientPasswordChange() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (event) => {
        event.preventDefault();
        put(route('patient.password.update'), {
            onFinish: () => reset('current_password', 'password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Change Password" />
            <div className="mb-8 text-center">
                <h1 className="font-headline text-[32px] leading-tight text-on-background">Set Your Password</h1>
                <p className="mt-2 text-secondary">Change your temporary password before opening the patient portal.</p>
            </div>
            <form onSubmit={submit} className="space-y-4 rounded-lg border border-border-subtle bg-white p-6 shadow-sm">
                <div>
                    <InputLabel htmlFor="current_password" value="Temporary password" />
                    <TextInput id="current_password" type="password" value={data.current_password} className="mt-1 block w-full" onChange={(event) => setData('current_password', event.target.value)} />
                    <InputError message={errors.current_password} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="password" value="New password" />
                    <TextInput id="password" type="password" value={data.password} className="mt-1 block w-full" onChange={(event) => setData('password', event.target.value)} />
                    <InputError message={errors.password} className="mt-2" />
                </div>
                <div>
                    <InputLabel htmlFor="password_confirmation" value="Confirm new password" />
                    <TextInput id="password_confirmation" type="password" value={data.password_confirmation} className="mt-1 block w-full" onChange={(event) => setData('password_confirmation', event.target.value)} />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>
                <PrimaryButton className="w-full" disabled={processing}>{processing ? 'Updating...' : 'Continue to portal'}</PrimaryButton>
            </form>
        </GuestLayout>
    );
}
