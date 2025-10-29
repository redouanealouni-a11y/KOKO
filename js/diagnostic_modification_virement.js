// 🔍 SCRIPT DE DIAGNOSTIC : Problème de modification des virements
// Date: 2025-10-24
// Objectif: Identifier pourquoi "Données requises manquantes pour la modification"

// ========================================
// 🚨 DIAGNOSTIC AUTOMATIQUE
// ========================================

async function diagnosticModificationVirement() {
    console.log('🔍 DIAGNOSTIC AUTOMATIQUE - Problème de modification des virements');
    console.log('================================================================');
    
    try {
        // 1. Lister tous les virements existants
        console.log('📊 Étape 1: Recherche des virements existants...');
        const virementsResponse = await apiCall('/transactions.php?type=virement_debit');
        const virements = virementsResponse.data || [];
        
        if (virements.length === 0) {
            console.log('❌ Aucun virement trouvé dans le système.');
            return;
        }
        
        console.log(`✅ ${virements.length} virement(s) trouvé(s)`);
        
        // 2. Tester la modification du premier virement
        console.log('🧪 Étape 2: Test de modification du premier virement...');
        const premierVirement = virements[0];
        console.log('📋 Données du virement original:');
        console.log('  ID:', premierVirement.id);
        console.log('  Type:', premierVirement.type);
        console.log('  Description:', premierVirement.description);
        console.log('  Montant:', premierVirement.amount);
        console.log('  Compte:', premierVirement.account_id);
        console.log('  Date:', premierVirement.date);
        
        // 3. Simuler la modification avec tous les champs requis
        console.log('📤 Étape 3: Simulation de la modification...');
        const modificationTest = {
            id: premierVirement.id,
            account_id: premierVirement.account_id,
            type: premierVirement.type,
            description: premierVirement.description + ' [TEST MODIFICATION]',
            amount: premierVirement.amount,
            date: premierVirement.date
        };
        
        console.log('📦 Données envoyées:');
        console.log('  account_id:', modificationTest.account_id, modificationTest.account_id ? '✅ OK' : '❌ VIDE');
        console.log('  type:', modificationTest.type, modificationTest.type ? '✅ OK' : '❌ VIDE');
        console.log('  description:', modificationTest.description, modificationTest.description ? '✅ OK' : '❌ VIDE');
        console.log('  amount:', modificationTest.amount, modificationTest.amount ? '✅ OK' : '❌ VIDE');
        
        // 4. Test de la requête PUT
        console.log('🚀 Étape 4: Exécution du test PUT...');
        try {
            const putResponse = await apiCall(`/transactions.php?id=${premierVirement.id}`, {
                method: 'PUT',
                body: modificationTest
            });
            
            console.log('✅ RÉUSSITE: Modification effectuée avec succès');
            console.log('📊 Réponse:', putResponse);
            
        } catch (putError) {
            console.log('❌ ERREUR: La modification a échoué');
            console.log('📄 Message d\'erreur:', putError.message);
            console.log('🔍 Détails de l\'erreur:', putError);
            
            // Analyser l'erreur
            if (putError.message.includes('Données requises manquantes')) {
                console.log('🎯 DIAGNOSTIC: Erreur de validation des données');
                console.log('💡 Suggestion: Vérifier que tous les champs requis sont présents et non vides');
                console.log('📋 Champs requis: account_id, type, description, amount');
            }
        }
        
        console.log('================================================================');
        console.log('✅ Diagnostic terminé');
        
    } catch (error) {
        console.error('❌ Erreur lors du diagnostic:', error);
    }
}

// ========================================
// 🔧 TESTS MANUELS AVANCÉS
// ========================================

