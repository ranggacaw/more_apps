import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const resendForm = useForm({});

    const resend = (e) => {
        e.preventDefault();

        resendForm.post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div className="text-center mb-8">
                <h1 className="font-headline text-[32px] leading-tight text-on-background mb-2">
                    Verify Your Email
                </h1>
                <p className="text-secondary text-base">
                    Click the verification link we sent to your email.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address
                    for your staff account.
                </div>
            )}

            <div className="bg-white p-6 rounded-lg border border-border-subtle shadow-sm glass-panel">
                <form onSubmit={resend} className="space-y-4">
                    <InputError message={resendForm.errors.email} />
                    <div className="pt-2">
                        <PrimaryButton className="w-full" disabled={resendForm.processing}>
                            Resend Verification Email
                        </PrimaryButton>
                    </div>

                    <div className="flex justify-center pt-2">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="text-sm text-secondary hover:text-on-background hover:underline"
                        >
                            Log Out
                        </Link>
                    </div>
                </form>
            </div>
        </GuestLayout>
    );
}
