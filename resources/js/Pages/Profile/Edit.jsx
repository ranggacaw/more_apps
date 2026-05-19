import AppLayout from '@/Layouts/AppLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status, role }) {
    return (
        <AppLayout title="Profile" description="Keep your patient contact details accurate so reminders and confirmations reach the right person.">
            <Head title="Profile" />

            <div className="space-y-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            role={role}
                            className="max-w-xl"
                        />
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-8">
                    <UpdatePasswordForm className="max-w-xl" />
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-8">
                    <DeleteUserForm className="max-w-xl" />
                </div>
            </div>
        </AppLayout>
    );
}
