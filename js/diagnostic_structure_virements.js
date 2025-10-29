// 🔍 DIAGNOSTIC : Structure base de données virements liés

function analyserStructureVirements() {
    console.log('🔍 ANALYSE STRUCTURE BASE DE DONNÉES VIREMENTS');
    console.log('==============================================');
    
    // Récupérer tous les virements
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    if (virements.length === 0) {
        console.log('❌ Aucun virement trouvé dans appData');
        return;
    }
    
    console.log(`📊 Virements trouvés: ${virements.length}`);
    
    // Grouper par transfer_ref
    const transferts = {};
    virements.forEach(v => {
        const ref = v.transfer_ref || 'SANS_REF';
        if (!transferts[ref]) {
            transferts[ref] = [];
        }
        transferts[ref].push(v);
    });
    
    console.log(`📁 Transferts uniques: ${Object.keys(transferts).length}`);
    
    // Analyser chaque transfert
    Object.entries(transferts).forEach(([transferRef, transactions]) => {
        if (transferRef === 'SANS_REF') {
            console.log(`\n❌ Virements SANS transfer_ref: ${transactions.length}`);
            transactions.forEach(t => {
                console.log(`  - ID: ${t.id}, Type: ${t.type}, Description: ${t.description}`);
            });
            return;
        }
        
        console.log(`\n🔗 Transfert ${transferRef}:`);
        console.log(`  Nombre de transactions: ${transactions.length}`);
        
        transactions.forEach((t, index) => {
            console.log(`  ${index + 1}. ID:${t.id} Type:${t.type}`);
            console.log(`     Account: ${t.account_id} Amount: ${t.amount}€`);
            console.log(`     Date: ${t.date} Description: ${t.description}`);
            
            // Vérifier les liens croisés
            console.log(`     Liens croisés:`);
            console.log(`       - credit_transaction_id: ${t.credit_transaction_id || 'NULL'}`);
            console.log(`       - debit_transaction_id: ${t.debit_transaction_id || 'NULL'}`);
        });
        
        // Vérifier la cohérence
        const debitTx = transactions.find(t => t.type === 'virement_debit');
        const creditTx = transactions.find(t => t.type === 'virement_credit');
        
        if (debitTx && creditTx) {
            const montantsEgaux = Math.abs(debitTx.amount) === Math.abs(creditTx.amount);
            const datesEgales = debitTx.date === creditTx.date;
            const refEgales = debitTx.transfer_ref === creditTx.transfer_ref;
            
            console.log(`  ✅ Cohérence:`);
            console.log(`    - Montants égaux: ${montantsEgaux ? 'OUI' : 'NON'} (${debitTx.amount}€ vs ${creditTx.amount}€)`);
            console.log(`    - Dates égales: ${datesEgales ? 'OUI' : 'NON'}`);
            console.log(`    - Références égales: ${refEgales ? 'OUI' : 'NON'}`);
            
            // Vérifier les liens croisés
            const lienDebitCreditOk = debitTx.credit_transaction_id === creditTx.id;
            const lienCreditDebitOk = creditTx.debit_transaction_id === debitTx.id;
            
            console.log(`    - Lien Débit→Crédit: ${lienDebitCreditOk ? 'OUI' : 'NON'}`);
            console.log(`    - Lien Crédit→Débit: ${lienCreditDebitOk ? 'OUI' : 'NON'}`);
            
            if (!lienDebitCreditOk || !lienCreditDebitOk) {
                console.log(`    ⚠️ PROBLÈME: Liens croisés manquants ou incorrects!`);
            }
        } else {
            console.log(`  ⚠️ Transfert incomplet: ${debitTx ? 'Manque crédit' : 'Manque débit'}`);
        }
    });
    
    return transferts;
}

function verifierSynchronisationPossible() {
    console.log('\n🔄 TEST SYNCHRONISATION POSSIBLE');
    console.log('================================');
    
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    // Trouver un transfert complet
    const transfertComplete = null;
    
    for (const virement of virements) {
        if (!virement.transfer_ref) continue;
        
        const transactionsLiees = appData.transactions.filter(t => 
            t.transfer_ref === virement.transfer_ref && t.id !== virement.id
        );
        
        if (transactionsLiees.length === 1) {
            // On a trouvé un transfert complet (2 transactions)
            transfertComplete = {
                debit: transactionsLiees.find(t => t.type === 'virement_debit') || virement,
                credit: transactionsLiees.find(t => t.type === 'virement_credit') || virement
            };
            break;
        }
    }
    
    if (!transfertComplete) {
        console.log('❌ Aucun transfert complet trouvé');
        return null;
    }
    
    console.log('✅ Transfert complet trouvé:');
    console.log(`  Débit ID: ${transfertComplete.debit.id}`);
    console.log(`  Crédit ID: ${transfertComplete.credit.id}`);
    console.log(`  Transfer ref: ${transfertComplete.debit.transfer_ref}`);
    
    // Simuler les modifications possibles
    console.log('\n🎯 MODIFICATIONS SYNC POSSIBLES:');
    console.log('1. Changement montant → Sync automatiques');
    console.log('2. Changement date → Sync automatiques');
    console.log('3. Changement compte → Sync automatiques');
    console.log('4. Changement description → Sync automatiques');
    
    // Vérifier si on peut récupérer les deux transactions
    console.log('\n🧪 TEST API:');
    fetch(`/api/transactions.php?transfer_ref=${transfertComplete.debit.transfer_ref}`)
        .then(r => r.json())
        .then(data => {
            console.log('API Response:', data);
            if (data.success && data.data && data.data.length === 2) {
                console.log('✅ API retourne bien les 2 transactions liées');
            } else {
                console.log('❌ API ne retourne pas les bonnes transactions');
            }
        })
        .catch(err => console.log('❌ Erreur API:', err));
    
    return transfertComplete;
}

// Test de modification d'un virement
function testerModificationSynchrone(transactionId) {
    console.log('\n🔧 TEST MODIFICATION SYNC');
    console.log('==========================');
    console.log('Transaction à modifier:', transactionId);
    
    const transaction = appData.transactions.find(t => t.id == transactionId);
    if (!transaction) {
        console.log('❌ Transaction non trouvée');
        return;
    }
    
    console.log('Transaction:', {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        account_id: transaction.account_id,
        transfer_ref: transaction.transfer_ref
    });
    
    // Chercher la transaction liée
    const linkedTransaction = appData.transactions.find(t => 
        t.transfer_ref === transaction.transfer_ref && t.id !== transaction.id
    );
    
    if (linkedTransaction) {
        console.log('Transaction liée:');
        console.log('  ID:', linkedTransaction.id);
        console.log('  Type:', linkedTransaction.type);
        console.log('  Amount:', linkedTransaction.amount);
        console.log('  Account:', linkedTransaction.account_id);
        
        console.log('\n📝 MODIFICATIONS REQUISES:');
        console.log('1. Modifier cette transaction');
        console.log('2. Modifier automatiquement la transaction liée');
        console.log('3. Maintenir la cohérence: montants opposés, dates identiques, etc.');
        
        return { transaction, linkedTransaction };
    } else {
        console.log('❌ Aucune transaction liée trouvée');
        return null;
    }
}

console.log('✅ Diagnostic structure virements chargé!');
console.log('📝 Fonctions disponibles:');
console.log('1. analyserStructureVirements()');
console.log('2. verifierSynchronisationPossible()');
console.log('3. testerModificationSynchrone("ID")');