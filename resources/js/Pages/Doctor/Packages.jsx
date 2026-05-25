import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import { formatCurrency } from '@/lib/format';
import { Head, useForm, router } from '@inertiajs/react';
import { DataTable, SortableHeader } from '@/Components/DataTable';
import Modal from '@/Components/Modal';

function StatCard({ label, value, helper, icon, iconBg = 'bg-slate-50', iconColor = 'text-slate-500' }) {
    return (
        <div className="rounded-[24px] border border-border-subtle bg-white p-5 shadow-sm transition hover:shadow-md flex items-start justify-between">
            <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">{label}</p>
                <p className="text-3xl font-semibold text-slate-950">{value}</p>
                <p className="text-sm leading-6 text-slate-500">{helper}</p>
            </div>
            <div className={`p-3 rounded-2xl ${iconBg} ${iconColor}`}>
                <span className="material-symbols-outlined text-2xl select-none">{icon}</span>
            </div>
        </div>
    );
}

export default function Packages({ doctor, packages, packageTypes }) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const totalPackages = packages.length;
    const activePackages = packages.filter((p) => p.is_active).length;
    const totalPurchases = packages.reduce((sum, p) => sum + p.paid_payments_count, 0);

    const createForm = useForm({
        name: '',
        description: '',
        price: 0,
        duration_days: 30,
        type: packageTypes[0] ?? 'basic',
        consultation_credits: 1,
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        description: '',
        price: 0,
        duration_days: 30,
        type: 'basic',
        consultation_credits: 1,
        is_active: true,
    });

    const handleCreateSubmit = (event) => {
        event.preventDefault();
        createForm.post(route('doctor.packages.store'), {
            onSuccess: () => {
                createForm.reset();
                setCreateModalOpen(false);
            },
            preserveScroll: true,
        });
    };

    const handleEditSubmit = (event) => {
        event.preventDefault();
        editForm.patch(route('doctor.packages.update', selectedPackage.id), {
            onSuccess: () => {
                setEditModalOpen(false);
            },
            preserveScroll: true,
        });
    };

    const openEditModal = (pkg) => {
        setSelectedPackage(pkg);
        editForm.setData({
            name: pkg.name,
            description: pkg.description ?? '',
            price: pkg.price,
            duration_days: pkg.duration_days,
            type: pkg.type,
            consultation_credits: pkg.consultation_credits,
            is_active: pkg.is_active,
        });
        editForm.clearErrors();
        setEditModalOpen(true);
    };

    const openDeleteModal = (pkg) => {
        setSelectedPackage(pkg);
        setDeleteModalOpen(true);
    };

    const handleDelete = () => {
        router.delete(route('doctor.packages.destroy', selectedPackage.id), {
            onSuccess: () => {
                setDeleteModalOpen(false);
            },
            preserveScroll: true,
        });
    };

    const handleDeactivate = () => {
        router.patch(route('doctor.packages.update', selectedPackage.id), {
            name: selectedPackage.name,
            description: selectedPackage.description ?? '',
            price: selectedPackage.price,
            duration_days: selectedPackage.duration_days,
            type: selectedPackage.type,
            consultation_credits: selectedPackage.consultation_credits,
            is_active: false,
        }, {
            onSuccess: () => {
                setDeleteModalOpen(false);
            },
            preserveScroll: true,
        });
    };

    const filteredPackages = packages.filter((pkg) =>
        pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pkg.description && pkg.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const columns = [
        {
            accessorKey: 'name',
            header: ({ column }) => <SortableHeader column={column} title="Package Name" />,
            cell: ({ row }) => (
                <div className="py-1">
                    <div className="font-semibold text-slate-900">{row.original.name}</div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{row.original.slug}</div>
                </div>
            ),
        },
        {
            accessorKey: 'type',
            header: ({ column }) => <SortableHeader column={column} title="Type" />,
            cell: ({ row }) => {
                const type = row.original.type;
                let variant = 'neutral';
                let customClass = '';
                if (type === 'vip') {
                    variant = 'success';
                    customClass = 'bg-purple-100 text-purple-700';
                } else if (type === 'advance') {
                    variant = 'warning';
                }
                return <Badge variant={variant} className={`capitalize ${customClass}`}>{type}</Badge>;
            },
        },
        {
            accessorKey: 'price',
            header: ({ column }) => <SortableHeader column={column} title="Price" />,
            cell: ({ row }) => (
                <span className="font-semibold text-slate-800">{formatCurrency(row.original.price)}</span>
            ),
        },
        {
            accessorKey: 'duration_days',
            header: ({ column }) => <SortableHeader column={column} title="Duration" />,
            cell: ({ row }) => (
                <span className="text-slate-600 font-medium">{row.original.duration_days} Days</span>
            ),
        },
        {
            accessorKey: 'consultation_credits',
            header: ({ column }) => <SortableHeader column={column} title="Credits" />,
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                    <span className="material-symbols-outlined text-lg text-slate-400 select-none">stethoscope</span>
                    <span>{row.original.consultation_credits} Sessions</span>
                </div>
            ),
        },
        {
            accessorKey: 'paid_payments_count',
            header: ({ column }) => <SortableHeader column={column} title="Purchases" />,
            cell: ({ row }) => (
                <div className="text-xs">
                    <div className="font-semibold text-slate-900">{row.original.paid_payments_count} paid</div>
                    <div className="text-slate-500">{row.original.active_entitlements_count} active entitlements</div>
                </div>
            ),
        },
        {
            accessorKey: 'is_active',
            header: ({ column }) => <SortableHeader column={column} title="Status" />,
            cell: ({ row }) => (
                <Badge variant={row.original.is_active ? 'success' : 'neutral'}>
                    {row.original.is_active ? 'Active' : 'Inactive'}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        onClick={() => openEditModal(row.original)}
                        className="h-9 w-9 p-0 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        title="Edit Package"
                    >
                        <span className="material-symbols-outlined text-[20px] select-none">edit</span>
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => openDeleteModal(row.original)}
                        className="h-9 w-9 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete Package"
                    >
                        <span className="material-symbols-outlined text-[20px] select-none">delete</span>
                    </Button>
                </div>
            ),
        },
    ];

    const hasPurchases = selectedPackage && (selectedPackage.paid_payments_count > 0 || selectedPackage.total_entitlements_count > 0);

    return (
        <DoctorLayout doctor={doctor}>
            <Head title="Packages" />

            <DoctorPageHeader
                title="Packages"
                subtitle="Create, review, price, and deactivate package offerings without breaking historical payments or entitlements."
                actions={
                    <Button
                        onClick={() => {
                            createForm.reset();
                            createForm.clearErrors();
                            setCreateModalOpen(true);
                        }}
                        className="bg-clinical-gold text-white hover:opacity-90 transition shadow-sm gap-2"
                    >
                        <span className="material-symbols-outlined select-none text-[18px]">add</span>
                        Create Package
                    </Button>
                }
            />

            <div className="grid gap-6 sm:grid-cols-3">
                <StatCard
                    label="Total Packages"
                    value={totalPackages}
                    helper="All packages configured"
                    icon="inventory_2"
                    iconBg="bg-amber-50"
                    iconColor="text-clinical-gold"
                />
                <StatCard
                    label="Active in Catalog"
                    value={activePackages}
                    helper="Visible to patients for purchase"
                    icon="check_circle"
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-600"
                />
                <StatCard
                    label="Total Purchases"
                    value={totalPurchases}
                    helper="Paid purchases across all packages"
                    icon="shopping_bag"
                    iconBg="bg-blue-50"
                    iconColor="text-blue-600"
                />
            </div>

            <div className="mt-8">
                <Card className="border-border-subtle bg-white shadow-sm overflow-hidden">
                    <CardHeader className="border-b border-slate-50 py-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-xl font-semibold text-slate-900">Package catalog</CardTitle>
                                <CardDescription className="text-slate-500">
                                    Displaying {filteredPackages.length} package offerings. Use the search bar to filter packages.
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:max-w-xs">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                                    <span className="material-symbols-outlined text-lg select-none">search</span>
                                </span>
                                <Input
                                    type="text"
                                    placeholder="Search packages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 rounded-xl"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <DataTable columns={columns} data={filteredPackages} />
                    </CardContent>
                </Card>
            </div>

            {/* Create Package Modal */}
            <Modal show={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Create New Package</h3>
                            <p className="text-xs text-slate-500">Configure a new package offering for the patient catalog.</p>
                        </div>
                        <button onClick={() => setCreateModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <span className="material-symbols-outlined select-none text-[20px]">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleCreateSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Package name</label>
                            <Input placeholder="e.g. Weight Loss Starter" value={createForm.data.name} onChange={(event) => createForm.setData('name', event.target.value)} />
                            {createForm.errors.name ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{createForm.errors.name}</p> : null}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                            <Textarea rows={3} placeholder="Describe what this package includes..." value={createForm.data.description} onChange={(event) => createForm.setData('description', event.target.value)} />
                            {createForm.errors.description ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{createForm.errors.description}</p> : null}
                        </div>

                        <div className="grid gap-4 grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Price (Rp)</label>
                                <Input type="number" min="0" placeholder="0" value={createForm.data.price} onChange={(event) => createForm.setData('price', Number(event.target.value))} />
                                {createForm.errors.price ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{createForm.errors.price}</p> : null}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Consultation credits</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="52"
                                    value={createForm.data.consultation_credits}
                                    onChange={(event) => createForm.setData('consultation_credits', Number(event.target.value))}
                                />
                                {createForm.errors.consultation_credits ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{createForm.errors.consultation_credits}</p> : null}
                            </div>
                        </div>

                        <div className="grid gap-4 grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Duration (days)</label>
                                <Input type="number" min="1" max="365" value={createForm.data.duration_days} onChange={(event) => createForm.setData('duration_days', Number(event.target.value))} />
                                {createForm.errors.duration_days ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{createForm.errors.duration_days}</p> : null}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Package type</label>
                                <select
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-clinical-gold focus:ring-1 focus:ring-clinical-gold shadow-sm"
                                    value={createForm.data.type}
                                    onChange={(event) => createForm.setData('type', event.target.value)}
                                >
                                    {packageTypes.map((type) => (
                                        <option key={type} value={type} className="capitalize">
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {createForm.errors.type ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{createForm.errors.type}</p> : null}
                            </div>
                        </div>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition">
                            <input type="checkbox" checked={createForm.data.is_active} onChange={(event) => createForm.setData('is_active', event.target.checked)} className="rounded text-clinical-gold focus:ring-clinical-gold" />
                            Publish this package to the active patient catalog immediately
                        </label>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-clinical-gold text-white hover:opacity-90" disabled={createForm.processing}>
                                {createForm.processing ? 'Creating...' : 'Create package'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Edit Package Modal */}
            <Modal show={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="lg">
                <div className="p-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Edit Package</h3>
                            <p className="text-xs text-slate-500">Modify properties of package <strong>{selectedPackage?.name}</strong>.</p>
                        </div>
                        <button onClick={() => setEditModalOpen(false)} className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                            <span className="material-symbols-outlined select-none text-[20px]">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Package name</label>
                            <Input value={editForm.data.name} onChange={(event) => editForm.setData('name', event.target.value)} />
                            {editForm.errors.name ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{editForm.errors.name}</p> : null}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                            <Textarea rows={3} value={editForm.data.description} onChange={(event) => editForm.setData('description', event.target.value)} />
                            {editForm.errors.description ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{editForm.errors.description}</p> : null}
                        </div>

                        <div className="grid gap-4 grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Price (Rp)</label>
                                <Input type="number" min="0" value={editForm.data.price} onChange={(event) => editForm.setData('price', Number(event.target.value))} />
                                {editForm.errors.price ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{editForm.errors.price}</p> : null}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Consultation credits</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="52"
                                    value={editForm.data.consultation_credits}
                                    onChange={(event) => editForm.setData('consultation_credits', Number(event.target.value))}
                                />
                                {editForm.errors.consultation_credits ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{editForm.errors.consultation_credits}</p> : null}
                            </div>
                        </div>

                        <div className="grid gap-4 grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Duration (days)</label>
                                <Input type="number" min="1" max="365" value={editForm.data.duration_days} onChange={(event) => editForm.setData('duration_days', Number(event.target.value))} />
                                {editForm.errors.duration_days ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{editForm.errors.duration_days}</p> : null}
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-500">Package type</label>
                                <select
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-clinical-gold focus:ring-1 focus:ring-clinical-gold shadow-sm"
                                    value={editForm.data.type}
                                    onChange={(event) => editForm.setData('type', event.target.value)}
                                >
                                    {packageTypes.map((type) => (
                                        <option key={type} value={type} className="capitalize">
                                            {type}
                                        </option>
                                    ))}
                                </select>
                                {editForm.errors.type ? <p className="mt-1.5 text-xs text-rose-600 font-medium">{editForm.errors.type}</p> : null}
                            </div>
                        </div>

                        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition">
                            <input type="checkbox" checked={editForm.data.is_active} onChange={(event) => editForm.setData('is_active', event.target.checked)} className="rounded text-clinical-gold focus:ring-clinical-gold" />
                            Keep this package purchasable in the patient catalog
                        </label>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-clinical-gold text-white hover:opacity-90" disabled={editForm.processing}>
                                {editForm.processing ? 'Saving...' : 'Save package'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal show={deleteModalOpen} onClose={() => setDeleteModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <span className="material-symbols-outlined select-none text-[24px]">warning</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900">Delete Package</h3>
                            <p className="text-sm text-slate-500 mt-2">
                                Are you sure you want to delete <strong>{selectedPackage?.name}</strong>?
                            </p>

                            {hasPurchases ? (
                                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-xs leading-relaxed text-amber-800 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <span className="material-symbols-outlined text-[16px]">info</span>
                                        <span>Historical Records Found</span>
                                    </div>
                                    <p>
                                        This package has <strong>{selectedPackage?.paid_payments_count} paid purchases</strong> (and {selectedPackage?.total_entitlements_count} total patient entitlements) and cannot be deleted to preserve financial audit logs and active programs.
                                    </p>
                                    <p className="font-medium">
                                        Please deactivate the package instead. Deactivating hides it from the patient catalog, ensuring no future bookings can use it, while keeping existing patient entitlements active.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-xs text-slate-500 mt-4 leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                    This package has never been purchased by patients. It is completely safe to delete. This action cannot be undone.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button type="button" variant="outline" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        {hasPurchases ? (
                            <Button
                                type="button"
                                className="bg-amber-600 hover:bg-amber-500 text-white"
                                onClick={handleDeactivate}
                            >
                                Deactivate Package
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                variant="danger"
                                onClick={handleDelete}
                            >
                                Delete Package
                            </Button>
                        )}
                    </div>
                </div>
            </Modal>
        </DoctorLayout>
    );
}
