/**
 * Main application entry point - Refactored modular version
 * @module main
 * 
 * Architecture:
 * - core/: Application core (API, Store, Router, App lifecycle)
 * - services/: Business logic layer
 * - components/: UI components (to be loaded dynamically)
 * - utils/: Utility functions (formatters, validators, helpers, security)
 * 
 * This file imports and initializes all modules to start the application.
 */

// ===== CORE IMPORTS =====
import { app } from './core/app.js';
import { router } from './core/router.js';
import { store } from './core/store.js';
import { api } from './core/api.js';

// ===== SERVICE IMPORTS =====
import { transactionService } from './services/transactionService.js';
import { tiersService } from './services/tiersService.js';
import { compteService } from './services/compteService.js';
import { statsService } from './services/statsService.js';

// ===== UTILITY IMPORTS =====
import { formatCurrency, formatDate, formatDateTime } from './utils/formatters.js';
import { showNotification, debounce } from './utils/helpers.js';
import { sanitizeHTML } from './utils/security.js';

// ===== GLOBAL EXPORTS FOR LEGACY COMPATIBILITY =====
// These allow the existing HTML onclick handlers to work
window.app = app;
window.router = router;
window.store = store;
window.api = api;
window.transactionService = transactionService;
window.tiersService = tiersService;
window.compteService = compteService;
window.statsService = statsService;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.showNotification = showNotification;
window.debounce = debounce;
window.sanitizeHTML = sanitizeHTML;

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Démarrage de l\'application modulaire...');
    console.log('📦 Modules chargés:', {
        core: ['app', 'router', 'store', 'api'],
        services: ['transactionService', 'tiersService', 'compteService', 'statsService'],
        utils: ['formatters', 'validators', 'helpers', 'security']
    });
    
    try {
        // Initialize the application
        await app.initialize();
        
        console.log('✅ Application initialisée et prête');
        
    } catch (error) {
        console.error('❌ Erreur critique lors de l\'initialisation:', error);
    }
});

/**
 * Export for module usage
 */
export {
    app,
    router,
    store,
    api,
    transactionService,
    tiersService,
    compteService,
    statsService,
    formatCurrency,
    formatDate,
    formatDateTime,
    showNotification,
    sanitizeHTML
};

console.log('✅ Module principal chargé');
