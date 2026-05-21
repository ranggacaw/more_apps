import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div className="text-center mb-8">
                <h1 className="font-headline text-[32px] leading-tight text-on-background mb-2">
                    Reset Password
                </h1>
                <p className="text-secondary text-base">
                    Enter your email and we&apos;ll send you a password reset
                    link.
                </p>
            </div>

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg border border-border-subtle shadow-sm glass-panel">
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1">
                        <InputLabel htmlFor="email" value="Email" />

                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            isFocused={true}
                            onChange={(e) =>
                                setData('email', e.target.value)
                            }
                        />

                        <InputError
                            message={errors.email}
                            className="mt-2"
                        />
                    </div>

                    <div className="pt-2">
                        <PrimaryButton
                            className="w-full"
                            disabled={processing}
                        >
                            Send Reset Link
                        </PrimaryButton>
                    </div>
                </form>

                <div className="mt-4 pt-4 border-t border-border-subtle text-center">
                    <p className="text-sm text-secondary">
                        Remember your password?{' '}
                        <Link
                            href={route('login')}
                            className="text-clinical-gold font-semibold hover:underline"
                        >
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </GuestLayout>
    );
}
