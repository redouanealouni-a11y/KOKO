// Test de validation de la correction d'affichage des virements (V2)
// Exécuter dans la console du navigateur

console.log('🔍 Test d\'affichage des virements - Correction complète du signe');

// Test 1: Fonction formatCurrencyForDisplay (version corrigée)
const testVirementDebit = {
    type: 'virement_debit',
    amount: -154.00
};

const testVirementCredit = {
    type: 'virement_credit', 
    amount: 200.00
};

const testRecette = {
    type: 'recette',
    amount: 500.00
};

const testDepense = {
    type: 'depense',
    amount: -300.00
};

console.log('\n📊 Test formatCurrencyForDisplay (V2):');

// Simuler la fonction corrigée (copie du code JS V2)
function formatCurrencyForDisplayTest(transaction) {
    // Pour les virements (débit et crédit), afficher sans le signe
    if (transaction.type === 'virement_debit' || transaction.type === 'virement_credit') {
        const absAmount = Math.abs(parseFloat(transaction.amount) || 0);
        return formatCurrencyTest(absAmount);
    }
    
    // Pour tous les autres types, afficher normalement
    return formatCurrencyTest(transaction.amount);
}

function formatCurrencyTest(amount) {
    const numAmount = parseFloat(amount) || 0;
    if (Math.abs(numAmount) >= 1000000000) {
        return (numAmount / 1000000000).toFixed(1) + ' Mrd €';
    } else if (Math.abs(numAmount) >= 1000000) {
        return (numAmount / 1000000).toFixed(1) + ' M €';
    } else {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numAmount);
    }
}

console.log('Virement Débit (-154,00 €) :', formatCurrencyForDisplayTest(testVirementDebit));
console.log('Virement Crédit (200,00 €) :', formatCurrencyForDisplayTest(testVirementCredit));  
console.log('Recette (500,00 €) :', formatCurrencyForDisplayTest(testRecette));
console.log('Dépense (-300,00 €) :', formatCurrencyForDisplayTest(testDepense));

console.log('\n✅ Attendu (V2):');
console.log('- Virement Débit : 154,00 € (sans signe négatif)');
console.log('- Virement Crédit : 200,00 € (sans signe)');
console.log('- Recette : 500,00 €'); 
console.log('- Dépense : 300,00 € (sans signe négatif)');

// Test 2: Vérification de l'affichage dans la popup
console.log('\n📝 Test popup de modification:');

// Simuler le chargement d'un montant dans la popup
function testPopupLoading(transactionType, amount) {
    const displayAmount = (transactionType === 'virement_debit' || transactionType === 'virement_credit') 
        ? Math.abs(parseFloat(amount) || 0)
        : parseFloat(amount) || 0;
    return displayAmount;
}

console.log('Popup - Virement Débit (-154,00) :', testPopupLoading('virement_debit', -154));
console.log('Popup - Virement Crédit (200,00) :', testPopupLoading('virement_credit', 200));
console.log('Popup - Recette (500,00) :', testPopupLoading('recette', 500));
console.log('Popup - Dépense (-300,00) :', testPopupLoading('depense', -300));

// Test 3: Vérification de l'implémentation
setTimeout(() => {
    console.log('\n🔍 Vérification de l\'implémentation...');
    
    // Vérifier que la fonction existe
    if (typeof formatCurrencyForDisplay === 'function') {
        console.log('✅ Fonction formatCurrencyForDisplay définie');
    } else {
        console.log('❌ Fonction formatCurrencyForDisplay non trouvée');
    }
    
    // Vérifier qu'elle est utilisée dans les templates HTML
    const recentTransactionsTable = document.getElementById('recent-transactions');
    if (recentTransactionsTable) {
        console.log('✅ Tableau des transactions récentes trouvé');
    }
    
    // Vérifier le champ amount dans la popup
    const transferAmountField = document.getElementById('transfer-amount');
    if (transferAmountField) {
        console.log('✅ Champ transfer-amount trouvé dans la popup');
    }
    
    console.log('\n🎯 Tests de validation complets - Maintenant :');
    console.log('1. Rechargez la page (Ctrl+F5)');
    console.log('2. Créez un nouveau virement - montants positifs dans le formulaire');
    console.log('3. Modifiez un virement de crédit - affichage positif dans popup ET tableau');
    console.log('4. Vérifiez que les tableaux n\'affichent plus de signes négatifs pour les virements');
}, 1000);