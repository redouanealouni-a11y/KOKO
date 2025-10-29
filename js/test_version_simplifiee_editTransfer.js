/**
 * Test de la version simplifiée de editTransfer()
 * À exécuter après avoir rechargé la page pour tester la nouvelle logique
 */

console.log('🧪 TEST VERSION SIMPLIFIÉE - editTransfer()\n');

async function testVersionSimplifiee() {
    if (!appData || !appData.transactions) {
        console.log('❌ appData non disponible');
        return;
    }
    
    // Trouver un virement pour tester
    const virement = appData.transactions.find(t => 
        (t.type === 'virement_debit' || t.type === 'virement_credit') && t.transfer_ref
    );
    
    if (!virement) {
        console.log('❌ Aucun virement trouvé pour test');
        return;
    }
    
    console.log('🧪 Test avec virement:', {
        id: virement.id,
        type: virement.type,
        account_id: virement.account_id,
        transfer_ref: virement.transfer_ref
    });
    
    // Tester la logique de recherche des transactions liées
    console.log('\n🔍 Test de la recherche des transactions liées...');
    
    const allRelatedTransactions = appData.transactions.filter(t => 
        t.transfer_ref === virement.transfer_ref && t.id !== virement.id
    );
    
    console.log('📊 Transactions liées trouvées:', allRelatedTransactions.length);
    allRelatedTransactions.forEach(t => {
        console.log(`  - ${t.type}: account_id=${t.account_id}, id=${t.id}`);
    });
    
    // Test de la recherche élargie dans appData
    const allTransactionsWithRef = appData.transactions.filter(t => 
        t.transfer_ref === virement.transfer_ref
    );
    
    console.log('\n📊 Toutes les transactions avec ce transfer_ref:', allTransactionsWithRef.length);
    allTransactionsWithRef.forEach(t => {
        console.log(`  - ${t.type}: account_id=${t.account_id}, id=${t.id}`);
    });
    
    // Tester la logique de détermination des comptes
    let fromAccountId, toAccountId;
    
    if (virement.type === 'virement_debit') {
        fromAccountId = virement.account_id;
        const creditTransaction = allRelatedTransactions.find(t => t.type === 'virement_credit') 
            || appData.transactions.find(t => t.transfer_ref === virement.transfer_ref && t.type === 'virement_credit');
        
        if (creditTransaction) {
            toAccountId = creditTransaction.account_id;
            console.log('\n✅ Logique virement DÉBIT:');
            console.log('  - Source (débit):', fromAccountId);
            console.log('  - Destination (crédit):', toAccountId);
        } else {
            console.log('\n❌ Logique virement DÉBIT: Transaction crédit non trouvée');
        }
        
    } else if (virement.type === 'virement_credit') {
        toAccountId = virement.account_id;
        const debitTransaction = allRelatedTransactions.find(t => t.type === 'virement_debit') 
            || appData.transactions.find(t => t.transfer_ref === virement.transfer_ref && t.type === 'virement_debit');
        
        if (debitTransaction) {
            fromAccountId = debitTransaction.account_id;
            console.log('\n✅ Logique virement CRÉDIT:');
            console.log('  - Source (débit):', fromAccountId);
            console.log('  - Destination (crédit):', toAccountId);
        } else {
            console.log('\n❌ Logique virement CRÉDIT: Transaction débit non trouvée');
        }
    }
    
    // Vérification finale
    console.log('\n🎯 RÉSULTAT FINAL:');
    console.log('  - fromAccountId:', fromAccountId);
    console.log('  - toAccountId:', toAccountId);
    
    if (fromAccountId && toAccountId) {
        console.log('✅ SUCCÈS: Les deux comptes sont déterminés');
        
        // Test de présence dans les selects
        if (typeof updateAccountSelects === 'function') {
            console.log('\n🧪 Test updateAccountSelects()...');
            updateAccountSelects();
            
            const fromSelect = document.getElementById('transfer-from-account');
            const toSelect = document.getElementById('transfer-to-account');
            
            if (fromSelect && toSelect) {
                console.log('✅ Sélecteurs trouvés');
                
                // Test de présélection
                fromSelect.value = fromAccountId;
                toSelect.value = toAccountId;
                
                console.log('📊 Résultat présélection:');
                console.log('  - from-select valeur:', fromSelect.value);
                console.log('  - to-select valeur:', toSelect.value);
                
                const fromSuccess = fromSelect.value === fromAccountId.toString();
                const toSuccess = toSelect.value === toAccountId.toString();
                
                console.log('  - fromSelect succès:', fromSuccess ? '✅' : '❌');
                console.log('  - toSelect succès:', toSuccess ? '✅' : '❌');
                
                if (fromSuccess && toSuccess) {
                    console.log('\n🎉 SUCCÈS COMPLET: La nouvelle logique fonctionne!');
                } else {
                    console.log('\n⚠️ SUCCÈS PARTIEL: Comptes déterminés mais présélection échoue');
                    console.log('  - Vérifiez que les IDs correspondent aux valeurs des options');
                }
            }
        }
        
    } else {
        console.log('❌ ÉCHEC: Un ou plusieurs comptes manquants');
        console.log('💡 Vérifiez la cohérence des données en base');
    }
    
    // Résumé
    console.log('\n=== 📋 RÉSUMÉ ===');
    console.log('✅ La logique simplifiée a été testée');
    console.log('✅ Si les comptes sont déterminés, la présélection devrait fonctionner');
    console.log('💡 Testez maintenant avec un vrai modal de modification');
}

// Lancer le test
testVersionSimplifiee();