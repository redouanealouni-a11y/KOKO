/**
 * ============================================================================
 * FONCTIONS DE GESTION DES VIREMENTS - VERSION ORGANISÉE ET DOCUMENTÉE
 * ============================================================================
 * 
 * Ce fichier contient toutes les fonctions relatives à la gestion des virements
 * (transferts entre comptes) avec une architecture claire et maintenable.
 * 
 * ARCHITECTURE:
 * - Utilitaires de chargement des données
 * - Fonctions de modification des virements
 * - Fonctions de sauvegarde
 * - Fonctions utilitaires et de diagnostic
 * 
 * Auteur: MiniMax Agent
 * Date: 2025-10-25
 * ============================================================================
 */

// ============================================================================
// CONSTANTES ET CONFIGURATION
// ============================================================================

const TRANSFER_CONSTANTS = {
    TYPES: {
        DEBIT: 'virement_debit',
        CREDIT: 'virement_credit'
    },
    DEFAULTS: {
        DESCRIPTION: 'Virement de fonds',
        STATUS: 'pending'
    },
    MESSAGES: {
        ERROR: {
            TRANSACTION_NOT_FOUND: 'Virement non trouvé.',
            ACCOUNTS_NOT_DETERMINED: 'Erreur: Impossible de déterminer les comptes. Contactez l\'administrateur.',
            INCOMPLETE_TRANSFER: 'Virement incomplet. Contactez l\'administrateur.'
        },
        SUCCESS: {
            ACCOUNTS_DETERMINED: 'Comptes déterminés avec succès',
            PRESELECTION_COMPLETE: 'Présélection terminée. Vérifiez le formulaire.'
        }
    }
};

// ============================================================================
// FONCTIONS DE CHARGEMENT DES DONNÉES
// ============================================================================

/**
 * Charge une transaction spécifique par son ID
 * @param {string} id - ID de la transaction à charger
 * @returns {Promise<Object|null>} La transaction ou null si non trouvée
 */
async function loadTransactionById(id) {
    try {
        console.log(`📥 Chargement de la transaction: ${id}`);
        const response = await apiCall(`/transactions.php?id=${id}`);
        return response.data;
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la transaction:', error);
        showNotification(TRANSFER_CONSTANTS.MESSAGES.ERROR.TRANSACTION_NOT_FOUND, 'error');
        return null;
    }
}

/**
 * Charge toutes les transactions liées à un transfert via API
 * @param {string} transferRef - Référence du transfert
 * @returns {Promise<Array>} Tableau des transactions liées
 */
async function loadLinkedTransactions(transferRef) {
    try {
        console.log(`🔗 Chargement des transactions liées pour: ${transferRef}`);
        const response = await apiCall(`/transactions.php?transfer_ref=${transferRef}`);
        return response.data || [];
    } catch (error) {
        console.warn('⚠️ Échec du chargement via API:', error);
        return [];
    }
}

/**
 * Récupère les transactions liées depuis les données locales (plus rapide)
 * @param {Object} currentTransaction - Transaction actuelle
 * @returns {Array} Tableau des transactions liées (sauf celle en cours)
 */
function getLocalLinkedTransactions(currentTransaction) {
    return appData.transactions.filter(t => 
        t.transfer_ref === currentTransaction.transfer_ref && 
        t.id !== currentTransaction.id
    );
}

// ============================================================================
// FONCTIONS DE DÉTERMINATION DES COMPTES
// ============================================================================

/**
 * Détermine les comptes source et destination pour un virement
 * @param {Object} transaction - Transaction courante (virement_debit ou virement_credit)
 * @returns {Object} Objet contenant fromAccountId et toAccountId
 */
