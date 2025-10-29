/**
 * =====================================================
 * 🛒 SECTION: ACHATS ET DÉPENSES - MODALS PRINCIPALES
 * =====================================================
 * 
 * Fonctions de gestion des modals pour les achats
 * UNIFICATION: Élimination des fonctions dupliquées
 */

/**
 * =====================================================
 * 🎯 MODAL ACHAT PRINCIPAL (UNIFIÉE)
 * =====================================================
 */

/**
 * Ouvre la modal d'ajout/modification d'achat (VERSION UNIFIÉE)
 */
function openAchatModal(achatId = null) {
    console.log(`🛒 Ouverture modal achat ${achatId ? '(modification)' : '(nouvel achat)'}...`);
    
    const modal = document.getElementById('achatModal');
    if (!modal) {
        console.error('❌ Modal achat non trouvé');
        return;
    }
    
    // Réinitialiser le formulaire
    resetAchatForm();
    
    // Configurer le titre selon le mode
    const title = modal.querySelector('.modal-header h2');
    if (title) {
        title.innerHTML = achatId 
            ? '<i class="fas fa-edit"></i> Modifier Achat'
            : '<i class="fas fa-shopping-cart"></i> Nouvel Achat';
    }
    
    // Charger les données si c'est une modification
    if (achatId) {
        loadAchatForEdit(achatId);
    }
    
    // Charger les listes déroulantes
    loadAchatDropdowns();
    
    // Afficher la modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Focus sur le premier champ
    setTimeout(() => {
        const firstInput = modal.querySelector('#achat-fournisseur');
        if (firstInput) firstInput.focus();
    }, 100);
    
    console.log('✅ Modal achat ouverte');
}

/**
 * Ferme la modal d'achat (VERSION UNIFIÉE)
 */
function closeAchatModal() {
    const modal = document.getElementById('achatModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('❌ Modal achat fermée');
    }
}

/**
 * Réinitialise le formulaire d'achat (VERSION UNIFIÉE)
 */
function resetAchatForm() {
    const form = document.getElementById('form-achat') || modal?.querySelector('form');
    if (form) {
        form.reset();
        console.log('🔄 Formulaire achat réinitialisé');
    }
    
    // Réinitialiser les champs spécifiques
    const today = new Date().toISOString().split('T')[0];
    const dateField = document.getElementById('achat-date-facture');
    if (dateField) {
        dateField.value = today;
    }
    
    // Réinitialiser le récapitulatif
    updateAchatRecap();
    
    // Réinitialiser le fichier d'upload
    const uploadZone = document.getElementById('upload-zone');
    const uploadedFiles = document.getElementById('uploaded-files');
    if (uploadZone) uploadZone.classList.remove('has-files');
    if (uploadedFiles) uploadedFiles.innerHTML = '';
}

/**
 * Navigue entre les onglets du modal achat
 * @param {string} tabName - Nom de l'onglet à afficher
 */
function switchAchatTab(tabName) {
    console.log(`🔄 Basculement vers onglet modal: ${tabName}`);
    
    // Désactiver tous les onglets
    const allTabButtons = document.querySelectorAll('.modal .tab-btn');
    const allTabContents = document.querySelectorAll('.modal .tab-content');
    
    allTabButtons.forEach(btn => btn.classList.remove('active'));
    allTabContents.forEach(content => content.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    const activeButton = document.querySelector(`.tab-btn[onclick="switchAchatTab('${tabName}')"]`);
    const activeContent = document.getElementById(`tab-${tabName}`);
    
    if (activeButton) activeButton.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
    
    // Actions spécifiques par onglet
    switch (tabName) {
        case 'main-info':
            updateAchatRecap();
            break;
        case 'financial':
            calculateFinancialsFromTTC();
            break;
        case 'payment':
            updatePaymentStatus();
            break;
    }
}

/**
 * =====================================================
 * 🎯 MODAL CATÉGORIES (EXISTANT - FONCTIONNEL)
 * =====================================================
 */

/**
 * Ouvre la modal de gestion des catégories
 * @param {number|null} categorieId - ID de la catégorie à modifier (null pour nouvelle)
 */
// =====================================================
// 🏷️ MODAL CATÉGORIES - GESTION
// =====================================================
// NOTE: openCategoryModal est dans main.js (version principale)
//       Ce fichier ne contient que les fonctions de support

/**
 * NOTE: closeCategoryModal() est définie dans main.js pour éviter les doublons
 * et conflits. La version main.js utilise modal.classList.remove('show') qui
 * est compatible avec le système de classes du modal. Ne pas redéfinir ici.
 */

/**
 * Charge les données d'une catégorie pour modification
 * @param {number} categorieId 
 */
async function loadCategoryData(categorieId) {
    try {
        const response = await apiCall(`/categories.php?id=${categorieId}`);
        if (response.success && response.data) {
            const category = response.data;
            
            // Remplir le formulaire
            document.getElementById('categorie-id').value = category.id;
            document.getElementById('categorie-nom').value = category.nom;
            document.getElementById('categorie-description').value = category.description || '';
            document.getElementById('categorie-type').value = category.type || 'depense';
            document.getElementById('categorie-actif').checked = category.actif;
            
            console.log('✅ Données catégorie chargées pour modification');
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données catégorie:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

/**
 * =====================================================
 * 🔧 FONCTIONS UTILITAIRES MODAL
 * =====================================================
 */

/**
 * Charge les données d'un achat pour modification
 * @param {number} achatId 
 */
async function loadAchatForEdit(achatId) {
    try {
        const response = await apiCall(`/transactions.php?id=${achatId}&type=achat`);
        if (response.success && response.data) {
            const achat = response.data;
            
            // Remplir le formulaire avec les données existantes
            prefillAchatForm(achat);
            console.log('✅ Données achat chargées pour modification');
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des données achat:', error);
        showNotification('Erreur lors du chargement des données', 'error');
    }
}

/**
 * Remplit le formulaire avec les données d'un achat
 * @param {Object} achatData 
 */
function prefillAchatForm(achatData) {
    // Informations principales
    if (achatData.fournisseur_id) {
        document.getElementById('achat-fournisseur').value = achatData.fournisseur_id;
    }
    if (achatData.reference) {
        document.getElementById('achat-reference').value = achatData.reference;
    }
    if (achatData.description) {
        document.getElementById('achat-description').value = achatData.description;
    }
    if (achatData.montant_ttc) {
        document.getElementById('achat-montant-ttc').value = achatData.montant_ttc;
    }
    if (achatData.date_facture) {
        document.getElementById('achat-date-facture').value = achatData.date_facture;
    }
    if (achatData.date_echeance) {
        document.getElementById('achat-date-echeance').value = achatData.date_echeance;
    }
    
    // Informations financières
    if (achatData.montant_ht) {
        document.getElementById('achat-montant-ht').value = achatData.montant_ht;
    }
    if (achatData.taux_tva) {
        document.getElementById('achat-taux-tva').value = achatData.taux_tva;
    }
    if (achatData.remise) {
        document.getElementById('achat-remise').value = achatData.remise;
    }
    if (achatData.timbre) {
        document.getElementById('achat-timbre').value = achatData.timbre;
    }
    
    // Paiement
    if (achatData.mode_paiement) {
        document.getElementById('achat-mode-paiement').value = achatData.mode_paiement;
    }
    if (achatData.compte_id) {
        document.getElementById('achat-compte').value = achatData.compte_id;
    }
    if (achatData.statut_paiement) {
        document.getElementById('achat-statut').value = achatData.statut_paiement;
    }
    
    updateAchatRecap();
}