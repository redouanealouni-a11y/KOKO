/**
 * Validation utilities for form inputs
 * @module utils/validators
 */

/**
 * Validate if a value is a valid email address
 * @param {string} email The email to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate if a value is a valid phone number (French format)
 * @param {string} phone The phone number to validate
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidPhone(phone) {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(phone);
}

/**
 * Validate if a value is a positive number
 * @param {*} value The value to validate
 * @returns {boolean} True if valid positive number, false otherwise
 */
export function isPositiveNumber(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
}

/**
 * Validate if a string is not empty
 * @param {string} str The string to validate
 * @returns {boolean} True if not empty, false otherwise
 */
export function isNotEmpty(str) {
    return typeof str === 'string' && str.trim().length > 0;
}

/**
 * Validate required fields in an object
 * @param {Object} data The data object to validate
 * @param {string[]} requiredFields Array of required field names
 * @returns {Object} Object with isValid boolean and errors array
 */
export function validateRequired(data, requiredFields) {
    const errors = [];
    
    requiredFields.forEach(field => {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            errors.push(`Le champ "${field}" est requis`);
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate a transaction object
 * @param {Object} transaction The transaction data
 * @returns {Object} Validation result with isValid and errors
 */
export function validateTransaction(transaction) {
    const errors = [];
    
    if (!transaction.type) {
        errors.push('Le type de transaction est requis');
    }
    
    if (!transaction.description || transaction.description.trim() === '') {
        errors.push('La description est requise');
    }
    
    if (!isPositiveNumber(transaction.amount)) {
        errors.push('Le montant doit être un nombre positif');
    }
    
    if (!transaction.account_id) {
        errors.push('Le compte est requis');
    }
    
    if (!transaction.date) {
        errors.push('La date est requise');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate a tiers (client/fournisseur) object
 * @param {Object} tiers The tiers data
 * @returns {Object} Validation result
 */
export function validateTiers(tiers) {
    const errors = [];
    
    if (!tiers.raison_sociale || tiers.raison_sociale.trim() === '') {
        errors.push('La raison sociale est requise');
    }
    
    if (tiers.email && !isValidEmail(tiers.email)) {
        errors.push('L\'adresse email n\'est pas valide');
    }
    
    if (tiers.telephone && !isValidPhone(tiers.telephone)) {
        errors.push('Le numéro de téléphone n\'est pas valide');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
