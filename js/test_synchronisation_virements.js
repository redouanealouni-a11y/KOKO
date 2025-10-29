// 🧪 SCRIPT DE TEST - Synchronisation automatique virements

function testerSynchronisationVirements(transactionId) {
    console.log('🔄 TEST SYNCHRONISATION AUTOMATIQUE VIREMENTS');
    console.log('==============================================');
    console.log('Transaction à tester:', transactionId);
    
    // 1. Récupérer la transaction
    const transaction = appData.transactions.find(t => t.id == transactionId);
    if (!transaction) {
        console.log('❌ Transaction non trouvée');
        return;
    }
    
    console.log('📄 Transaction originale:');
    console.log('  ID:', transaction.id);
    console.log('  Type:', transaction.type);
    console.log('  Transfer ref:', transaction.transfer_ref);
    console.log('  Amount:', transaction.amount);
    console.log('  Date:', transaction.date);
    console.log('  Description:', transaction.description);
    
    // 2. Trouver la transaction liée
    const linkedTransaction = appData.transactions.find(t => 
        t.transfer_ref === transaction.transfer_ref && t.id !== transaction.id
    );
    
    if (!linkedTransaction) {
        console.log('❌ Aucune transaction liée trouvée');
        return;
    }
    
    console.log('\n🔗 Transaction liée:');
    console.log('  ID:', linkedTransaction.id);
    console.log('  Type:', linkedTransaction.type);
    console.log('  Amount:', linkedTransaction.amount);
    console.log('  Date:', linkedTransaction.date);
    console.log('  Description:', linkedTransaction.description);
    
    // 3. Vérifier la cohérence actuelle
    console.log('\n📊 VÉRIFICATION COHÉRENCE ACTUELLE:');
    
    const montantsOpposes = Math.abs(transaction.amount) === Math.abs(linkedTransaction.amount);
    const datesEgales = transaction.date === linkedTransaction.date;
    const transferRefEgales = transaction.transfer_ref === linkedTransaction.transfer_ref;
    
    console.log('✅ Montants opposés:', montantsOpposes ? 'OUI' : 'NON');
    console.log('✅ Dates égales:', datesEgales ? 'OUI' : 'NON');
    console.log('✅ Transfer refs égales:', transferRefEgales ? 'OUI' : 'NON');
    
    // Vérifier les liens croisés
    const liensCroisessOk = (
        (transaction.credit_transaction_id === linkedTransaction.id || transaction.debit_transaction_id === linkedTransaction.id) &&
        (linkedTransaction.credit_transaction_id === transaction.id || linkedTransaction.debit_transaction_id === transaction.id)
    );
    console.log('✅ Liens croisés:', liensCroisessOk ? 'OUI' : 'NON');
    
    // 4. Simuler une modification
    console.log('\n🎯 SIMULATION MODIFICATION:');
    
    const nouveauMontant = transaction.amount * 1.1; // Augmenter de 10%
    const nouvelleDate = '2025-12-31';
    const nouvelleDescription = 'Test synchronisation';
    
    console.log('Nouvelle montant:', nouveauMontant);
    console.log('Nouvelle date:', nouvelleDate);
    console.log('Nouvelle description:', nouvelleDescription);
    
    // Calculer ce qui devrait se passer
    const montantLieAttendu = -Math.abs(nouveauMontant);
    const dateLieeAttendue = nouvelleDate;
    
    console.log('\n📝 RÉSULTATS ATTENDUS:');
    console.log('Transaction principale:');
    console.log('  Amount:', nouveauMontant);
    console.log('  Date:', nouvelleDate);
    console.log('  Description:', nouvelleDescription + ' (...)');
    
    console.log('Transaction liée:');
    console.log('  Amount:', montantLieAttendu);
    console.log('  Date:', dateLieeAttendue);
    console.log('  Description:', '(...) ' + nouvelleDescription);
    
    return {
        transaction,
        linkedTransaction,
        coherent: montantsOpposes && datesEgales && transferRefEgales && liensCroisessOk,
        test: {
            nouveauMontant,
            montantLieAttendu,
            nouvelleDate,
            dateLieeAttendue,
            nouvelleDescription
        }
    };
}

