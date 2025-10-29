/**
 * General helper utilities
 * @module utils/helpers
 */

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func The function to debounce
 * @param {number} wait The delay in milliseconds
 * @returns {Function} The debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show a notification toast message
 * @param {string} message The message to display
 * @param {string} type The type of notification ('success', 'error', 'warning', 'info')
 * @param {number} duration Duration in milliseconds (default: 3000)
 */
export function showNotification(message, type = 'info', duration = 3000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        max-width: 400px;
        animation: slideIn 0.3s ease-in-out;
    `;
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.borderLeft = `4px solid ${colors[type] || colors.info}`;
    
    // Add icon
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span style="font-size: 1.5rem; color: ${colors[type]}">${icons[type]}</span>
            <span style="color: #374151;">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after duration
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

/**
 * Generate a unique ID
 * @returns {string} A unique identifier
 */
export function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone an object
 * @param {*} obj The object to clone
 * @returns {*} The cloned object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Get query parameter from URL
 * @param {string} param The parameter name
 * @returns {string|null} The parameter value or null
 */
export function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

/**
 * Confirm action with user
 * @param {string} message The confirmation message
 * @returns {boolean} True if confirmed, false otherwise
 */
export function confirmAction(message) {
    return window.confirm(message);
}

/**
 * Sort array of objects by a property
 * @param {Array} array The array to sort
 * @param {string} property The property name to sort by
 * @param {string} order 'asc' or 'desc' (default: 'asc')
 * @returns {Array} The sorted array
 */
export function sortBy(array, property, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];
        
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Filter array by search term across multiple properties
 * @param {Array} array The array to filter
 * @param {string} searchTerm The search term
 * @param {string[]} properties The properties to search in
 * @returns {Array} The filtered array
 */
export function searchInArray(array, searchTerm, properties) {
    if (!searchTerm || searchTerm.trim() === '') return array;
    
    const term = searchTerm.toLowerCase();
    
    return array.filter(item => {
        return properties.some(prop => {
            const value = String(item[prop] || '').toLowerCase();
            return value.includes(term);
        });
    });
}
