/**
 * 🔍 DIAGNOSTIC AVANCÉ: Chargement des documents dans les virements
 * 
 * Ce script vérifie en détail pourquoi les documents ne se chargent pas
 * lors de la modification d'un virement.
 */

/**
 * Fonction de diagnostic à exécuter dans la console
 */
async function diagnosticVirementDocuments(virementId) {
    console.log('\n🔍 ===== DÉBUT DU DIAGNOSTIC =====\n');
    
    if (!virementId) {
        console.error('❌ Veuillez fournir un ID de virement');
        console.log('Usage: diagnosticVirementDocuments("votre-virement-id")');
        return;
    }
    
    // Étape 1: Vérifier que l'API retourne bien les données
    console.log('🔹 ÉTAPE 1: Test de l\'API');
    console.log('----------------------------');
    
    try {
        const response = await fetch(`${API_BASE}/transactions.php?id=${virementId}`);
        console.log('  ✅ Requête API effectuée');
        console.log('  Status:', response.status);
        
        if (!response.ok) {
            console.error('  ❌ Erreur HTTP:', response.status);
            return;
        }
        
        const data = await response.json();
        console.log('  ✅ Réponse JSON reçue');
        console.log('  Données:', data);
        
        if (!data.success) {
            console.error('  ❌ L\'API retourne success: false');
            return;
        }
        
        const transaction = data.data;
        console.log('  ✅ Transaction récupérée:', transaction.id);
        console.log('  Type:', transaction.type);
        console.log('  Description:', transaction.description);
        
        // Étape 2: Vérifier la présence des documents
        console.log('\n🔹 ÉTAPE 2: Vérification des documents');
        console.log('----------------------------');
        
        if (!transaction.documents) {
            console.error('  ❌ Le champ "documents" n\'existe PAS dans la réponse !');
            console.log('  Clés présentes:', Object.keys(transaction));
            return;
        }
        
        console.log('  ✅ Le champ "documents" existe');
        console.log('  Type de "documents":', typeof transaction.documents);
        console.log('  Est un tableau:', Array.isArray(transaction.documents));
        console.log('  Nombre de documents:', transaction.documents.length);
        
        if (transaction.documents.length === 0) {
            console.warn('  ⚠️ Aucun document associé à ce virement');
            console.log('\n💡 DIAGNOSTIC: Le virement n\'a aucun document enregistré en base de données.');
            return;
        }
        
        console.log('\n  Documents trouvés:');
        transaction.documents.forEach((doc, index) => {
            console.log(`\n  Document ${index + 1}:`);
            console.log('    - ID:', doc.id);
            console.log('    - Nom original:', doc.original_name);
            console.log('    - Nom fichier:', doc.file_name);
            console.log('    - Taille:', doc.file_size, 'octets');
            console.log('    - Type MIME:', doc.mime_type);
            console.log('    - Chemin:', doc.file_path);
        });
        
        // Étape 3: Vérifier l'élément DOM
        console.log('\n🔹 ÉTAPE 3: Vérification de l\'interface');
        console.log('----------------------------');
        
        const documentsList = document.getElementById('transfer-files-list');
        if (!documentsList) {
            console.error('  ❌ Élément #transfer-files-list NON TROUVÉ dans le DOM !');
            return;
        }
        
        console.log('  ✅ Élément #transfer-files-list trouvé');
        console.log('  Contenu actuel:', documentsList.innerHTML.substring(0, 100) + '...');
        
        // Étape 4: Vérifier que la fonction existe
        console.log('\n🔹 ÉTAPE 4: Vérification des fonctions JavaScript');
        console.log('----------------------------');
        
        if (typeof renderExistingTransferDocuments === 'undefined') {
            console.error('  ❌ Fonction renderExistingTransferDocuments N\'EXISTE PAS !');
            console.log('  💡 La fonction n\'a peut-être pas été chargée dans main.js');
            return;
        }
        
        console.log('  ✅ Fonction renderExistingTransferDocuments existe');
        
        // Étape 5: Tester manuellement le rendu
        console.log('\n🔹 ÉTAPE 5: Test manuel du rendu');
        console.log('----------------------------');
        
        try {
            console.log('  Appel de renderExistingTransferDocuments...');
            renderExistingTransferDocuments(transaction.documents);
            console.log('  ✅ Fonction exécutée sans erreur');
            console.log('  Vérifiez visuellement si les documents s\'affichent dans le modal');
        } catch (error) {
            console.error('  ❌ ERREUR lors de l\'exécution:', error);
            console.error('  Stack trace:', error.stack);
        }
        
        // Étape 6: Vérifier la fonction editTransfer
        console.log('\n🔹 ÉTAPE 6: Vérification de editTransfer');
        console.log('----------------------------');
        
        if (typeof editTransfer === 'undefined') {
            console.error('  ❌ Fonction editTransfer N\'EXISTE PAS !');
            return;
        }
        
        console.log('  ✅ Fonction editTransfer existe');
        
        // Afficher le code source de la fonction (premières lignes)
        const functionSource = editTransfer.toString();
        const documentsSection = functionSource.match(/\/\/ Onglet 3: Documents[\s\S]{0,500}/);
        if (documentsSection) {
            console.log('\n  Code de la section Documents:');
            console.log('  ' + documentsSection[0].replace(/\n/g, '\n  '));
        }
        
        console.log('\n🔍 ===== FIN DU DIAGNOSTIC =====\n');
        console.log('💡 RÉSUMÉ:');
        console.log('  - API fonctionne: ✅');
        console.log('  - Documents présents:', transaction.documents.length > 0 ? '✅' : '❌');
        console.log('  - Élément DOM existe: ✅');
        console.log('  - Fonction renderExistingTransferDocuments existe: ✅');
        console.log('\n📝 Si les documents ne s\'affichent toujours pas:');
        console.log('  1. Vérifiez la console pour des erreurs JavaScript');
        console.log('  2. Vérifiez que vous avez bien vidé le cache (Ctrl+F5)');
        console.log('  3. Vérifiez que le fichier main.js est bien à jour sur le serveur');
        
    } catch (error) {
        console.error('\n❌ ERREUR CRITIQUE:', error);
        console.error('Stack trace:', error.stack);
    }
}

