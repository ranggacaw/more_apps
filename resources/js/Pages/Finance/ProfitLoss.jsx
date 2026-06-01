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

function MetricCard({ label, value, helper }) {
    return (
        <Card>
            <CardHeader>
                <CardDescription>{label}</CardDescription>
                <CardTitle>{value}</CardTitle>
            </CardHeader>
            {helper ? <CardContent className="text-sm text-slate-500">{helper}</CardContent> : null}
        </Card>
    );
}

function FormError({ message }) {
    return message ? <p className="mt-1 text-xs font-medium text-rose-600">{message}</p> : null;
}

function ExpenseForm({ defaultDate }) {
    const form = useForm({
        name: '',
        category: '',
        amount: 0,
        expense_date: defaultDate,
        notes: '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.post(route('finance.operating-expenses.store'), {
            preserveScroll: true,
            onSuccess: () => form.reset('name', 'category', 'amount', 'notes'),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Name</label>
                    <Input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                    <FormError message={form.errors.name} />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
                    <Input value={form.data.category} onChange={(event) => form.setData('category', event.target.value)} />
                    <FormError message={form.errors.category} />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
                    <Input type="number" min="0" value={form.data.amount} onChange={(event) => form.setData('amount', Number(event.target.value))} />
                    <FormError message={form.errors.amount} />
                </div>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Expense date</label>
                    <Input type="date" value={form.data.expense_date} onChange={(event) => form.setData('expense_date', event.target.value)} />
                    <FormError message={form.errors.expense_date} />
                </div>
            </div>
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Notes</label>
                <Textarea className="min-h-20" value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} />
                <FormError message={form.errors.notes} />
            </div>
            <Button disabled={form.processing}>{form.processing ? 'Saving...' : 'Save expense'}</Button>
        </form>
    );
}

