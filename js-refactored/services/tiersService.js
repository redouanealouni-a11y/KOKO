/**
 * Tiers Service - Handles clients and fournisseurs business logic
 * @module services/tiersService
 */

import { api } from '../core/api.js';
import { store } from '../core/store.js';
import { validateTiers } from '../utils/validators.js';
import { showNotification } from '../utils/helpers.js';

/**
 * Tiers Service class
 */
class TiersService {
    /**
     * Load tiers (clients or fournisseurs)
     * @param {string} type 'client' or 'fournisseur'
     * @returns {Promise<Array>} Array of tiers
     */
    async loadTiers(type) {
        try {
            const response = await api.get('/tiers.php', { type });
            const tiers = response.data || [];
            
            if (type === 'client') {
                store.setState({ clients: tiers });
            } else if (type === 'fournisseur') {
                store.setState({ fournisseurs: tiers });
            }
            
            return tiers;
            
        } catch (error) {
            console.error(`Erreur lors du chargement des ${type}s:`, error);
            showNotification(`Erreur lors du chargement des ${type}s`, 'error');
            throw error;
        }
    }

    /**
     * Get a single tiers by ID
     * @param {string} id Tiers ID
     * @returns {Promise<Object>} Tiers object
     */
    async getTiers(id) {
        try {
            const response = await api.get('/tiers.php', { id });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération du tiers:', error);
            throw error;
        }
    }

    /**
     * Create a new tiers
     * @param {Object} tiersData Tiers data
     * @returns {Promise<Object>} Created tiers
     */
    async createTiers(tiersData) {
        // Validate data
        const validation = validateTiers(tiersData);
        if (!validation.isValid) {
            const errorMessage = validation.errors.join(', ');
            showNotification(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        try {
            const response = await api.post('/tiers.php', tiersData);
            
            const typeName = tiersData.type === 'client' ? 'Client' : 'Fournisseur';
            showNotification(response.message || `${typeName} créé avec succès`, 'success');
            
            // Reload tiers
            await this.loadTiers(tiersData.type);
            
            return response.data;
            
        } catch (error) {
            console.error('Erreur lors de la création du tiers:', error);
            showNotification(error.message || 'Erreur lors de la création', 'error');
            throw error;
        }
    }

    /**
     * Update an existing tiers
     * @param {string} id Tiers ID
     * @param {Object} tiersData Updated tiers data
     * @returns {Promise<Object>} Updated tiers
     */
    async updateTiers(id, tiersData) {
        // Validate data
        const validation = validateTiers(tiersData);
        if (!validation.isValid) {
            const errorMessage = validation.errors.join(', ');
            showNotification(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        try {
            const response = await api.put(`/tiers.php?id=${id}`, tiersData);
            
            const typeName = tiersData.type === 'client' ? 'Client' : 'Fournisseur';
            showNotification(response.message || `${typeName} mis à jour avec succès`, 'success');
            
            // Reload tiers
            await this.loadTiers(tiersData.type);
            
            return response.data;
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour du tiers:', error);
            showNotification(error.message || 'Erreur lors de la mise à jour', 'error');
            throw error;
        }
    }

    /**
     * Delete a tiers
     * @param {string} id Tiers ID
     * @param {string} type 'client' or 'fournisseur'
     * @returns {Promise<boolean>} Success status
     */
    async deleteTiers(id, type) {
        try {
            const response = await api.delete(`/tiers.php?id=${id}`);
            
            const typeName = type === 'client' ? 'Client' : 'Fournisseur';
            showNotification(response.message || `${typeName} supprimé avec succès`, 'success');
            
            // Reload tiers
            await this.loadTiers(type);
            
            return true;
            
        } catch (error) {
            console.error('Erreur lors de la suppression du tiers:', error);
            showNotification(error.message || 'Erreur lors de la suppression', 'error');
            throw error;
        }
    }

    /**
     * Search tiers by term
     * @param {Array} tiersList Array of tiers
     * @param {string} searchTerm Search term
     * @returns {Array} Filtered tiers
     */
    searchTiers(tiersList, searchTerm) {
        if (!searchTerm || searchTerm.trim() === '') {
            return tiersList;
        }

        const term = searchTerm.toLowerCase();
        return tiersList.filter(tiers => 
            (tiers.raison_sociale && tiers.raison_sociale.toLowerCase().includes(term)) ||
            (tiers.code && tiers.code.toLowerCase().includes(term)) ||
            (tiers.contact && tiers.contact.toLowerCase().includes(term)) ||
            (tiers.email && tiers.email.toLowerCase().includes(term)) ||
            (tiers.telephone && tiers.telephone.toLowerCase().includes(term))
        );
    }

    /**
     * Filter tiers by various criteria
     * @param {Array} tiersList Array of tiers
     * @param {Object} filters Filter criteria
     * @returns {Array} Filtered tiers
     */
    filterTiers(tiersList, filters) {
        let filtered = [...tiersList];

        // Search filter
        if (filters.search) {
            filtered = this.searchTiers(filtered, filters.search);
        }

        // Solde filter
        if (filters.solde) {
            switch (filters.solde) {
                case 'debiteur':
                    filtered = filtered.filter(t => parseFloat(t.solde || 0) > 0);
                    break;
                case 'crediteur':
                    filtered = filtered.filter(t => parseFloat(t.solde || 0) < 0);
                    break;
                case 'equilibre':
                    filtered = filtered.filter(t => parseFloat(t.solde || 0) === 0);
                    break;
            }
        }

        // Status filter
        if (filters.statut) {
            const isActive = filters.statut === 'actif';
            filtered = filtered.filter(t => t.is_active === isActive);
        }

        return filtered;
    }
}

// Export singleton instance
export const tiersService = new TiersService();