// Test 1: Vérifier chaque champ individuellement
async function testChampsIndividuels(transactionId) {
    console.log('🧪 Test des champs individuellement...');
    
    try {
        // Récupérer la transaction
        const response = await apiCall(`/transactions.php?id=${transactionId}`);
        const transaction = response.data;
        
        if (!transaction) {
            console.log('❌ Transaction non trouvée');
            return;
        }
        
        console.log('📋 Transaction de base:', {
            id: transaction.id,
            account_id: transaction.account_id,
            type: transaction.type,
            description: transaction.description,
            amount: transaction.amount,
            date: transaction.date
        });
        
        // Tester sans account_id
        try {
            const test1 = {
                type: transaction.type,
                description: transaction.description + ' [TEST 1]',
                amount: transaction.amount,
                date: transaction.date
            };
            await apiCall(`/transactions.php?id=${transactionId}`, { method: 'PUT', body: test1 });
            console.log('✅ Test sans account_id: RÉUSSI (anormal)');
        } catch (e) {
            console.log('❌ Test sans account_id: ÉCHEC -', e.message.includes('Données requises') ? 'Validation stricte OK' : 'Erreur inattendue');
        }
        
        // Tester sans type
        try {
            const test2 = {
                account_id: transaction.account_id,
                description: transaction.description + ' [TEST 2]',
                amount: transaction.amount,
                date: transaction.date
            };
            await apiCall(`/transactions.php?id=${transactionId}`, { method: 'PUT', body: test2 });
            console.log('✅ Test sans type: RÉUSSI (anormal)');
        } catch (e) {
            console.log('❌ Test sans type: ÉCHEC -', e.message.includes('Données requises') ? 'Validation stricte OK' : 'Erreur inattendue');
        }
        
        // Tester sans description
        try {
            const test3 = {
                account_id: transaction.account_id,
                type: transaction.type,
                amount: transaction.amount,
                date: transaction.date
            };
            await apiCall(`/transactions.php?id=${transactionId}`, { method: 'PUT', body: test3 });
            console.log('✅ Test sans description: RÉUSSI (anormal)');
        } catch (e) {
            console.log('❌ Test sans description: ÉCHEC -', e.message.includes('Données requises') ? 'Validation stricte OK' : 'Erreur inattendue');
        }
        
        // Tester sans amount
        try {
            const test4 = {
                account_id: transaction.account_id,
                type: transaction.type,
                description: transaction.description + ' [TEST 4]',
                date: transaction.date
            };
            await apiCall(`/transactions.php?id=${transactionId}`, { method: 'PUT', body: test4 });
            console.log('✅ Test sans amount: RÉUSSI (anormal)');
        } catch (e) {
            console.log('❌ Test sans amount: ÉCHEC -', e.message.includes('Données requises') ? 'Validation stricte OK' : 'Erreur inattendue');
        }
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
    }
}

// Test 2: Vérifier le formulaire frontend
function diagnosticFormulaireFrontend() {
    console.log('🔍 Diagnostic du formulaire frontend...');
    
    // Vérifier les éléments du formulaire de modification
    const elements = {
        'transfer-from-account': document.getElementById('transfer-from-account'),
        'transfer-to-account': document.getElementById('transfer-to-account'),
        'transfer-amount': document.getElementById('transfer-amount'),
        'transfer-description': document.getElementById('transfer-description'),
        'transfer-date': document.getElementById('transfer-date'),
        'transfer-reference': document.getElementById('transfer-reference'),
        'transfer-payment-method': document.getElementById('transfer-payment-method')
    };
    
    console.log('📋 État des éléments du formulaire:');
    for (const [id, element] of Object.entries(elements)) {
        const value = element ? element.value : 'NON TROUVÉ';
        const status = element ? '✅ TROUVÉ' : '❌ MANQUANT';
        console.log(`  ${id}: ${value} ${status}`);
    }
    
    // Vérifier si on est en mode édition
    console.log('📝 État de l\'édition:');
    console.log('  editingId:', editingId);
    console.log('  currentSection:', currentSection);
    console.log('  Modale ouverte:', document.querySelector('.modal.show') ? 'OUI' : 'NON');
}

// ========================================
// 🎯 ACTIONS RECOMMANDÉES
// ========================================

function actionsRecommandees() {
    console.log('💡 ACTIONS RECOMMANDÉES POUR CORRIGER LE PROBLÈME:');
    console.log('================================================');
    console.log('1. Exécuter: diagnosticModificationVirement()');
    console.log('2. Identifier quel champ manque exactement');
    console.log('3. Vérifier que le formulaire frontend collecte tous les champs');
    console.log('4. Corriger la fonction qui envoie les données de modification');
    console.log('5. Tester à nouveau la modification');
    console.log('');
    console.log('🚀 Pour lancer le diagnostic complet:');
    console.log('   await diagnosticModificationVirement()');
    console.log('');
    console.log('🔧 Pour tester avec un ID spécifique:');
    console.log('   await testChampsIndividuels("VOTRE_ID_TRANSACTION")');
    console.log('');
    console.log('🎨 Pour analyser le formulaire:');
    console.log('   diagnosticFormulaireFrontend()');
}

// Export des fonctions pour usage dans la console
if (typeof window !== 'undefined') {
    window.diagnosticModificationVirement = diagnosticModificationVirement;
    window.testChampsIndividuels = testChampsIndividuels;
    window.diagnosticFormulaireFrontend = diagnosticFormulaireFrontend;
    window.actionsRecommandees = actionsRecommandees;
    
    console.log('🎯 Script de diagnostic chargé avec succès!');
    console.log('💡 Tapez actionsRecommandees() pour voir les instructions');
}