// Test de modification réelle via l'API
async function testerModificationAPISync(transactionId, modifications) {
    console.log('\n🧪 TEST MODIFICATION API SYNC');
    console.log('=============================');
    
    try {
        console.log('📤 Envoi modification...');
        
        const response = await apiCall(`/transactions.php?id=${transactionId}`, {
            method: 'PUT',
            body: JSON.stringify(modifications)
        });
        
        if (response.success) {
            console.log('✅ Modification réussie');
            console.log('📄 Réponse:', response.data);
            
            // Recharger les données pour vérifier la sync
            await loadAppData();
            
            // Vérifier la synchronisation
            const transaction = appData.transactions.find(t => t.id == transactionId);
            const linked = appData.transactions.find(t => 
                t.transfer_ref === transaction.transfer_ref && t.id !== transaction.id
            );
            
            console.log('\n🔍 VÉRIFICATION POST-SYNC:');
            console.log('Transaction modifiée:');
            console.log('  Amount:', transaction.amount);
            console.log('  Date:', transaction.date);
            console.log('  Description:', transaction.description);
            
            console.log('Transaction liée:');
            console.log('  Amount:', linked.amount);
            console.log('  Date:', linked.date);
            console.log('  Description:', linked.description);
            
            // Vérifications
            const syncOk = (
                Math.abs(transaction.amount) === Math.abs(linked.amount) &&
                transaction.date === linked.date &&
                transaction.transfer_ref === linked.transfer_ref
            );
            
            console.log('\n' + (syncOk ? '✅' : '❌') + ' SYNCHRONISATION: ' + (syncOk ? 'RÉUSSIE' : 'ÉCHOUÉE'));
            
            return syncOk;
        } else {
            console.log('❌ Erreur modification:', response.message);
            return false;
        }
    } catch (error) {
        console.log('❌ Erreur lors du test:', error.message);
        return false;
    }
}

// Interface de test simple
function interfaceTestSync() {
    console.log('🎮 INTERFACE DE TEST SYNCHRONISATION');
    console.log('====================================');
    
    // Lister les virements disponibles
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    console.log(`Virements disponibles (${virements.length}):`);
    virements.slice(0, 5).forEach((v, i) => {
        console.log(`  ${i+1}. ${v.id} (${v.type}): ${v.description}`);
    });
    
    if (virements.length > 0) {
        const virementTest = virements[0];
        console.log('\n💡 Exemple de test:');
        console.log('1. Diagnostic complet:');
        console.log(`testerSynchronisationVirements("${virementTest.id}")`);
        
        console.log('\n2. Test de modification:');
        console.log(`testerModificationAPISync("${virementTest.id}", {amount: 1234.56, description: "Test sync"})`);
        
        console.log('\n3. Test automatique complet:');
        console.log('async function testComplet() {');
        console.log('  const result = testerSynchronisationVirements("' + virementTest.id + '");');
        console.log('  if (result.coherent) {');
        console.log('    await testerModificationAPISync("' + virementTest.id + '", {');
        console.log('      amount: 999.99,');
        console.log('      description: "Test synchronisation automatique"');
        console.log('    });');
        console.log('  }');
        console.log('}');
        console.log('testComplet();');
    }
    
    return virements;
}

// Test complet automatique
async function testCompletSynchronisation() {
    console.log('🚀 TEST COMPLET AUTOMATIQUE');
    console.log('============================');
    
    // Trouver un virement avec transfert complet
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    for (const virement of virements) {
        const linked = appData.transactions.find(t => 
            t.transfer_ref === virement.transfer_ref && t.id !== virement.id
        );
        
        if (linked) {
            console.log(`\n🔍 Test virement ${virement.id}...`);
            
            // Test de diagnostic
            const result = testerSynchronisationVirements(virement.id);
            
            if (result.coherent) {
                console.log('✅ Virement cohérent - test modification...');
                
                // Test de modification
                const montantTest = 500 + Math.random() * 1000;
                const success = await testerModificationAPISync(virement.id, {
                    amount: Math.round(montantTest * 100) / 100,
                    description: 'Test sync auto ' + new Date().toLocaleTimeString()
                });
                
                console.log(success ? '✅ Sync réussie' : '❌ Sync échouée');
                
                if (success) {
                    console.log('🎉 TEST COMPLET RÉUSSI!');
                    return true;
                }
            } else {
                console.log('⚠️ Virement non cohérent - skip');
            }
        }
    }
    
    console.log('❌ Aucun test réussi');
    return false;
}

console.log('✅ Script test synchronisation chargé!');
console.log('📝 Fonctions disponibles:');
console.log('1. testerSynchronisationVirements("ID")');
console.log('2. testerModificationAPISync("ID", {modifications})');
console.log('3. interfaceTestSync()');
console.log('4. testCompletSynchronisation()');
console.log('\n💡 Tapez interfaceTestSync() pour commencer');