/**
 * Fonction pour lister tous les virements avec documents
 */
async function listerVirementsAvecDocuments() {
    console.log('📋 Liste des virements avec documents:\n');
    
    try {
        const response = await fetch(`${API_BASE}/transactions.php?type=virement_debit`);
        const data = await response.json();
        
        if (!data.success || !data.data) {
            console.error('Erreur lors de la récupération des virements');
            return;
        }
        
        const virements = data.data;
        console.log(`Total de virements (débit): ${virements.length}\n`);
        
        let virementsAvecDocs = 0;
        
        for (const virement of virements) {
            if (virement.documents && virement.documents.length > 0) {
                virementsAvecDocs++;
                console.log(`✅ ID: ${virement.id}`);
                console.log(`   Description: ${virement.description}`);
                console.log(`   Montant: ${virement.amount} €`);
                console.log(`   Nombre de documents: ${virement.documents.length}`);
                console.log(`   Pour tester: diagnosticVirementDocuments("${virement.id}")\n`);
            }
        }
        
        console.log(`\n📊 Résumé:`);
        console.log(`   Virements avec documents: ${virementsAvecDocs}`);
        console.log(`   Virements sans documents: ${virements.length - virementsAvecDocs}`);
        
        if (virementsAvecDocs === 0) {
            console.log('\n⚠️ Aucun virement avec documents trouvé.');
            console.log('Créez un virement avec un document pour tester le diagnostic.');
        }
        
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Rendre les fonctions globalement accessibles
window.diagnosticVirementDocuments = diagnosticVirementDocuments;
window.listerVirementsAvecDocuments = listerVirementsAvecDocuments;

console.log('🚀 Script de diagnostic chargé !');
console.log('\nUtilisation:');
console.log('  1. listerVirementsAvecDocuments() - Liste tous les virements avec documents');
console.log('  2. diagnosticVirementDocuments("id-du-virement") - Diagnostic détaillé d\'un virement spécifique');
console.log('\nExemple:');
console.log('  diagnosticVirementDocuments("123e4567-e89b-12d3-a456-426614174000")');
