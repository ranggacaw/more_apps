import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminDataTable from '@/Components/AdminDataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatCurrency } from '@/lib/format';
import { Head, router, useForm } from '@inertiajs/react';

const roleVariants = {
    doctor: 'success',
    admin: 'warning',
    super_admin: 'warning',
};

function DoctorFields({ data, setData }) {
    return (
        <div className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Specialization</label>
                    <Input value={data.specialization} onChange={(event) => setData('specialization', event.target.value)} />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Consultation fee</label>
                    <Input type="number" min="0" value={data.consultation_fee} onChange={(event) => setData('consultation_fee', Number(event.target.value))} />
                </div>
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Bio</label>
                <Textarea className="min-h-20" value={data.bio} onChange={(event) => setData('bio', event.target.value)} />
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Avatar URL</label>
                <Input value={data.avatar_url} onChange={(event) => setData('avatar_url', event.target.value)} />
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={data.doctor_is_active} onChange={(event) => setData('doctor_is_active', event.target.checked)} />
                Keep this doctor visible to the operational scheduling flow
            </label>
        </div>
    );
}

function UserEditorExpanded({ user, roles }) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: '',
        password_confirmation: '',
        role: user.role,
        is_verified: user.is_verified,
        date_of_birth: user.date_of_birth ?? '',
        address: user.address ?? '',
        medical_notes: user.medical_notes ?? '',
        specialization: user.doctor_profile?.specialization ?? '',
        bio: user.doctor_profile?.bio ?? '',
        avatar_url: user.doctor_profile?.avatar_url ?? '',
        consultation_fee: user.doctor_profile?.consultation_fee ?? 500000,
        doctor_is_active: user.doctor_profile?.is_active ?? true,
    });

    const submit = (event) => {
        event.preventDefault();
        patch(route('admin.users.update', user.id));
    };

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                    <p className="text-slate-500">Bookings</p>
                    <p className="mt-1 font-semibold text-slate-900">{user.bookings_count}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                    <p className="text-slate-500">Payments</p>
                    <p className="mt-1 font-semibold text-slate-900">{user.payments_count}</p>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-600">
                    <p className="text-slate-500">Active packages</p>
                    <p className="mt-1 font-semibold text-slate-900">{user.active_packages_count}</p>
                </div>
            </div>

            <form onSubmit={submit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                        <Input value={data.name} onChange={(event) => setData('name', event.target.value)} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                        <Input type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
                        <Input value={data.phone} onChange={(event) => setData('phone', event.target.value)} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                        <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={data.role} onChange={(event) => setData('role', event.target.value)}>
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">New password</label>
                        <Input type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
                        <Input type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Date of birth</label>
                        <Input type="date" value={data.date_of_birth} onChange={(event) => setData('date_of_birth', event.target.value)} />
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 md:mt-8">
                        <input type="checkbox" checked={data.is_verified} onChange={(event) => setData('is_verified', event.target.checked)} />
                        Mark this account as verified
                    </label>
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                    <Textarea className="min-h-20" value={data.address} onChange={(event) => setData('address', event.target.value)} />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Medical notes</label>
                    <Textarea className="min-h-20" value={data.medical_notes} onChange={(event) => setData('medical_notes', event.target.value)} />
                </div>

                {data.role === 'doctor' ? <DoctorFields data={data} setData={setData} /> : null}

                {user.doctor_profile ? <p className="text-sm text-slate-500">Current doctor fee: {formatCurrency(user.doctor_profile.consultation_fee)}</p> : null}

                {Object.values(errors).length ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(errors)[0]}</div>
                ) : null}

                <Button disabled={processing}>{processing ? 'Saving...' : 'Save user'}</Button>
            </form>
        </div>
    );
}