function determineTransferAccounts(transaction) {
    console.log(`🔍 Détermination des comptes pour: ${transaction.type} (${transaction.id})`);
    
    let fromAccountId = null;
    let toAccountId = null;
    
    // Récupérer toutes les transactions liées (en mémoire locale)
    const linkedTransactions = getLocalLinkedTransactions(transaction);
    
    console.log(`📊 Transactions liées trouvées: ${linkedTransactions.length}`);
    
    if (transaction.type === TRANSFER_CONSTANTS.TYPES.DEBIT) {
        // VIREMENT DÉBIT: argent qui SORT du compte source
        fromAccountId = transaction.account_id;
        
        // Trouver la transaction CRÉDIT correspondante (argent qui ENTRE dans le compte destination)
        const creditTransaction = linkedTransactions.find(t => t.type === TRANSFER_CONSTANTS.TYPES.CREDIT);
        
        if (creditTransaction) {
            toAccountId = creditTransaction.account_id;
            console.log(`✅ Virement DÉBIT - Source: ${fromAccountId}, Destination: ${toAccountId}`);
        } else {
            console.error(`❌ Virement DÉBIT - Transaction crédit non trouvée!`);
            logTransactionDebug(transaction, 'débit');
        }
        
    } else if (transaction.type === TRANSFER_CONSTANTS.TYPES.CREDIT) {
        // VIREMENT CRÉDIT: argent qui ENTRE dans le compte destination
        toAccountId = transaction.account_id;
        
        // Trouver la transaction DÉBIT correspondante (argent qui SORT du compte source)
        const debitTransaction = linkedTransactions.find(t => t.type === TRANSFER_CONSTANTS.TYPES.DEBIT);
        
        if (debitTransaction) {
            fromAccountId = debitTransaction.account_id;
            console.log(`✅ Virement CRÉDIT - Source: ${fromAccountId}, Destination: ${toAccountId}`);
        } else {
            console.error(`❌ Virement CRÉDIT - Transaction débit non trouvée!`);
            logTransactionDebug(transaction, 'crédit');
        }
    }
    
    return { fromAccountId, toAccountId };
}

/**
 * Affiche les informations de debug pour diagnostiquer un problème
 * @param {Object} transaction - Transaction problématique
 * @param {string} type - Type de problème ('débit' ou 'crédit')
 */
function logTransactionDebug(transaction, type) {
    console.group(`🔍 DEBUG - Problème ${type.toUpperCase()}`);
    console.log('Transaction courante:', {
        id: transaction.id,
        type: transaction.type,
        account_id: transaction.account_id,
        transfer_ref: transaction.transfer_ref,
        amount: transaction.amount
    });
    
    console.log('Toutes les transactions avec ce transfer_ref:');
    appData.transactions
        .filter(t => t.transfer_ref === transaction.transfer_ref)
        .forEach(t => console.log(`  📋 ${t.type}: account_id=${t.account_id}, id=${t.id}`));
    
    console.groupEnd();
}

// ============================================================================
// FONCTIONS DE PRÉSÉLECTION ET VALIDATION
// ============================================================================

/**
 * Applique la solution de secours si les comptes ne peuvent pas être déterminés
 * @param {Object} transaction - Transaction courante
 * @param {Object} currentAccounts - Comptes déterminés (peuvent être null)
 * @returns {Object} Comptes après application de la solution de secours
 */
function applyFallbackSolution(transaction, currentAccounts) {
    let { fromAccountId, toAccountId } = currentAccounts;
    
    if (!fromAccountId || !toAccountId) {
        console.warn('⚠️ COMPTES MANQUANTS - Application de la solution de secours');
        
        // Diagnostic détaillé
        console.group('🔍 Diagnostic de fallback');
        console.log('Transaction:', transaction);
        console.log('Transfer_ref:', transaction.transfer_ref);
        console.log('fromAccountId trouvé:', fromAccountId);
        console.log('toAccountId trouvé:', toAccountId);
        console.groupEnd();
        
        // Solution intelligente selon le type de transaction
        if (transaction.type === TRANSFER_CONSTANTS.TYPES.DEBIT) {
            // Pour un virement débit: on peut au moins déterminer le compte source
            if (!fromAccountId) fromAccountId = transaction.account_id;
            console.log('🔧 Virement DÉBIT: Utilisation du compte courant comme source');
        } 
        else if (transaction.type === TRANSFER_CONSTANTS.TYPES.CREDIT) {
            // Pour un virement crédit: on peut au moins déterminer le compte destination
            if (!toAccountId) toAccountId = transaction.account_id;
            console.log('🔧 Virement CRÉDIT: Utilisation du compte courant comme destination');
        }
    }
    
    return { fromAccountId, toAccountId };
}

/**
 * Valide que les comptes déterminés sont utilisables
 * @param {Object} accounts - Comptes à valider
 * @param {Object} transaction - Transaction courante
 * @returns {boolean} True si validation réussie
 */
function validateDeterminedAccounts(accounts, transaction) {
    const { fromAccountId, toAccountId } = accounts;
    
    if (!fromAccountId || !toAccountId) {
        console.error('❌ ERREUR: Impossible de déterminer les comptes même avec la solution de secours');
        console.log('🔍 Détails de l\'erreur:', {
            transaction_id: transaction.id,
            transaction_type: transaction.type,
            transfer_ref: transaction.transfer_ref,
            fromAccountId,
            toAccountId
        });
        
        showNotification(TRANSFER_CONSTANTS.MESSAGES.ERROR.ACCOUNTS_NOT_DETERMINED, 'error');
        return false;
    }
    
    console.log('✅ Comptes validés:', accounts);
    return true;
}

