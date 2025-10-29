// 🔍 DIAGNOSTIC : Problème comptes source/destination virements

function diagnosticComptesVirement(transactionId) {
    console.log('🔍 DIAGNOSTIC: Chargement comptes virement');
    console.log('Transaction ID:', transactionId);
    
    // Trouver la transaction
    const transaction = appData.transactions.find(t => t.id == transactionId);
    if (!transaction) {
        console.log('❌ Transaction non trouvée!');
        return;
    }
    
    console.log('📄 Transaction trouvée:');
    console.log('  - ID:', transaction.id);
    console.log('  - Type:', transaction.type);
    console.log('  - Account ID:', transaction.account_id);
    console.log('  - Description:', transaction.description);
    console.log('  - Transfer ref:', transaction.transfer_ref);
    
    // Chercher les transactions liées
    const linkedTransactions = appData.transactions.filter(t => 
        t.transfer_ref === transaction.transfer_ref && t.id !== transaction.id
    );
    
    console.log(`\n🔗 Transactions liées trouvées: ${linkedTransactions.length}`);
    linkedTransactions.forEach((t, i) => {
        console.log(`  ${i+1}. ID:${t.id} Type:${t.type} Account:${t.account_id}`);
    });
    
    // Simuler la logique d'édition
    console.log('\n🎯 SIMULATION LOGIQUE EDITTRANSFER:');
    
    let fromAccountId, toAccountId;
    
    if (transaction.type === 'virement_debit') {
        console.log('  → C\'est un virement DÉBIT');
        console.log('  → Compte source =', transaction.account_id);
        fromAccountId = transaction.account_id;
        
        const creditTransaction = linkedTransactions.find(t => t.type === 'virement_credit');
        if (creditTransaction) {
            console.log('  → Compte destination =', creditTransaction.account_id);
            toAccountId = creditTransaction.account_id;
        } else {
            console.log('  → ❌ Pas de transaction crédit trouvée!');
        }
    } else if (transaction.type === 'virement_credit') {
        console.log('  → C\'est un virement CRÉDIT');
        console.log('  → Compte destination =', transaction.account_id);
        toAccountId = transaction.account_id;
        
        const debitTransaction = linkedTransactions.find(t => t.type === 'virement_debit');
        if (debitTransaction) {
            console.log('  → Compte source =', debitTransaction.account_id);
            fromAccountId = debitTransaction.account_id;
        } else {
            console.log('  → ❌ Pas de transaction débit trouvée!');
        }
    }
    
    console.log('\n📊 RÉSULTAT:');
    console.log('  Compte source à charger:', fromAccountId || '❌ MANQUANT');
    console.log('  Compte destination à charger:', toAccountId || '❌ MANQUANT');
    
    return { fromAccountId, toAccountId, transaction, linkedTransactions };
}

function listerTousVirementsAvecComptes() {
    console.log('📋 LISTE COMPLÈTE: Virements avec leurs comptes');
    
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    console.log(`Total virements: ${virements.length}`);
    
    // Grouper par transfer_ref
    const transferts = {};
    virements.forEach(t => {
        if (!transferts[t.transfer_ref]) {
            transferts[t.transfer_ref] = [];
        }
        transferts[t.transfer_ref].push(t);
    });
    
    Object.entries(transferts).forEach(([transferRef, transactions]) => {
        console.log(`\n🔗 Transfert ${transferRef}:`);
        transactions.forEach(t => {
            console.log(`  - ${t.type}: Account ${t.account_id} - ${t.description}`);
        });
        
        // Vérifier si complet
        const hasDebit = transactions.find(t => t.type === 'virement_debit');
        const hasCredit = transactions.find(t => t.type === 'virement_credit');
        
        if (hasDebit && hasCredit) {
            console.log(`  ✅ Complet: Débit Account ${hasDebit.account_id} → Crédit Account ${hasCredit.account_id}`);
        } else {
            console.log(`  ❌ Incomplet: ${hasDebit ? 'Manque crédit' : 'Manque débit'}`);
        }
    });
}

function testerChargementComptes(transactionId) {
    console.log('🧪 TEST: Chargement comptes pour transaction', transactionId);
    
    const result = diagnosticComptesVirement(transactionId);
    
    if (!result.fromAccountId) {
        console.log('\n⚠️ PROBLÈME: Compte source manquant!');
        console.log('   Causes possibles:');
        console.log('   1. Transaction liée non chargée dans appData');
        console.log('   2. Transfer ref incorrect');
        console.log('   3. Structure base de données incorrecte');
    }
    
    if (!result.toAccountId) {
        console.log('\n⚠️ PROBLÈME: Compte destination manquant!');
    }
    
    return result;
}

// Fonction pour recharger toutes les transactions liées
function rechargerTransactionsLiees(transferRef) {
    console.log('🔄 Rechargement transactions liées pour:', transferRef);
    
    return apiCall(`/transactions.php?transfer_ref=${transferRef}`)
        .then(response => {
            console.log('📄 Réponse API:', response);
            
            // Mettre à jour appData
            if (response.data) {
                response.data.forEach(newTransaction => {
                    const existingIndex = appData.transactions.findIndex(t => t.id === newTransaction.id);
                    if (existingIndex >= 0) {
                        appData.transactions[existingIndex] = newTransaction;
                    } else {
                        appData.transactions.push(newTransaction);
                    }
                });
                
                console.log('✅ Transactions mises à jour dans appData');
            }
            
            return response.data;
        })
        .catch(error => {
            console.error('❌ Erreur rechargement:', error);
            throw error;
        });
}

console.log('✅ Fonctions diagnostic comptes chargées:');
console.log('- diagnosticComptesVirement(transactionId)');
console.log('- listerTousVirementsAvecComptes()');
console.log('- testerChargementComptes(transactionId)');
console.log('- rechargerTransactionsLiees(transferRef)');