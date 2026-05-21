export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center justify-center rounded-md bg-clinical-gold px-4 py-3.5 text-sm font-semibold uppercase tracking-widest text-white shadow-md transition-all duration-300 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-clinical-gold focus:ring-offset-2 active:scale-[0.98] ${
                    disabled && 'opacity-50 cursor-not-allowed'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
