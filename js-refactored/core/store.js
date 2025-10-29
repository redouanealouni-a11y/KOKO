/**
 * Centralized state management (Store pattern)
 * @module core/store
 */

import { debounce } from '../utils/helpers.js';

/**
 * Application state store
 */
class Store {
    constructor() {
        this.state = {
            // Core data
            transactions: [],
            comptes: [],
            categories: [],
            clients: [],
            fournisseurs: [],
            settings: {},
            
            // UI state
            currentSection: 'dashboard',
            currentTiersType: 'client',
            currentAccountType: 'caisse',
            editingId: null,
            
            // Filter states
            transactionFilters: {},
            clientFilters: {},
            fournisseurFilters: {},
            
            // Loading states
            isLoading: false,
            loadingMessage: ''
        };
        
        this.listeners = new Map();
        this.charts = {};
    }

    /**
     * Get the current state
     * @returns {Object} The current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Get a specific state property
     * @param {string} key The property key
     * @returns {*} The property value
     */
    get(key) {
        return this.state[key];
    }

    /**
     * Set state properties
     * @param {Object} updates Object with properties to update
     */
    setState(updates) {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        // Notify listeners of state change
        this.notifyListeners(oldState, this.state);
    }

    /**
     * Subscribe to state changes
     * @param {string} key The state key to watch (or '*' for all)
     * @param {Function} callback The callback function
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        
        this.listeners.get(key).push(callback);
        
        // Return unsubscribe function
        return () => {
            const callbacks = this.listeners.get(key);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Notify listeners of state changes
     * @param {Object} oldState The previous state
     * @param {Object} newState The new state
     */
    notifyListeners(oldState, newState) {
        // Notify specific key listeners
        Object.keys(newState).forEach(key => {
            if (oldState[key] !== newState[key] && this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    callback(newState[key], oldState[key]);
                });
            }
        });
        
        // Notify wildcard listeners
        if (this.listeners.has('*')) {
            this.listeners.get('*').forEach(callback => {
                callback(newState, oldState);
            });
        }
    }

    /**
     * Get chart instance
     * @param {string} chartId The chart identifier
     * @returns {Object} The chart instance
     */
    getChart(chartId) {
        return this.charts[chartId];
    }

    /**
     * Set chart instance
     * @param {string} chartId The chart identifier
     * @param {Object} chart The chart instance
     */
    setChart(chartId, chart) {
        // Destroy existing chart if it exists
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
        }
        this.charts[chartId] = chart;
    }

    /**
     * Clear all data
     */
    clearData() {
        this.setState({
            transactions: [],
            comptes: [],
            categories: [],
            clients: [],
            fournisseurs: []
        });
    }

    /**
     * Reset filters
     * @param {string} type The filter type ('transaction', 'client', 'fournisseur', or 'all')
     */
    resetFilters(type = 'all') {
        const updates = {};
        
        if (type === 'all' || type === 'transaction') {
            updates.transactionFilters = {};
        }
        if (type === 'all' || type === 'client') {
            updates.clientFilters = {};
        }
        if (type === 'all' || type === 'fournisseur') {
            updates.fournisseurFilters = {};
        }
        
        this.setState(updates);
    }
}

// Export singleton instance
export const store = new Store();
