/**
 * Centralized API client for all HTTP requests
 * @module core/api
 */

import { API_CONFIG, API_PATHS } from './config.js';
import { showNotification } from '../utils/helpers.js';

/**
 * API Client class for handling all HTTP requests
 */
class APIClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.isReady = false;
    }

    /**
     * Detect and set the correct API path
     * @returns {Promise<string>} The detected API path
     */
    async detectAPIPath() {
        console.log('🔍 Détection du chemin API...');
        
        for (const path of API_PATHS) {
            try {
                const response = await fetch(`${path}/tiers.php`, { 
                    method: 'GET',
                    signal: AbortSignal.timeout(5000)
                });
                
                if (response.status !== 404) {
                    console.log(`✅ Chemin API détecté: ${path}`);
                    this.baseURL = path;
                    this.isReady = true;
                    return path;
                }
            } catch (error) {
                // Continue with next path
            }
        }
        
        console.warn('⚠️ Aucun chemin API valide détecté, utilisation du défaut:', this.baseURL);
        this.isReady = true;
        return this.baseURL;
    }

    /**
     * Make an HTTP request to the API
     * @param {string} endpoint The API endpoint (e.g., '/transactions.php')
     * @param {Object} options Request options (method, body, etc.)
     * @returns {Promise<Object>} The response data
     */
    async request(endpoint, options = {}) {
        if (!this.isReady) {
            await this.detectAPIPath();
        }

        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        // Convert body to JSON if it's an object
        if (finalOptions.body && typeof finalOptions.body === 'object') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);
            
            const response = await fetch(url, {
                ...finalOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle non-OK responses
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
            }
            
            // Handle empty responses (e.g., for DELETE)
            const text = await response.text();
            if (!text) {
                return { success: true };
            }
            
            const data = JSON.parse(text);
            
            // Check for API-level errors
            if (data.error === true || data.success === false) {
                throw new Error(data.message || 'Réponse API non réussie');
            }
            
            return data;
            
        } catch (error) {
            console.error(`Erreur API pour ${endpoint}:`, error);
            
            // Show user-friendly error message
            if (error.name === 'AbortError') {
                showNotification('Requête timeout - le serveur met trop de temps à répondre', 'error');
            } else {
                showNotification(error.message || 'Erreur de communication avec le serveur', 'error');
            }
            
            throw error;
        }
    }

    /**
     * GET request
     * @param {string} endpoint The API endpoint
     * @param {Object} params Query parameters
     * @returns {Promise<Object>} The response data
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    /**
     * POST request
     * @param {string} endpoint The API endpoint
     * @param {Object} data The request body
     * @returns {Promise<Object>} The response data
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    /**
     * PUT request
     * @param {string} endpoint The API endpoint
     * @param {Object} data The request body
     * @returns {Promise<Object>} The response data
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    /**
     * DELETE request
     * @param {string} endpoint The API endpoint
     * @returns {Promise<Object>} The response data
     */
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

// Export singleton instance
export const api = new APIClient();