export default function Users({ users, filters, roles, defaultConsultationFee, pagination, sortBy, sortDir }) {
    const filterForm = useForm(filters);
    const createForm = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role: 'admin',
        is_verified: true,
        date_of_birth: '',
        address: '',
        medical_notes: '',
        specialization: '',
        bio: '',
        avatar_url: '',
        consultation_fee: defaultConsultationFee,
        doctor_is_active: true,
    });

    const submitFilters = (event) => {
        event.preventDefault();
        filterForm.transform((data) => ({
            ...data,
            sort_by: sortBy,
            sort_dir: sortDir,
        }));
        filterForm.get(route('admin.users.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const submitCreate = (event) => {
        event.preventDefault();
        createForm.post(route('admin.users.store'), {
            onSuccess: () => createForm.reset(),
        });
    };

    const columns = [
        { accessorKey: 'name', header: 'Name', meta: { sortKey: 'name' } },
        { accessorKey: 'email', header: 'Email' },
        { accessorKey: 'phone', header: 'Phone' },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ getValue }) => (
                <Badge variant={roleVariants[getValue()] ?? 'neutral'}>{getValue()}</Badge>
            ),
        },
        {
            accessorKey: 'is_verified',
            header: 'Verified',
            cell: ({ getValue }) => (
                <Badge variant={getValue() ? 'success' : 'warning'}>
                    {getValue() ? 'verified' : 'unverified'}
                </Badge>
            ),
        },
        {
            accessorKey: 'bookings_count',
            header: 'Bookings',
            cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        },
        {
            accessorKey: 'payments_count',
            header: 'Payments',
            cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        },
        {
            accessorKey: 'active_packages_count',
            header: 'Pkgs',
            cell: ({ getValue }) => <span className="font-medium">{getValue()}</span>,
        },
    ];

    return (
        <AdminLayout>
            <Head title="Admin Users" />
            <AdminPageHeader title="Admin Users" subtitle="Filter operational accounts, review verification status, and create or update doctor, admin, and finance super admin users from one admin directory." />

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Directory filters</CardTitle>
                            <CardDescription>Search by name, email, or phone, then narrow by role or verification state.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitFilters} className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Search</label>
                                    <div className="relative w-full sm:max-w-xs">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                            <span className="material-symbols-outlined text-lg select-none">search</span>
                                        </span>
                                        <Input
                                            type="text"
                                            placeholder="Search users..."
                                            value={filterForm.data.search}
                                            onChange={(event) => filterForm.setData('search', event.target.value)}
                                            className="pl-9 h-10 rounded-xl"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                                        <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={filterForm.data.role} onChange={(event) => filterForm.setData('role', event.target.value)}>
                                            <option value="">all roles</option>
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Verification</label>
                                        <select
                                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                                            value={filterForm.data.verification_state}
                                            onChange={(event) => filterForm.setData('verification_state', event.target.value)}
                                        >
                                            <option value="">all users</option>
                                            <option value="verified">verified</option>
                                            <option value="unverified">unverified</option>
                                        </select>
                                    </div>
                                </div>
                                <Button disabled={filterForm.processing}>{filterForm.processing ? 'Filtering...' : 'Apply filters'}</Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Create account</CardTitle>
                            <CardDescription>Provision team-managed doctor, admin, or finance super admin accounts without public self-registration.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitCreate} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                                        <Input value={createForm.data.name} onChange={(event) => createForm.setData('name', event.target.value)} />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                                        <Input type="email" value={createForm.data.email} onChange={(event) => createForm.setData('email', event.target.value)} />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Phone</label>
                                        <Input value={createForm.data.phone} onChange={(event) => createForm.setData('phone', event.target.value)} />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Role</label>
                                        <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={createForm.data.role} onChange={(event) => createForm.setData('role', event.target.value)}>
                                            {roles.map((role) => (
                                                <option key={role} value={role}>
                                                    {role}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                                        <Input type="password" value={createForm.data.password} onChange={(event) => createForm.setData('password', event.target.value)} />
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Confirm password</label>
                                        <Input type="password" value={createForm.data.password_confirmation} onChange={(event) => createForm.setData('password_confirmation', event.target.value)} />
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">Date of birth</label>
                                        <Input type="date" value={createForm.data.date_of_birth} onChange={(event) => createForm.setData('date_of_birth', event.target.value)} />
                                    </div>
                                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 md:mt-8">
                                        <input type="checkbox" checked={createForm.data.is_verified} onChange={(event) => createForm.setData('is_verified', event.target.checked)} />
                                        Mark this account as verified
                                    </label>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Address</label>
                                    <Textarea className="min-h-20" value={createForm.data.address} onChange={(event) => createForm.setData('address', event.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Medical notes</label>
                                    <Textarea className="min-h-20" value={createForm.data.medical_notes} onChange={(event) => createForm.setData('medical_notes', event.target.value)} />
                                </div>
                                {createForm.data.role === 'doctor' ? <DoctorFields data={createForm.data} setData={createForm.setData} /> : null}

                                {Object.values(createForm.errors).length ? (
                                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(createForm.errors)[0]}</div>
                                ) : null}

                                <Button className="w-full" disabled={createForm.processing}>
                                    {createForm.processing ? 'Creating...' : 'Create account'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <AdminDataTable
                    columns={columns}
                    data={users}
                    pagination={pagination}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    filters={filters}
                    routeName="admin.users.index"
                    expandableRow={(user) => <UserEditorExpanded user={user} roles={roles} />}
                />
            </div>
        </AdminLayout>
    );
}
