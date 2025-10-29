/**
 * Test rapide de l'API pour récupérer les transactions liées par transfer_ref
 * À exécuter dans la console pour tester directement l'endpoint
 */

console.log('🧪 Test API - Récupération transactions liées par transfer_ref\n');

async function testApiTransferRef() {
    if (!appData || !appData.transactions) {
        console.log('❌ appData ou appData.transactions non disponible');
        return;
    }
    
    // Trouver un virement avec transfer_ref
    const virement = appData.transactions.find(t => 
        (t.type === 'virement_debit' || t.type === 'virement_credit') && t.transfer_ref
    );
    
    if (!virement) {
        console.log('❌ Aucun virement avec transfer_ref trouvé');
        return;
    }
    
    console.log('📊 Test avec virement:', {
        id: virement.id,
        type: virement.type,
        account_id: virement.account_id,
        amount: virement.amount,
        transfer_ref: virement.transfer_ref
    });
    
    const transferRef = virement.transfer_ref;
    console.log(`🔗 Test API: /transactions.php?transfer_ref=${transferRef}`);
    
    try {
        // Test direct de l'API
        const response = await fetch(`/transactions.php?transfer_ref=${transferRef}`);
        console.log('📡 Réponse HTTP:', response.status, response.statusText);
        
        if (!response.ok) {
            console.log('❌ Erreur HTTP:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('📊 Réponse API complète:', data);
        
        if (data.success && data.data) {
            console.log('✅ Succès de l\'API');
            console.log('📊 Transactions retournées:', data.data.length);
            
            data.data.forEach((transaction, index) => {
                console.log(`Transaction ${index + 1}:`, {
                    id: transaction.id,
                    type: transaction.type,
                    account_id: transaction.account_id,
                    amount: transaction.amount,
                    description: transaction.description
                });
            });
            
            // Vérifier si c'est une paire complète
            const hasDebit = data.data.some(t => t.type === 'virement_debit');
            const hasCredit = data.data.some(t => t.type === 'virement_credit');
            
            console.log('\n🔍 Analyse de la paire:');
            console.log('- Contient virement_debit:', hasDebit);
            console.log('- Contient virement_credit:', hasCredit);
            
            if (hasDebit && hasCredit) {
                console.log('✅ Paire complète trouvée');
                
                // Vérifier la cohérence des montants
                const debit = data.data.find(t => t.type === 'virement_debit');
                const credit = data.data.find(t => t.type === 'virement_credit');
                
                console.log('💰 Cohérence des montants:');
                console.log(`- Débit: ${debit.amount}`);
                console.log(`- Crédit: ${credit.amount}`);
                console.log(`- Différence: ${Math.abs(Math.abs(debit.amount) - Math.abs(credit.amount))}`);
                
                if (Math.abs(Math.abs(debit.amount) - Math.abs(credit.amount)) < 0.01) {
                    console.log('✅ Montants cohérents');
                } else {
                    console.log('❌ Montants incohérents!');
                }
                
            } else {
                console.log('❌ Paire incomplète!');
                console.log('💡 Ceci explique pourquoi la présélection échoue');
            }
            
        } else {
            console.log('❌ Échec de l\'API ou données manquantes');
            console.log('📊 Réponse:', data);
        }
        
    } catch (error) {
        console.log('❌ Erreur lors du test API:', error.message);
    }
    
    // Test alternatif avec fetch + apiCall si disponible
    if (typeof apiCall === 'function') {
        console.log('\n🔄 Test avec apiCall() (fonction interne)...');
        try {
            const apiResult = await apiCall(`/transactions.php?transfer_ref=${transferRef}`);
            console.log('📊 Résultat apiCall():', apiResult);
        } catch (error) {
            console.log('❌ Erreur apiCall():', error.message);
        }
    }
    
    console.log('\n=== 🎯 CONCLUSION ===');
    console.log('Si l\'API fonctionne et retourne une paire complète:');
    console.log('✅ Le problème est dans la logique JavaScript');
    console.log('💡 Vérifiez les logs détaillés de editTransfer()');
    
    console.log('\nSi l\'API ne fonctionne pas:');
    console.log('❌ Problème avec l\'endpoint ou la base de données');
    console.log('💡 Vérifiez la configuration de l\'API');
}

testApiTransferRef();