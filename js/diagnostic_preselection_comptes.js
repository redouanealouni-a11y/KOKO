/**
 * Diagnostic rapide pour vérifier la correction de la présélection des comptes
 * À exécuter dans la console du navigateur après avoir ouvert un modal de modification
 */

console.log('🔍 DIAGNOSTIC RAPIDE - Présélection comptes virement\n');

// Fonction pour vérifier l'état d'un select
function checkSelectState(selectId, expectedValue) {
    const select = document.getElementById(selectId);
    if (!select) {
        console.log(`❌ ${selectId}: Select non trouvé`);
        return { success: false, reason: 'Select non trouvé' };
    }
    
    const currentValue = select.value;
    const optionsCount = select.options.length;
    const selectedText = select.options[select.selectedIndex]?.text || 'Non sélectionné';
    
    console.log(`📊 ${selectId}:`);
    console.log(`   - Valeur actuelle: ${currentValue}`);
    console.log(`   - Valeur attendue: ${expectedValue}`);
    console.log(`   - Options disponibles: ${optionsCount}`);
    console.log(`   - Texte sélectionné: ${selectedText}`);
    
    const success = currentValue == expectedValue;
    console.log(`   - Status: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    return { 
        success, 
        currentValue, 
        expectedValue, 
        optionsCount, 
        selectedText,
        reason: success ? 'OK' : 'Valeur non présélectionnée'
    };
}

// Vérifier si le modal est ouvert et contient des données
const modal = document.getElementById('transferModal');
if (!modal || modal.style.display === 'none') {
    console.log('⚠️  Le modal de virement n\'est pas ouvert');
    console.log('💡 Ouvrez d\'abord un modal de modification de virement');
} else {
    console.log('✅ Modal de virement ouvert');
    
    // Vérifier les sélecteurs de comptes
    console.log('\n🔍 Vérification des présélections...\n');
    
    // Ces valeurs seraient récupérées depuis la transaction
    // Pour le test, on va essayer de les deviner
    const fromSelect = document.getElementById('transfer-from-account');
    const toSelect = document.getElementById('transfer-to-account');
    
    if (fromSelect && toSelect) {
        console.log('✅ Sélecteurs trouvés');
        console.log(`📊 from-select: ${fromSelect.options.length} options`);
        console.log(`📊 to-select: ${toSelect.options.length} options`);
        
        // Vérifier si des valeurs sont sélectionnées
        const fromValue = fromSelect.value;
        const toValue = toSelect.value;
        
        console.log(`\n📋 Valeurs actuelles:`);
        console.log(`   - Compte source: ${fromValue || 'NON SÉLECTIONNÉ'}`);
        console.log(`   - Compte destination: ${toValue || 'NON SÉLECTIONNÉ'}`);
        
        if (fromValue && toValue) {
            console.log('\n✅ SUCCÈS: Les deux comptes sont présélectionnés !');
            
            // Vérifier que les textes sont cohérents
            const fromText = fromSelect.options[fromSelect.selectedIndex]?.text;
            const toText = toSelect.options[toSelect.selectedIndex]?.text;
            
            console.log(`   - Compte source: ${fromText}`);
            console.log(`   - Compte destination: ${toText}`);
            
        } else if (!fromValue && !toValue) {
            console.log('\n❌ PROBLÈME: Aucun compte n\'est présélectionné');
            console.log('💡 Cela peut indiquer que la correction n\'a pas été appliquée');
        } else {
            console.log('\n⚠️  PROBLÈME PARTIEL: Un seul compte est présélectionné');
            if (!fromValue) console.log('   - Compte source: MANQUANT');
            if (!toValue) console.log('   - Compte destination: MANQUANT');
        }
        
        // Tester la fonction updateAccountSelects
        console.log('\n🧪 Test de updateAccountSelects()...');
        if (typeof updateAccountSelects === 'function') {
            console.log('✅ Fonction updateAccountSelects trouvée');
            try {
                updateAccountSelects();
                console.log('✅ updateAccountSelects() exécutée sans erreur');
                
                console.log(`📊 from-select après update: ${fromSelect.options.length} options`);
                console.log(`📊 to-select après update: ${toSelect.options.length} options`);
                
            } catch (error) {
                console.log('❌ Erreur lors de updateAccountSelects():', error.message);
            }
        } else {
            console.log('❌ Fonction updateAccountSelects non trouvée');
        }
        
    } else {
        console.log('❌ Sélecteurs de comptes non trouvés');
    }
    
    // Vérifier le récapitulatif
    console.log('\n📋 Vérification du récapitulatif...');
    const summaryFrom = document.getElementById('transfer-summary-from');
    const summaryTo = document.getElementById('transfer-summary-to');
    
    if (summaryFrom && summaryTo) {
        console.log(`   - Compte source récap: ${summaryFrom.textContent}`);
        console.log(`   - Compte destination récap: ${summaryTo.textContent}`);
        
        if (summaryFrom.textContent !== '-' && summaryTo.textContent !== '-') {
            console.log('✅ Récapitulatif correctement affiché');
        } else {
            console.log('⚠️  Récapitulatif montre des valeurs par défaut');
        }
    } else {
        console.log('⚠️  Éléments de récapitulatif non trouvés');
    }
}

// Instructions finales
console.log('\n📋 ACTIONS RECOMMANDÉES:');
console.log('1. Si les comptes sont présélectionnés ✅ : La correction fonctionne !');
console.log('2. Si un problème est détecté ❌ :');
console.log('   - Rechargez la page (Ctrl+F5)');
console.log('   - Vérifiez que les modifications sont dans le code');
console.log('   - Regardez les logs de la console lors de l\'ouverture du modal');
console.log('3. Testez avec différents virements (débit et crédit)');
console.log('4. Vérifiez que le récapitulatif affiche les bons comptes');

console.log('\n🔧 MODIFICATIONS APPORTÉES:');
console.log('✅ Ajout de updateAccountSelects() dans editTransfer()');
console.log('✅ Ordre d\'exécution corrigé');
console.log('✅ Logs de présélection ajoutés');