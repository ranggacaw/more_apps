import { cn } from '@/lib/utils';

const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
    ghost: 'text-slate-700 hover:bg-slate-100',
    success: 'bg-emerald-600 text-white hover:bg-emerald-500',
    danger: 'bg-rose-600 text-white hover:bg-rose-500',
};

export function Button({ className, variant = 'default', ...props }) {
    return (
        <button
            className={cn(
                'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
                variants[variant],
                className,
            )}
            {...props}
        />
    );
}
