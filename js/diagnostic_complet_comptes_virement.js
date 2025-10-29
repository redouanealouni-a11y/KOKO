/**
 * Diagnostic complet pour identifier le problème de présélection des comptes
 * À exécuter dans la console du navigateur avant d'ouvrir un modal de modification
 */

console.log('🔍 DIAGNOSTIC COMPLET - Problème présélection comptes virement\n');

async function diagnosticComplet() {
    console.log('=== 📊 ANALYSE DES DONNÉES ===\n');
    
    // Vérifier appData
    if (!appData) {
        console.log('❌ appData non défini');
        return;
    }
    
    console.log('📊 État de appData:');
    console.log('- Transactions:', appData.transactions?.length || 0);
    console.log('- Comptes:', appData.comptes?.length || 0);
    
    // Analyser les virements existants
    const virementDebits = appData.transactions?.filter(t => t.type === 'virement_debit') || [];
    const virementCredits = appData.transactions?.filter(t => t.type === 'virement_credit') || [];
    
    console.log('\n📊 Analyse des virements:');
    console.log('- Virements débit:', virementDebits.length);
    console.log('- Virements crédit:', virementCredits.length);
    
    // Analyser les transferts (paires de virements)
    const transfers = {};
    appData.transactions?.forEach(t => {
        if (t.transfer_ref) {
            if (!transfers[t.transfer_ref]) {
                transfers[t.transfer_ref] = [];
            }
            transfers[t.transfer_ref].push(t);
        }
    });
    
    console.log('\n📊 Analyse des transferts (transfer_ref):');
    console.log('- Nombre de transferts uniques:', Object.keys(transfers).length);
    
    Object.entries(transfers).forEach(([ref, transactions], index) => {
        if (index < 5) { // Limiter l'affichage
            console.log(`\nTransfert ${ref}:`);
            transactions.forEach(t => {
                console.log(`  - ${t.type}: account_id=${t.account_id}, amount=${t.amount}, id=${t.id}`);
            });
        }
    });
    
    // Vérifier les problèmes potentiels
    console.log('\n=== 🚨 DÉTECTION DES PROBLÈMES ===\n');
    
    let problemeDetecte = false;
    
    // Problème 1: Transactions sans transfer_ref
    const transactionsSansTransferRef = appData.transactions?.filter(t => 
        (t.type === 'virement_debit' || t.type === 'virement_credit') && !t.transfer_ref
    ) || [];
    
    if (transactionsSansTransferRef.length > 0) {
        console.log('❌ PROBLÈME: Transactions virement sans transfer_ref:', transactionsSansTransferRef.length);
        transactionsSansTransferRef.forEach(t => {
            console.log(`  - ID ${t.id}: type=${t.type}, account_id=${t.account_id}, transfer_ref=${t.transfer_ref}`);
        });
        problemeDetecte = true;
    } else {
        console.log('✅ Toutes les transactions virement ont un transfer_ref');
    }
    
    // Problème 2: Transferts incomplets (une seule transaction au lieu de deux)
    const transfertsIncomplets = Object.entries(transfers).filter(([ref, transactions]) => 
        transactions.length !== 2
    );
    
    if (transfertsIncomplets.length > 0) {
        console.log('\n❌ PROBLÈME: Transferts incomplets:', transfertsIncomplets.length);
        transfertsIncomplets.forEach(([ref, transactions]) => {
            console.log(`  - Transfert ${ref}: ${transactions.length} transaction(s) au lieu de 2`);
            transactions.forEach(t => {
                console.log(`    - ${t.type}: account_id=${t.account_id}, id=${t.id}`);
            });
        });
        problemeDetecte = true;
    } else {
        console.log('✅ Tous les transferts ont exactement 2 transactions');
    }
    
    // Problème 3: Vérifier la cohérence des montants
    const montantsIncoherents = Object.entries(transfers).filter(([ref, transactions]) => {
        if (transactions.length !== 2) return false;
        const debit = transactions.find(t => t.type === 'virement_debit');
        const credit = transactions.find(t => t.type === 'virement_credit');
        return Math.abs(Math.abs(debit.amount) - Math.abs(credit.amount)) > 0.01;
    });
    
    if (montantsIncoherents.length > 0) {
        console.log('\n❌ PROBLÈME: Montants incohérents:', montantsIncoherents.length);
        montantsIncoherents.forEach(([ref, transactions]) => {
            const debit = transactions.find(t => t.type === 'virement_debit');
            const credit = transactions.find(t => t.type === 'virement_credit');
            console.log(`  - Transfert ${ref}: Débit=${debit.amount}, Crédit=${credit.amount}`);
        });
        problemeDetecte = true;
    } else {
        console.log('✅ Tous les transferts ont des montants cohérents');
    }
    
    // Résumé
    console.log('\n=== 📋 RÉSUMÉ DU DIAGNOSTIC ===\n');
    
    if (!problemeDetecte) {
        console.log('✅ Aucune anomalie détectée dans les données');
        console.log('💡 Le problème est probablement dans la logique de récupération des transactions liées');
        console.log('🔧 Recommandation: Tester avec le diagnostic détaillé lors de l\'ouverture du modal');
    } else {
        console.log('❌ Des problèmes ont été détectés dans les données');
        console.log('🔧 Actions recommandées:');
        console.log('1. Corriger les données incohérentes');
        console.log('2. Vérifier la création des virements');
        console.log('3. Recharger les données après correction');
    }
    
    // Test de la fonction updateAccountSelects
    console.log('\n=== 🧪 TEST DES FONCTIONS ===\n');
    
    if (typeof updateAccountSelects === 'function') {
        console.log('🧪 Test updateAccountSelects()...');
        try {
            updateAccountSelects();
            console.log('✅ updateAccountSelects() exécutée sans erreur');
            
            // Vérifier les selects
            const fromSelect = document.getElementById('transfer-from-account');
            const toSelect = document.getElementById('transfer-to-account');
            
            if (fromSelect && toSelect) {
                console.log('✅ Sélecteurs trouvés');
                console.log(`- from-select: ${fromSelect.options.length} options`);
                console.log(`- to-select: ${toSelect.options.length} options`);
                
                if (appData.comptes.length > 0) {
                    const compteTest = appData.comptes[0];
                    console.log(`\n🧪 Test présélection avec compte: ${compteTest.name} (${compteTest.id})`);
                    
                    fromSelect.value = compteTest.id;
                    console.log(`- from-select après test: ${fromSelect.value}`);
                    
                    if (fromSelect.value === compteTest.id) {
                        console.log('✅ Présélection manuelle fonctionne');
                    } else {
                        console.log('❌ Échec de la présélection manuelle');
                        problemeDetecte = true;
                    }
                }
            }
        } catch (error) {
            console.log('❌ Erreur lors du test updateAccountSelects():', error);
            problemeDetecte = true;
        }
    } else {
        console.log('❌ Fonction updateAccountSelects non trouvée');
        problemeDetecte = true;
    }
    
    console.log('\n=== 🎯 ACTIONS SUIVANTES ===\n');
    console.log('1. Si des problèmes de données sont détectés:');
    console.log('   - Corriger les transactionsincohérentes');
    console.log('   - Recharger la page (Ctrl+F5)');
    console.log('   - Relancer ce diagnostic');
    console.log('\n2. Si les données sont OK:');
    console.log('   - Ouvrir un modal de modification de virement');
    console.log('   - Exécuter le diagnostic "rapide" dans la console');
    console.log('   - Vérifier les logs détaillés de editTransfer()');
    
    if (problemeDetecte) {
        console.log('\n❌ Diagnostic terminé: Problèmes détectés');
    } else {
        console.log('\n✅ Diagnostic terminé: Aucune anomalie détectée');
    }
}

// Lancer le diagnostic
diagnosticComplet();