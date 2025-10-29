/**
 * Diagnostic de l'erreur "Impossible de déterminer les comptes pour ce virement"
 * À exécuter dans la console après avoir cliqué sur modifier et vu l'erreur
 */

console.log('🔍 DIAGNOSTIC ERREUR - Impossible de déterminer les comptes\n');

async function diagnosticErreurComptes() {
    if (!appData || !appData.transactions) {
        console.log('❌ appData non disponible');
        return;
    }
    
    console.log('=== 📊 ÉTAT ACTUEL DES DONNÉES ===\n');
    
    // Analyser les virements récents
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    console.log('📊 Nombre total de virements:', virements.length);
    
    // Grouper par transfer_ref
    const transferts = {};
    virements.forEach(t => {
        if (t.transfer_ref) {
            if (!transferts[t.transfer_ref]) {
                transferts[t.transfer_ref] = [];
            }
            transferts[t.transfer_ref].push(t);
        }
    });
    
    console.log('📊 Nombre de transferts uniques:', Object.keys(transferts).length);
    
    // Vérifier les transferts problématiques
    let transfertsProblematiques = 0;
    
    Object.entries(transferts).forEach(([ref, transactions], index) => {
        const hasDebit = transactions.some(t => t.type === 'virement_debit');
        const hasCredit = transactions.some(t => t.type === 'virement_credit');
        
        if (!hasDebit || !hasCredit) {
            transfertsProblematiques++;
            if (index < 5) { // Limiter l'affichage
                console.log(`\n❌ Transfert ${ref} PROBLÉMATIQUE:`);
                console.log(`- Transactions: ${transactions.length}`);
                console.log(`- Has Debit: ${hasDebit}`);
                console.log(`- Has Credit: ${hasCredit}`);
                transactions.forEach(t => {
                    console.log(`  * ${t.type}: account_id=${t.account_id}, id=${t.id}, transfer_ref=${t.transfer_ref}`);
                });
            }
        }
    });
    
    console.log(`\n📊 Transferts problématiques: ${transfertsProblematiques}`);
    
    // Tester avec un virement spécifique
    console.log('\n=== 🧪 TEST AVEC VIREMENT SPÉCIFIQUE ===\n');
    
    // Prendre le premier virement avec transfer_ref
    const virementTest = virements.find(t => t.transfer_ref && 
        transferts[t.transfer_ref] && 
        transferts[t.transfer_ref].length === 2
    );
    
    if (!virementTest) {
        console.log('❌ Aucun virement avec paire complète trouvé pour test');
        return;
    }
    
    console.log('🧪 Test avec virement:', {
        id: virementTest.id,
        type: virementTest.type,
        account_id: virementTest.account_id,
        transfer_ref: virementTest.transfer_ref
    });
    
    // Tester la récupération API
    console.log(`🔗 Test API: /transactions.php?transfer_ref=${virementTest.transfer_ref}`);
    
    try {
        const response = await fetch(`/transactions.php?transfer_ref=${virementTest.transfer_ref}`);
        console.log('📡 Réponse HTTP:', response.status, response.statusText);
        
        if (!response.ok) {
            console.log('❌ ERREUR HTTP - L\'API ne fonctionne pas!');
            console.log('💡 C\'est probablement la cause du problème');
            return;
        }
        
        const data = await response.json();
        console.log('📊 Réponse API:', data);
        
        if (!data.success) {
            console.log('❌ L\'API retourne success=false');
            console.log('📊 Message d\'erreur:', data.message || 'Non fourni');
            console.log('💡 Vérifiez les logs serveur');
            return;
        }
        
        if (!data.data || !Array.isArray(data.data)) {
            console.log('❌ L\'API ne retourne pas de données valides');
            console.log('📊 data:', data.data);
            return;
        }
        
        console.log('✅ API fonctionne, transactions retournées:', data.data.length);
        
        // Analyser les transactions retournées
        const transactionsRetournees = data.data;
        const hasDebit = transactionsRetournees.some(t => t.type === 'virement_debit');
        const hasCredit = transactionsRetournees.some(t => t.type === 'virement_credit');
        
        console.log('\n🔍 Analyse des transactions retournées:');
        console.log('- Contient virement_debit:', hasDebit);
        console.log('- Contient virement_credit:', hasCredit);
        
        transactionsRetournees.forEach(t => {
            console.log(`* ${t.type}: id=${t.id}, account_id=${t.account_id}, transfer_ref=${t.transfer_ref}`);
        });
        
        if (!hasDebit || !hasCredit) {
            console.log('\n❌ PROBLÈME: La paire de virements est incomplète!');
            console.log('💡 Cela explique pourquoi les comptes ne peuvent pas être déterminés');
            
            // Vérifier si le problème est dans la base de données
            if (virementTest.type === 'virement_debit' && !hasCredit) {
                console.log('🔍 DIAGNOSTIC: Vous tryez de modifier un virement DÉBIT');
                console.log('❌ La transaction CRÉDIT correspondante n\'est pas trouvée');
                console.log('💡 Problème possible: Transaction crédit supprimée ou mal liée');
            }
            
            if (virementTest.type === 'virement_credit' && !hasDebit) {
                console.log('🔍 DIAGNOSTIC: Vous tryez de modifier un virement CRÉDIT');
                console.log('❌ La transaction DÉBIT correspondante n\'est pas trouvée');
                console.log('💡 Problème possible: Transaction débit supprimée ou mal liée');
            }
            
        } else {
            console.log('\n✅ Paire complète trouvée via API');
            
            // Tester la logique de détermination des comptes
            let fromAccountId, toAccountId;
            
            if (virementTest.type === 'virement_debit') {
                fromAccountId = virementTest.account_id;
                const creditTransaction = transactionsRetournees.find(t => t.type === 'virement_credit');
                toAccountId = creditTransaction.account_id;
                
                console.log('\n🧪 LOGIQUE pour virement DÉBIT:');
                console.log('- fromAccountId (transaction courante):', fromAccountId);
                console.log('- toAccountId (transaction crédit):', toAccountId);
                
            } else if (virementTest.type === 'virement_credit') {
                toAccountId = virementTest.account_id;
                const debitTransaction = transactionsRetournees.find(t => t.type === 'virement_debit');
                fromAccountId = debitTransaction.account_id;
                
                console.log('\n🧪 LOGIQUE pour virement CRÉDIT:');
                console.log('- fromAccountId (transaction débit):', fromAccountId);
                console.log('- toAccountId (transaction courante):', toAccountId);
            }
            
            console.log('\n🎯 RÉSULTAT FINAL:');
            console.log('- fromAccountId:', fromAccountId);
            console.log('- toAccountId:', toAccountId);
            
            if (!fromAccountId || !toAccountId) {
                console.log('❌ PROBLÈME: Un des comptes est manquant!');
                console.log('💡 Vérifiez les account_id dans la base de données');
            } else {
                console.log('✅ Les comptes sont correctement déterminés');
                console.log('💡 Le problème doit être ailleurs dans le code JavaScript');
            }
        }
        
    } catch (error) {
        console.log('❌ ERREUR lors du test API:', error.message);
        console.log('💡 L\'API est probablement hors service');
    }
    
    // Recommandations
    console.log('\n=== 🎯 RECOMMANDATIONS ===\n');
    
    if (transfertsProblematiques > 0) {
        console.log('❌ IL Y A DES DONNÉES INCOHÉRENTES EN BASE');
        console.log('🔧 Actions recommandées:');
        console.log('1. Corriger les transactions manquantes en base');
        console.log('2. Ou supprimer et recréer les virements problématiques');
        console.log('3. Recharger les données (Ctrl+F5)');
    } else {
        console.log('✅ Les données semblent cohérentes');
        console.log('🔧 Actions recommandées:');
        console.log('1. Vérifier les logs détaillés lors de l\'ouverture du modal');
        console.log('2. Tester la correction après avoir vu ce diagnostic');
    }
    
    console.log('\n=== 🔍 PROCHAINES ÉTAPES ===\n');
    console.log('1. Regardez ce diagnostic dans la console');
    console.log('2. Si des problèmes de données sont détectés: corrigez-les');
    console.log('3. Sinon, regardez les logs détaillés de editTransfer()');
    console.log('4. L\'erreur "Impossible de déterminer les comptes" est normale');
    console.log('   elle nous indique où est le problème!');
}

// Lancer le diagnostic
diagnosticErreurComptes();