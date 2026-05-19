import { Head, Link } from '@inertiajs/react';

export default function Welcome({ auth, canLogin, canRegister, doctors }) {
    return (
        <>
            <Head title="MORE Clinic" />

            <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#ffffff_40%,_#f8fafc_100%)] text-slate-900">
                <div className="mx-auto flex max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8">
                    <header className="flex flex-col gap-4 border-b border-slate-200 pb-8 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">MORE Aesthetic and Wellness Centre</p>
                            <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Clinic operations and patient booking in one responsive MVP.</h1>
                            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
                                Patients can book and pay online, doctors can manage availability, and admins can monitor activity from a single Laravel and Inertia application.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                                    Open dashboard
                                </Link>
                            ) : (
                                <>
                                    {canLogin ? (
                                        <Link href={route('login')} className="rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white">
                                            Log in
                                        </Link>
                                    ) : null}
                                    {canRegister ? (
                                        <Link href={route('register')} className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800">
                                            Register as patient
                                        </Link>
                                    ) : null}
                                </>
                            )}
                        </div>
                    </header>

                    <main className="grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
                        <section className="space-y-8">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-sm text-slate-500">Patients</p>
                                    <p className="mt-2 text-2xl font-semibold">Book and pay</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-sm text-slate-500">Doctors</p>
                                    <p className="mt-2 text-2xl font-semibold">Set schedules</p>
                                </div>
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <p className="text-sm text-slate-500">Admins</p>
                                    <p className="mt-2 text-2xl font-semibold">Monitor revenue</p>
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                                <h2 className="text-2xl font-semibold tracking-tight">Core MVP flow</h2>
                                <div className="mt-6 grid gap-4 md:grid-cols-2">
                                    {[
                                        'Patient registration and login',
                                        'Role-based patient, doctor, and admin access',
                                        'Doctor availability with generated slots',
                                        'Booking lock, checkout, and payment callback confirmation',
                                        'Queued WhatsApp and email notifications',
                                        'Docker-based app, queue worker, Nginx, and PostgreSQL setup',
                                    ].map((item) => (
                                        <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">Clinic Team</p>
                                    <h2 className="mt-2 text-2xl font-semibold tracking-tight">Featured doctors</h2>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                {doctors.map((doctor) => (
                                    <div key={doctor.id} className="rounded-2xl border border-slate-200 p-5">
                                        <p className="font-medium text-slate-900">{doctor.name}</p>
                                        <p className="mt-1 text-sm text-amber-700">{doctor.specialization}</p>
                                        <p className="mt-3 text-sm text-slate-600">{doctor.bio}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}