function ExpenseRow({ expense }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        name: expense.name,
        category: expense.category ?? '',
        amount: expense.amount,
        expense_date: expense.expense_date,
        notes: expense.notes ?? '',
    });

    const submit = (event) => {
        event.preventDefault();
        form.patch(route('finance.operating-expenses.update', expense.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    const destroy = () => {
        router.delete(route('finance.operating-expenses.destroy', expense.id), { preserveScroll: true });
    };

    if (editing) {
        return (
            <form onSubmit={submit} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="grid gap-3 md:grid-cols-4">
                    <Input value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />
                    <Input value={form.data.category} onChange={(event) => form.setData('category', event.target.value)} />
                    <Input type="number" min="0" value={form.data.amount} onChange={(event) => form.setData('amount', Number(event.target.value))} />
                    <Input type="date" value={form.data.expense_date} onChange={(event) => form.setData('expense_date', event.target.value)} />
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
                <p className="font-medium text-slate-900">{expense.name}</p>
                <p className="mt-1 text-sm text-slate-500">{expense.category || 'Uncategorized'} - {expense.expense_date}</p>
                {expense.notes ? <p className="mt-2 text-sm text-slate-500">{expense.notes}</p> : null}
            </div>
            <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-900">{formatCurrency(expense.amount)}</span>
                <Button type="button" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
                <Button type="button" variant="danger" onClick={destroy}>Delete</Button>
            </div>
        </div>
    );
}

function PaymentAdjustmentRow({ payment }) {
    const [editing, setEditing] = useState(false);
    const form = useForm({
        return_amount: payment.return_amount,
        hpp_amount: payment.hpp_amount,
    });

    const submit = (event) => {
        event.preventDefault();
        form.patch(route('finance.payment-adjustments.update', payment.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    };

    if (editing) {
        return (
            <form onSubmit={submit} className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
                <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr] md:items-end">
                    <div>
                        <p className="font-medium text-slate-900">{payment.patient_name}</p>
                        <p className="mt-1 text-sm text-slate-500">{payment.type} - {payment.order_id}</p>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Return amount</label>
                        <Input type="number" min="0" max={payment.amount} value={form.data.return_amount} onChange={(event) => form.setData('return_amount', Number(event.target.value))} />
                        <FormError message={form.errors.return_amount} />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">HPP / COGS</label>
                        <Input type="number" min="0" value={form.data.hpp_amount} onChange={(event) => form.setData('hpp_amount', Number(event.target.value))} />
                        <FormError message={form.errors.hpp_amount} />
                    </div>
                </div>
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
                <p className="font-medium text-slate-900">{payment.patient_name}</p>
                <p className="mt-1 text-sm text-slate-500">{payment.type} - {payment.order_id} - {payment.paid_at}</p>
                <p className="mt-2 text-sm text-slate-500">Gross payment: {formatCurrency(payment.amount)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-600">Return: <strong className="text-slate-900">{formatCurrency(payment.return_amount)}</strong></span>
                <span className="text-sm text-slate-600">HPP: <strong className="text-slate-900">{formatCurrency(payment.hpp_amount)}</strong></span>
                <Button type="button" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
            </div>
        </div>
    );
}

export default function ProfitLoss({ filters, report, paymentAdjustments, operatingExpenses, canManageFinance, doctor }) {
    const filterForm = useForm(filters);

    const submitFilters = (event) => {
        event.preventDefault();
        filterForm.get(route('finance.profit-loss.index'), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <PageShell
            doctor={doctor}
            title="Profit and Loss"
            subtitle="Cash-basis statement from paid payments, manual returns and HPP values, and operating expenses in the selected window."
        >
            <Head title="Finance Profit and Loss" />

            <Card>
                <CardHeader>
                    <CardTitle>Reporting window</CardTitle>
                    <CardDescription>Paid payment timestamps and operating expense dates define this statement.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submitFilters} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">Start date</label>
                            <Input type="date" value={filterForm.data.start_date} onChange={(event) => filterForm.setData('start_date', event.target.value)} />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">End date</label>
                            <Input type="date" value={filterForm.data.end_date} onChange={(event) => filterForm.setData('end_date', event.target.value)} />
                            <FormError message={filterForm.errors.end_date} />
                        </div>
                        <Button disabled={filterForm.processing}>{filterForm.processing ? 'Refreshing...' : 'Apply filters'}</Button>
                    </form>
                </CardContent>
            </Card>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Gross revenue" value={formatCurrency(report.gross_revenue)} helper={`${report.payments_count} paid payments`} />
                <MetricCard label="Returns" value={formatCurrency(report.returns)} helper="Manual return amounts on paid payments" />
                <MetricCard label="HPP / COGS" value={formatCurrency(report.hpp)} helper="Manual cost amounts on paid payments" />
                <MetricCard label="Operating expenses" value={formatCurrency(report.operating_expenses)} helper={`${report.expense_count} expense records`} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue and gross profit</CardTitle>
                        <CardDescription>Total revenue subtracts returns before HPP is applied.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                        {[
                            ['Gross revenue', report.gross_revenue],
                            ['Returns', -report.returns],
                            ['Total revenue', report.total_revenue],
                            ['HPP / COGS', -report.hpp],
                            ['Gross profit', report.gross_profit],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                                <span>{label}</span>
                                <span className="font-semibold text-slate-900">{formatCurrency(value)}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Net income</CardTitle>
                        <CardDescription>Gross margin stays zero when total revenue is not positive.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                            <span>Gross margin</span>
                            <span className="font-semibold text-slate-900">{report.gross_margin_percentage}%</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                            <span>Operating expenses</span>
                            <span className="font-semibold text-slate-900">- {formatCurrency(report.operating_expenses)}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-4 text-white">
                            <span>Net income</span>
                            <span className="text-lg font-semibold">{formatCurrency(report.net_income)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <section id="payment-adjustments" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment returns and HPP</CardTitle>
                        <CardDescription>{canManageFinance ? 'Update return and HPP values on paid payments included in this profit and loss window.' : 'Doctors can review statement totals without payment adjustment controls.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {canManageFinance && paymentAdjustments.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No paid payments in this reporting window.</p> : null}
                        {canManageFinance ? paymentAdjustments.map((payment) => <PaymentAdjustmentRow key={payment.id} payment={payment} />) : null}
                    </CardContent>
                </Card>
            </section>

            <section id="operating-expenses" className="mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Operating expenses</CardTitle>
                        <CardDescription>{canManageFinance ? 'Create, update, or delete manual expenses included in profit and loss reports.' : 'Doctors can review statement totals without mutation controls.'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {canManageFinance ? <ExpenseForm defaultDate={filters.end_date} /> : null}
                        {canManageFinance && operatingExpenses.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No operating expenses in this reporting window.</p> : null}
                        {canManageFinance ? operatingExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />) : null}
                    </CardContent>
                </Card>
            </section>
        </PageShell>
    );
}
