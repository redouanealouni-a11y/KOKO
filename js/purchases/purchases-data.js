/**
 * =====================================================
 * 🛒 SECTION: ACHATS ET DÉPENSES - CHARGEMENT DONNÉES
 * =====================================================
 * 
 * Fonctions pour charger les données (fournisseurs, catégories, comptes)
 * nécessaires aux formulaires d'achats
 */

/**
 * Charge la liste des fournisseurs pour le formulaire d'achat
 */
async function loadFournisseursForAchat() {
    console.log('👥 Chargement des fournisseurs pour achats...');
    
    try {
        const select = document.getElementById('achat-fournisseur');
        if (!select) {
            console.warn('⚠️ Select fournisseur non trouvé');
            return;
        }
        
        const response = await apiCall('/tiers.php?type=fournisseur');
        if (response.success && response.data) {
            // Vider le select
            select.innerHTML = '<option value="">Sélectionner un fournisseur</option>';
            
            // Ajouter les fournisseurs
            response.data.forEach(fournisseur => {
                const option = document.createElement('option');
                option.value = fournisseur.id;
                option.textContent = `${fournisseur.nom} ${fournisseur.prenom ? '(' + fournisseur.prenom + ')' : ''}`;
                select.appendChild(option);
            });
            
            console.log(`✅ ${response.data.length} fournisseurs chargés`);
        } else {
            console.warn('⚠️ Aucun fournisseur trouvé');
            select.innerHTML = '<option value="">Aucun fournisseur disponible</option>';
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des fournisseurs:', error);
        showNotification('Erreur lors du chargement des fournisseurs', 'error');
    }
}

/**
 * Charge la liste des catégories pour le formulaire d'achat
 */
async function loadCategoriesForAchat() {
    console.log('🏷️ Chargement des catégories pour achats...');
    
    try {
        const select = document.getElementById('achat-categorie-pieces');
        if (!select) {
            console.warn('⚠️ Select catégorie non trouvé');
            return;
        }
        
        const response = await apiCall('/categories.php?type=depense');
        if (response.success && response.data) {
            // Vider le select
            select.innerHTML = '<option value="">Sélectionner une catégorie</option>';
            
            // Ajouter les catégories
            response.data.forEach(categorie => {
                if (categorie.actif) {
                    const option = document.createElement('option');
                    option.value = categorie.id;
                    option.textContent = categorie.nom;
                    select.appendChild(option);
                }
            });
            
            console.log(`✅ ${response.data.filter(c => c.actif).length} catégories chargées`);
        } else {
            // Catégories par défaut si pas de données
            const defaultCategories = [
                { value: 'FOURNITURE', text: 'Fournitures' },
                { value: 'EQUIPEMENT', text: 'Équipement' },
                { value: 'MAINTENANCE', text: 'Maintenance' },
                { value: 'SERVICES', text: 'Services' },
                { value: 'TRAVAUX', text: 'Travaux' },
                { value: 'CONSOMMABLE', text: 'Consommables' },
                { value: 'AUTRES', text: 'Autres' }
            ];
            
            select.innerHTML = '<option value="">Sélectionner une catégorie</option>';
            defaultCategories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.value;
                option.textContent = cat.text;
                select.appendChild(option);
            });
            
            console.log('⚠️ Utilisation des catégories par défaut');
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des catégories:', error);
        showNotification('Erreur lors du chargement des catégories', 'error');
    }
}

/**
 * Charge la liste des comptes bancaires pour le formulaire d'achat
 */
