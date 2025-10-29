/**
 * Application configuration and constants
 * @module core/config
 */

/**
 * API configuration
 */
export const API_CONFIG = {
    BASE_URL: './api',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3
};

/**
 * Possible API paths for auto-detection
 */
export const API_PATHS = [
    './api',
    'api',
    '../api',
    './test-repo-feature-comprehensive-improvements/api',
    './test-repo-feature-comprehensive-improvements/test-repo-feature-comprehensive-improvements/api'
];

/**
 * Transaction types
 */
export const TRANSACTION_TYPES = {
    RECETTE: 'recette',
    DEPENSE: 'depense',
    VIREMENT_DEBIT: 'virement_debit',
    VIREMENT_CREDIT: 'virement_credit'
};

/**
 * Account types
 */
export const ACCOUNT_TYPES = {
    CAISSE: 'caisse',
    BANQUE: 'banque'
};

/**
 * Tiers types
 */
export const TIERS_TYPES = {
    CLIENT: 'client',
    FOURNISSEUR: 'fournisseur'
};

/**
 * Application sections
 */
export const SECTIONS = {
    DASHBOARD: 'dashboard',
    TRANSACTIONS: 'transactions',
    CLIENTS: 'clients',
    FOURNISSEURS: 'fournisseurs',
    BANQUE: 'banque',
    CAISSE: 'caisse',
    RAPPORTS: 'rapports',
    PARAMETRES: 'parametres'
};

/**
 * Page titles for each section
 */
export const SECTION_TITLES = {
    [SECTIONS.DASHBOARD]: 'Tableau de bord',
    [SECTIONS.TRANSACTIONS]: 'Transactions',
    [SECTIONS.CLIENTS]: 'Gestion des Clients',
    [SECTIONS.FOURNISSEURS]: 'Gestion des Fournisseurs',
    [SECTIONS.BANQUE]: 'Comptes Bancaires',
    [SECTIONS.CAISSE]: 'Caisses',
    [SECTIONS.RAPPORTS]: 'Rapports',
    [SECTIONS.PARAMETRES]: 'Paramètres'
};

/**
 * Month names in French
 */
export const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

/**
 * Chart colors
 */
export const CHART_COLORS = {
    PRIMARY: '#2563eb',
    SUCCESS: '#10b981',
    DANGER: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6',
    SECONDARY: '#6b7280'
};

/**
 * Default pagination limit
 */
export const DEFAULT_LIMIT = 50;

/**
 * Debounce delay for search inputs (ms)
 */
export const SEARCH_DEBOUNCE_DELAY = 300;
