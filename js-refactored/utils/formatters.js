/**
 * Formatting utilities for dates, currency, and numbers
 * @module utils/formatters
 */

/**
 * Format a number as currency
 * @param {number} amount The amount to format
 * @param {string} currency The currency code (default: 'EUR')
 * @returns {string} The formatted currency string
 */
export function formatCurrency(amount, currency = 'EUR') {
    const symbols = {
        'EUR': '€',
        'USD': '$',
        'GBP': '£',
        'DZD': 'DA'
    };
    
    const symbol = symbols[currency] || '€';
    const numAmount = parseFloat(amount) || 0;
    
    return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numAmount) + ' ' + symbol;
}

/**
 * Format a date string or Date object to French format (dd/mm/yyyy)
 * @param {string|Date} date The date to format
 * @returns {string} The formatted date string
 */
export function formatDate(date) {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(d.getTime())) {
        return 'Date invalide';
    }
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
}

/**
 * Format a datetime to French format with time (dd/mm/yyyy HH:MM)
 * @param {string|Date} datetime The datetime to format
 * @returns {string} The formatted datetime string
 */
export function formatDateTime(datetime) {
    if (!datetime) return '';
    
    const d = typeof datetime === 'string' ? new Date(datetime) : datetime;
    
    if (isNaN(d.getTime())) {
        return 'Date invalide';
    }
    
    const dateStr = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format a number with thousand separators
 * @param {number} num The number to format
 * @returns {string} The formatted number
 */
export function formatNumber(num) {
    return new Intl.NumberFormat('fr-FR').format(num);
}

/**
 * Parse a currency string to a float number
 * @param {string} currencyStr The currency string (e.g., "1 234,56 €")
 * @returns {number} The parsed number
 */
export function parseCurrency(currencyStr) {
    if (typeof currencyStr !== 'string') return parseFloat(currencyStr) || 0;
    
    // Remove currency symbols and spaces
    const cleaned = currencyStr.replace(/[^0-9,.-]/g, '');
    // Replace comma with dot for parsing
    const normalized = cleaned.replace(',', '.');
    
    return parseFloat(normalized) || 0;
}
