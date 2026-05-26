import React, { useState } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { router } from '@inertiajs/react';
import {
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronRight,
    ChevronDown,
} from 'lucide-react';

export default function AdminDataTable({
    columns,
    data,
    pagination,
    sortBy,
    sortDir,
    filters = {},
    routeName,
    expandableRow,
}) {
    const [expanded, setExpanded] = useState({});

    const visit = (params) => {
        router.get(
            route(routeName),
            { ...filters, ...params },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleSort = (sortKey) => {
        const newDir =
            sortBy === sortKey && sortDir === 'asc' ? 'desc' : 'asc';
        visit({ sort_by: sortKey, sort_dir: newDir, page: 1 });
    };

    const handlePageChange = (page) => {
        const params = { page };
        if (sortBy) {
            params.sort_by = sortBy;
            params.sort_dir = sortDir;
        }
        visit(params);
    };

    const enhancedColumns = columns.map((col) => {
        if (!col.meta?.sortKey) return col;
        const originalHeader = col.header;
        const sortKey = col.meta.sortKey;
        return {
            ...col,
            header: ({ column }) => (
                <button
                    type="button"
                    className="flex items-center gap-1 font-medium hover:text-gray-900"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleSort(sortKey);
                    }}
                >
                    {typeof originalHeader === 'function'
                        ? originalHeader({ column })
                        : originalHeader || column.id}
                    {sortBy === sortKey ? (
                        sortDir === 'asc' ? (
                            <ArrowUp className="h-4 w-4" />
                        ) : (
                            <ArrowDown className="h-4 w-4" />
                        )
                    ) : (
                        <ArrowUpDown className="h-4 w-4 opacity-50" />
                    )}
                </button>
            ),
        };
    });

    const table = useReactTable({
        data,
        columns: enhancedColumns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        onExpandedChange: setExpanded,
        state: { expanded },
    });

    const { current_page, last_page, total } = pagination ?? {};
    const pages = [];
    if (last_page) {
        for (let i = 1; i <= last_page; i++) {
            if (
                i === 1 ||
                i === last_page ||
                (i >= current_page - 1 && i <= current_page + 1)
            ) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-white shadow-sm overflow-x-auto">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {expandableRow && (
                                    <TableHead className="w-10" />
                                )}
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext(),
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        className={
                                            expandableRow
                                                ? 'cursor-pointer hover:bg-slate-50'
                                                : ''
                                        }
                                        onClick={() =>
                                            expandableRow &&
                                            row.toggleExpanded()
                                        }
                                    >
                                        {expandableRow && (
                                            <TableCell className="w-10">
                                                {row.getIsExpanded() ? (
                                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-slate-400" />
                                                )}
                                            </TableCell>
                                        )}
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {row.getIsExpanded() && expandableRow && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    row.getVisibleCells()
                                                        .length +
                                                    (expandableRow ? 1 : 0)
                                                }
                                                className="bg-slate-50 px-6 py-4"
                                            >
                                                {expandableRow(row.original)}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={
                                        columns.length +
                                        (expandableRow ? 1 : 0)
                                    }
                                    className="h-24 text-center text-gray-500"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {pagination && last_page > 1 && (
                <div className="flex items-center justify-between text-sm text-slate-600">
                    <p>
                        {total} total record{total !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
                            disabled={current_page <= 1}
                            onClick={() =>
                                handlePageChange(current_page - 1)
                            }
                        >
                            Previous
                        </button>
                        {pages.map((page, index) =>
                            page === '...' ? (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-2"
                                >
                                    ...
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    type="button"
                                    className={`rounded-lg border px-3 py-1.5 ${page === current_page ? 'bg-slate-900 text-white' : ''}`}
                                    onClick={() => handlePageChange(page)}
                                >
                                    {page}
                                </button>
                            ),
                        )}
                        <button
                            type="button"
                            className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
                            disabled={current_page >= last_page}
                            onClick={() =>
                                handlePageChange(current_page + 1)
                            }
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
