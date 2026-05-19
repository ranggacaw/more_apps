import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status, verificationChannel, phone }) {
    const otpForm = useForm({ otp: '' });
    const resendForm = useForm({});

    const submit = (e) => {
        e.preventDefault();

        otpForm.post(route('verification.otp.verify'), {
            onFinish: () => otpForm.reset('otp'),
        });
    };

    const resend = (e) => {
        e.preventDefault();

        resendForm.post(route('verification.send'));
    };

    const isOtpFlow = verificationChannel === 'otp';

    return (
        <GuestLayout>
            <Head title="Account Verification" />

            <div className="mb-4 text-sm text-gray-600">
                {isOtpFlow
                    ? `Enter the 6-digit verification code sent to ${phone ?? 'your WhatsApp number'}.`
                    : "Thanks for signing up! Before getting started, please verify your email address by clicking the link we just emailed to you."}
            </div>

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            {status === 'otp-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    A fresh verification code has been sent to your WhatsApp
                    number.
                </div>
            )}

            {isOtpFlow ? (
                <form onSubmit={submit}>
                    <div>
                        <InputLabel htmlFor="otp" value="Verification Code" />

                        <TextInput
                            id="otp"
                            name="otp"
                            value={otpForm.data.otp}
                            className="mt-1 block w-full"
                            autoComplete="one-time-code"
                            inputMode="numeric"
                            isFocused={true}
                            onChange={(e) => otpForm.setData('otp', e.target.value)}
                            required
                        />

                        <InputError
                            message={otpForm.errors.otp}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <PrimaryButton disabled={otpForm.processing}>
                                Verify Code
                            </PrimaryButton>

                            <button
                                type="button"
                                onClick={resend}
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                disabled={resendForm.processing}
                            >
                                Send a new code
                            </button>
                        </div>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Log Out
                        </Link>
                    </div>
                </form>
            ) : (
                <form onSubmit={resend}>
                    <div className="mt-4 flex items-center justify-between">
                        <PrimaryButton disabled={resendForm.processing}>
                            Resend Verification Email
                        </PrimaryButton>

                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Log Out
                        </Link>
                    </div>
                </form>
            )}
        </GuestLayout>
    );
}
