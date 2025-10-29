/**
 * Script de diagnostic pour le système d'upload de documents
 * À ajouter temporairement à la fin de main.js pour tester
 */

// Fonction de diagnostic à appeler depuis la console
window.diagnosticUploadSystem = function() {
    console.log('='.repeat(60));
    console.log('🔍 DIAGNOSTIC DU SYSTÈME D\'UPLOAD DE DOCUMENTS');
    console.log('='.repeat(60));
    
    // 1. Vérifier les éléments DOM
    console.log('\n1️⃣ Vérification des éléments DOM:');
    console.log('-'.repeat(60));
    
    const elements = {
        // Transaction normale
        'transaction-file-input': document.getElementById('transaction-file-input'),
        'documents-list': document.getElementById('documents-list'),
        'content-documents': document.getElementById('content-documents'),
        
        // Virement
        'transfer-file-input': document.getElementById('transfer-file-input'),
        'transfer-files-list': document.getElementById('transfer-files-list'),
        'transfer-content-documents': document.getElementById('transfer-content-documents')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            console.log(`✅ ${key}: TROUVÉ`);
        } else {
            console.log(`❌ ${key}: MANQUANT`);
        }
    });
    
    // 2. Vérifier les fonctions JavaScript
    console.log('\n2️⃣ Vérification des fonctions JavaScript:');
    console.log('-'.repeat(60));
    
    const functions = {
        'triggerFileUpload': typeof window.triggerFileUpload,
        'handleFileSelection': typeof window.handleFileSelection,
        'renderFilesList': typeof window.renderFilesList,
        'uploadTransactionDocuments': typeof window.uploadTransactionDocuments,
        'handleTransferFiles': typeof window.handleTransferFiles,
        'renderTransferFilesList': typeof window.renderTransferFilesList,
        'uploadTransferDocuments': typeof window.uploadTransferDocuments
    };
    
    Object.keys(functions).forEach(key => {
        if (functions[key] === 'function') {
            console.log(`✅ ${key}: EXISTE`);
        } else {
            console.log(`❌ ${key}: MANQUANTE (${functions[key]})`);
        }
    });
    
    // 3. Vérifier les tableaux de fichiers
    console.log('\n3️⃣ Vérification des tableaux de fichiers:');
    console.log('-'.repeat(60));
    console.log(`transactionFiles: ${typeof transactionFiles} - Longueur: ${transactionFiles ? transactionFiles.length : 'N/A'}`);
    console.log(`transferFiles: ${typeof transferFiles} - Longueur: ${transferFiles ? transferFiles.length : 'N/A'}`);
    
    // 4. Tester l'ouverture du sélecteur de fichiers
    console.log('\n4️⃣ Test d\'ouverture du sélecteur:');
    console.log('-'.repeat(60));
    console.log('👉 Exécutez cette commande pour tester l\'ouverture du sélecteur:');
    console.log('   triggerFileUpload()  // Pour transaction normale');
    console.log('   document.getElementById("transfer-file-input").click()  // Pour virement');
    
    // 5. Vérifier l'API
    console.log('\n5️⃣ Vérification de l\'API:');
    console.log('-'.repeat(60));
    console.log(`API_BASE: ${API_BASE}`);
    console.log(`URL upload: ${API_BASE}/upload_document.php`);
    
    // Test de connexion à l'API
    console.log('\n🌐 Test de connexion à l\'API...');
    fetch(API_BASE + '/upload_document.php', {
        method: 'OPTIONS'
    })
    .then(response => {
        console.log(`✅ API accessible: ${response.status} ${response.statusText}`);
    })
    .catch(error => {
        console.log(`❌ API inaccessible: ${error.message}`);
    });
    
    // 6. Instructions pour tester
    console.log('\n6️⃣ Instructions de test:');
    console.log('-'.repeat(60));
    console.log('📝 Pour tester l\'upload de fichiers manuellement:');
    console.log('');
    console.log('// Étape 1: Sélectionner un fichier');
    console.log('const fileInput = document.getElementById("transaction-file-input");');
    console.log('fileInput.click(); // Puis sélectionnez un fichier');
    console.log('');
    console.log('// Étape 2: Vérifier que le fichier est dans la liste');
    console.log('console.log(transactionFiles);');
    console.log('');
    console.log('// Étape 3: Tester le rendu');
    console.log('renderFilesList();');
    console.log('');
    
    console.log('='.repeat(60));
    console.log('🎉 Diagnostic terminé!');
    console.log('='.repeat(60));
};

