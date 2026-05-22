export const CLINIC_TIME_ZONE = 'Asia/Jakarta';

function clinicFormatter(options) {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: CLINIC_TIME_ZONE,
        ...options,
    });
}

function clinicParts(value, options) {
    return clinicFormatter(options).formatToParts(new Date(value));
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value ?? 0);
}

export function formatDateTime(value) {
    return clinicFormatter({
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

export function formatDate(value) {
    return clinicFormatter({
        weekday: 'long',
        day: 'numeric',
        month: 'short',
    }).format(new Date(value));
}

export function formatTime(value) {
    return clinicFormatter({
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date(value));
}

export function getClinicHour(value) {
    const hour = clinicParts(value, {
        hour: '2-digit',
        hour12: false,
    }).find((part) => part.type === 'hour')?.value;

    return Number(hour ?? 0);
}

export function getClinicDateKey(value) {
    const parts = clinicParts(value, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
}

export const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
