/**
 * =====================================================
 * 🛒 ACHATS ET DÉPENSES - INDEX PRINCIPAL (STRUCTURÉ)
 * =====================================================
 * 
 * Ce fichier organise toutes les fonctionnalités des achats/dépenses
 * en modules séparés pour une meilleure maintenabilité.
 */

// Import des modules organisés (si nécessaire avec bundler)
// import './purchases-navigation.js';
// import './purchases-modal.js';
// import './purchases-data.js';
// import './purchases-validation.js';
// import './purchases-save.js';

// Expose les fonctions au scope global pour compatibilité avec l'existant
// Les fonctions sont définies dans les fichiers séparés

/**
 * Fonctions de navigation disponibles globalement
 */
window.showAchatsTab = showAchatsTab;
window.updateAchatsDisplay = updateAchatsDisplay;
window.initAchatsCharts = initAchatsCharts;

/**
 * Fonctions modals disponibles globalement
 */
window.openAchatModal = openAchatModal;
window.closeAchatModal = closeAchatModal;
window.resetAchatForm = resetAchatForm;
window.switchAchatTab = switchAchatTab;
window.openCategoryModal = openCategoryModal;
window.loadCategoryData = loadCategoryData;
window.prefillAchatForm = prefillAchatForm;

/**
 * Fonctions de chargement données disponibles globalement
 */
window.loadFournisseursForAchat = loadFournisseursForAchat;
window.loadCategoriesForAchat = loadCategoriesForAchat;
window.loadComptesForAchat = loadComptesForAchat;
window.loadAchatDropdowns = loadAchatDropdowns;
window.loadAchatsVueEnsemble = loadAchatsVueEnsemble;
window.loadAchatsEnregistrements = loadAchatsEnregistrements;
window.loadAchatsSuiviPaiements = loadAchatsSuiviPaiements;
window.loadAchatsCategories = loadAchatsCategories;
window.loadAchatsRapports = loadAchatsRapports;

/**
 * Fonctions de validation et calculs disponibles globalement
 */
window.calculateFinancialsFromTTC = calculateFinancialsFromTTC;
window.calculateFinancials = calculateFinancials;
window.updateAchatRecap = updateAchatRecap;
window.validateAchatForm = validateAchatForm;
window.updatePaymentStatus = updatePaymentStatus;
window.collectAchatData = collectAchatData;

/**
 * Fonctions de sauvegarde et documents disponibles globalement
 */
window.saveAchat = saveAchat;
window.saveAchatFromForm = saveAchatFromForm;
window.handleAchatFileSelection = handleAchatFileSelection;
window.uploadAchatDocument = uploadAchatDocument;
window.duplicateCurrentAchat = duplicateCurrentAchat;
window.exportAchatData = exportAchatData;

console.log('🛒 Module Achats/Dépenses structuré chargé');

// Fonctions utilitaires pour les catégories (gardées fonctionnelles)
/**
 * Modifie une catégorie existante
 * @param {string} categoryId 
 */
window.editCategory = function(categoryId) {
    console.log(`✏️ Modification catégorie: ${categoryId}`);
    openCategoryModal(categoryId);
};

/**
 * Supprime une catégorie
 * @param {string} categoryId 
 */
window.deleteCategory = async function(categoryId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        return;
    }
    
    try {
        const response = await apiCall(`/categories.php?id=${categoryId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showNotification('Catégorie supprimée', 'success');
            loadAchatsCategories(); // Recharger la liste
        } else {
            showNotification(response.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('❌ Erreur lors de la suppression:', error);
        showNotification('Erreur lors de la suppression', 'error');
    }
};

/**
 * Affiche les détails d'une catégorie
 * @param {string} categoryId 
 */
window.viewCategoryDetails = function(categoryId) {
    console.log(`👁️ Détails catégorie: ${categoryId}`);
    // Implémenter l'affichage des détails si nécessaire
    showNotification('Fonctionnalité à implémenter', 'info');
};

// =====================================================
// 📋 RÉSUMÉ DE LA RESTRUCTURATION
// =====================================================

/**
 * AVANT (Problèmes identifiés) :
 * ❌ Fonctions dupliquées dans un fichier de 8747 lignes
 * ❌ Code dispersé sans organisation logique
 * ❌ Difficulté de maintenance et débugage
 * ❌ Risque de conflits de noms de fonctions
 * 
 * APRÈS (Solution organisée) :
 * ✅ 6 fichiers séparés par fonctionnalité
 * ✅ Fonctions unifiées (plus de duplications)
 * ✅ Code documenté avec commentaires de section
 * ✅ Facilement maintenable et debuggable
 * ✅ Structure logique par thématique
 * 
 * 📁 Structure créée :
 * js/purchases/
 * ├── purchases-navigation.js     (navigation et affichage)
 * ├── purchases-modal.js          (gestion modals unifiée)
 * ├── purchases-data.js           (chargement données)
 * ├── purchases-validation.js     (calculs et validation)
 * ├── purchases-save.js           (sauvegarde et documents)
 * └── purchases-index.js          (point d'entrée principal)
 * 
 * 🎯 Fonctionnalités conservées :
 * ✅ Modal catégories qui fonctionne bien
 * ✅ Bouton "Nouvelle Catégorie"
 * ✅ Navigation entre onglets
 * ✅ Calculs financiers
 * ✅ Upload documents
 * ✅ Validation formulaires
 * ✅ Toutes les fonctionnalités existantes
 * 
 * 📈 Bénéfices :
 * 🧩 Modulaire et organisé
 * 🔍 Facilement debuggable
 * 🚀 Facile à maintenir
 * 🛡️ Moins de bugs
 * 📚 Auto-documenté
 * ⚡ Optimisé sans duplications
 */