// Fonction pour tester l'upload avec un fichier de test
window.testUploadWithFakeFile = async function() {
    console.log('🧪 Test d\'upload avec un fichier factice...');
    
    // Créer un fichier de test
    const testContent = 'Test document upload - ' + new Date().toISOString();
    const blob = new Blob([testContent], { type: 'text/plain' });
    const file = new File([blob], 'test_document.txt', { type: 'text/plain' });
    
    console.log('📄 Fichier de test créé:', file.name, file.size, 'octets');
    
    // Ajouter à la liste
    transactionFiles.push(file);
    console.log(`✅ Fichier ajouté au tableau. Total: ${transactionFiles.length}`);
    
    // Rendre la liste
    try {
        renderFilesList();
        console.log('✅ Liste rendue avec succès');
    } catch (error) {
        console.log('❌ Erreur lors du rendu:', error);
    }
    
    // Vérifier le contenu de documents-list
    const docsList = document.getElementById('documents-list');
    if (docsList) {
        console.log(`🔍 Contenu de documents-list:`, docsList.innerHTML.substring(0, 200) + '...');
    }
};

// Fonction pour tester l'upload complet
window.testCompleteUpload = async function(transactionId) {
    if (!transactionId) {
        console.log('❌ Veuillez fournir un ID de transaction');
        console.log('Exemple: testCompleteUpload("votre-transaction-id")');
        return;
    }
    
    console.log(`🚀 Test d'upload complet pour la transaction: ${transactionId}`);
    
    if (transactionFiles.length === 0) {
        console.log('⚠️ Aucun fichier à uploader. Exécutez d\'abord: testUploadWithFakeFile()');
        return;
    }
    
    try {
        await uploadTransactionDocuments(transactionId);
        console.log('✅ Upload terminé avec succès!');
    } catch (error) {
        console.log('❌ Erreur lors de l\'upload:', error.message);
        console.log('Stack:', error.stack);
    }
};

// Ajouter des écouteurs d'événements pour le débogage
window.addEventListener('DOMContentLoaded', function() {
    console.log('%c🔧 DIAGNOSTIC SYSTEM LOADED', 'background: #4CAF50; color: white; padding: 5px 10px; border-radius: 3px;');
    console.log('Pour lancer le diagnostic, exécutez: diagnosticUploadSystem()');
    console.log('Pour tester avec un fichier factice: testUploadWithFakeFile()');
    console.log('Pour tester l\'upload complet: testCompleteUpload("transaction-id")');
    
    // Ajouter un listener sur le changement de fichiers pour déboguer
    const transactionFileInput = document.getElementById('transaction-file-input');
    if (transactionFileInput) {
        transactionFileInput.addEventListener('change', function(e) {
            console.log('📥 Événement change déclenché sur transaction-file-input');
            console.log(`   Fichiers sélectionnés: ${e.target.files.length}`);
            if (e.target.files.length > 0) {
                Array.from(e.target.files).forEach((file, index) => {
                    console.log(`   ${index + 1}. ${file.name} (${file.size} octets)`);
                });
            }
        });
    }
    
    const transferFileInput = document.getElementById('transfer-file-input');
    if (transferFileInput) {
        transferFileInput.addEventListener('change', function(e) {
            console.log('📥 Événement change déclenché sur transfer-file-input');
            console.log(`   Fichiers sélectionnés: ${e.target.files.length}`);
            if (e.target.files.length > 0) {
                Array.from(e.target.files).forEach((file, index) => {
                    console.log(`   ${index + 1}. ${file.name} (${file.size} octets)`);
                });
            }
        });
    }
});

console.log('%c🔧 Script de diagnostic chargé!', 'background: #2196F3; color: white; padding: 5px 10px; border-radius: 3px;');
