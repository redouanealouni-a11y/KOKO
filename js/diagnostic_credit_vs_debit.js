// 🔍 DIAGNOSTIC : Documents virement crédit vs débit

function diagnosticCreditVsDebit(transferRef) {
    console.log('🔍 DIAGNOSTIC: Credit vs Debit documents');
    console.log('Transfer ref:', transferRef);
    
    // Filtrer les transactions liées à ce transfert
    const linkedTransactions = appData.transactions.filter(t => 
        t.transfer_ref === transferRef
    );
    
    console.log('📊 Transactions liées trouvées:', linkedTransactions.length);
    linkedTransactions.forEach((transaction, index) => {
        console.log(`Transaction ${index + 1}:`);
        console.log('  - ID:', transaction.id);
        console.log('  - Type:', transaction.type);
        console.log('  - Description:', transaction.description);
        console.log('  - Documents:', transaction.documents || []);
        console.log('  - Nombre documents:', transaction.documents ? transaction.documents.length : 0);
    });
    
    return linkedTransactions;
}

// Fonction pour lister tous les virements et leurs documents
function listerVirementsAvecDocumentsCreditDebit() {
    console.log('📋 LISTE COMPLÈTE: Virements avec documents (Crédit vs Débit)');
    
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    console.log(`Total virements trouvés: ${virements.length}`);
    
    virements.forEach(transaction => {
        console.log('\n📄 Virement:');
        console.log('  - ID:', transaction.id);
        console.log('  - Type:', transaction.type);
        console.log('  - Transfer ref:', transaction.transfer_ref);
        console.log('  - Description:', transaction.description);
        console.log('  - Montant:', transaction.amount);
        console.log('  - Documents:', transaction.documents || []);
        console.log('  - Nb documents:', transaction.documents ? transaction.documents.length : 0);
    });
    
    return virements;
}

// Analyser un virement spécifique
function analyserVirementDetails(transferRef) {
    console.log('🔬 ANALYSE DÉTAILLÉE VIREMENT:', transferRef);
    
    const transactions = appData.transactions.filter(t => t.transfer_ref === transferRef);
    
    transactions.forEach(t => {
        console.log(`\n📋 ${t.type.toUpperCase()}:`);
        console.log('  ID:', t.id);
        console.log('  Type:', t.type);
        console.log('  Description:', t.description);
        console.log('  Account ID:', t.account_id);
        console.log('  Documents:', t.documents);
        console.log('  Nb docs:', t.documents ? t.documents.length : 0);
    });
    
    // Vérifier si les documents sont distribués différemment
    const debitTransaction = transactions.find(t => t.type === 'virement_debit');
    const creditTransaction = transactions.find(t => t.type === 'virement_credit');
    
    console.log('\n📊 SYNTHÈSE:');
    console.log('Transaction débit a', debitTransaction?.documents?.length || 0, 'documents');
    console.log('Transaction crédit a', creditTransaction?.documents?.length || 0, 'documents');
    
    if ((debitTransaction?.documents?.length || 0) > 0 && (creditTransaction?.documents?.length || 0) === 0) {
        console.log('💡 PROBLÈME IDENTIFIÉ: Documents seulement sur débit, pas sur crédit!');
    }
    
    return transactions;
}

// Test sur un virement avec documents
function testerVirementSpecific(transferRef) {
    console.log('🧪 TEST: Analyse virement', transferRef);
    
    const transactions = analyserVirementDetails(transferRef);
    
    if (transactions.length !== 2) {
        console.log('⚠️ ATTENTION: Pas exactement 2 transactions liées!');
        return;
    }
    
    // Simuler ce qui se passe quand on édite chaque transaction
    transactions.forEach(transaction => {
        console.log(`\n🎯 Test édition ${transaction.type}:`);
        console.log('  Documents disponibles:', transaction.documents?.length || 0);
        console.log('  Résultat: La fonction renderExistingTransferDocuments sera appelée avec', 
                   transaction.documents?.length || 0, 'documents');
        
        if ((transaction.documents?.length || 0) === 0) {
            console.log('  ❌ PROBLÈME: Aucun document - onglet Documents sera vide!');
        } else {
            console.log('  ✅ Documents chargés correctement');
        }
    });
}

console.log('✅ Fonctions de diagnostic chargées:');
console.log('- diagnosticCreditVsDebit(transferRef)');
console.log('- listerVirementsAvecDocumentsCreditDebit()');
console.log('- analyserVirementDetails(transferRef)');
console.log('- testerVirementSpecific(transferRef)');