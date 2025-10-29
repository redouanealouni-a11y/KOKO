/**
 * Statistics Service - Handles data analysis and reporting
 * @module services/statsService
 */

import { store } from '../core/store.js';
import { transactionService } from './transactionService.js';
import { compteService } from './compteService.js';

/**
 * Statistics Service class
 */
class StatsService {
    /**
     * Calculate dashboard statistics
     * @returns {Promise<Object>} Dashboard statistics
     */
    async getDashboardStats() {
        try {
            // Get transaction stats
            const transactionStats = await transactionService.getStatistics();
            
            // Get account balances
            const comptes = store.get('comptes') || [];
            const totalBalance = comptes.reduce((sum, compte) => {
                return sum + parseFloat(compte.balance || 0);
            }, 0);
            
            return {
                totalBalance,
                totalRecettes: transactionStats.total_recettes || 0,
                totalDepenses: transactionStats.total_depenses || 0,
                totalTransactions: transactionStats.total_transactions || 0,
                netBalance: (transactionStats.total_recettes || 0) - (transactionStats.total_depenses || 0)
            };
            
        } catch (error) {
            console.error('Erreur lors du calcul des statistiques:', error);
            return {
                totalBalance: 0,
                totalRecettes: 0,
                totalDepenses: 0,
                totalTransactions: 0,
                netBalance: 0
            };
        }
    }

    /**
     * Get transaction distribution by type
     * @returns {Object} Distribution data for charts
     */
    getTransactionDistribution() {
        const transactions = store.get('transactions') || [];
        
        const recettes = transactions
            .filter(t => t.type === 'recette' || t.type === 'virement_credit')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
            
        const depenses = transactions
            .filter(t => t.type === 'depense' || t.type === 'virement_debit')
            .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
        return {
            labels: ['Recettes', 'Dépenses'],
            values: [recettes, depenses],
            colors: ['#10b981', '#ef4444']
        };
    }

    /**
     * Get account balance distribution
     * @returns {Object} Distribution data for charts
     */
    getAccountDistribution() {
        const comptes = store.get('comptes') || [];
        
        const labels = [];
        const values = [];
        const colors = [];
        
        comptes.forEach((compte, index) => {
            if (compte.is_active) {
                labels.push(compte.name);
                values.push(parseFloat(compte.balance || 0));
                // Alternate colors
                colors.push(index % 2 === 0 ? '#2563eb' : '#3b82f6');
            }
        });
        
        return { labels, values, colors };
    }

    /**
     * Get monthly transaction trends
     * @param {number} months Number of months to analyze (default: 6)
     * @returns {Object} Trend data for charts
     */
    getMonthlyTrends(months = 6) {
        const transactions = store.get('transactions') || [];
        const now = new Date();
        const monthData = [];
        
        // Initialize data structure for each month
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthData.push({
                month: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
                recettes: 0,
                depenses: 0
            });
        }
        
        // Aggregate transactions by month
        transactions.forEach(transaction => {
            const txDate = new Date(transaction.date);
            const monthDiff = (now.getFullYear() - txDate.getFullYear()) * 12 + 
                             (now.getMonth() - txDate.getMonth());
            
            if (monthDiff >= 0 && monthDiff < months) {
                const index = months - 1 - monthDiff;
                const amount = parseFloat(transaction.amount || 0);
                
                if (transaction.type === 'recette' || transaction.type === 'virement_credit') {
                    monthData[index].recettes += amount;
                } else if (transaction.type === 'depense' || transaction.type === 'virement_debit') {
                    monthData[index].depenses += amount;
                }
            }
        });
        
        return {
            labels: monthData.map(m => m.month),
            recettes: monthData.map(m => m.recettes),
            depenses: monthData.map(m => m.depenses)
        };
    }

    /**
     * Get category distribution
     * @returns {Object} Category distribution data
     */
    getCategoryDistribution() {
        const transactions = store.get('transactions') || [];
        const categories = store.get('categories') || [];
        
        const categoryMap = new Map();
        
        transactions.forEach(transaction => {
            if (transaction.category_id) {
                const amount = parseFloat(transaction.amount || 0);
                const current = categoryMap.get(transaction.category_id) || 0;
                categoryMap.set(transaction.category_id, current + amount);
            }
        });
        
        const labels = [];
        const values = [];
        
        categoryMap.forEach((amount, categoryId) => {
            const category = categories.find(c => c.id === categoryId);
            labels.push(category ? category.name : 'Non catégorisé');
            values.push(amount);
        });
        
        return { labels, values };
    }

    /**
     * Get top tiers by transaction volume
     * @param {string} type 'client' or 'fournisseur'
     * @param {number} limit Number of results (default: 5)
     * @returns {Array} Top tiers with transaction totals
     */
    getTopTiers(type, limit = 5) {
        const transactions = store.get('transactions') || [];
        const tiers = type === 'client' ? store.get('clients') : store.get('fournisseurs');
        
        const tiersMap = new Map();
        
        transactions.forEach(transaction => {
            if (transaction.tiers_id) {
                const amount = parseFloat(transaction.amount || 0);
                const current = tiersMap.get(transaction.tiers_id) || { total: 0, count: 0 };
                tiersMap.set(transaction.tiers_id, {
                    total: current.total + amount,
                    count: current.count + 1
                });
            }
        });
        
        const topTiers = [];
        tiersMap.forEach((data, tiersId) => {
            const tiersData = tiers.find(t => t.id === tiersId);
            if (tiersData) {
                topTiers.push({
                    ...tiersData,
                    transactionTotal: data.total,
                    transactionCount: data.count
                });
            }
        });
        
        return topTiers
            .sort((a, b) => b.transactionTotal - a.transactionTotal)
            .slice(0, limit);
    }

    /**
     * Calculate period comparison (current vs previous)
     * @param {string} period 'month', 'quarter', 'year'
     * @returns {Object} Comparison data
     */
    getPeriodComparison(period = 'month') {
        const transactions = store.get('transactions') || [];
        const now = new Date();
        
        let currentStart, currentEnd, previousStart, previousEnd;
        
        if (period === 'month') {
            currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
            currentEnd = now;
            previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        } else if (period === 'quarter') {
            const quarter = Math.floor(now.getMonth() / 3);
            currentStart = new Date(now.getFullYear(), quarter * 3, 1);
            currentEnd = now;
            previousStart = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
            previousEnd = new Date(now.getFullYear(), quarter * 3, 0);
        } else { // year
            currentStart = new Date(now.getFullYear(), 0, 1);
            currentEnd = now;
            previousStart = new Date(now.getFullYear() - 1, 0, 1);
            previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        }
        
        const calculatePeriodStats = (start, end) => {
            const filtered = transactions.filter(t => {
                const txDate = new Date(t.date);
                return txDate >= start && txDate <= end;
            });
            
            return {
                recettes: filtered
                    .filter(t => t.type === 'recette' || t.type === 'virement_credit')
                    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
                depenses: filtered
                    .filter(t => t.type === 'depense' || t.type === 'virement_debit')
                    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
                count: filtered.length
            };
        };
        
        const current = calculatePeriodStats(currentStart, currentEnd);
        const previous = calculatePeriodStats(previousStart, previousEnd);
        
        return {
            current,
            previous,
            changes: {
                recettes: previous.recettes ? ((current.recettes - previous.recettes) / previous.recettes * 100) : 0,
                depenses: previous.depenses ? ((current.depenses - previous.depenses) / previous.depenses * 100) : 0,
                count: previous.count ? ((current.count - previous.count) / previous.count * 100) : 0
            }
        };
    }
}

// Export singleton instance
export const statsService = new StatsService();
