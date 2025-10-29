/**
 * Transaction Service - Handles all transaction-related business logic
 * @module services/transactionService
 */

import { api } from '../core/api.js';
import { store } from '../core/store.js';
import { validateTransaction } from '../utils/validators.js';
import { showNotification } from '../utils/helpers.js';

/**
 * Transaction Service class
 */
class TransactionService {
    /**
     * Load transactions with optional filters
     * @param {Object} filters Filter parameters
     * @returns {Promise<Array>} Array of transactions
     */
    async loadTransactions(filters = {}) {
        try {
            const response = await api.get('/transactions.php', filters);
            const transactions = response.data || [];
            
            store.setState({ transactions });
            return transactions;
            
        } catch (error) {
            console.error('Erreur lors du chargement des transactions:', error);
            showNotification('Erreur lors du chargement des transactions', 'error');
            throw error;
        }
    }

    /**
     * Get a single transaction by ID
     * @param {string} id Transaction ID
     * @returns {Promise<Object>} Transaction object
     */
    async getTransaction(id) {
        try {
            const response = await api.get('/transactions.php', { id });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération de la transaction:', error);
            throw error;
        }
    }

    /**
     * Create a new transaction
     * @param {Object} transactionData Transaction data
     * @returns {Promise<Object>} Created transaction
     */
    async createTransaction(transactionData) {
        // Validate data
        const validation = validateTransaction(transactionData);
        if (!validation.isValid) {
            const errorMessage = validation.errors.join(', ');
            showNotification(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        try {
            const response = await api.post('/transactions.php', transactionData);
            
            showNotification(response.message || 'Transaction créée avec succès', 'success');
            
            // Reload transactions
            await this.loadTransactions();
            
            return response.data;
            
        } catch (error) {
            console.error('Erreur lors de la création de la transaction:', error);
            showNotification(error.message || 'Erreur lors de la création de la transaction', 'error');
            throw error;
        }
    }

    /**
     * Update an existing transaction
     * @param {string} id Transaction ID
     * @param {Object} transactionData Updated transaction data
     * @returns {Promise<Object>} Updated transaction
     */
    async updateTransaction(id, transactionData) {
        // Validate data
        const validation = validateTransaction(transactionData);
        if (!validation.isValid) {
            const errorMessage = validation.errors.join(', ');
            showNotification(errorMessage, 'error');
            throw new Error(errorMessage);
        }

        try {
            const response = await api.put(`/transactions.php?id=${id}`, transactionData);
            
            showNotification(response.message || 'Transaction mise à jour avec succès', 'success');
            
            // Reload transactions
            await this.loadTransactions();
            
            return response.data;
            
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la transaction:', error);
            showNotification(error.message || 'Erreur lors de la mise à jour', 'error');
            throw error;
        }
    }

    /**
     * Delete a transaction
     * @param {string} id Transaction ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteTransaction(id) {
        try {
            const response = await api.delete(`/transactions.php?id=${id}`);
            
            showNotification(response.message || 'Transaction supprimée avec succès', 'success');
            
            // Reload transactions
            await this.loadTransactions();
            
            return true;
            
        } catch (error) {
            console.error('Erreur lors de la suppression de la transaction:', error);
            showNotification(error.message || 'Erreur lors de la suppression', 'error');
            throw error;
        }
    }

    /**
     * Create a transfer between accounts
     * @param {Object} transferData Transfer data (from_account_id, to_account_id, amount, description)
     * @returns {Promise<Object>} Transfer result
     */
    async createTransfer(transferData) {
        const { from_account_id, to_account_id, amount, description } = transferData;

        // Validation
        if (!from_account_id || !to_account_id) {
            const error = 'Les comptes source et destination sont requis';
            showNotification(error, 'error');
            throw new Error(error);
        }

        if (from_account_id === to_account_id) {
            const error = 'Les comptes source et destination doivent être différents';
            showNotification(error, 'error');
            throw new Error(error);
        }

        if (!amount || parseFloat(amount) <= 0) {
            const error = 'Le montant doit être supérieur à 0';
            showNotification(error, 'error');
            throw new Error(error);
        }

        try {
            const response = await api.post('/transactions.php/transfer', {
                from_account_id,
                to_account_id,
                amount: parseFloat(amount),
                description: description || 'Virement de fonds'
            });
            
            showNotification(response.message || 'Virement effectué avec succès', 'success');
            
            // Reload transactions and accounts
            await this.loadTransactions();
            
            return response.data;
            
        } catch (error) {
            console.error('Erreur lors du virement:', error);
            showNotification(error.message || 'Erreur lors du virement', 'error');
            throw error;
        }
    }

    /**
     * Get transaction statistics
     * @param {Object} filters Optional date filters
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics(filters = {}) {
        try {
            const response = await api.get('/transactions.php/stats', filters);
            return response.data || {
                total_transactions: 0,
                total_recettes: 0,
                total_depenses: 0
            };
        } catch (error) {
            console.error('Erreur lors de la récupération des statistiques:', error);
            return {
                total_transactions: 0,
                total_recettes: 0,
                total_depenses: 0
            };
        }
    }

    /**
     * Filter transactions in memory
     * @param {Array} transactions Array of transactions
     * @param {Object} filters Filter criteria
     * @returns {Array} Filtered transactions
     */
    filterTransactions(transactions, filters) {
        let filtered = [...transactions];

        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filtered = filtered.filter(t => 
                (t.description && t.description.toLowerCase().includes(searchTerm)) ||
                (t.reference && t.reference.toLowerCase().includes(searchTerm)) ||
                (t.tiers_name && t.tiers_name.toLowerCase().includes(searchTerm)) ||
                (t.category_name && t.category_name.toLowerCase().includes(searchTerm))
            );
        }

        if (filters.type) {
            filtered = filtered.filter(t => t.type === filters.type);
        }

        if (filters.account_id) {
            filtered = filtered.filter(t => t.account_id === filters.account_id);
        }

        if (filters.tiers_id) {
            filtered = filtered.filter(t => t.tiers_id === filters.tiers_id);
        }

        if (filters.category_id) {
            filtered = filtered.filter(t => t.category_id === filters.category_id);
        }

        if (filters.month) {
            const month = parseInt(filters.month);
            filtered = filtered.filter(t => {
                const txDate = new Date(t.date);
                return txDate.getMonth() + 1 === month;
            });
        }

        return filtered;
    }
}

// Export singleton instance
export const transactionService = new TransactionService();
