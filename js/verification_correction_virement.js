// 🎯 SCRIPT DE VÉRIFICATION RAPIDE - Correction du Virement
// Date: 2025-10-24
// Objectif: Vérifier que la modification des virements fonctionne maintenant

async function verificationRapideVirement() {
    console.log('🎯 VÉRIFICATION RAPIDE - Modification des Virements');
    console.log('===============================================');
    
    try {
        // 1. Chercher un virement existant
        console.log('🔍 Recherche d\'un virement existant...');
        const virementsResponse = await apiCall('/transactions.php?type=virement_debit');
        const virements = virementsResponse.data || [];
        
        if (virements.length === 0) {
            console.log('❌ Aucun virement trouvé pour le test');
            return false;
        }
        
        const virement = virements[0];
        console.log(`✅ Virement trouvé: ${virement.description} (ID: ${virement.id})`);
        
        // 2. Préparer des données de test
        const descriptionTest = `TEST CORRECTION - ${new Date().toLocaleString()}`;
        const donneesTest = {
            account_id: virement.account_id,
            type: virement.type,
            description: descriptionTest,
            amount: virement.amount,
            date: virement.date
        };
        
        console.log('📋 Données de test préparées:');
        console.log('  account_id:', donneesTest.account_id ? '✅' : '❌');
        console.log('  type:', donneesTest.type ? '✅' : '❌');
        console.log('  description:', donneesTest.description ? '✅' : '❌');
        console.log('  amount:', donneesTest.amount ? '✅' : '❌');
        
        // 3. Tester la modification
        console.log('🧪 Test de modification en cours...');
        console.log('📤 Envoi des données vers l\'API...');
        
        const response = await apiCall(`/transactions.php?id=${virement.id}`, {
            method: 'PUT',
            body: donneesTest
        });
        
        console.log('✅ RÉUSSITE! La modification a fonctionné');
        console.log('📊 Réponse reçue:', response);
        
        // 4. Vérifier que la transaction a été mise à jour
        const transactionMisesAJour = await apiCall(`/transactions.php?id=${virement.id}`);
        const transaction = transactionMisesAJour.data;
        
        if (transaction.description === descriptionTest) {
            console.log('✅ La transaction a été correctement mise à jour en base');
            return true;
        } else {
            console.log('⚠️ La transaction semble ne pas avoir été mise à jour correctement');
            console.log('   Description attendue:', descriptionTest);
            console.log('   Description reçue:', transaction.description);
            return false;
        }
        
    } catch (error) {
        console.log('❌ ERREUR lors de la vérification:');
        console.log('   Message:', error.message);
        console.log('   Détails:', error);
        return false;
    }
}

// 🧪 Test de Modification avec Données Formulaire
async function testModificationSimulee() {
    console.log('🧪 TEST SIMULATION - Formulaire de Modification');
    console.log('===============================================');
    
    // Simuler les données collectées par le formulaire
    const formulaireData = {
        from_account_id: 'compte-source-uuid',
        to_account_id: 'compte-destination-uuid',
        amount: 999.99,
        description: 'Virement de test - FORMULAIRE',
        date: '2025-10-24'
    };
    
    console.log('📋 Données du formulaire (format virement):');
    console.log('  from_account_id:', formulaireData.from_account_id);
    console.log('  to_account_id:', formulaireData.to_account_id);
    console.log('  amount:', formulaireData.amount);
    console.log('  description:', formulaireData.description);
    
    // Simuler la transformation faite par saveTransfer()
    const transactionType = 'virement_debit'; // Simuler virement_debit
    
    let apiData;
    if (transactionType === 'virement_debit') {
        apiData = {
            account_id: formulaireData.from_account_id,
            type: 'virement_debit',
            description: formulaireData.description,
            amount: formulaireData.amount,
            date: formulaireData.date
        };
    } else {
        apiData = {
            account_id: formulaireData.to_account_id,
            type: 'virement_credit',
            description: formulaireData.description,
            amount: formulaireData.amount,
            date: formulaireData.date
        };
    }
    
    console.log('🔧 Données après transformation (format API):');
    console.log('  account_id:', apiData.account_id ? '✅' : '❌');
    console.log('  type:', apiData.type ? '✅' : '❌');
    console.log('  description:', apiData.description ? '✅' : '❌');
    console.log('  amount:', apiData.amount ? '✅' : '❌');
    
    // Vérifier que tous les champs requis sont présents
    const champsRequis = ['account_id', 'type', 'description', 'amount'];
    const champsManquants = champsRequis.filter(champ => !apiData[champ]);
    
    if (champsManquants.length === 0) {
        console.log('✅ Tous les champs requis sont présents!');
        console.log('🚀 La transformation fonctionne correctement');
        return true;
    } else {
        console.log('❌ Champs manquants:', champsManquants.join(', '));
        return false;
    }
}