/**
 * Présélectionne les comptes dans les sélecteurs du formulaire
 * @param {string} fromAccountId - ID du compte source
 * @param {string} toAccountId - ID du compte destination
 * @param {Object} transaction - Transaction courante
 */
function preselectAccountsInForm(fromAccountId, toAccountId, transaction) {
    // S'assurer que les comptes sont chargés dans les sélecteurs
    updateAccountSelects();
    
    const fromSelect = document.getElementById('transfer-from-account');
    const toSelect = document.getElementById('transfer-to-account');
    
    console.log('🔄 Présélection des comptes dans le formulaire...');
    
    // Présélection du compte source
    if (fromAccountId) {
        fromSelect.value = fromAccountId;
        const sourceSelected = fromSelect.value === fromAccountId;
        console.log(`✅ Compte source: ${fromAccountId} ${sourceSelected ? '✅' : '❌'}`);
        
        if (!sourceSelected) {
            console.warn(`⚠️ Compte source ${fromAccountId} non trouvé dans les options disponibles`);
            console.log('📋 Options disponibles:', Array.from(fromSelect.options).map(o => o.value));
        }
    }
    
    // Présélection du compte destination
    if (toAccountId) {
        toSelect.value = toAccountId;
        const destSelected = toSelect.value === toAccountId;
        console.log(`✅ Compte destination: ${toAccountId} ${destSelected ? '✅' : '❌'}`);
        
        if (!destSelected) {
            console.warn(`⚠️ Compte destination ${toAccountId} non trouvé dans les options disponibles`);
            console.log('📋 Options disponibles:', Array.from(toSelect.options).map(o => o.value));
        }
    }
    
    console.log(TRANSFER_CONSTANTS.MESSAGES.SUCCESS.PRESELECTION_COMPLETE);
}

// ============================================================================
// FONCTION PRINCIPALE DE MODIFICATION DE VIREMENT
// ============================================================================

/**
 * Modifie un virement existant - VERSION ORGANISÉE ET MAIN TENABLE
 * 
 * Logique principale:
 * 1. Charger la transaction si nécessaire
 * 2. Récupérer les transactions liées
 * 3. Déterminer les comptes source et destination
 * 4. Appliquer une solution de secours si nécessaire
 * 5. Présélectionner les comptes dans le formulaire
 * 6. Remplir les autres champs du formulaire
 * 
 * @param {string} id - ID de la transaction à modifier
 * @param {Object} transaction - Transaction fournie (optionnel)
 */
async function editTransfer(id, transaction = null) {
    console.group('📝 ÉDITION DE VIREMENT - Début');
    
    try {
        // 1. CHARGEMENT DE LA TRANSACTION
        // ================================
        if (!transaction) {
            console.log('📥 Transaction non fournie, chargement via API...');
            transaction = await loadTransactionById(id);
            if (!transaction) {
                console.error('❌ Échec du chargement de la transaction');
                return;
            }
        }
        
        // Variables globales pour saveTransfer()
        editingId = id;
        currentTransaction = transaction;
        
        console.log(`📋 Transaction chargée: ${transaction.id} (${transaction.type})`);
        
        // 2. RÉCUPÉRATION DES TRANSACTIONS LIÉES
        // ======================================
        console.log('🔗 Recherche des transactions liées...');
        
        // D'abord: chercher en mémoire locale (rapide et fiable)
        let linkedTransactions = getLocalLinkedTransactions(transaction);
        console.log(`✅ Transactions liées trouvées en mémoire: ${linkedTransactions.length}`);
        
        // Si pas trouvé localement: tenter via API (solution de secours)
        if (linkedTransactions.length === 0) {
            console.log('🔄 Aucune transaction liée en mémoire, tentative via API...');
            linkedTransactions = await loadLinkedTransactions(transaction.transfer_ref);
            console.log(`📡 Transactions liées récupérées via API: ${linkedTransactions.length}`);
        }
        
        // 3. DÉTERMINATION DES COMPTES
        // ============================
        const accounts = determineTransferAccounts(transaction);
        
        // 4. APPLICATION DE LA SOLUTION DE SECOURS
        // ========================================
        const finalAccounts = applyFallbackSolution(transaction, accounts);
        
        // 5. VALIDATION
        // =============
        if (!validateDeterminedAccounts(finalAccounts, transaction)) {
            console.error('❌ Validation échouée');
            return;
        }
        
        console.log(TRANSFER_CONSTANTS.MESSAGES.SUCCESS.ACCOUNTS_DETERMINED, finalAccounts);
        
        // 6. PRÉSÉLECTION DANS LE FORMULAIRE
        // ==================================
        preselectAccountsInForm(finalAccounts.fromAccountId, finalAccounts.toAccountId, transaction);
        
        // 7. REMPLISSAGE DES AUTRES CHAMPS
        // ================================
        fillTransferForm(transaction, linkedTransactions);
        
    } catch (error) {
        console.error('❌ ERREUR CRITIQUE dans editTransfer:', error);
        showNotification(TRANSFER_CONSTANTS.MESSAGES.ERROR.INCOMPLETE_TRANSFER, 'error');
    } finally {
        console.groupEnd();
    }
}

