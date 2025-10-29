/**
 * =====================================================
 * 🛒 SECTION: ACHATS ET DÉPENSES - SAUVEGARDE & DOCUMENTS
 * =====================================================
 * 
 * Fonctions pour la sauvegarde des achats et gestion des documents
 */

/**
 * =====================================================
 * 💾 SAUVEGARDE DES ACHATS
 * =====================================================
 */

/**
 * Sauvegarde un achat (VERSION UNIFIÉE)
 * @param {boolean} continueAfter - Continuer après sauvegarde (garder modal ouvert)
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
async function saveAchat(continueAfter = false) {
    console.log(`💾 Sauvegarde achat (continuer: ${continueAfter})...`);
    
    try {
        // Collecter et valider les données
        const formData = collectAchatData();
        const validation = validateAchatForm(formData);
        
        if (!validation.valid) {
            console.warn('❌ Validation échouée:', validation.errors);
            return { success: false, errors: validation.errors };
        }
        
        // Afficher un indicateur de chargement
        showSavingIndicator(true);
        
        // Déterminer l'URL et la méthode selon le mode (ajout/modification)
        const isEdit = editingId !== null;
        const url = isEdit ? `/transactions.php?id=${editingId}` : '/transactions.php';
        const method = isEdit ? 'PUT' : 'POST';
        
        console.log(`${isEdit ? '✏️ Modification' : '➕ Ajout'} achat via ${method} ${url}`);
        
        // Envoyer la requête
        const response = await apiCall(url, {
            method: method,
            body: JSON.stringify({
                ...formData,
                type: 'achat'
            })
        });
        
        if (response.success) {
            console.log('✅ Achat sauvegardé avec succès:', response.data);
            
            // Actualiser les données de l'application
            if (isEdit) {
                // Mise à jour d'un achat existant
                const index = appData.transactions.findIndex(t => t.id === editingId);
                if (index !== -1) {
                    appData.transactions[index] = { ...appData.transactions[index], ...response.data };
                }
            } else {
                // Ajout d'un nouvel achat
                appData.transactions.push(response.data);
            }
            
            // Afficher une notification de succès
            showNotification(
                `Achat ${isEdit ? 'modifié' : 'ajouté'} avec succès`, 
                'success'
            );
            
            // Actualiser l'affichage
            updateAchatsDisplay();
            
            // Fermer ou continuer selon le paramètre
            if (continueAfter) {
                resetAchatForm();
                loadAchatDropdowns(); // Recharger les listes
            } else {
                closeAchatModal();
                editingId = null; // Réinitialiser le mode édition
            }
            
            return { success: true, data: response.data };
        } else {
            console.error('❌ Erreur lors de la sauvegarde:', response);
            showNotification(response.message || 'Erreur lors de la sauvegarde', 'error');
            return { success: false, message: response.message };
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde de l\'achat:', error);
        showNotification('Erreur lors de la sauvegarde', 'error');
        return { success: false, error: error.message };
    } finally {
        showSavingIndicator(false);
    }
}

/**
 * Gestionnaire d'événement pour la sauvegarde via formulaire
 * @param {Event} event 
 */
async function saveAchatFromForm(event) {
    event.preventDefault();
    console.log('📝 Soumission du formulaire d\'achat...');
    
    const continueAfter = event.submitter?.dataset.continue === 'true';
    const result = await saveAchat(continueAfter);
    
    if (result.success) {
        // Actions post-sauvegarde réussies
        console.log('✅ Achat enregistré depuis le formulaire');
    }
}

/**
 * =====================================================
 * 📎 GESTION DES DOCUMENTS
 * =====================================================
 */

/**
 * Gère la sélection de fichiers pour l'achat
 * @param {Event} event 
 */
function handleAchatFileSelection(event) {
    console.log('📎 Sélection de fichiers pour achat...');
    
    const files = Array.from(event.target.files);
    const uploadZone = document.getElementById('upload-zone');
    const uploadedFiles = document.getElementById('uploaded-files');
    
    if (!uploadZone || !uploadedFiles) {
        console.warn('⚠️ Éléments d\'upload non trouvés');
        return;
    }
    
    // Ajouter les fichiers à la liste
    files.forEach(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB max
            showNotification(`Le fichier "${file.name}" est trop volumineux (max 10MB)`, 'warning');
            return;
        }
        
        // Ajouter le fichier à la zone d'affichage
        const fileElement = createFileElement(file);
        uploadedFiles.appendChild(fileElement);
    });
    
    // Mettre à jour l'apparence de la zone d'upload
    uploadZone.classList.toggle('has-files', uploadedFiles.children.length > 0);
    
    console.log(`📎 ${files.length} fichier(s) ajouté(s)`);
}