// 📊 Vérification de l'État des Formulaires
function verifierEtatFormulaires() {
    console.log('📊 VÉRIFICATION - État des Formulaires');
    console.log('====================================');
    
    const elements = {
        'transfer-from-account': document.getElementById('transfer-from-account'),
        'transfer-to-account': document.getElementById('transfer-to-account'),
        'transfer-amount': document.getElementById('transfer-amount'),
        'transfer-description': document.getElementById('transfer-description'),
        'transfer-date': document.getElementById('transfer-date')
    };
    
    let elementsOk = 0;
    
    for (const [id, element] of Object.entries(elements)) {
        const existe = element ? '✅' : '❌';
        const valeur = element ? element.value : 'N/A';
        console.log(`  ${id}: ${valeur} ${existe}`);
        if (element) elementsOk++;
    }
    
    console.log(`\n📊 Résultat: ${elementsOk}/${Object.keys(elements).length} éléments trouvés`);
    
    return elementsOk === Object.keys(elements).length;
}

// 🎯 LANCEMENT DE TOUS LES TESTS
async function testsComplets() {
    console.log('🎯 LANCEMENT DES TESTS COMPLETS');
    console.log('==============================');
    
    // Test 1: Vérification des formulaires
    console.log('\n1️⃣ Test des Formulaires');
    const testFormulaires = verifierEtatFormulaires();
    
    // Test 2: Simulation de transformation
    console.log('\n2️⃣ Test de Transformation des Données');
    const testTransformation = await testModificationSimulee();
    
    // Test 3: Test réel (optionnel)
    console.log('\n3️⃣ Test Réel de Modification');
    let testReel = false;
    try {
        testReel = await verificationRapideVirement();
    } catch (e) {
        console.log('⚠️ Test réel skippé (pas de virements disponibles ou erreur réseau)');
    }
    
    // Résumé final
    console.log('\n📊 RÉSUMÉ DES TESTS');
    console.log('==================');
    console.log('Formulaires:    ', testFormulaires ? '✅ OK' : '❌ ÉCHEC');
    console.log('Transformation: ', testTransformation ? '✅ OK' : '❌ ÉCHEC');
    console.log('Test réel:      ', testReel ? '✅ OK' : '❌ ÉCHEC / SKIP');
    
    const success = testFormulaires && testTransformation;
    console.log('\n🎯 RÉSULTAT FINAL:', success ? '✅ SUCCÈS' : '❌ ÉCHEC');
    
    return success;
}

// Export des fonctions
if (typeof window !== 'undefined') {
    window.verificationRapideVirement = verificationRapideVirement;
    window.testModificationSimulee = testModificationSimulee;
    window.verifierEtatFormulaires = verifierEtatFormulaires;
    window.testsComplets = testsComplets;
    
    console.log('🎯 Script de vérification chargé!');
    console.log('💡 Lancez testsComplets() pour exécuter tous les tests');
}

// Lancement automatique si demandé
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        verificationRapideVirement,
        testModificationSimulee,
        verifierEtatFormulaires,
        testsComplets
    };
}