// ============================================================================
// FONCTIONS DE REMPLISSAGE DU FORMULAIRE
// ============================================================================

/**
 * Remplit le formulaire de virement avec les données de la transaction
 * @param {Object} transaction - Transaction à modifier
 * @param {Array} linkedTransactions - Transactions liées
 */
function fillTransferForm(transaction, linkedTransactions) {
    console.log('📝 Remplissage du formulaire...');
    
    // === ONGLET 1: INFORMATIONS PRINCIPALES ===
    
    // Montant (sans signe pour les virements)
    const displayAmount = Math.abs(parseFloat(transaction.amount) || 0);
    document.getElementById('transfer-amount').value = displayAmount;
    
    // Description (nettoyée des suffixes automatiques)
    const cleanDescription = cleanTransferDescription(transaction.description);
    document.getElementById('transfer-description').value = cleanDescription;
    
    // === ONGLET 2: INFORMATIONS BANCAIRES ===
    
    const bankingFields = {
        'transfer-date': transaction.date || '',
        'transfer-reference': transaction.reference || '',
        'transfer-payment-method': transaction.payment_method || '',
        'transfer-value-date': transaction.value_date || '',
        'transfer-execution-date': transaction.effective_date || '',
        'transfer-status': transaction.bank_status || TRANSFER_CONSTANTS.DEFAULTS.STATUS,
        'transfer-bank-notes': transaction.bank_notes || ''
    };
    
    Object.entries(bankingFields).forEach(([fieldId, value]) => {
        const element = document.getElementById(fieldId);
        if (element) element.value = value;
    });
    
    // === ONGLET 3: DOCUMENTS ===
    
    // Réinitialiser les fichiers
    transferFiles = [];
    
    // Charger les documents existants
    loadExistingDocuments(transaction, linkedTransactions);
    
    console.log('✅ Formulaire rempli avec succès');
}

/**
 * Nettoie la description en supprimant les suffixes automatiques ajoutés par le système
 * @param {string} description - Description à nettoyer
 * @returns {string} Description nettoyée
 */
function cleanTransferDescription(description) {
    if (!description) return TRANSFER_CONSTANTS.DEFAULTS.DESCRIPTION;
    
    // Supprimer les suffixes automatiques
    return description
        .replace(/\s*\(vers.*\)\s*$/i, '')  // Supprime "(vers nom_compte)"
        .replace(/\s*\(de.*\)\s*$/i, '')    // Supprime "(de nom_compte)"
        .trim() || TRANSFER_CONSTANTS.DEFAULTS.DESCRIPTION;
}

/**
 * Charge les documents existants de la transaction
 * @param {Object} transaction - Transaction courante
 * @param {Array} linkedTransactions - Transactions liées
 */
function loadExistingDocuments(transaction, linkedTransactions) {
    let documentsToLoad = transaction.documents || [];
    
    // Si pas de documents sur la transaction courante, essayer la transaction liée
    if (documentsToLoad.length === 0 && transaction.type === TRANSFER_CONSTANTS.TYPES.CREDIT) {
        const debitTransaction = linkedTransactions.find(t => t.type === TRANSFER_CONSTANTS.TYPES.DEBIT);
        if (debitTransaction && debitTransaction.documents) {
            documentsToLoad = debitTransaction.documents;
            console.log('📄 Documents chargés depuis la transaction débit liée');
        }
    }
    
    // Charger les documents trouvés
    documentsToLoad.forEach(doc => {
        // Logique de chargement des documents existants
        console.log('📄 Document trouvé:', doc);
    });
}

// ============================================================================
// EXPORTATION DES FONCTIONS (pour utilisation dans d'autres modules)
// ============================================================================

// Pour compatibilité avec le code existant, réexporter les noms de fonctions
if (typeof window !== 'undefined') {
    window.editTransfer = editTransfer;
    window.loadTransactionById = loadTransactionById;
    window.determineTransferAccounts = determineTransferAccounts;
    window.cleanTransferDescription = cleanTransferDescription;
}

console.log('✅ Fonctions de gestion des virements chargées et organisées');