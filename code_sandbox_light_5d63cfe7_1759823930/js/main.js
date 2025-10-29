/**
 * Application JavaScript principale - Gestion de Caisse Régie
 * Version: 2.0.0
 */

// Configuration globale
const APP_CONFIG = {
    API_BASE: './api',
    VERSION: '2.0.0',
    PAGINATION_LIMIT: 20,
    CURRENCY: 'EUR',
    DATE_FORMAT: 'DD/MM/YYYY'
};

// Variables globales
let currentSection = 'dashboard';
let currentPage = 1;
let currentFilters = {};
let charts = {};

// État de l'application
const appState = {
    transactions: [],
    comptes: [],
    tiers: [],
    categories: [],
    settings: {},
    loading: false
};

/**
 * Initialisation de l'application
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation de l\'application Gestion de Caisse Régie v' + APP_CONFIG.VERSION);
    
    // Initialiser la date courante
    updateCurrentDate();
    setInterval(updateCurrentDate, 60000); // Mettre à jour chaque minute
    
    // Charger les données initiales
    initializeApp();
    
    // Initialiser les événements
    initializeEvents();
    
    // Afficher le tableau de bord par défaut
    showSection('dashboard');
});

/**
 * Initialisation des données de l'application
 */
async function initializeApp() {
    showLoader('Chargement de l\'application...');
    
    try {
        // Charger les paramètres
        await loadSettings();
        
        // Charger les données de base
        await Promise.all([
            loadCategories(),
            loadComptes(),
            loadTiers()
        ]);
        
        // Charger le tableau de bord
        await loadDashboard();
        
        hideLoader();
        showNotification('Application chargée avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        hideLoader();
        showNotification('Erreur lors du chargement de l\'application: ' + error.message, 'error');
    }
}

/**
 * Initialisation des événements
 */
function initializeEvents() {
    // Événements des formulaires
    setupFormEvents();
    
    // Événements de navigation
    setupNavigationEvents();
    
    // Événements des modals
    setupModalEvents();
    
    // Événements des filtres
    setupFilterEvents();
}

/**
 * Gestion de la navigation
 */
function showSection(sectionName) {
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Désactiver tous les liens de navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Afficher la section demandée
    const targetSection = document.getElementById('section-' + sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        currentSection = sectionName;
        
        // Activer le lien de navigation correspondant
        document.querySelector(`[onclick="showSection('${sectionName}')"]`)?.classList.add('active');
        
        // Charger les données spécifiques à la section
        loadSectionData(sectionName);
    }
}

/**
 * Charger les données spécifiques à une section
 */
async function loadSectionData(sectionName) {
    try {
        switch (sectionName) {
            case 'dashboard':
                await loadDashboard();
                break;
            case 'transactions':
                await loadTransactions();
                break;
            case 'comptes':
                await loadComptes();
                break;
            case 'tiers':
                await loadTiers();
                break;
            case 'parametres':
                await loadParametres();
                break;
        }
    } catch (error) {
        console.error('Erreur lors du chargement de la section:', error);
        showNotification('Erreur lors du chargement des données: ' + error.message, 'error');
    }
}

/**
 * Chargement du tableau de bord
 */
async function loadDashboard() {
    try {
        // Charger les statistiques
        const [statsResponse, transactionsResponse, comptesResponse] = await Promise.all([
            apiCall('GET', 'transactions', { action: 'stats' }),
            apiCall('GET', 'transactions', { limit: 10 }),
            apiCall('GET', 'comptes', { action: 'resume' })
        ]);
        
        // Mettre à jour les KPIs
        updateKPIs(statsResponse.data, comptesResponse.data);
        
        // Mettre à jour le tableau des dernières transactions
        updateDashboardTransactions(transactionsResponse.data.data);
        
        // Mettre à jour les graphiques
        updateDashboardCharts(statsResponse.data);
        
    } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord:', error);
        throw error;
    }
}

/**
 * Mise à jour des KPIs du tableau de bord
 */
function updateKPIs(stats, comptesStats) {
    const soldeTotal = comptesStats.statistiques.solde_total_actuel || 0;
    const recettesMois = stats.general?.total_recettes || 0;
    const depensesMois = stats.general?.total_depenses || 0;
    const nbComptes = comptesStats.statistiques.total_comptes || 0;
    
    // Solde total
    document.getElementById('kpi-solde-total').textContent = formatCurrency(soldeTotal);
    
    // Recettes du mois
    document.getElementById('kpi-recettes-mois').textContent = formatCurrency(recettesMois);
    
    // Dépenses du mois
    document.getElementById('kpi-depenses-mois').textContent = formatCurrency(depensesMois);
    
    // Nombre de comptes
    document.getElementById('kpi-nb-comptes').textContent = nbComptes;
}

/**
 * Mise à jour du tableau des dernières transactions
 */
function updateDashboardTransactions(transactions) {
    const tbody = document.getElementById('table-dernieres-transactions');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Aucune transaction récente</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date)}</td>
            <td>
                <span class="badge badge-${transaction.type === 'recette' ? 'success' : 'danger'}">
                    ${transaction.type === 'recette' ? 'Recette' : 'Dépense'}
                </span>
            </td>
            <td>${escapeHtml(transaction.description)}</td>
            <td class="text-end ${transaction.type === 'recette' ? 'text-success' : 'text-danger'}">
                ${transaction.type === 'recette' ? '+' : '-'}${formatCurrency(transaction.montant)}
            </td>
            <td>
                <i class="fas fa-${transaction.compte.type === 'caisse' ? 'cash-register' : 'university'} me-1"></i>
                ${escapeHtml(transaction.compte.nom)}
            </td>
            <td>
                ${transaction.categorie ? 
                    `<span class="badge" style="background-color: ${transaction.categorie.couleur}">${escapeHtml(transaction.categorie.nom)}</span>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
        </tr>
    `).join('');
}

