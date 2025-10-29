// 🧪 SCRIPT DE TEST - Vérification comptes virements

function testCompletComptesVirement(transactionId) {
    console.log('🚀 TEST COMPLET: Chargement comptes virement');
    console.log('Transaction ID:', transactionId);
    console.log('========================================');
    
    // 1. Diagnostic de base
    const baseResult = diagnosticComptesVirement(transactionId);
    
    // 2. Test de la fonction editTransfer (simulé)
    console.log('\n🎯 TEST SIMULATION editTransfer:');
    
    const { fromAccountId, toAccountId, transaction } = baseResult;
    
    console.log('  Transaction type:', transaction.type);
    console.log('  Compte source à charger:', fromAccountId || '❌ MANQUANT');
    console.log('  Compte destination à charger:', toAccountId || '❌ MANQUANT');
    
    // 3. Test des comptes dans le formulaire
    console.log('\n📝 TEST FORMULAIRE:');
    
    const fromAccountSelect = document.getElementById('transfer-from-account');
    const toAccountSelect = document.getElementById('transfer-to-account');
    
    if (fromAccountSelect && toAccountSelect) {
        if (fromAccountId) {
            const sourceOption = fromAccountSelect.querySelector(`option[value="${fromAccountId}"]`);
            console.log('  ✅ Compte source disponible:', sourceOption ? 'OUI' : 'NON');
            if (sourceOption) {
                fromAccountSelect.value = fromAccountId;
                console.log('    → Valeur définie:', fromAccountSelect.value);
            }
        }
        
        if (toAccountId) {
            const destOption = toAccountSelect.querySelector(`option[value="${toAccountId}"]`);
            console.log('  ✅ Compte destination disponible:', destOption ? 'OUI' : 'NON');
            if (destOption) {
                toAccountSelect.value = toAccountId;
                console.log('    → Valeur définie:', toAccountSelect.value);
            }
        }
    } else {
        console.log('  ❌ Sélecteurs de comptes non trouvés!');
    }
    
    // 4. Résumé final
    console.log('\n📊 RÉSUMÉ FINAL:');
    
    const successSource = fromAccountId && document.getElementById('transfer-from-account')?.value == fromAccountId;
    const successDest = toAccountId && document.getElementById('transfer-to-account')?.value == toAccountId;
    
    if (successSource && successDest) {
        console.log('  ✅ SUCCÈS: Tous les comptes se chargent correctement!');
        console.log('  🎉 Le problème est RÉSOLU!');
    } else {
        console.log('  ❌ PROBLÈME: Certains comptes ne se chargent pas:');
        if (!successSource) console.log('    - Compte source');
        if (!successDest) console.log('    - Compte destination');
        console.log('  🔧 Vérifiez la solution dans SOLUTION_COMPTES_VIREMENTS.md');
    }
    
    return { successSource, successDest, fromAccountId, toAccountId };
}

// Fonction pour tester automatiquement tous les virements
function testerTousVirements() {
    console.log('🔍 TEST AUTOMATIQUE: Tous les virements');
    
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    console.log(`Virements trouvés: ${virements.length}`);
    
    const results = {};
    
    virements.forEach(virement => {
        console.log(`\n📄 Test virement ${virement.id} (${virement.type}):`);
        
        const result = diagnosticComptesVirement(virement.id);
        const hasSource = !!result.fromAccountId;
        const hasDest = !!result.toAccountId;
        
        results[virement.id] = { hasSource, hasDest, type: virement.type };
        
        console.log(`  ${hasSource ? '✅' : '❌'} Source: ${result.fromAccountId || 'MANQUANT'}`);
        console.log(`  ${hasDest ? '✅' : '❌'} Destination: ${result.toAccountId || 'MANQUANT'}`);
    });
    
    // Synthèse
    console.log('\n📊 SYNTHÈSE GLOBALE:');
    
    const debitVirements = Object.entries(results).filter(([id, r]) => r.type === 'virement_debit');
    const creditVirements = Object.entries(results).filter(([id, r]) => r.type === 'virement_credit');
    
    const debitSuccess = debitVirements.filter(([id, r]) => r.hasSource && r.hasDest).length;
    const creditSuccess = creditVirements.filter(([id, r]) => r.hasSource && r.hasDest).length;
    
    console.log(`Virements DÉBIT: ${debitSuccess}/${debitVirements.length} OK`);
    console.log(`Virements CRÉDIT: ${creditSuccess}/${creditVirements.length} OK`);
    
    if (debitSuccess === debitVirements.length && creditSuccess === creditVirements.length) {
        console.log('🎉 TOUS LES VIREMENTS FONCTIONNENT CORRECTEMENT!');
    } else {
        console.log('⚠️ Certains virements ont encore des problèmes.');
    }
    
    return results;
}

// Interface simple de test
function interfaceTestVirement() {
    console.log('🎮 INTERFACE DE TEST VIREMENTS');
    console.log('===============================');
    console.log('Fonctions disponibles:');
    console.log('1. testCompletComptesVirement("ID") - Test complet d\'un virement');
    console.log('2. testerTousVirements() - Test automatique de tous les virements');
    console.log('3. diagnosticComptesVirement("ID") - Diagnostic simple');
    console.log('4. listerTousVirementsAvecComptes() - Liste des virements');
    
    // Afficher les virements disponibles
    const virements = appData.transactions.filter(t => 
        t.type === 'virement_debit' || t.type === 'virement_credit'
    );
    
    console.log(`\n📋 Virements disponibles (${virements.length}):`);
    virements.slice(0, 5).forEach(v => {
        console.log(`  - ${v.id} (${v.type}): ${v.description}`);
    });
    
    if (virements.length > 5) {
        console.log(`  ... et ${virements.length - 5} autres`);
    }
    
    console.log('\n💡 Exemple de test:');
    console.log('testCompletComptesVirement("' + (virements[0]?.id || 'ID_TRANSACTION') + '")');
}

console.log('✅ Script de test des comptes virements chargé!');
console.log('📝 Tapez interfaceTestVirement() pour voir les instructions');