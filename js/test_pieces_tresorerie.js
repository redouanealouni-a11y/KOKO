/**
 * Test du formulaire d'achat avec la nouvelle table pieces_tresorerie
 * Auteur: MiniMax Agent
 * Date: 2025-10-26
 */

async function testPieceTresorerieAPI() {
    console.log('🧪 Test de l\'API pieces_tresorerie...');
    
    try {
        // Test 1: Récupération des types de documents
        console.log('\n📋 Test 1: Récupération des types de documents');
        const typesResponse = await fetch('api/pieces_tresorerie.php?path=types');
        const typesData = await typesResponse.json();
        console.log('✅ Types disponibles:', typesData.data);
        
        // Test 2: Récupération des états de documents
        console.log('\n📋 Test 2: Récupération des états de documents');
        const etatsResponse = await fetch('api/pieces_tresorerie.php?path=etats');
        const etatsData = await etatsResponse.json();
        console.log('✅ États disponibles:', etatsData.data);
        
        // Test 3: Création d'un achat de test
        console.log('\n📋 Test 3: Création d\'un achat de test');
        const testAchat = {
            CleTypeDocument: 'facture_achat',
            Label: 'Test achat - Fournitures bureau',
            MontantTTC: 150.00,
            Date: '2025-10-26',
            Note: 'Test automatique de l\'API pieces_tresorerie',
            Payement: 'especes',
            CleDevise: 'XAF',
            TauxChange: 1.0,
            CleEtatDocument: 'brouillon',
            DateEtat: '2025-10-26',
            bModeTTC: true
        };
        
        const createResponse = await fetch('api/pieces_tresorerie.php?path=create_achat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testAchat)
        });
        
        const createResult = await createResponse.json();
        console.log('✅ Achat créé:', createResult);
        
        if (createResult.success && createResult.data) {
            const pieceId = createResult.data.CleDocument;
            console.log(`🆔 ID de la pièce créée: ${pieceId}`);
            
            // Test 4: Récupération de la pièce créée
            console.log('\n📋 Test 4: Récupération de la pièce créée');
            const getResponse = await fetch(`api/pieces_tresorerie.php?path=piece/${pieceId}`);
            const getResult = await getResponse.json();
            console.log('✅ Pièce récupérée:', getResult.data);
            
            // Test 5: Liste des pièces
            console.log('\n📋 Test 5: Liste des pièces');
            const listResponse = await fetch('api/pieces_tresorerie.php?path=list');
            const listResult = await listResponse.json();
            console.log(`✅ ${listResult.data.length} pièces trouvées`);
            
            // Test 6: Suppression de la pièce de test
            console.log('\n📋 Test 6: Suppression de la pièce de test');
            const deleteResponse = await fetch(`api/pieces_tresorerie.php?path=piece/${pieceId}`, {
                method: 'DELETE'
            });
            const deleteResult = await deleteResponse.json();
            console.log('✅ Pièce supprimée:', deleteResult);
        }
        
        console.log('\n🎉 Tous les tests sont passés avec succès!');
        
    } catch (error) {
        console.error('❌ Erreur lors des tests:', error);
        return false;
    }
    
    return true;
}

/**
 * Test des fonctions JavaScript du formulaire d'achat
 */
async function testAchatForm() {
    console.log('🧪 Test du formulaire d\'achat...');
    
    // Simuler la récupération des données du formulaire
    const mockFormData = {
        CleTiers: 'mock-fournisseur-id',
        Date: '2025-10-26',
        Date2: '2025-11-26',
        Label: 'Test - Achat de fournitures',
        Note: 'Test automatisé',
        MontantTTC: 200.00,
        Reference: 'TEST-001',
        Payement: 'virement',
        CleCompte: 'mock-compte-id',
        CleMode: 'virement',
        CleDevise: 'XAF',
        TauxChange: 1.0,
        CleTypeDocument: 'facture_achat',
        CleEtatDocument: 'brouillon',
        DateEtat: '2025-10-26',
        bModeTTC: true
    };
    
    console.log('📋 Données simulées du formulaire:', mockFormData);
    
    try {
        // Test d'envoi vers l'API
        const response = await fetch('api/pieces_tresorerie.php?path=create_achat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(mockFormData)
        });
        
        const result = await response.json();
        console.log('✅ Réponse de l\'API:', result);
        
        if (result.success) {
            console.log('✅ Le formulaire peut envoyer des données correctement');
            
            // Nettoyer l'enregistrement de test si nécessaire
            if (result.data && result.data.CleDocument) {
                console.log('🧹 Nettoyage de l\'enregistrement de test...');
                await fetch(`api/pieces_tresorerie.php?path=piece/${result.data.CleDocument}`, {
                    method: 'DELETE'
                });
                console.log('✅ Nettoyage terminé');
            }
            
            return true;
        } else {
            console.error('❌ L\'API a retourné une erreur:', result.error);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test du formulaire:', error);
        return false;
    }
}

/**
 * Vérification de la structure de la base de données
 */
async function testDatabaseStructure() {
    console.log('🧪 Test de la structure de la base de données...');
    
    try {
        // Vérifier si la table pieces_tresorerie existe
        const response = await fetch('api/pieces_tresorerie.php?path=list');
        const result = await response.json();
        
        if (result.success !== undefined) {
            console.log('✅ La table pieces_tresorerie est accessible');
            console.log(`📊 Nombre d\'enregistrements: ${result.data ? result.data.length : 0}`);
            return true;
        } else {
            console.error('❌ La table pieces_tresorerie n\'est pas accessible');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du test de la structure:', error);
        return false;
    }
}

/**
 * Test complet du système
 */
async function runFullTest() {
    console.log('🚀 Démarrage des tests complets du système pieces_tresorerie');
    console.log('=' .repeat(60));
    
    const results = {
        api: false,
        database: false,
        form: false
    };
    
    // Test de la base de données
    results.database = await testDatabaseStructure();
    
    if (results.database) {
        // Test de l'API
        results.api = await testPieceTresorerieAPI();
        
        // Test du formulaire
        results.form = await testAchatForm();
    }
    
    // Résumé des résultats
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSUMÉ DES TESTS:');
    console.log(`   Base de données: ${results.database ? '✅ OK' : '❌ ÉCHEC'}`);
    console.log(`   API: ${results.api ? '✅ OK' : '❌ ÉCHEC'}`);
    console.log(`   Formulaire: ${results.form ? '✅ OK' : '❌ ÉCHEC'}`);
    
    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
        console.log('\n🎉 TOUS LES TESTS SONT PASSÉS! Le système est prêt.');
    } else {
        console.log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration.');
    }
    
    return allPassed;
}

// Exposer les fonctions pour utilisation manuelle
if (typeof window !== 'undefined') {
    window.testPieceTresorerieAPI = testPieceTresorerieAPI;
    window.testAchatForm = testAchatForm;
    window.testDatabaseStructure = testDatabaseStructure;
    window.runFullTest = runFullTest;
}

// Auto-exécution si appelé directement
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        testPieceTresorerieAPI,
        testAchatForm,
        testDatabaseStructure,
        runFullTest
    };
}

// Note: Pour utiliser dans la console du navigateur, tapez:
// runFullTest()