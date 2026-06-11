import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminDataTable from '@/Components/AdminDataTable';
import AdminLayout, { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

function ProgramEditor({ program }) {
    const form = useForm({
        name: program.name,
        price: program.price,
        hpp_amount: program.hpp_amount,
        is_active: program.is_active,
    });
    const destroyForm = useForm({});

    const submit = (event) => {
        event.preventDefault();
        form.patch(route('admin.aesthetic-programs.update', program.id));
    };

    return (
        <form onSubmit={submit} className="space-y-4" onClick={(event) => event.stopPropagation()}>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Program name</label>
                    <Input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.is_active ? '1' : '0'} onChange={(event) => form.setData('is_active', event.target.value === '1')}>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                    </select>
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Selling price</label>
                    <Input type="number" min="0" value={form.data.price} onChange={(event) => form.setData('price', event.target.value)} />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">HPP / COGS</label>
                    <Input type="number" min="0" value={form.data.hpp_amount} onChange={(event) => form.setData('hpp_amount', event.target.value)} />
                </div>
            </div>
            {Object.values(form.errors).length ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(form.errors)[0]}</div> : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-slate-500">Updated {program.updated_at ? formatDateTime(program.updated_at) : 'recently'}</p>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" disabled={destroyForm.processing} onClick={() => destroyForm.delete(route('admin.aesthetic-programs.destroy', program.id), { preserveScroll: true })}>Delete/deactivate</Button>
                    <Button disabled={form.processing}>{form.processing ? 'Saving...' : 'Save program'}</Button>
                </div>
            </div>
        </form>
    );
}

export default function AestheticPrograms({ programs, pagination, sortBy, sortDir }) {
    const form = useForm({ name: '', price: 0, hpp_amount: 0, is_active: true });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('admin.aesthetic-programs.store'), { onSuccess: () => form.reset() });
    };

    const columns = [
        { accessorKey: 'name', header: 'Program', meta: { sortKey: 'name' } },
        { accessorKey: 'price', header: 'Price', meta: { sortKey: 'price' }, cell: ({ getValue }) => formatCurrency(getValue()) },
        { accessorKey: 'hpp_amount', header: 'HPP', meta: { sortKey: 'hpp_amount' }, cell: ({ getValue }) => formatCurrency(getValue()) },
        { accessorKey: 'gross_margin', header: 'Gross margin', meta: { sortKey: 'gross_margin' }, cell: ({ getValue }) => formatCurrency(getValue()) },
        { accessorKey: 'is_active', header: 'Status', meta: { sortKey: 'is_active' }, cell: ({ getValue }) => <Badge variant={getValue() ? 'success' : 'neutral'}>{getValue() ? 'active' : 'inactive'}</Badge> },
    ];

    return (
        <AdminLayout>
            <Head title="Aesthetic Programs" />
            <AdminPageHeader title="Aesthetic Programs" subtitle="Manage doctor-selectable aesthetic treatment programs, selling prices, HPP, and active state." />
            <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create program</CardTitle>
                        <CardDescription>Active records become searchable in doctor consultation workspaces.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Program name</label>
                                <Input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Selling price</label>
                                    <Input type="number" min="0" value={form.data.price} onChange={(event) => form.setData('price', event.target.value)} />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">HPP / COGS</label>
                                    <Input type="number" min="0" value={form.data.hpp_amount} onChange={(event) => form.setData('hpp_amount', event.target.value)} />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-700">
                                <input type="checkbox" checked={form.data.is_active} onChange={(event) => form.setData('is_active', event.target.checked)} />
                                Active
                            </label>
                            {Object.values(form.errors).length ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(form.errors)[0]}</div> : null}
                            <Button className="w-full" disabled={form.processing}>{form.processing ? 'Saving...' : 'Create program'}</Button>
                        </form>
                    </CardContent>
                </Card>
                <AdminDataTable columns={columns} data={programs} pagination={pagination} sortBy={sortBy} sortDir={sortDir} routeName="admin.aesthetic-programs.index" expandableRow={(program) => <ProgramEditor program={program} />} />
            </div>
        </AdminLayout>
    );
}
