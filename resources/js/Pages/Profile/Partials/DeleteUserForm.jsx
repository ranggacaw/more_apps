import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import Modal from '@/Components/Modal';
import TextInput from '@/Components/TextInput';
import { useForm } from '@inertiajs/react';
import { useRef, useState } from 'react';

export default function DeleteUserForm({ className = '' }) {
    const [confirmingUserDeletion, setConfirmingUserDeletion] = useState(false);
    const passwordInput = useRef();

    const {
        data,
        setData,
        delete: destroy,
        processing,
        reset,
        errors,
        clearErrors,
    } = useForm({
        password: '',
    });

    const confirmUserDeletion = () => {
        setConfirmingUserDeletion(true);
    };

    const deleteUser = (e) => {
        e.preventDefault();

        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        });
    };

    const closeModal = () => {
        setConfirmingUserDeletion(false);

        clearErrors();
        reset();
    };

    return (
        <div className={className}>
            <button
                type="button"
                onClick={confirmUserDeletion}
                className="w-full rounded-xl border border-rose-300 px-4 py-3 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2"
            >
                Delete account
            </button>

            <Modal show={confirmingUserDeletion} onClose={closeModal} maxWidth="lg">
                <form onSubmit={deleteUser} className="p-6 sm:p-7">
                    <div className="border-b border-border-subtle pb-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-600">
                            Confirm deletion
                        </p>
                        <h2 className="mt-2 text-xl font-semibold tracking-tight text-on-background">
                            Are you sure you want to delete your account?
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-secondary">
                            This permanently removes your account and related access. Enter your password to confirm that you want to continue.
                        </p>
                    </div>

                    <div className="mt-6">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            className="mt-2 block w-full rounded-2xl border-border-subtle bg-surface-cream px-4 py-3 text-sm text-on-background focus:border-clinical-gold"
                            isFocused
                            placeholder="Enter your password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={closeModal}
                            className="rounded-xl border border-border-subtle px-4 py-2.5 text-sm font-medium text-secondary transition-colors hover:bg-surface-cream"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Deleting...' : 'Delete account'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
