import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({
    status,
    verificationChannel,
    phone,
    otpDeliveryMode,
    otpDebugCode,
    otpDebugEnabled,
}) {
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

            <div className="text-center mb-8">
                <h1 className="font-headline text-[32px] leading-tight text-on-background mb-2">
                    Verify Your Account
                </h1>
                <p className="text-secondary text-base">
                    {isOtpFlow
                        ? `Enter the 6-digit code sent to ${phone ?? 'your WhatsApp number'}.`
                        : 'Click the verification link we sent to your email.'}
                </p>
            </div>

            {isOtpFlow && otpDebugEnabled && (
                <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    This environment logs WhatsApp OTP messages instead of
                    sending them to a real inbox.
                </div>
            )}

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            {status === 'otp-sent' && isOtpFlow && otpDeliveryMode === 'logged' && (
                <div className="mb-4 text-sm font-medium text-amber-700">
                    No real WhatsApp message was sent in this environment.
                    {otpDebugCode
                        ? ` Use code ${otpDebugCode} to continue.`
                        : ' Check the application log for the latest code.'}
                </div>
            )}

            {status === 'otp-sent' && isOtpFlow && otpDeliveryMode !== 'logged' && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    A fresh verification code has been queued for WhatsApp
                    delivery.
                </div>
            )}

            <div className="bg-white p-6 rounded-lg border border-border-subtle shadow-sm glass-panel">
                {isOtpFlow ? (
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-1">
                            <InputLabel
                                htmlFor="otp"
                                value="Verification Code"
                            />

                            <TextInput
                                id="otp"
                                name="otp"
                                value={otpForm.data.otp}
                                className="mt-1 block w-full"
                                autoComplete="one-time-code"
                                inputMode="numeric"
                                isFocused={true}
                                onChange={(e) =>
                                    otpForm.setData('otp', e.target.value)
                                }
                                required
                            />

                            <InputError
                                message={otpForm.errors.otp}
                                className="mt-2"
                            />
                        </div>

                        <div className="pt-2">
                            <PrimaryButton
                                className="w-full"
                                disabled={otpForm.processing}
                            >
                                Verify Code
                            </PrimaryButton>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={resend}
                                className="text-sm text-clinical-gold font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={resendForm.processing}
                            >
                                Send a new code
                            </button>

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
                ) : (
                    <form onSubmit={resend} className="space-y-4">
                        <div className="pt-2">
                            <PrimaryButton
                                className="w-full"
                                disabled={resendForm.processing}
                            >
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
                )}
            </div>
        </GuestLayout>
    );
}
