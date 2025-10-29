/**
 * Security utilities for preventing XSS attacks and sanitizing input
 * @module utils/security
 */

/**
 * Sanitize a string to prevent XSS attacks before inserting into HTML.
 * @param {string} str The string to sanitize.
 * @returns {string} The sanitized string.
 */
export function sanitizeHTML(str) {
    if (str === null || str === undefined) {
        return '';
    }
    const temp = document.createElement('div');
    temp.textContent = String(str);
    return temp.innerHTML;
}

/**
 * Escape special regex characters in a string
 * @param {string} string The string to escape
 * @returns {string} The escaped string
 */
export function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Validate if a string is safe for use in HTML attributes
 * @param {string} value The value to validate
 * @returns {boolean} True if safe, false otherwise
 */
export function isSafeAttribute(value) {
    const dangerous = /<script|javascript:|onerror=|onload=/i;
    return !dangerous.test(value);
}
