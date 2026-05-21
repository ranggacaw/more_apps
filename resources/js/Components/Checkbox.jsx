export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-outline-variant text-clinical-gold shadow-sm focus:ring-clinical-gold ' +
                className
            }
        />
    );
}
