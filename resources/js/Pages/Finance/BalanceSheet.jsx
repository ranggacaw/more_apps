import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DoctorLayout, { DoctorPageHeader } from '@/Layouts/DoctorLayout';
import FinanceLayout, { FinancePageHeader } from '@/Layouts/FinanceLayout';
import { formatCurrency } from '@/lib/format';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function PageShell({ doctor, title, subtitle, children }) {
    const { auth } = usePage().props;

    if (auth.user?.role === 'doctor') {
        return (
            <DoctorLayout doctor={doctor}>
                <DoctorPageHeader title={title} subtitle={subtitle} />
                {children}
            </DoctorLayout>
        );
    }

    return (
        <FinanceLayout>
            <FinancePageHeader title={title} subtitle={subtitle} />
            {children}
        </FinanceLayout>
    );
}

function FormError({ message }) {
    return message ? <p className="mt-1 text-xs font-medium text-rose-600">{message}</p> : null;
}

function SummaryCard({ label, value, helper }) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>{label}</CardDescription>
                <CardTitle>{formatCurrency(value)}</CardTitle>
            </CardHeader>
            {helper ? <CardContent className="text-sm text-slate-500">{helper}</CardContent> : null}
        </Card>
    );
}

function EntryForm({ defaultDate, allowedSides }) {
    const form = useForm({
        side: allowedSides[0] ?? 'asset',
        label: '',
        category: '',
        amount: 0,
        entry_date: defaultDate,
        notes: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('finance.balance-sheet-entries.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('label', 'category', 'amount', 'notes'),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Side</label>
                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.side} onChange={(event) => form.setData('side', event.target.value)}>
                        {allowedSides.map((side) => <option key={side} value={side}>{side}</option>)}
                    </select>
                    <FormError message={form.errors.side} />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Label</label>
                    <Input value={form.data.label} onChange={(event) => form.setData('label', event.target.value)} />
                    <FormError message={form.errors.label} />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                    <Input value={form.data.category} onChange={(event) => form.setData('category', event.target.value)} />
                    <FormError message={form.errors.category} />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
                    <Input type="number" min="0" value={form.data.amount} onChange={(event) => form.setData('amount', Number(event.target.value))} />
                    <FormError message={form.errors.amount} />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Entry date</label>
                    <Input type="date" value={form.data.entry_date} onChange={(event) => form.setData('entry_date', event.target.value)} />
                    <FormError message={form.errors.entry_date} />
                </div>
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                <Textarea className="min-h-20" value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} />
                <FormError message={form.errors.notes} />
            </div>
            <Button disabled={form.processing}>{form.processing ? 'Saving...' : 'Save entry'}</Button>
        </form>
    );
}

function EntryRow({ entry, allowedSides }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        side: entry.side,
        label: entry.label,
        category: entry.category ?? '',
        amount: entry.amount,
        entry_date: entry.entry_date,
        notes: entry.notes ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.patch(route('finance.balance-sheet-entries.update', entry.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const destroy = () => {
        router.delete(route('finance.balance-sheet-entries.destroy', entry.id), { preserveScroll: true });
    };

    if (editing) {
        return (
            <form onSubmit={submit} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="grid gap-3 md:grid-cols-5">
                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={form.data.side} onChange={(event) => form.setData('side', event.target.value)}>
                        {allowedSides.map((side) => <option key={side} value={side}>{side}</option>)}
                    </select>
                    <Input value={form.data.label} onChange={(event) => form.setData('label', event.target.value)} />
                    <Input value={form.data.category} onChange={(event) => form.setData('category', event.target.value)} />
                    <Input type="number" min="0" value={form.data.amount} onChange={(event) => form.setData('amount', Number(event.target.value))} />
                    <Input type="date" value={form.data.entry_date} onChange={(event) => form.setData('entry_date', event.target.value)} />
                </div>
                <Textarea className="min-h-20" value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} />
                {Object.values(form.errors).length ? <div className="text-sm text-rose-600">{Object.values(form.errors)[0]}</div> : null}
                <div className="flex flex-wrap gap-2">
                    <Button disabled={form.processing}>{form.processing ? 'Saving...' : 'Save changes'}</Button>
                    <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
            </form>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
                <p className="font-medium text-slate-900">{entry.label}</p>
                <p className="mt-1 text-sm text-slate-500">{entry.side} - {entry.category || 'Uncategorized'} - {entry.entry_date}</p>
                {entry.notes ? <p className="mt-2 text-sm text-slate-500">{entry.notes}</p> : null}
            </div>
            <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">{formatCurrency(entry.amount)}</span>
                <Button type="button" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                <Button type="button" variant="danger" onClick={destroy}>Delete</Button>
            </div>
        </div>
    );
}

function StatementRows({ title, rows }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
                {rows.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-slate-500">No rows.</p> : null}
                {rows.map((row) => (
                    <div key={`${row.source}-${row.id}`} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                        <div>
                            <p className="font-medium text-slate-900">{row.label}</p>
                            <p className="text-xs text-slate-500">{row.category || row.source}</p>
                        </div>
                        <span className="font-semibold text-slate-900">{formatCurrency(row.amount)}</span>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

export default function BalanceSheet({ filters, report, balanceSheetEntries, allowedSides, canManageFinance, doctor }) {
    const filterForm = useForm(filters);

    const submitFilters = (event) => {
        event.preventDefault();
        filterForm.get(route('finance.balance-sheet.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <PageShell
            doctor={doctor}
            title="Balance Sheet"
            subtitle="Simplified as-of statement with calculated cash and retained earnings plus manual assets, equity, and liabilities."
        >
            <Head title="Finance Balance Sheet" />

            <Card>
                <CardHeader>
                    <CardTitle>As-of filter</CardTitle>
                    <CardDescription>Manual entries dated on or before this day are included in the statement.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submitFilters} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">As-of date</label>
                            <Input type="date" value={filterForm.data.as_of_date} onChange={(event) => filterForm.setData('as_of_date', event.target.value)} />
                            <FormError message={filterForm.errors.as_of_date} />
                        </div>
                        <Button disabled={filterForm.processing}>{filterForm.processing ? 'Refreshing...' : 'Apply filter'}</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <SummaryCard label="Total assets" value={report.total_assets} helper="Cash plus manual asset rows" />
                <SummaryCard label="Equity plus liabilities" value={report.total_equity_liabilities} helper="Retained earnings plus manual rows" />
                <SummaryCard label="Retained earnings" value={report.retained_earnings} helper="Cumulative net income" />
                <SummaryCard label="Variance" value={report.variance} helper="Assets minus equity plus liabilities" />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <StatementRows title="Assets" rows={report.asset_rows} />
                <div className="space-y-6">
                    <StatementRows title="Equity" rows={report.equity_rows} />
                    <StatementRows title="Liabilities" rows={report.liability_rows} />
                </div>
            </div>

            <section id="balance-sheet-entries" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Manual balance-sheet entries</CardTitle>
                        <CardDescription>{canManageFinance ? 'Create, update, or delete manual asset, equity, and liability rows.' : 'Doctors can review statement totals without manual-entry controls.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {canManageFinance ? <EntryForm defaultDate={filters.as_of_date} allowedSides={allowedSides} /> : null}
                        {canManageFinance && balanceSheetEntries.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No manual entries dated on or before this as-of date.</p> : null}
                        {canManageFinance ? balanceSheetEntries.map((entry) => <EntryRow key={entry.id} entry={entry} allowedSides={allowedSides} />) : null}
                    </CardContent>
                </Card>
            </section>
        </PageShell>
    );
}
