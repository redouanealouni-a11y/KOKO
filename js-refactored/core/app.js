/**
 * Main application initialization and lifecycle management
 * @module core/app
 */

import { api } from './api.js';
import { store } from './store.js';
import { router } from './router.js';
import { showNotification } from '../utils/helpers.js';

/**
 * Application class - Main entry point
 */
class Application {
    constructor() {
        this.isInitialized = false;
        this.connectionStatus = 'disconnected';
    }

    /**
     * Initialize the application
     */
    async initialize() {
        if (this.isInitialized) {
            console.warn('Application déjà initialisée');
            return;
        }

        console.log('🚀 Initialisation de l\'application PHP/PostgreSQL...');
        
        try {
            // Show loading status
            this.updateConnectionStatus('loading', 'Chargement...');
            
            // Set initial date in transaction form
            this.setInitialDates();
            
            // Detect API path
            await api.detectAPIPath();
            
            // Load initial data
            await this.loadInitialData();
            
            // Initialize router with section handlers
            this.registerSectionHandlers();
            
            // Navigate to dashboard
            router.navigateTo('dashboard');
            
            // Update connection status
            this.updateConnectionStatus('success', 'Connecté');
            this.connectionStatus = 'connected';
            this.isInitialized = true;
            
            console.log('✅ Application initialisée avec succès');
            showNotification('Application prête', 'success', 2000);
            
        } catch (error) {
            console.error('❌ Erreur d\'initialisation:', error);
            this.updateConnectionStatus('error', 'Erreur de connexion');
            this.connectionStatus = 'error';
            
            // Show specific error message
            if (error.message.includes('404') || error.message.includes('fetch')) {
                showNotification('Erreur: API non trouvée. Vérifiez la structure des fichiers.', 'error', 5000);
            } else {
                showNotification('Erreur de connexion à la base de données', 'error', 5000);
            }
        }
    }

    /**
     * Load initial application data
     */
    async loadInitialData() {
        console.log('📥 Chargement des données initiales...');
        
        try {
            const [settings, categories, comptes, clients, fournisseurs] = await Promise.all([
                api.get('/settings.php').catch(() => ({ data: {} })),
                api.get('/categories.php').catch(() => ({ data: [] })),
                api.get('/comptes.php').catch(() => ({ data: [] })),
                api.get('/tiers.php', { type: 'client' }).catch(() => ({ data: [] })),
                api.get('/tiers.php', { type: 'fournisseur' }).catch(() => ({ data: [] }))
            ]);
            
            store.setState({
                settings: settings.data || {},
                categories: categories.data || [],
                comptes: comptes.data || [],
                clients: clients.data || [],
                fournisseurs: fournisseurs.data || []
            });
            
            console.log('✅ Données initiales chargées:', store.getState());
            
        } catch (error) {
            console.error('❌ Erreur lors du chargement des données:', error);
            throw error;
        }
    }

    /**
     * Register section handlers with the router
     */
    registerSectionHandlers() {
        // These will be imported and registered by component modules
        // This is a placeholder for the pattern
    }

    /**
     * Set initial dates in forms
     */
    setInitialDates() {
        const today = new Date().toISOString().split('T')[0];
        const transactionDateInput = document.getElementById('transaction-date');
        if (transactionDateInput) {
            transactionDateInput.value = today;
        }
    }

    /**
     * Update connection status display
     * @param {string} status The status ('success', 'error', 'loading')
     * @param {string} message The status message
     */
    updateConnectionStatus(status, message) {
        const statusElement = document.getElementById('connection-status');
        const textElement = document.getElementById('status-text');
        
        if (!statusElement || !textElement) return;
        
        statusElement.className = 'px-3 py-1 rounded-full text-sm';
        
        const statusClasses = {
            success: 'bg-green-100 text-green-800',
            error: 'bg-red-100 text-red-800',
            loading: 'bg-yellow-100 text-yellow-800'
        };
        
        const classes = statusClasses[status] || 'bg-gray-100 text-gray-800';
        statusElement.classList.add(...classes.split(' '));
        textElement.textContent = message;
    }

    /**
     * Refresh all data
     */
    async refresh() {
        console.log('🔄 Actualisation des données...');
        
        try {
            await this.loadInitialData();
            
            // Trigger current section refresh
            const currentSection = router.getCurrentSection();
            router.navigateTo(currentSection);
            
            showNotification('Données actualisées', 'success', 2000);
            
        } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
            showNotification('Erreur lors de l\'actualisation', 'error');
        }
    }

    /**
     * Get connection status
     * @returns {string} The current connection status
     */
    getConnectionStatus() {
        return this.connectionStatus;
    }
}

// Export singleton instance
export const app = new Application();

/**
 * Global refresh function for backwards compatibility
 */
window.refreshData = function() {
    app.refresh();
};
