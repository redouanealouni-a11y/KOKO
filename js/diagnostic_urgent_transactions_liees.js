/**
 * Diagnostic URGENT - Pourquoi les transactions liées ne sont pas trouvées
 * À exécuter immédiatement après avoir vu l'erreur "Virement incomplet"
 */

console.log('🚨 DIAGNOSTIC URGENT - Transactions liées non trouvées\n');

async function diagnosticUrgent() {
    if (!appData || !appData.transactions) {
        console.log('❌ appData non disponible');
        return;
    }
    
    console.log('=== 🔍 ÉTAT ACTUEL DES DONNÉES ===\n');
    
    // Lister tous les virements avec leur transfer_ref
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    console.log('📊 TOTAL VIREMENTS:', virements.length);
    
    // Grouper par transfer_ref pour voir les paires
    const transferts = {};
    virements.forEach(t => {
        if (!t.transfer_ref) {
            console.log('❌ VIREMENT SANS TRANSFER_REF:', t.id, t.type, t.account_id);
        } else {
            if (!transferts[t.transfer_ref]) {
                transferts[t.transfer_ref] = [];
            }
            transferts[t.transfer_ref].push(t);
        }
    });
    
    console.log('\n📊 TRANSFERS TROUVÉS:', Object.keys(transferts).length);
    
    // Analyser chaque transfert
    Object.entries(transferts).forEach(([ref, transactions], index) => {
        console.log(`\n--- Transfer ${ref} ---`);
        console.log('Transactions:', transactions.length);
        
        transactions.forEach(t => {
            console.log(`  ${t.type}: id=${t.id}, account_id=${t.account_id}, amount=${t.amount}`);
        });
        
        const hasDebit = transactions.some(t => t.type === 'virement_debit');
        const hasCredit = transactions.some(t => t.type === 'virement_credit');
        
        console.log(`  Complet: ${hasDebit && hasCredit ? '✅' : '❌'} (debit: ${hasDebit}, credit: ${hasCredit})`);
        
        // Si incomplet et index < 3, montrer le problème
        if ((!hasDebit || !hasCredit) && index < 3) {
            console.log(`  🚨 PROBLÈME: Transfer incomplet!`);
            console.log(`  💡 Il manque: ${!hasDebit ? 'virement_debit' : ''} ${!hasCredit ? 'virement_credit' : ''}`);
        }
    });
    
    // TEST AVEC UN VIREMENT SPÉCIFIQUE
    console.log('\n=== 🧪 TEST AVEC VIREMENT RÉCENT ===\n');
    
    // Prendre le dernier virement avec un transfert complet
    const transfertComplet = Object.entries(transferts).find(([ref, transactions]) => {
        return transactions.some(t => t.type === 'virement_debit') && 
               transactions.some(t => t.type === 'virement_credit');
    });
    
    if (!transfertComplet) {
        console.log('❌ AUCUN TRANSFERT COMPLET TROUVÉ!');
        console.log('💡 C\'est pourquoi la modification échoue');
        return;
    }
    
    const [transferRef, transactions] = transfertComplet;
    console.log('🧪 Test avec transfert complet:', transferRef);
    
    // Tester avec le virement debit
    const virementDebit = transactions.find(t => t.type === 'virement_debit');
    const virementCredit = transactions.find(t => t.type === 'virement_credit');
    
    console.log('\n📊 VIREMENT DÉBIT:');
    console.log('  ID:', virementDebit.id);
    console.log('  Account_id:', virementDebit.account_id);
    console.log('  Transfer_ref:', virementDebit.transfer_ref);
    
    console.log('\n📊 VIREMENT CRÉDIT:');
    console.log('  ID:', virementCredit.id);
    console.log('  Account_id:', virementCredit.account_id);
    console.log('  Transfer_ref:', virementCredit.transfer_ref);
    
    // Test de la recherche dans appData
    console.log('\n🧪 TEST DE RECHERCHE DANS appData:');
    
    console.log('🔍 Recherche des transactions liées pour le DÉBIT:');
    const linkedForDebit = appData.transactions.filter(t => 
        t.transfer_ref === virementDebit.transfer_ref && t.id !== virementDebit.id
    );
    console.log('  Trouvées:', linkedForDebit.length);
    linkedForDebit.forEach(t => console.log(`    - ${t.type}: id=${t.id}, account_id=${t.account_id}`));
    
    console.log('\n🔍 Recherche des transactions liées pour le CRÉDIT:');
    const linkedForCredit = appData.transactions.filter(t => 
        t.transfer_ref === virementCredit.transfer_ref && t.id !== virementCredit.id
    );
    console.log('  Trouvées:', linkedForCredit.length);
    linkedForCredit.forEach(t => console.log(`    - ${t.type}: id=${t.id}, account_id=${t.account_id}`));
    
    // Test avec updateAccountSelects
    console.log('\n🧪 TEST CHARGEMENT COMPTES:');
    if (typeof updateAccountSelects === 'function') {
        updateAccountSelects();
        console.log('✅ updateAccountSelects() exécutée');
        
        const fromSelect = document.getElementById('transfer-from-account');
        const toSelect = document.getElementById('transfer-to-account');
        
        if (fromSelect && toSelect) {
            console.log('✅ Sélecteurs trouvés');
            console.log('  - from-select options:', fromSelect.options.length);
            console.log('  - to-select options:', toSelect.options.length);
            
            // Test présélection pour virement DÉBIT
            console.log('\n🔧 Test présélection virement DÉBIT:');
            fromSelect.value = virementDebit.account_id;
            toSelect.value = virementCredit.account_id;
            
            console.log('  - Source présélectionné:', fromSelect.value, '(attendu:', virementDebit.account_id, ')');
            console.log('  - Destination présélectionné:', toSelect.value, '(attendu:', virementCredit.account_id, ')');
            
            const success1 = fromSelect.value == virementDebit.account_id;
            const success2 = toSelect.value == virementCredit.account_id;
            
            console.log('  - Source OK:', success1 ? '✅' : '❌');
            console.log('  - Destination OK:', success2 ? '✅' : '❌');
            
            if (success1 && success2) {
                console.log('\n🎉 SUCCÈS: La présélection fonctionne!');
                console.log('💡 Le problème était dans la récupération des transactions liées');
                console.log('🔧 La solution: Utiliser les données locales comme dans ce test');
            } else {
                console.log('\n❌ PROBLÈME: Présélection échoue');
                console.log('💡 Vérifiez que les account_id correspondent aux valeurs des options');
            }
        }
    }
    
    // CONCLUSION
    console.log('\n=== 🎯 CONCLUSION ===\n');
    
    const transfertsIncomplets = Object.values(transferts).filter(t => {
        const hasDebit = t.some(x => x.type === 'virement_debit');
        const hasCredit = t.some(x => x.type === 'virement_credit');
        return !hasDebit || !hasCredit;
    });
    
    if (transfertsIncomplets.length > 0) {
        console.log('❌ PROBLÈME IDENTIFIÉ:', transfertsIncomplets.length, 'transferts incomplets');
        console.log('💡 Solution: Corriger les données en base de données');
        console.log('   - Soit supprimer et recréer les virements');
        console.log('   - Soit compléter les paires manquantes');
    } else {
        console.log('✅ DONNÉES COHÉRENTES: Tous les transferts sont complets');
        console.log('💡 Le problème est dans la logique de récupération');
        console.log('🔧 Solution: Utiliser la logique de ce diagnostic dans editTransfer()');
    }
    
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Regardez ce diagnostic dans la console');
    console.log('2. Si données cohérentes: Je vais corriger la logique de récupération');
    console.log('3. Si données incohérentes: Il faut corriger la base de données');
}

// Lancer le diagnostic immédiatement
diagnosticUrgent();