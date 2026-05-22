import AppLayout from '@/Layouts/AppLayout';
import PatientLayout from '@/Layouts/PatientLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

const roleLabels = {
    patient: 'Patient',
    doctor: 'Doctor',
    admin: 'Admin',
};

function AccountOverviewCard({ role, verified }) {
    const roleLabel = roleLabels[role] ?? 'User';

    return (
        <div className="rounded-2xl border border-border-subtle bg-surface-cream p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-clinical-gold">
                Account at a glance
            </p>

            <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-3 rounded-xl bg-white px-4 py-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-secondary">
                            Role
                        </p>
                        <p className="mt-1 text-sm font-medium text-on-background">
                            {roleLabel}
                        </p>
                    </div>
                    <span className="rounded-full bg-clinical-gold/10 px-2.5 py-1 text-xs font-medium text-clinical-gold">
                        Active
                    </span>
                </div>

                <div className="flex items-start justify-between gap-3 rounded-xl bg-white px-4 py-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-secondary">
                            Verification
                        </p>
                        <p className="mt-1 text-sm font-medium text-on-background">
                            {verified ? 'Verified' : role === 'patient' ? 'WhatsApp confirmation pending' : 'Email verification pending'}
                        </p>
                    </div>
                    <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            verified
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                        }`}
                    >
                        {verified ? 'Ready' : 'Needs action'}
                    </span>
                </div>
            </div>
        </div>
    );
}

function VerificationBanner({ role, status }) {
    const message =
        role === 'patient'
            ? 'Verify WhatsApp to unlock reminders and booking access.'
            : 'Verify your email address so account recovery and security notices reach you.';

    const actionText =
        role === 'patient'
            ? 'Send new WhatsApp code'
            : 'Re-send verification email';

    const successText =
        status === 'otp-sent'
            ? 'A new verification code has been sent to your WhatsApp number.'
            : status === 'verification-link-sent'
              ? 'A new verification link has been sent to your email address.'
              : null;

    return (
        <section className="mt-6 rounded-[28px] border border-amber-200 bg-amber-50/80 px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700 shadow-sm">
                        <span className="material-symbols-outlined">mark_chat_unread</span>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-on-background">
                            Verification required
                        </p>
                        <p className="mt-1 text-sm leading-6 text-secondary">
                            {message}
                        </p>
                        {successText ? (
                            <p className="mt-2 text-sm font-medium text-emerald-700">
                                {successText}
                            </p>
                        ) : null}
                    </div>
                </div>

                <Link
                    href={route('verification.send')}
                    method="post"
                    as="button"
                    className="rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100"
                >
                    {actionText}
                </Link>
            </div>
        </section>
    );
}

function ProfileSettingsContent({ mustVerifyEmail, status, role, showHero }) {
    const user = usePage().props.auth.user;
    const verified = user?.email_verified_at !== null;

    return (
        <div className="mx-auto max-w-full">
            {showHero ? (
                <section className="rounded-[28px] border border-clinical-gold/20 bg-white px-5 py-6 soft-lift sm:px-7 sm:py-7 lg:px-8">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-clinical-gold">
                                Account settings
                            </p>
                            <h1 className="mt-3 font-headline text-3xl leading-tight text-on-background sm:text-4xl">
                                A calmer settings flow for profile, security, and verification.
                            </h1>
                            <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary sm:text-base">
                                Keep contact details current, update patient-specific information, and handle security without mixing routine edits with destructive actions.
                            </p>
                        </div>

                        <AccountOverviewCard role={role} verified={verified} />
                    </div>
                </section>
            ) : null}

            {mustVerifyEmail && !verified ? (
                <VerificationBanner role={role} status={status} />
            ) : null}

            <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px] xl:items-start">
                <div className="space-y-6">
                    <section className="overflow-hidden rounded-[30px] border border-border-subtle bg-white soft-lift">
                        <div className="border-b border-border-subtle bg-gradient-to-r from-clinical-gold/10 to-transparent px-5 py-5 sm:px-7">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clinical-gold/10 text-clinical-gold">
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold tracking-tight text-on-background">
                                            Profile information
                                        </h2>
                                        <p className="mt-1 max-w-2xl text-sm leading-6 text-secondary">
                                            Contact details and account information used for reminders, confirmations, and your clinic record.
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-full bg-surface-cream px-3 py-1 text-xs font-medium text-secondary">
                                    Primary section
                                </div>
                            </div>
                        </div>

                        <div className="px-5 py-6 sm:px-7 sm:py-7">
                            <UpdateProfileInformationForm role={role} />
                        </div>
                    </section>
                </div>

                <div className="space-y-6 xl:sticky xl:top-28">
                    {!showHero ? (
                        <AccountOverviewCard role={role} verified={verified} />
                    ) : null}

                    <section className="rounded-[28px] border border-border-subtle bg-white p-5 soft-lift sm:p-6">
                        <div className="border-b border-border-subtle pb-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-clinical-gold">
                                Security
                            </p>
                            <h2 className="mt-2 text-lg font-semibold tracking-tight text-on-background">
                                Update password
                            </h2>
                            <p className="mt-2 text-sm leading-6 text-secondary">
                                Keep security close by without interrupting the main profile editing flow.
                            </p>
                        </div>

                        <div className="mt-5">
                            <UpdatePasswordForm />
                        </div>
                    </section>
                </div>
            </section>

            <section className="mt-6 rounded-[30px] border border-rose-200 bg-white px-5 py-5 soft-lift sm:px-7 sm:py-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-2xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-600">
                            Danger zone
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-on-background">
                            Delete account only after routine updates are complete.
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-secondary">
                            This action permanently removes your account and clinic access, so it stays isolated from normal save actions.
                        </p>
                    </div>

                    <div className="w-full lg:max-w-xs">
                        <DeleteUserForm />
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function Edit({ mustVerifyEmail, status, role }) {
    const isPatient = role === 'patient';
    const content = (
        <ProfileSettingsContent
            mustVerifyEmail={mustVerifyEmail}
            status={status}
            role={role}
            showHero={isPatient}
        />
    );

    return (
        <>
            <Head title={isPatient ? 'Settings' : 'Profile Settings'} />

            {isPatient ? (
                <PatientLayout>{content}</PatientLayout>
            ) : (
                <AppLayout
                    title="Profile Settings"
                    description="Keep your account, contact details, and security settings current so clinic communication and operational access stay accurate."
                >
                    {content}
                </AppLayout>
            )}
        </>
    );
}
