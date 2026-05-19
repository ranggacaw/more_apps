import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }) {
    return (
        <textarea
            className={cn(
                'min-h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200',
                className,
            )}
            {...props}
        />
    );
}
