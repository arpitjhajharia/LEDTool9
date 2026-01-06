export const formatCurrency = (amount, currency = 'INR', compact = false) => {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
        style: 'currency',
        currency: currency,
        maximumFractionDigits: 0,
        notation: compact ? "compact" : "standard"
    }).format(amount);
};

export const generateId = () => Math.random().toString(36).substr(2, 9).toUpperCase();

import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
    return twMerge(clsx(inputs))
}