/**
 * Crée un élément visuel pour afficher un fichier sélectionné
 * @param {File} file 
 * @returns {HTMLElement} Élément du fichier
 */
function createFileElement(file) {
    const fileDiv = document.createElement('div');
    fileDiv.className = 'uploaded-file';
    fileDiv.innerHTML = `
        <div class="file-info">
            <i class="fas fa-file-${getFileIcon(file.type)}"></i>
            <span class="file-name">${sanitizeHTML(file.name)}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
        </div>
        <button type="button" class="remove-file" onclick="removeFile(this)">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Stocker le fichier dans l'élément
    fileDiv.file = file;
    
    return fileDiv;
}

/**
 * Supprime un fichier de la liste des fichiers uploadés
 * @param {HTMLElement} button 
 */
function removeFile(button) {
    const fileDiv = button.closest('.uploaded-file');
    if (fileDiv) {
        fileDiv.remove();
        
        // Mettre à jour l'apparence de la zone d'upload
        const uploadZone = document.getElementById('upload-zone');
        const uploadedFiles = document.getElementById('uploaded-files');
        if (uploadZone && uploadedFiles) {
            uploadZone.classList.toggle('has-files', uploadedFiles.children.length > 0);
        }
        
        console.log('📎 Fichier supprimé de la liste');
    }
}

/**
 * Upload un document pour un achat existant
 * @param {number} transactionId - ID de la transaction
 * @param {File} file - Fichier à uploader
 * @returns {Promise<Object>} Résultat de l'upload
 */
async function uploadAchatDocument(transactionId, file) {
    console.log(`📤 Upload document pour achat ${transactionId}...`);
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('transaction_id', transactionId);
        formData.append('type', 'achat');
        
        const response = await fetch(`${API_BASE}/upload.php`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Document uploadé avec succès:', result.data);
            showNotification('Document uploadé avec succès', 'success');
            return { success: true, data: result.data };
        } else {
            console.error('❌ Erreur upload:', result.message);
            showNotification(result.message || 'Erreur lors de l\'upload', 'error');
            return { success: false, message: result.message };
        }
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'upload du document:', error);
        showNotification('Erreur lors de l\'upload', 'error');
        return { success: false, error: error.message };
    }
}

/**
 * =====================================================
 * 🛠️ FONCTIONS UTILITAIRES
 * =====================================================
 */

/**
 * Duplique l'achat actuel
 */
function duplicateCurrentAchat() {
    console.log('📋 Duplication de l\'achat actuel...');
    
    // Collecter les données actuelles
    const currentData = collectAchatData();
    
    // Vider les champs qui ne doivent pas être dupliqués
    delete currentData.id;
    delete currentData.reference; // Peut être régénéré
    
    // Réinitialiser le formulaire avec les nouvelles données
    prefillAchatForm(currentData);
    
    // Ajuster le titre de la modal
    const modal = document.getElementById('achatModal');
    const title = modal?.querySelector('.modal-header h2');
    if (title) {
        title.innerHTML = '<i class="fas fa-copy"></i> Dupliquer Achat';
    }
    
    showNotification('Formulaire préparé pour duplication', 'info');
    console.log('✅ Achat dupliqué dans le formulaire');
}

/**
 * Exporte les données d'achat
 */
function exportAchatData() {
    console.log('📊 Export des données d\'achat...');
    
    // Collecter toutes les données d'achats
    const achatsData = appData.transactions.filter(t => t.type === 'achat');
    
    if (achatsData.length === 0) {
        showNotification('Aucune donnée d\'achat à exporter', 'warning');
        return;
    }
    
    // Convertir en CSV
    const csv = convertToCSV(achatsData);
    
    // Télécharger le fichier
    downloadCSV(csv, `achats_${new Date().toISOString().split('T')[0]}.csv`);
    
    showNotification('Données d\'achat exportées', 'success');
    console.log(`📊 ${achatsData.length} achats exportés`);
}

/**
 * Affiche/masque l'indicateur de sauvegarde
 * @param {boolean} show 
 */
function showSavingIndicator(show) {
    // Chercher le bouton de sauvegarde actif
    const saveButton = document.querySelector('#achatModal button[type="submit"]');
    if (saveButton) {
        saveButton.disabled = show;
        saveButton.innerHTML = show 
            ? '<i class="fas fa-spinner fa-spin"></i> Sauvegarde...'
            : '<i class="fas fa-save"></i> Enregistrer';
    }
}