async function loadComptesForAchat() {
    console.log('🏦 Chargement des comptes pour achats...');
    
    try {
        const select = document.getElementById('achat-compte');
        if (!select) {
            console.warn('⚠️ Select compte non trouvé');
            return;
        }
        
        const response = await apiCall('/comptes.php');
        if (response.success && response.data) {
            // Vider le select
            select.innerHTML = '<option value="">Sélectionner un compte</option>';
            
            // Ajouter les comptes
            response.data.forEach(compte => {
                if (compte.actif) {
                    const option = document.createElement('option');
                    option.value = compte.id;
                    option.textContent = `${compte.nom} (${compte.solde.toFixed(2)} €)`;
                    select.appendChild(option);
                }
            });
            
            console.log(`✅ ${response.data.filter(c => c.actif).length} comptes chargés`);
        } else {
            console.warn('⚠️ Aucun compte trouvé');
            select.innerHTML = '<option value="">Aucun compte disponible</option>';
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des comptes:', error);
        showNotification('Erreur lors du chargement des comptes', 'error');
    }
}

/**
 * Charge toutes les listes déroulantes du formulaire d'achat (VERSION UNIFIÉE)
 */
async function loadAchatDropdowns() {
    console.log('📋 Chargement de toutes les listes déroulantes pour achats...');
    
    try {
        // Charger toutes les listes en parallèle
        await Promise.all([
            loadFournisseursForAchat(),
            loadCategoriesForAchat(),
            loadComptesForAchat()
        ]);
        
        console.log('✅ Toutes les listes déroulantes chargées');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des listes:', error);
        showNotification('Erreur lors du chargement des options', 'error');
    }
}

/**
 * =====================================================
 * 📊 CHARGEMENT DES SECTIONS DE L'ONGLET ACHATS
 * =====================================================
 */

/**
 * Charge la vue d'ensemble des achats
 */
async function loadAchatsVueEnsemble() {
    console.log('📊 Chargement de la vue d\'ensemble des achats...');
    
    try {
        const content = document.getElementById('achats-vue-ensemble-content');
        if (!content) {
            console.error('❌ Contenu vue d\'ensemble non trouvé');
            return;
        }
        
        // Afficher un spinner
        content.innerHTML = `
            <div class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                <span class="ml-3 text-gray-600">Chargement de la vue d'ensemble...</span>
            </div>
        `;
        
        // Simuler le chargement (remplacer par un vrai appel API)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Recharger le contenu complet (le HTML est déjà défini dans index.php)
        // On pourrait ici mettre à jour les données动态s
        
        console.log('✅ Vue d\'ensemble des achats chargée');
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la vue d\'ensemble:', error);
        content.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-gray-600">Erreur lors du chargement des données</p>
            </div>
        `;
    }
}

/**
 * Charge la section des enregistrements d'achats
 */
async function loadAchatsEnregistrements() {
    console.log('📝 Chargement des enregistrements d\'achats...');
    
    try {
        const tableBody = document.getElementById('achats-table');
        if (!tableBody) {
            console.error('❌ Table des achats non trouvée');
            return;
        }
        
        // Afficher le spinner
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-8">
                    <div class="loading mx-auto"></div>
                    <p class="text-gray-500 mt-3">Chargement des achats...</p>
                </td>
            </tr>
        `;
        
        // Charger les achats depuis l'API
        const response = await apiCall('/transactions.php?type=achat');
        if (response.success && response.data) {
            renderAchatsTable(response.data);
        } else {
            // Pas de données
            tableBody.innerHTML = `
                <tr>
                    <td colspan="10" class="text-center py-8">
                        <i class="fas fa-inbox text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-500">Aucun achat enregistré</p>
                    </td>
                </tr>
            `;
        }
        
        console.log('✅ Enregistrements d\'achats chargés');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des enregistrements:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-8">
                    <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                    <p class="text-red-500">Erreur lors du chargement</p>
                </td>
            </tr>
        `;
    }
}

/**
 * Charge la section de suivi des paiements
 */
async function loadAchatsSuiviPaiements() {
    console.log('💳 Chargement du suivi des paiements...');
    
    try {
        const content = document.getElementById('achats-suivi-paiements-content');
        if (!content) {
            console.error('❌ Contenu suivi paiements non trouvé');
            return;
        }
        
        // Le contenu est déjà défini dans index.php
        // On pourrait ici charger les données dynamiques
        
        console.log('✅ Suivi des paiements chargé');
    } catch (error) {
        console.error('❌ Erreur lors du chargement du suivi paiements:', error);
    }
}

/**
 * Charge la section des catégories (avec bouton "Nouvelle Catégorie" qui fonctionne)
 */
async function loadAchatsCategories() {
    console.log('🏷️ Chargement des catégories...');
    
    try {
        const content = document.getElementById('achats-categories-content');
        const categoriesList = document.getElementById('categories-list');
        
        if (!content || !categoriesList) {
            console.error('❌ Éléments de la section catégories non trouvés');
            return;
        }
        
        // Afficher le spinner
        categoriesList.innerHTML = `
            <div class="col-span-full text-center py-8 text-gray-500">
                <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                <p>Chargement des catégories...</p>
            </div>
        `;
        
        // Charger les catégories depuis l'API
        const response = await apiCall('/categories.php?type=depense');
        if (response.success && response.data) {
            renderCategoriesList(response.data);
        } else {
            renderCategoriesList([]);
        }
        
        console.log('✅ Catégories chargées');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des catégories:', error);
        showNotification('Erreur lors du chargement des catégories', 'error');
    }
}

/**
 * Charge la section des rapports
 */
async function loadAchatsRapports() {
    console.log('📈 Chargement des rapports d\'achats...');
    
    try {
        const content = document.getElementById('achats-rapports-content');
        if (!content) {
            console.error('❌ Contenu rapports non trouvé');
            return;
        }
        
        // Le contenu est déjà défini dans index.php
        // On pourrait ici générer des rapports dynamiques
        
        console.log('✅ Rapports d\'achats chargés');
    } catch (error) {
        console.error('❌ Erreur lors du chargement des rapports:', error);
    }
}

/**
 * =====================================================
 * 🏷️ FONCTIONS DE RENDU DES CATÉGORIES MANQUANTES
 * =====================================================
 * 
 * Ces fonctions étaient manquantes et causaient l'erreur
 * "Erreur lors du chargement des catégories"
 */

/**
 * Crée une carte d'affichage pour une catégorie
 */
function createCategoryCard(categorie) {
    const card = document.createElement('div');
    card.className = 'category-card-modern bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden';
    
    // Utiliser l'icône FontAwesome de la base de données
    const icone = categorie.icone || 'fas fa-tag';
    const nomAffiche = categorie.nom || 'Catégorie';
    const codeAffiche = categorie.code || 'N/A';
    const couleur = categorie.couleur || '#6B7280';
    
    // Formater la date correctement
    let dateCree = 'Date non disponible';
    try {
        if (categorie.date_creation) {
            const date = new Date(categorie.date_creation);
            if (!isNaN(date.getTime())) {
                dateCree = date.toLocaleDateString('fr-FR');
            }
        }
    } catch (error) {
        console.warn('Erreur formatage date:', categorie.date_creation);
    }
    
    // Calculer le badge de statut
    const statutBadge = categorie.actif ? 
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>Active</span>' :
        '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"><i class="fas fa-pause-circle mr-1"></i>Inactive</span>';
    
    card.innerHTML = `
        <!-- En-tête avec icône et informations principales -->
        <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-4">
                <!-- Icône avec gradient et effet moderne -->
                <div class="category-icon-container p-4 rounded-xl shadow-md flex items-center justify-center relative overflow-hidden">
                    <div class="absolute inset-0 opacity-10" style="background: linear-gradient(45deg, ${couleur}, ${couleur}80);"></div>
                    <i class="${icone} text-2xl relative z-10" style="color: ${couleur};"></i>
                </div>
                
                <!-- Informations principales -->
                <div class="flex-1">
                    <div class="flex items-center space-x-2 mb-1">
                        <h4 class="font-bold text-lg text-gray-900 leading-tight">${nomAffiche}</h4>
                        ${statutBadge}
                    </div>
                    <div class="flex items-center space-x-3 text-sm text-gray-500">
                        <span class="bg-gray-100 px-2 py-1 rounded-md font-medium">
                            <i class="fas fa-hashtag mr-1"></i>${codeAffiche}
                        </span>
                    </div>
                </div>
            </div>
            
            <!-- Menu d'actions -->
            <div class="flex space-x-1 ml-4">
                <button onclick="editCategory(${categorie.id})" 
                        class="action-btn text-blue-600 hover:text-white hover:bg-blue-600 p-2 rounded-lg transition-all duration-200 group"
                        title="Modifier">
                    <i class="fas fa-edit group-hover:scale-110 transition-transform"></i>
                </button>
                <button onclick="deleteCategory(${categorie.id})" 
                        class="action-btn text-red-600 hover:text-white hover:bg-red-600 p-2 rounded-lg transition-all duration-200 group"
                        title="Supprimer">
                    <i class="fas fa-trash group-hover:scale-110 transition-transform"></i>
                </button>
            </div>
        </div>
        
        <!-- Description (si disponible) -->
        ${categorie.description ? `
            <div class="mb-4 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border-l-4" style="border-left-color: ${couleur};">
                <p class="text-sm text-gray-600 leading-relaxed">${categorie.description}</p>
            </div>
        ` : ''}
        
        <!-- Pied de carte avec métadonnées -->
        <div class="flex items-center justify-between pt-3 border-t border-gray-100">
            <div class="flex items-center text-xs text-gray-500 space-x-4">
                <div class="flex items-center space-x-1">
                    <i class="fas fa-calendar-plus text-gray-400"></i>
                    <span class="font-medium">${dateCree}</span>
                </div>
                <div class="flex items-center space-x-1">
                    <i class="fas fa-palette text-gray-400"></i>
                    <span class="w-4 h-4 rounded-full border-2 border-gray-200" style="background-color: ${couleur};"></span>
                </div>
            </div>
            <div class="text-xs text-gray-400 font-medium">
                #${categorie.id}
            </div>
        </div>
        
        <!-- Effet de brillance au survol -->
        <div class="card-shine absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-xl bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 translate-x-full hover:translate-x-[-200%]"></div>
    `;
    
    return card;
}

/**
 * Affiche la liste des catégories dans le container
 */
function renderCategoriesList(categories) {
    const container = document.getElementById('categories-list');
    const noCategoriesMessage = document.getElementById('no-categories-message');
    
    if (!container) {
        console.error('❌ Container categories-list non trouvé');
        return;
    }
    
    // Vider le conteneur
    container.innerHTML = '';
    
    if (categories && categories.length > 0) {
        // Afficher chaque catégorie
        categories.forEach(categorie => {
            const categoryCard = createCategoryCard(categorie);
            container.appendChild(categoryCard);
        });
        
        // Masquer le message "aucune catégorie"
        if (noCategoriesMessage) {
            noCategoriesMessage.classList.add('hidden');
        }
        
        console.log(`✅ ${categories.length} catégories affichées`);
    } else {
        // Aucune catégorie trouvée
        if (noCategoriesMessage) {
            noCategoriesMessage.classList.remove('hidden');
        }
        console.log('⚠️ Aucune catégorie trouvée');
    }
}