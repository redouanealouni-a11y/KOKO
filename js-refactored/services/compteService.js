/**
 * Compte Service - Handles account (banque/caisse) business logic
 * @module services/compteService
 */

import { api } from '../core/api.js';
import { store } from '../core/store.js';
import { isNotEmpty, isPositiveNumber } from '../utils/validators.js';
import { showNotification } from '../utils/helpers.js';

/**
 * Compte Service class
 */
class CompteService {
    /**
     * Load all accounts
     * @returns {Promise<Array>} Array of accounts
     */
    async loadComptes() {
        try {
            const response = await api.get('/comptes.php');
            const comptes = response.data || [];
            
            store.setState({ comptes });
            return comptes;
            
        } catch (error) {
            console.error('Erreur lors du chargement des comptes:', error);
            showNotification('Erreur lors du chargement des comptes', 'error');
            throw error;
        }
    }

    /**
     * Get a single account by ID
     * @param {string} id Account ID
     * @returns {Promise<Object>} Account object
     */
    async getCompte(id) {
        try {
            const response = await api.get('/comptes.php', { id });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération du compte:', error);
            throw error;
        }
    }

    /**
     * Create a new account
     * @param {Object} compteData Account data
     * @returns {Promise<Object>} Created account
     */
    async createCompte(compteData) {
        // Validation
        const errors = [];
        
        if (!isNotEmpty(compteData.name)) {
            errors.push('Le nom du compte est requis');
        }
        
        if (!compteData.type || !['caisse', 'banque'].includes(compteData.type)) {
            errors.push('Le type de compte est requis (caisse ou banque)');
        }
        
        if (compteData.initial_balance && !isPositiveNumber(compteData.initial_balance)) {
            errors.push('Le solde initial doit être un nombre positif');
        }
        
        if (errors.length > 0) {
            const errorMessage = errors.join(', ');
            showNotification(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        try {
            const response = await api.post('/comptes.php', compteData);
            
            showNotification(response.message || 'Compte créé avec succès', 'success');
            
            // Reload accounts
            await this.loadComptes();
            
            return response.data;
            
        } catch (error) {
            console.error('Erreur lors de la création du compte:', error);
            showNotification(error.message || 'Erreur lors de la création du compte', 'error');
            throw error;
        }
    }

    /**
     * Update an existing account
     * @param {string} id Account ID
     * @param {Object} compteData Updated account data
     * @returns {Promise<Object>} Updated account
     */
    async updateCompte(id, compteData) {
        // Validation
        const errors = [];
        
        if (!isNotEmpty(compteData.name)) {
            errors.push('Le nom du compte est requis');
        }
        
        if (errors.length > 0) {
            const errorMessage = errors.join(', ');
            showNotification(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        try {
            const response = await api.put(`/comptes.php?id=${id}`, compteData);
            
            showNotification(response.message || 'Compte mis à jour avec succès', 'success');
            
            // Reload accounts
            await this.loadComptes();
            
            return response.data;
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour du compte:', error);
            showNotification(error.message || 'Erreur lors de la mise à jour', 'error');
            throw error;
        }
    }

    /**
     * Delete an account
     * @param {string} id Account ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteCompte(id) {
        try {
            const response = await api.delete(`/comptes.php?id=${id}`);
            
            showNotification(response.message || 'Compte supprimé avec succès', 'success');
            
            // Reload accounts
            await this.loadComptes();
            
            return true;
            
        } catch (error) {
            console.error('Erreur lors de la suppression du compte:', error);
            showNotification(error.message || 'Erreur lors de la suppression', 'error');
            throw error;
        }
    }

    /**
     * Get accounts by type
     * @param {string} type 'caisse' or 'banque'
     * @returns {Array} Filtered accounts
     */
    getComptesByType(type) {
        const comptes = store.get('comptes') || [];
        return comptes.filter(compte => compte.type === type && compte.is_active);
    }

    /**
     * Calculate total balance for a specific account type
     * @param {string} type 'caisse' or 'banque'
     * @returns {number} Total balance
     */
    getTotalBalanceByType(type) {
        const comptes = this.getComptesByType(type);
        return comptes.reduce((total, compte) => {
            return total + parseFloat(compte.balance || 0);
        }, 0);
    }

    /**
     * Get account statistics
     * @param {string} id Account ID
     * @returns {Promise<Object>} Account statistics
     */
    async getCompteStats(id) {
        try {
            const response = await api.get(`/comptes.php`, { id, stats: true });
            return response.data || {};
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return {};
        }
    }
}

// Export singleton instance
export const compteService = new CompteService();