/**
 * Mise à jour des graphiques du tableau de bord
 */
function updateDashboardCharts(stats) {
    // Graphique d'évolution
    updateEvolutionChart(stats);
    
    // Graphique de répartition par catégorie
    updateCategoriesChart(stats.par_categorie);
}

/**
 * Graphique d'évolution des finances
 */
function updateEvolutionChart(stats) {
    const ctx = document.getElementById('chart-evolution').getContext('2d');
    
    // Données d'exemple pour l'évolution (à remplacer par de vraies données)
    const labels = [];
    const recettesData = [];
    const depensesData = [];
    
    // Générer les données des 6 derniers mois
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        labels.push(date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }));
        
        // Données simulées (à remplacer par de vraies données)
        recettesData.push(Math.random() * 5000 + 2000);
        depensesData.push(Math.random() * 3000 + 1000);
    }
    
    if (charts.evolution) {
        charts.evolution.destroy();
    }
    
    charts.evolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Recettes',
                data: recettesData,
                borderColor: '#28a745',
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: true
            }, {
                label: 'Dépenses',
                data: depensesData,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220, 53, 69, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

/**
 * Graphique de répartition par catégorie
 */
function updateCategoriesChart(categoriesData) {
    const ctx = document.getElementById('chart-categories').getContext('2d');
    
    if (!categoriesData || categoriesData.length === 0) {
        return;
    }
    
    const labels = [];
    const data = [];
    const colors = [];
    
    categoriesData.forEach(cat => {
        if (cat.total > 0) {
            labels.push(cat.categorie || 'Sans catégorie');
            data.push(cat.total);
            colors.push(cat.couleur || '#6c757d');
        }
    });
    
    if (charts.categories) {
        charts.categories.destroy();
    }
    
    charts.categories = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = formatCurrency(context.parsed);
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Chargement des transactions
 */
async function loadTransactions(page = 1) {
    try {
        showLoader('Chargement des transactions...');
        
        const params = {
            page: page,
            limit: APP_CONFIG.PAGINATION_LIMIT,
            ...currentFilters
        };
        
        const response = await apiCall('GET', 'transactions', params);
        
        appState.transactions = response.data.data;
        updateTransactionsTable(response.data);
        updateTransactionsPagination(response.data.pagination);
        
        hideLoader();
        
    } catch (error) {
        console.error('Erreur lors du chargement des transactions:', error);
        hideLoader();
        throw error;
    }
}

/**
 * Mise à jour du tableau des transactions
 */
function updateTransactionsTable(data) {
    const tbody = document.getElementById('table-transactions');
    
    if (!data.data || data.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">Aucune transaction trouvée</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.data.map(transaction => `
        <tr>
            <td>${formatDate(transaction.date)}</td>
            <td>
                <span class="badge badge-${transaction.type === 'recette' ? 'success' : 'danger'}">
                    ${transaction.type === 'recette' ? 'Recette' : 'Dépense'}
                </span>
            </td>
            <td>
                ${escapeHtml(transaction.description)}
                ${transaction.numero_piece ? `<br><small class="text-muted">N° ${escapeHtml(transaction.numero_piece)}</small>` : ''}
            </td>
            <td class="text-end ${transaction.type === 'recette' ? 'text-success' : 'text-danger'}">
                ${transaction.type === 'recette' ? '+' : '-'}${formatCurrency(transaction.montant)}
            </td>
            <td>
                <i class="fas fa-${transaction.compte.type === 'caisse' ? 'cash-register' : 'university'} me-1"></i>
                ${escapeHtml(transaction.compte.nom)}
            </td>
            <td>
                ${transaction.categorie ? 
                    `<span class="badge" style="background-color: ${transaction.categorie.couleur}">${escapeHtml(transaction.categorie.nom)}</span>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
            <td>
                ${transaction.tiers ? 
                    `<span class="badge bg-secondary">${escapeHtml(transaction.tiers.nom)}</span>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editTransaction(${transaction.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteTransaction(${transaction.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Mise à jour de la pagination des transactions
 */
function updateTransactionsPagination(pagination) {
    const container = document.getElementById('pagination-transactions');
    
    if (pagination.pages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Bouton précédent
    if (pagination.has_prev) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="loadTransactions(${pagination.page - 1})">Précédent</a></li>`;
    } else {
        html += '<li class="page-item disabled"><span class="page-link">Précédent</span></li>';
    }
    
    // Pages
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.pages, pagination.page + 2);
    
    if (startPage > 1) {
        html += '<li class="page-item"><a class="page-link" href="#" onclick="loadTransactions(1)">1</a></li>';
        if (startPage > 2) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === pagination.page) {
            html += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
        } else {
            html += `<li class="page-item"><a class="page-link" href="#" onclick="loadTransactions(${i})">${i}</a></li>`;
        }
    }
    
    if (endPage < pagination.pages) {
        if (endPage < pagination.pages - 1) {
            html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
        html += `<li class="page-item"><a class="page-link" href="#" onclick="loadTransactions(${pagination.pages})">${pagination.pages}</a></li>`;
    }
    
    // Bouton suivant
    if (pagination.has_next) {
        html += `<li class="page-item"><a class="page-link" href="#" onclick="loadTransactions(${pagination.page + 1})">Suivant</a></li>`;
    } else {
        html += '<li class="page-item disabled"><span class="page-link">Suivant</span></li>';
    }
    
    container.innerHTML = html;
}

/**
 * Chargement des comptes
 */
async function loadComptes() {
    try {
        const response = await apiCall('GET', 'comptes');
        appState.comptes = response.data;
        
        if (currentSection === 'comptes') {
            updateComptesDisplay();
        }
        
        // Mettre à jour les selects de comptes dans les formulaires
        updateComptesSelects();
        
    } catch (error) {
        console.error('Erreur lors du chargement des comptes:', error);
        throw error;
    }
}

/**
 * Mise à jour de l'affichage des comptes
 */
function updateComptesDisplay() {
    const container = document.getElementById('liste-comptes');
    
    if (!appState.comptes || appState.comptes.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted">Aucun compte trouvé</div>';
        return;
    }
    
    container.innerHTML = appState.comptes.map(compte => `
        <div class="col-xl-4 col-lg-6 mb-4">
            <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">
                        <i class="fas fa-${compte.type === 'caisse' ? 'cash-register' : 'university'} me-2"></i>
                        ${escapeHtml(compte.nom)}
                    </h6>
                    <div class="dropdown">
                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="editCompte(${compte.id})">
                                <i class="fas fa-edit me-2"></i>Modifier
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="viewCompteStats(${compte.id})">
                                <i class="fas fa-chart-line me-2"></i>Statistiques
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="#" onclick="deleteCompte(${compte.id})">
                                <i class="fas fa-trash me-2"></i>Supprimer
                            </a></li>
                        </ul>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted">Solde initial</small>
                            <div class="fw-bold">${formatCurrency(compte.solde_initial)}</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Solde actuel</small>
                            <div class="fw-bold ${compte.solde_actuel >= 0 ? 'text-success' : 'text-danger'}">
                                ${formatCurrency(compte.solde_actuel)}
                            </div>
                        </div>
                    </div>
                    <div class="mt-3">
                        <small class="text-muted">Mouvements: ${formatCurrency(compte.mouvements)}</small>
                        <div class="text-muted">
                            <small>${compte.nombre_transactions} transaction(s)</small>
                        </div>
                    </div>
                    ${compte.description ? `
                        <div class="mt-2">
                            <small class="text-muted">${escapeHtml(compte.description)}</small>
                        </div>
                    ` : ''}
                    ${compte.numero_compte ? `
                        <div class="mt-1">
                            <small><strong>N° compte:</strong> ${escapeHtml(compte.numero_compte)}</small>
                        </div>
                    ` : ''}
                    ${compte.banque ? `
                        <div>
                            <small><strong>Banque:</strong> ${escapeHtml(compte.banque)}</small>
                        </div>
                    ` : ''}
                </div>
                <div class="card-footer">
                    <small class="text-muted">
                        ${compte.derniere_transaction ? 
                            'Dernière transaction: ' + formatDate(compte.derniere_transaction) : 
                            'Aucune transaction'
                        }
                    </small>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Chargement des tiers
 */
async function loadTiers() {
    try {
        const response = await apiCall('GET', 'tiers');
        appState.tiers = response.data;
        
        if (currentSection === 'tiers') {
            updateTiersTable();
        }
        
        // Mettre à jour les selects de tiers dans les formulaires
        updateTiersSelects();
        
    } catch (error) {
        console.error('Erreur lors du chargement des tiers:', error);
        throw error;
    }
}

/**
 * Mise à jour du tableau des tiers
 */
function updateTiersTable() {
    const tbody = document.getElementById('table-tiers');
    
    if (!appState.tiers || appState.tiers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">Aucun tiers trouvé</td></tr>';
        return;
    }
    
    tbody.innerHTML = appState.tiers.map(tiers => `
        <tr>
            <td><code>${escapeHtml(tiers.code)}</code></td>
            <td>${escapeHtml(tiers.nom)}</td>
            <td>
                <span class="badge bg-${tiers.type === 'client' ? 'primary' : 'info'}">
                    ${tiers.type === 'client' ? 'Client' : 'Fournisseur'}
                </span>
            </td>
            <td>
                ${tiers.contact ? escapeHtml(tiers.contact) : '-'}
                ${tiers.telephone ? `<br><small class="text-muted">${escapeHtml(tiers.telephone)}</small>` : ''}
            </td>
            <td>${tiers.email ? `<a href="mailto:${escapeHtml(tiers.email)}">${escapeHtml(tiers.email)}</a>` : '-'}</td>
            <td>
                <span class="badge bg-${tiers.actif ? 'success' : 'secondary'}">
                    ${tiers.actif ? 'Actif' : 'Inactif'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editTiers(${tiers.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-info" onclick="viewTiersStats(${tiers.id})" title="Historique">
                        <i class="fas fa-history"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteTiers(${tiers.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Chargement des catégories
 */
async function loadCategories() {
    try {
        const response = await apiCall('GET', 'categories');
        appState.categories = response.data;
        
        if (currentSection === 'parametres') {
            updateCategoriesTable();
        }
        
        // Mettre à jour les selects de catégories dans les formulaires
        updateCategoriesSelects();
        
    } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        throw error;
    }
}

/**
 * Chargement des paramètres
 */
async function loadSettings() {
    try {
        const response = await apiCall('GET', 'settings');
        appState.settings = response.data;
        
        if (currentSection === 'parametres') {
            updateParametresForm();
        }
        
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        throw error;
    }
}

/**
 * Mise à jour des selects dans les formulaires
 */
function updateComptesSelects() {
    const selects = document.querySelectorAll('select[id*="compte"]');
    
    selects.forEach(select => {
        const currentValue = select.value;
        const placeholder = select.querySelector('option[value=""]')?.textContent || 'Sélectionner un compte...';
        
        select.innerHTML = `<option value="">${placeholder}</option>` +
            appState.comptes.filter(compte => compte.actif).map(compte => 
                `<option value="${compte.id}">${escapeHtml(compte.nom)} (${formatCurrency(compte.solde_actuel)})</option>`
            ).join('');
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

function updateTiersSelects() {
    const selects = document.querySelectorAll('select[id*="tiers"]');
    
    selects.forEach(select => {
        const currentValue = select.value;
        const placeholder = select.querySelector('option[value=""]')?.textContent || 'Aucun tiers';
        
        select.innerHTML = `<option value="">${placeholder}</option>` +
            appState.tiers.filter(tiers => tiers.actif).map(tiers => 
                `<option value="${tiers.id}">${escapeHtml(tiers.nom)} (${tiers.type})</option>`
            ).join('');
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

function updateCategoriesSelects() {
    const selects = document.querySelectorAll('select[id*="categorie"]');
    
    selects.forEach(select => {
        const currentValue = select.value;
        const placeholder = select.querySelector('option[value=""]')?.textContent || 'Aucune catégorie';
        
        select.innerHTML = `<option value="">${placeholder}</option>` +
            appState.categories.filter(cat => cat.actif).map(cat => 
                `<option value="${cat.id}">${escapeHtml(cat.nom)}</option>`
            ).join('');
        
        if (currentValue) {
            select.value = currentValue;
        }
    });
}

/**
 * Configuration des événements des formulaires
 */
function setupFormEvents() {
    // Formulaire de transaction
    const formTransaction = document.getElementById('form-transaction');
    if (formTransaction) {
        formTransaction.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTransaction();
        });
    }
    
    // Formulaire de virement
    const formVirement = document.getElementById('form-virement');
    if (formVirement) {
        formVirement.addEventListener('submit', function(e) {
            e.preventDefault();
            saveVirement();
        });
    }
    
    // Formulaire de compte
    const formCompte = document.getElementById('form-compte');
    if (formCompte) {
        formCompte.addEventListener('submit', function(e) {
            e.preventDefault();
            saveCompte();
        });
    }
    
    // Formulaire de tiers
    const formTiers = document.getElementById('form-tiers');
    if (formTiers) {
        formTiers.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTiers();
        });
    }
    
    // Formulaire de catégorie
    const formCategorie = document.getElementById('form-categorie');
    if (formCategorie) {
        formCategorie.addEventListener('submit', function(e) {
            e.preventDefault();
            saveCategorie();
        });
    }
    
    // Formulaire des paramètres généraux
    const formParametres = document.getElementById('form-parametres-general');
    if (formParametres) {
        formParametres.addEventListener('submit', function(e) {
            e.preventDefault();
            saveParametres();
        });
    }
}

/**
 * Configuration des événements de navigation
 */
function setupNavigationEvents() {
    // Onglets des comptes
    document.querySelectorAll('#comptes-tabs .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('#comptes-tabs .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Onglets des tiers
    document.querySelectorAll('#tiers-tabs .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('#tiers-tabs .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Onglets des paramètres
    document.querySelectorAll('#parametres-tabs .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('#parametres-tabs .nav-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * Configuration des événements des modals
 */
function setupModalEvents() {
    // Réinitialiser les formulaires lors de l'ouverture des modals
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('show.bs.modal', function() {
            const form = this.querySelector('form');
            if (form) {
                form.reset();
                
                // Vider les champs cachés
                const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
                hiddenInputs.forEach(input => input.value = '');
            }
        });
    });
}

/**
 * Configuration des événements de filtres
 */
function setupFilterEvents() {
    // Filtres des transactions
    const filterElements = [
        'filter-type', 'filter-compte', 'filter-categorie', 
        'filter-date-debut', 'filter-date-fin', 'filter-recherche'
    ];
    
    filterElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', applyTransactionFilters);
            if (element.type === 'text') {
                element.addEventListener('input', debounce(applyTransactionFilters, 500));
            }
        }
    });
}

/**
 * Appliquer les filtres de transactions
 */
function applyTransactionFilters() {
    currentFilters = {
        type: document.getElementById('filter-type')?.value || null,
        compte_id: document.getElementById('filter-compte')?.value || null,
        categorie_id: document.getElementById('filter-categorie')?.value || null,
        date_debut: document.getElementById('filter-date-debut')?.value || null,
        date_fin: document.getElementById('filter-date-fin')?.value || null,
        search: document.getElementById('filter-recherche')?.value || null
    };
    
    // Nettoyer les filtres vides
    Object.keys(currentFilters).forEach(key => {
        if (!currentFilters[key]) {
            delete currentFilters[key];
        }
    });
    
    // Recharger les transactions avec les nouveaux filtres
    if (currentSection === 'transactions') {
        loadTransactions(1);
    }
}

/**
 * Actions des transactions
 */
async function saveTransaction() {
    try {
        const formData = getFormData('form-transaction');
        const transactionId = formData.id;
        
        showLoader('Enregistrement de la transaction...');
        
        let response;
        if (transactionId) {
            // Modification
            response = await apiCall('PUT', 'transactions', formData, { id: transactionId });
        } else {
            // Création
            response = await apiCall('POST', 'transactions', formData);
        }
        
        hideLoader();
        hideModal('modalTransaction');
        showNotification(response.message || 'Transaction enregistrée avec succès', 'success');
        
        // Recharger les données
        await Promise.all([
            loadTransactions(currentPage),
            loadDashboard(),
            loadComptes()
        ]);
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de l\'enregistrement: ' + error.message, 'error');
    }
}

async function saveVirement() {
    try {
        const formData = getFormData('form-virement');
        
        // Validation côté client
        if (formData.compte_source === formData.compte_destination) {
            showNotification('Les comptes source et destination doivent être différents', 'error');
            return;
        }
        
        showLoader('Traitement du virement...');
        
        const response = await apiCall('POST', 'transactions', formData, { action: 'transfer' });
        
        hideLoader();
        hideModal('modalVirement');
        showNotification('Virement effectué avec succès', 'success');
        
        // Recharger les données
        await Promise.all([
            loadTransactions(currentPage),
            loadDashboard(),
            loadComptes()
        ]);
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors du virement: ' + error.message, 'error');
    }
}

async function editTransaction(id) {
    try {
        showLoader('Chargement de la transaction...');
        
        const response = await apiCall('GET', 'transactions', { id: id });
        const transaction = response.data;
        
        // Remplir le formulaire
        document.getElementById('transaction-id').value = transaction.id;
        document.getElementById('transaction-type').value = transaction.type;
        document.getElementById('transaction-montant').value = transaction.montant;
        document.getElementById('transaction-description').value = transaction.description;
        document.getElementById('transaction-date').value = transaction.date;
        document.getElementById('transaction-compte').value = transaction.compte.id;
        
        if (transaction.categorie) {
            document.getElementById('transaction-categorie').value = transaction.categorie.id;
        }
        
        if (transaction.tiers) {
            document.getElementById('transaction-tiers').value = transaction.tiers.id;
        }
        
        if (transaction.numero_piece) {
            document.getElementById('transaction-numero-piece').value = transaction.numero_piece;
        }
        
        if (transaction.notes) {
            document.getElementById('transaction-notes').value = transaction.notes;
        }
        
        // Changer le titre du modal
        document.getElementById('modal-transaction-title').textContent = 'Modifier la Transaction';
        
        hideLoader();
        showModal('modalTransaction');
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors du chargement: ' + error.message, 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
        return;
    }
    
    try {
        showLoader('Suppression de la transaction...');
        
        const response = await apiCall('DELETE', 'transactions', null, { id: id });
        
        hideLoader();
        showNotification('Transaction supprimée avec succès', 'success');
        
        // Recharger les données
        await Promise.all([
            loadTransactions(currentPage),
            loadDashboard(),
            loadComptes()
        ]);
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

/**
 * Actions des comptes
 */
async function saveCompte() {
    try {
        const formData = getFormData('form-compte');
        const compteId = formData.id;
        
        showLoader('Enregistrement du compte...');
        
        let response;
        if (compteId) {
            // Modification
            response = await apiCall('PUT', 'comptes', formData, { id: compteId });
        } else {
            // Création
            response = await apiCall('POST', 'comptes', formData);
        }
        
        hideLoader();
        hideModal('modalCompte');
        showNotification(response.message || 'Compte enregistré avec succès', 'success');
        
        // Recharger les données
        await Promise.all([
            loadComptes(),
            loadDashboard()
        ]);
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de l\'enregistrement: ' + error.message, 'error');
    }
}

async function editCompte(id) {
    try {
        showLoader('Chargement du compte...');
        
        const response = await apiCall('GET', 'comptes', { id: id });
        const compte = response.data;
        
        // Remplir le formulaire
        document.getElementById('compte-id').value = compte.id;
        document.getElementById('compte-nom').value = compte.nom;
        document.getElementById('compte-type').value = compte.type;
        document.getElementById('compte-solde-initial').value = compte.solde_initial;
        
        if (compte.description) {
            document.getElementById('compte-description').value = compte.description;
        }
        
        if (compte.numero_compte) {
            document.getElementById('compte-numero').value = compte.numero_compte;
        }
        
        if (compte.banque) {
            document.getElementById('compte-banque').value = compte.banque;
        }
        
        // Changer le titre du modal
        document.getElementById('modal-compte-title').textContent = 'Modifier le Compte';
        
        hideLoader();
        showModal('modalCompte');
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors du chargement: ' + error.message, 'error');
    }
}

async function deleteCompte(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
        return;
    }
    
    try {
        showLoader('Suppression du compte...');
        
        const response = await apiCall('DELETE', 'comptes', null, { id: id });
        
        hideLoader();
        showNotification(response.message || 'Compte supprimé avec succès', 'success');
        
        // Recharger les données
        await Promise.all([
            loadComptes(),
            loadDashboard()
        ]);
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

/**
 * Actions des tiers
 */
async function saveTiers() {
    try {
        const formData = getFormData('form-tiers');
        const tiersId = formData.id;
        
        showLoader('Enregistrement du tiers...');
        
        let response;
        if (tiersId) {
            // Modification
            response = await apiCall('PUT', 'tiers', formData, { id: tiersId });
        } else {
            // Création
            response = await apiCall('POST', 'tiers', formData);
        }
        
        hideLoader();
        hideModal('modalTiers');
        showNotification(response.message || 'Tiers enregistré avec succès', 'success');
        
        // Recharger les données
        await loadTiers();
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de l\'enregistrement: ' + error.message, 'error');
    }
}

async function editTiers(id) {
    try {
        showLoader('Chargement du tiers...');
        
        const response = await apiCall('GET', 'tiers', { id: id });
        const tiers = response.data;
        
        // Remplir le formulaire
        document.getElementById('tiers-id').value = tiers.id;
        document.getElementById('tiers-nom').value = tiers.nom;
        document.getElementById('tiers-type').value = tiers.type;
        
        if (tiers.contact) {
            document.getElementById('tiers-contact').value = tiers.contact;
        }
        
        if (tiers.telephone) {
            document.getElementById('tiers-telephone').value = tiers.telephone;
        }
        
        if (tiers.email) {
            document.getElementById('tiers-email').value = tiers.email;
        }
        
        if (tiers.adresse) {
            document.getElementById('tiers-adresse').value = tiers.adresse;
        }
        
        if (tiers.notes) {
            document.getElementById('tiers-notes').value = tiers.notes;
        }
        
        // Changer le titre du modal
        document.getElementById('modal-tiers-title').textContent = 'Modifier le Tiers';
        
        hideLoader();
        showModal('modalTiers');
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors du chargement: ' + error.message, 'error');
    }
}

async function deleteTiers(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tiers ?')) {
        return;
    }
    
    try {
        showLoader('Suppression du tiers...');
        
        const response = await apiCall('DELETE', 'tiers', null, { id: id });
        
        hideLoader();
        showNotification(response.message || 'Tiers supprimé avec succès', 'success');
        
        // Recharger les données
        await loadTiers();
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de la suppression: ' + error.message, 'error');
    }
}

/**
 * Actions des catégories
 */
async function saveCategorie() {
    try {
        const formData = getFormData('form-categorie');
        const categorieId = formData.id;
        
        showLoader('Enregistrement de la catégorie...');
        
        let response;
        if (categorieId) {
            // Modification
            response = await apiCall('PUT', 'categories', formData, { id: categorieId });
        } else {
            // Création
            response = await apiCall('POST', 'categories', formData);
        }
        
        hideLoader();
        hideModal('modalCategorie');
        showNotification(response.message || 'Catégorie enregistrée avec succès', 'success');
        
        // Recharger les données
        await loadCategories();
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de l\'enregistrement: ' + error.message, 'error');
    }
}

/**
 * Gestion des filtres par type
 */
function filterComptes(type) {
    // Mettre à jour l'onglet actif
    document.querySelectorAll('#comptes-tabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Filtrer l'affichage (côté client pour plus de fluidité)
    const comptes = document.querySelectorAll('#liste-comptes > div');
    
    comptes.forEach(compteDiv => {
        if (!type) {
            // Afficher tous
            compteDiv.style.display = 'block';
        } else {
            // Filtrer par type
            const typeIcon = compteDiv.querySelector('.fas');
            const isTypeMatch = (type === 'caisse' && typeIcon.classList.contains('fa-cash-register')) ||
                               (type === 'banque' && typeIcon.classList.contains('fa-university'));
            
            compteDiv.style.display = isTypeMatch ? 'block' : 'none';
        }
    });
}

function filterTiers(type) {
    // Mettre à jour l'onglet actif
    document.querySelectorAll('#tiers-tabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // Recharger avec le filtre
    currentFilters.type = type;
    if (!type) {
        delete currentFilters.type;
    }
    
    // Appliquer le filtre côté serveur
    loadTiers();
}

/**
 * Gestion des paramètres
 */
async function loadParametres() {
    try {
        await Promise.all([
            loadSettings(),
            loadCategories()
        ]);
        
        updateParametresForm();
        updateCategoriesTable();
        
    } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        throw error;
    }
}

function showParametresTab(tabName) {
    // Masquer tous les onglets
    document.querySelectorAll('.parametres-tab').forEach(tab => {
        tab.classList.add('d-none');
    });
    
    // Désactiver tous les liens
    document.querySelectorAll('#parametres-tabs .nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Afficher l'onglet demandé
    document.getElementById('parametres-' + tabName).classList.remove('d-none');
    
    // Activer le lien correspondant
    event.target.classList.add('active');
    
    // Charger les données spécifiques si nécessaire
    if (tabName === 'categories') {
        updateCategoriesTable();
    }
}

function updateParametresForm() {
    if (!appState.settings) return;
    
    // Remplir le formulaire avec les paramètres actuels
    const form = document.getElementById('form-parametres-general');
    if (!form) return;
    
    const fields = {
        'param-organization': 'organization',
        'param-currency': 'currency',
        'param-date-format': 'date_format',
        'param-language': 'language'
    };
    
    Object.entries(fields).forEach(([fieldId, settingKey]) => {
        const field = document.getElementById(fieldId);
        if (field && appState.settings[settingKey]) {
            field.value = appState.settings[settingKey];
        }
    });
}

function updateCategoriesTable() {
    const tbody = document.getElementById('table-categories');
    
    if (!appState.categories || appState.categories.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Aucune catégorie trouvée</td></tr>';
        return;
    }
    
    tbody.innerHTML = appState.categories.map(categorie => `
        <tr>
            <td>${escapeHtml(categorie.nom)}</td>
            <td>
                <span class="badge" style="background-color: ${categorie.couleur}; color: white;">
                    ${categorie.couleur}
                </span>
            </td>
            <td>${categorie.description ? escapeHtml(categorie.description) : '-'}</td>
            <td>
                <span class="badge bg-${categorie.actif ? 'success' : 'secondary'}">
                    ${categorie.actif ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary" onclick="editCategorie(${categorie.id})" title="Modifier">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline-danger" onclick="deleteCategorie(${categorie.id})" title="Supprimer">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function saveParametres() {
    try {
        const formData = getFormData('form-parametres-general');
        
        showLoader('Enregistrement des paramètres...');
        
        const response = await apiCall('PUT', 'settings', formData);
        
        hideLoader();
        showNotification('Paramètres enregistrés avec succès', 'success');
        
        // Recharger les paramètres
        await loadSettings();
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de l\'enregistrement: ' + error.message, 'error');
    }
}

/**
 * Import/Export des données
 */
async function exporterDonnees() {
    try {
        showLoader('Génération de la sauvegarde...');
        
        // Télécharger le fichier d'export
        window.location.href = APP_CONFIG.API_BASE + '/settings.php?action=export';
        
        hideLoader();
        showNotification('Sauvegarde téléchargée avec succès', 'success');
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de l\'export: ' + error.message, 'error');
    }
}

async function importerDonnees() {
    const fileInput = document.getElementById('import-file');
    
    if (!fileInput.files || !fileInput.files[0]) {
        showNotification('Veuillez sélectionner un fichier à importer', 'warning');
        return;
    }
    
    if (!confirm('ATTENTION: Cette action remplacera toutes les données existantes. Êtes-vous sûr de vouloir continuer ?')) {
        return;
    }
    
    try {
        const file = fileInput.files[0];
        const text = await file.text();
        const data = JSON.parse(text);
        
        showLoader('Import des données en cours...');
        
        const response = await apiCall('POST', 'settings', data, { action: 'import' });
        
        hideLoader();
        showNotification('Données importées avec succès', 'success');
        
        // Recharger toute l'application
        setTimeout(() => {
            window.location.reload();
        }, 1500);
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de l\'import: ' + error.message, 'error');
    }
}

/**
 * Rapports
 */
function genererRapport() {
    const type = document.getElementById('rapport-type').value;
    const dateDebut = document.getElementById('rapport-date-debut').value;
    const dateFin = document.getElementById('rapport-date-fin').value;
    const compteId = document.getElementById('rapport-compte').value;
    
    // Validation des dates
    if (!dateDebut || !dateFin) {
        showNotification('Veuillez spécifier une période', 'warning');
        return;
    }
    
    if (new Date(dateDebut) > new Date(dateFin)) {
        showNotification('La date de début doit être antérieure à la date de fin', 'error');
        return;
    }
    
    // Construire les filtres
    const filters = {
        date_debut: dateDebut,
        date_fin: dateFin
    };
    
    if (compteId) {
        filters.compte_id = compteId;
    }
    
    // Générer le rapport
    generateRapportData(filters);
}

async function generateRapportData(filters) {
    try {
        showLoader('Génération du rapport...');
        
        const response = await apiCall('GET', 'transactions', {
            ...filters,
            limit: 1000 // Limite élevée pour les rapports
        });
        
        const transactions = response.data.data;
        
        // Calculer les totaux
        let totalRecettes = 0;
        let totalDepenses = 0;
        let nbOperations = transactions.length;
        
        transactions.forEach(t => {
            if (t.type === 'recette') {
                totalRecettes += t.montant;
            } else {
                totalDepenses += t.montant;
            }
        });
        
        const benefice = totalRecettes - totalDepenses;
        
        // Mettre à jour l'affichage
        document.getElementById('rapport-total-recettes').textContent = formatCurrency(totalRecettes);
        document.getElementById('rapport-total-depenses').textContent = formatCurrency(totalDepenses);
        document.getElementById('rapport-benefice').textContent = formatCurrency(benefice);
        document.getElementById('rapport-nb-operations').textContent = nbOperations;
        
        // Mettre à jour le tableau des transactions
        const tbody = document.getElementById('rapport-transactions');
        tbody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${formatDate(transaction.date)}</td>
                <td>
                    <span class="badge badge-${transaction.type === 'recette' ? 'success' : 'danger'}">
                        ${transaction.type === 'recette' ? 'Recette' : 'Dépense'}
                    </span>
                </td>
                <td>${escapeHtml(transaction.description)}</td>
                <td class="text-end ${transaction.type === 'recette' ? 'text-success' : 'text-danger'}">
                    ${transaction.type === 'recette' ? '+' : '-'}${formatCurrency(transaction.montant)}
                </td>
                <td>${escapeHtml(transaction.compte.nom)}</td>
                <td>
                    ${transaction.categorie ? 
                        `<span class="badge" style="background-color: ${transaction.categorie.couleur}">${escapeHtml(transaction.categorie.nom)}</span>` : 
                        '-'
                    }
                </td>
            </tr>
        `).join('');
        
        // Ajuster la couleur du bénéfice
        const beneficeElement = document.getElementById('rapport-benefice');
        if (benefice >= 0) {
            beneficeElement.parentElement.className = 'card text-center bg-success text-white';
        } else {
            beneficeElement.parentElement.className = 'card text-center bg-danger text-white';
        }
        
        // Afficher les résultats
        document.getElementById('rapport-results').classList.remove('d-none');
        
        hideLoader();
        
    } catch (error) {
        hideLoader();
        showNotification('Erreur lors de la génération du rapport: ' + error.message, 'error');
    }
}

function exporterRapport(format) {
    const transactions = Array.from(document.querySelectorAll('#rapport-transactions tr')).map(row => {
        const cells = row.querySelectorAll('td');
        return {
            date: cells[0]?.textContent,
            type: cells[1]?.textContent.trim(),
            description: cells[2]?.textContent,
            montant: cells[3]?.textContent,
            compte: cells[4]?.textContent,
            categorie: cells[5]?.textContent
        };
    });
    
    if (format === 'csv') {
        exportToCSV(transactions);
    } else if (format === 'json') {
        exportToJSON(transactions);
    }
}

function exportToCSV(data) {
    const headers = ['Date', 'Type', 'Description', 'Montant', 'Compte', 'Catégorie'];
    const csvContent = [
        headers.join(';'),
        ...data.map(row => Object.values(row).join(';'))
    ].join('\n');
    
    downloadFile(csvContent, 'rapport_' + new Date().toISOString().split('T')[0] + '.csv', 'text/csv');
}

function exportToJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    downloadFile(jsonContent, 'rapport_' + new Date().toISOString().split('T')[0] + '.json', 'application/json');
}

/**
 * Fonctions utilitaires
 */

/**
 * Appel API générique
 */
async function apiCall(method, endpoint, data = null, params = null) {
    let url = `${APP_CONFIG.API_BASE}/${endpoint}.php`;
    
    // Ajouter les paramètres GET
    if (params && Object.keys(params).length > 0) {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                urlParams.append(key, value);
            }
        });
        url += '?' + urlParams.toString();
    }
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || result.message || 'Erreur inconnue');
        }
        
        return result;
        
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

/**
 * Récupérer les données d'un formulaire
 */
function getFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        // Convertir les valeurs vides en null
        data[key] = value === '' ? null : value;
    }
    
    return data;
}

/**
 * Afficher/masquer un modal
 */
function showModal(modalId) {
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
}

function hideModal(modalId) {
    const modalElement = document.getElementById(modalId);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }
}

/**
 * Afficher/masquer le loader
 */
function showLoader(message = 'Chargement...') {
    // Créer ou récupérer le loader
    let loader = document.getElementById('app-loader');
    
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'app-loader';
        loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
        loader.style.backgroundColor = 'rgba(0,0,0,0.5)';
        loader.style.zIndex = '9999';
        
        loader.innerHTML = `
            <div class="text-center text-white">
                <div class="spinner-border mb-3" role="status">
                    <span class="visually-hidden">Chargement...</span>
                </div>
                <div id="loader-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(loader);
    } else {
        document.getElementById('loader-message').textContent = message;
        loader.classList.remove('d-none');
    }
    
    appState.loading = true;
}

function hideLoader() {
    const loader = document.getElementById('app-loader');
    if (loader) {
        loader.classList.add('d-none');
    }
    appState.loading = false;
}

/**
 * Afficher une notification
 */
function showNotification(message, type = 'info', duration = 5000) {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed`;
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.minWidth = '300px';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après la durée spécifiée
    setTimeout(() => {
        if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, duration);
}

/**
 * Formater une devise
 */
function formatCurrency(amount, currency = APP_CONFIG.CURRENCY) {
    const symbols = {
        'EUR': '€',
        'USD': '$',
        'GBP': '£',
        'CHF': 'CHF'
    };
    
    const symbol = symbols[currency] || currency;
    const formatted = new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
    
    return `${formatted} ${symbol}`;
}

/**
 * Formater une date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

/**
 * Échapper les caractères HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Mettre à jour la date courante
 */
function updateCurrentDate() {
    const now = new Date();
    const dateString = now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const element = document.getElementById('current-date');
    if (element) {
        element.textContent = dateString;
    }
}

/**
 * Debounce pour optimiser les appels
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Télécharger un fichier
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
}

/**
 * Initialiser les dates par défaut dans les formulaires
 */
document.addEventListener('DOMContentLoaded', function() {
    // Définir la date d'aujourd'hui par défaut
    const today = new Date().toISOString().split('T')[0];
    
    const dateInputs = [
        'transaction-date',
        'virement-date',
        'rapport-date-fin'
    ];
    
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && !input.value) {
            input.value = today;
        }
    });
    
    // Définir le début du mois pour les rapports
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
    
    const startDateInput = document.getElementById('rapport-date-debut');
    if (startDateInput && !startDateInput.value) {
        startDateInput.value = startOfMonthStr;
    }
});