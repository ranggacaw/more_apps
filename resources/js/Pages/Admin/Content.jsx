import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import AdminDataTable from '@/Components/AdminDataTable';
import AdminLayout from '@/Layouts/AdminLayout';
import { AdminPageHeader } from '@/Layouts/AdminLayout';
import { formatDateTime } from '@/lib/format';
import { Head, useForm } from '@inertiajs/react';

function ContentEditorExpanded({ content }) {
    const { data, setData, patch, processing, errors } = useForm({
        title: content.title,
        excerpt: content.excerpt ?? '',
        body: content.body,
        status: content.status,
        asset: null,
    });

    const submit = (event) => {
        event.preventDefault();
        patch(route('admin.content.update', content.id));
    };

    return (
        <div className="space-y-4">
            <form onSubmit={submit} className="space-y-4" onClick={(e) => e.stopPropagation()}>
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                    <Input value={data.title} onChange={(event) => setData('title', event.target.value)} />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Excerpt</label>
                    <Textarea className="min-h-20" value={data.excerpt} onChange={(event) => setData('excerpt', event.target.value)} />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Body</label>
                    <Textarea value={data.body} onChange={(event) => setData('body', event.target.value)} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                        <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={data.status} onChange={(event) => setData('status', event.target.value)}>
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Replace asset</label>
                        <Input type="file" onChange={(event) => setData('asset', event.target.files?.[0] ?? null)} />
                    </div>
                </div>

                {content.asset ? (
                    <div className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-600">
                        <p className="font-medium text-slate-900">Current asset</p>
                        {content.asset.url ? (
                            <a href={content.asset.url} className="text-amber-700 hover:text-amber-800" target="_blank" rel="noreferrer">
                                {content.asset.name}
                            </a>
                        ) : (
                            <p>{content.asset.name}</p>
                        )}
                    </div>
                ) : null}

                {Object.values(errors).length ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(errors)[0]}</div>
                ) : null}

                <div className="flex flex-col gap-2 text-xs text-slate-500 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p>{content.updated_at ? `Updated: ${formatDateTime(content.updated_at)}` : 'Updated just now'}</p>
                        <p>{content.published_at ? `Published: ${formatDateTime(content.published_at)}` : 'Not published yet'}</p>
                    </div>
                    <Button disabled={processing}>{processing ? 'Saving...' : 'Save content'}</Button>
                </div>
            </form>
        </div>
    );
}

export default function Content({ contents, pagination, sortBy, sortDir }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        excerpt: '',
        body: '',
        status: 'draft',
        asset: null,
    });

    const submit = (event) => {
        event.preventDefault();
        post(route('admin.content.store'), {
            onSuccess: () => reset(),
        });
    };

    const columns = [
        { accessorKey: 'title', header: 'Title', meta: { sortKey: 'title' } },
        { accessorKey: 'slug', header: 'Slug' },
        {
            accessorKey: 'status',
            header: 'Status',
            meta: { sortKey: 'status' },
            cell: ({ getValue }) => (
                <Badge variant={getValue() === 'published' ? 'success' : 'neutral'}>
                    {getValue()}
                </Badge>
            ),
        },
        {
            accessorKey: 'updated_at',
            header: 'Updated',
            meta: { sortKey: 'updated_at' },
            cell: ({ getValue }) => (
                <span className="text-xs text-slate-500">
                    {getValue() ? formatDateTime(getValue()) : '—'}
                </span>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="Admin Content" />
            <AdminPageHeader title="Admin Content" subtitle="Manage educational or site content records with draft and published states plus optional file attachments." />

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <Card>
                    <CardHeader>
                        <CardTitle>Create content</CardTitle>
                        <CardDescription>Published records become available to the platform without code changes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                                <Input value={data.title} onChange={(event) => setData('title', event.target.value)} />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Excerpt</label>
                                <Textarea className="min-h-20" value={data.excerpt} onChange={(event) => setData('excerpt', event.target.value)} />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium text-slate-700">Body</label>
                                <Textarea value={data.body} onChange={(event) => setData('body', event.target.value)} />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                                    <select className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" value={data.status} onChange={(event) => setData('status', event.target.value)}>
                                        <option value="draft">draft</option>
                                        <option value="published">published</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">Optional asset</label>
                                    <Input type="file" onChange={(event) => setData('asset', event.target.files?.[0] ?? null)} />
                                </div>
                            </div>

                            {Object.values(errors).length ? (
                                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{Object.values(errors)[0]}</div>
                            ) : null}

                            <Button className="w-full" disabled={processing}>
                                {processing ? 'Saving...' : 'Create content'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <AdminDataTable
                    columns={columns}
                    data={contents}
                    pagination={pagination}
                    sortBy={sortBy}
                    sortDir={sortDir}
                    routeName="admin.content.index"
                    expandableRow={(content) => <ContentEditorExpanded content={content} />}
                />
            </div>
        </AdminLayout>
    );
}
