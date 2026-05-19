import { cn } from '@/lib/utils';

const variants = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
};

export function Badge({ className, variant = 'neutral', ...props }) {
    return (
        <span
            className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-medium', variants[variant], className)}
            {...props}
        />
    );
}
