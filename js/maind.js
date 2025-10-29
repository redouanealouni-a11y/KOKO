// Configuration de l'API
const API_BASE = './api';

// Variables globales
let currentSection = 'dashboard';
let currentTiersType = 'client';
let currentAccountType = 'caisse';
let editingId = null;
let charts = {};
let appData = {
    transactions: [],
    comptes: [],
    categories: [],
    clients: [],
    fournisseurs: [],
    settings: {}
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation de l\'application PHP/PostgreSQL...');
    
    // Définir la date actuelle
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;
    
    // Initialiser l'application
    initializeApp();
});

async function initializeApp() {
    try {
        showConnectionStatus('loading', 'Chargement...');
        
        // Charger les données de base
        await loadAllData();
        
        // Initialiser l'interface
        updateAllDisplays();
        showSection('dashboard');
        
        showConnectionStatus('success', 'Connecté');
        console.log('Application initialisée avec succès');
        
    } catch (error) {
        console.error('Erreur d\'initialisation:', error);
        showConnectionStatus('error', 'Erreur de connexion');
        showNotification('Erreur de connexion à la base de données', 'error');
    }
}

// Gestion du statut de connexion
function showConnectionStatus(status, message) {
    const statusElement = document.getElementById('connection-status');
    const textElement = document.getElementById('status-text');
    
    statusElement.className = 'px-3 py-1 rounded-full text-sm';
    
    switch (status) {
        case 'success':
            statusElement.classList.add('bg-green-100', 'text-green-800');
            break;
        case 'error':
            statusElement.classList.add('bg-red-100', 'text-red-800');
            break;
        case 'loading':
            statusElement.classList.add('bg-yellow-100', 'text-yellow-800');
            break;
        default:
            statusElement.classList.add('bg-gray-100', 'text-gray-800');
    }
    
    textElement.textContent = message;
}

// Fonctions API
async function apiCall(endpoint, options = {}) {
    try {
        const url = `${API_BASE}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const finalOptions = { ...defaultOptions, ...options };
        
        if (finalOptions.body && typeof finalOptions.body === 'object') {
            finalOptions.body = JSON.stringify(finalOptions.body);
        }
        
        const response = await fetch(url, finalOptions);
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

// Chargement des données
async function loadAllData() {
    try {
        const [
            settingsResponse,
            categoriesResponse,
            comptesResponse,
            clientsResponse,
            fournisseursResponse
        ] = await Promise.all([
            apiCall('/settings.php'),
            apiCall('/categories.php'),
            apiCall('/comptes.php'),
            apiCall('/tiers.php?type=client'),
            apiCall('/tiers.php?type=fournisseur')
        ]);
        
        appData.settings = settingsResponse.data || {};
        appData.categories = categoriesResponse.data || [];
        appData.comptes = comptesResponse.data || [];
        appData.clients = clientsResponse.data || [];
        appData.fournisseurs = fournisseursResponse.data || [];
        
        console.log('Données chargées:', appData);
        
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        throw error;
    }
}

async function loadTransactions(filters = {}) {
    try {
        const params = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                params.append(key, filters[key]);
            }
        });
        
        const response = await apiCall(`/transactions.php?${params.toString()}`);
        appData.transactions = response.data || [];
        return appData.transactions;
        
    } catch (error) {
        console.error('Erreur lors du chargement des transactions:', error);
        throw error;
    }
}

// Navigation
function showSection(section) {
    // Cacher toutes les sections
    document.querySelectorAll('.section').forEach(s => s.style.display = 'none');
    
    // Afficher la section sélectionnée
    document.getElementById(section + '-section').style.display = 'block';
    
    // Mettre à jour la sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('sidebar-active');
    });
    event.target.classList.add('sidebar-active');
    
    // Mettre à jour le titre
    const titles = {
        dashboard: 'Tableau de bord',
        transactions: 'Transactions',
        tiers: 'Tiers',
        banque: 'Comptes Bancaires',
        caisse: 'Caisses',
        rapports: 'Rapports',
        parametres: 'Paramètres'
    };
    
    document.getElementById('page-title').textContent = titles[section];
    currentSection = section;
    
    // Mettre à jour les affichages selon la section
    if (section === 'dashboard') {
        updateDashboard();
    } else if (section === 'transactions') {
        updateTransactionsDisplay();
    } else if (section === 'tiers') {
        updateTiersDisplay();
    } else if (section === 'banque') {
        updateBanqueDisplay();
    } else if (section === 'caisse') {
        updateCaisseDisplay();
    } else if (section === 'rapports') {
        updateRapportsDisplay();
    } else if (section === 'parametres') {
        updateParametresDisplay();
    }
}

// Mise à jour des affichages
function updateAllDisplays() {
    updateAccountSelects();
    updateTiersSelects();
    updateCategorySelects();
}

function updateAccountSelects() {
    const selects = [
        'transaction-account',
        'filter-account',
        'transfer-from-account',
        'transfer-to-account'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Sélectionner un compte</option>';
            
            appData.comptes.forEach(compte => {
                const option = document.createElement('option');
                option.value = compte.id;
                option.textContent = `${compte.name} (${formatCurrency(compte.balance)})`;
                select.appendChild(option);
            });
            
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });
}

function updateTiersSelects() {
    const select = document.getElementById('transaction-tiers');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Aucun tiers</option>';
        
        [...appData.clients, ...appData.fournisseurs].forEach(tiers => {
            const option = document.createElement('option');
            option.value = tiers.id;
            option.textContent = tiers.raison_sociale;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    }
}

function updateCategorySelects() {
    const select = document.getElementById('transaction-category');
    if (select) {
        const currentValue = select.value;
        select.innerHTML = '<option value="">Aucune</option>';
        
        appData.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
        if (currentValue) {
            select.value = currentValue;
        }
    }
}

// Dashboard
async function updateDashboard() {
    try {
        // Charger les statistiques
        const [statsResponse, transactionsResponse] = await Promise.all([
            apiCall('/transactions.php/stats'),
            apiCall('/transactions.php?limit=10')
        ]);
        
        const stats = statsResponse.data || {};
        const recentTransactions = transactionsResponse.data || [];
        
        // Calculer le solde total des comptes
        const totalBalance = appData.comptes.reduce((sum, compte) => sum + parseFloat(compte.balance || 0), 0);
        
        // Mettre à jour les statistiques
        document.getElementById('total-balance').textContent = formatCurrency(totalBalance);
        document.getElementById('total-balance').className = `text-2xl font-semibold ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`;
        
        document.getElementById('total-recettes').textContent = formatCurrency(stats.total_recettes || 0);
        document.getElementById('total-depenses').textContent = formatCurrency(stats.total_depenses || 0);
        document.getElementById('total-transactions').textContent = stats.total_transactions || 0;
        
        // Mettre à jour les transactions récentes
        updateRecentTransactionsTable(recentTransactions);
        
        // Mettre à jour les graphiques
        updateCharts(stats, appData.comptes);
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour du dashboard:', error);
        showNotification('Erreur lors du chargement du dashboard', 'error');
    }
}

function updateRecentTransactionsTable(transactions) {
    const tbody = document.getElementById('recent-transactions');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Aucune transaction récente</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td class="px-4 py-2">${formatDate(transaction.date)}</td>
            <td class="px-4 py-2">
                <span class="px-2 py-1 rounded text-xs ${getTypeClass(transaction.type)}">
                    ${getTypeLabel(transaction.type)}
                </span>
            </td>
            <td class="px-4 py-2">${transaction.description}</td>
            <td class="px-4 py-2">${transaction.account_name || 'N/A'}</td>
            <td class="px-4 py-2">${transaction.tiers_name || '-'}</td>
            <td class="px-4 py-2 text-right ${getAmountClass(transaction.type)}">
                ${formatCurrency(transaction.amount)}
            </td>
        </tr>
    `).join('');
}

// Transactions
async function updateTransactionsDisplay() {
    try {
        const filters = getTransactionFilters();
        const transactions = await loadTransactions(filters);
        updateTransactionsTable(transactions);
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour des transactions:', error);
        showNotification('Erreur lors du chargement des transactions', 'error');
    }
}

function getTransactionFilters() {
    return {
        search: document.getElementById('search-transactions')?.value || '',
        type: document.getElementById('filter-type')?.value || '',
        account_id: document.getElementById('filter-account')?.value || '',
        month: document.getElementById('filter-month')?.value || ''
    };
}

function applyTransactionFilters() {
    updateTransactionsDisplay();
}

function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-table');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-gray-500">Aucune transaction trouvée</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td class="px-4 py-3">${formatDate(transaction.date)}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs ${getTypeClass(transaction.type)}">
                    ${getTypeLabel(transaction.type)}
                </span>
            </td>
            <td class="px-4 py-3">${transaction.description}</td>
            <td class="px-4 py-3">${transaction.account_name || 'N/A'}</td>
            <td class="px-4 py-3">${transaction.tiers_name || '-'}</td>
            <td class="px-4 py-3">${transaction.category_name || '-'}</td>
            <td class="px-4 py-3 text-right ${getAmountClass(transaction.type)}">
                ${formatCurrency(transaction.amount)}
            </td>
            <td class="px-4 py-3 text-right">
                ${transaction.balance_after ? formatCurrency(transaction.balance_after) : '-'}
            </td>
            <td class="px-4 py-3 text-center no-print">
                <button onclick="deleteTransaction('${transaction.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Gestion des transactions
function openTransactionModal() {
    document.getElementById('transactionModal').style.display = 'block';
    resetTransactionForm();
}

function closeTransactionModal() {
    document.getElementById('transactionModal').style.display = 'none';
}

function resetTransactionForm() {
    document.getElementById('transactionForm').reset();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transaction-date').value = today;
}

async function saveTransaction(continueAdding = false) {
    try {
        const formData = {
            type: document.getElementById('transaction-type').value,
            description: document.getElementById('transaction-description').value,
            amount: parseFloat(document.getElementById('transaction-amount').value),
            date: document.getElementById('transaction-date').value,
            account_id: document.getElementById('transaction-account').value,
            category_id: document.getElementById('transaction-category').value || null,
            tiers_id: document.getElementById('transaction-tiers').value || null
        };
        
        // Validation
        if (!formData.type || !formData.description || !formData.amount || !formData.account_id) {
            showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        if (formData.amount <= 0) {
            showNotification('Le montant doit être positif', 'error');
            return;
        }
        
        await apiCall('/transactions.php', {
            method: 'POST',
            body: formData
        });
        
        showNotification('Transaction enregistrée avec succès', 'success');
        
        // Recharger les données
        await loadAllData();
        await loadTransactions();
        updateAllDisplays();
        
        if (currentSection === 'dashboard') {
            updateDashboard();
        } else if (currentSection === 'transactions') {
            updateTransactionsDisplay();
        }
        
        if (continueAdding) {
            resetTransactionForm();
        } else {
            closeTransactionModal();
        }
        
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        showNotification(error.message, 'error');
    }
}

async function deleteTransaction(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
        return;
    }
    
    try {
        await apiCall(`/transactions.php/${id}`, {
            method: 'DELETE'
        });
        
        showNotification('Transaction supprimée avec succès', 'success');
        
        // Recharger les données
        await loadAllData();
        updateTransactionsDisplay();
        
        if (currentSection === 'dashboard') {
            updateDashboard();
        }
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification(error.message, 'error');
    }
}

// Gestion des virements
function openTransferModal() {
    document.getElementById('transferModal').style.display = 'block';
    updateAccountSelects();
}

function closeTransferModal() {
    document.getElementById('transferModal').style.display = 'none';
    document.getElementById('transferForm').reset();
}

async function saveTransfer() {
    try {
        const formData = {
            from_account_id: document.getElementById('transfer-from-account').value,
            to_account_id: document.getElementById('transfer-to-account').value,
            amount: parseFloat(document.getElementById('transfer-amount').value),
            description: document.getElementById('transfer-description').value || 'Virement de fonds'
        };
        
        // Validation
        if (!formData.from_account_id || !formData.to_account_id || !formData.amount) {
            showNotification('Veuillez remplir tous les champs obligatoires', 'error');
            return;
        }
        
        if (formData.from_account_id === formData.to_account_id) {
            showNotification('Les comptes source et destination doivent être différents', 'error');
            return;
        }
        
        if (formData.amount <= 0) {
            showNotification('Le montant doit être positif', 'error');
            return;
        }
        
        await apiCall('/transactions.php/transfer', {
            method: 'POST',
            body: formData
        });
        
        showNotification('Virement effectué avec succès', 'success');
        
        // Recharger les données
        await loadAllData();
        updateAllDisplays();
        
        if (currentSection === 'transactions') {
            updateTransactionsDisplay();
        } else if (currentSection === 'dashboard') {
            updateDashboard();
        }
        
        closeTransferModal();
        
    } catch (error) {
        console.error('Erreur lors du virement:', error);
        showNotification(error.message, 'error');
    }
}

// Gestion des tiers
function showTiersTab(type) {
    document.querySelectorAll('.tiers-tab').forEach(tab => tab.style.display = 'none');
    document.getElementById(type + '-content').style.display = 'block';
    
    document.querySelectorAll('[id$="-tab"]').forEach(tab => {
        tab.classList.remove('border-blue-500', 'text-blue-600');
        tab.classList.add('text-gray-500');
    });
    
    document.getElementById(type + '-tab').classList.add('border-blue-500', 'text-blue-600');
    document.getElementById(type + '-tab').classList.remove('text-gray-500');
    
    currentTiersType = type === 'clients' ? 'client' : 'fournisseur';
    updateTiersDisplay();
}

async function updateTiersDisplay() {
    try {
        const tableId = currentTiersType === 'client' ? 'clients-table' : 'fournisseurs-table';
        const data = currentTiersType === 'client' ? appData.clients : appData.fournisseurs;
        
        updateTiersTable(tableId, data);
        
    } catch (error) {
        console.error('Erreur lors de la mise à jour des tiers:', error);
        showNotification('Erreur lors du chargement des tiers', 'error');
    }
}

function updateTiersTable(tableId, data) {
    const tbody = document.getElementById(tableId);
    
    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-gray-500">Aucun tiers trouvé</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map(tiers => `
        <tr>
            <td class="px-4 py-3">${tiers.code || '-'}</td>
            <td class="px-4 py-3">${tiers.raison_sociale}</td>
            <td class="px-4 py-3">${tiers.contact || '-'}</td>
            <td class="px-4 py-3">${tiers.telephone || '-'}</td>
            <td class="px-4 py-3">${tiers.email || '-'}</td>
            <td class="px-4 py-3 text-right">${formatCurrency(tiers.solde || 0)}</td>
            <td class="px-4 py-3 text-center no-print">
                <button onclick="editTiers('${tiers.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTiers('${tiers.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function openTiersModal(type) {
    currentTiersType = type;
    editingId = null;
    
    const titles = {
        client: 'Nouveau Client',
        fournisseur: 'Nouveau Fournisseur'
    };
    
    document.getElementById('tiersModalTitle').textContent = titles[type];
    document.getElementById('tiersModal').style.display = 'block';
    document.getElementById('tiersForm').reset();
}

function closeTiersModal() {
    document.getElementById('tiersModal').style.display = 'none';
}

async function saveTiers() {
    try {
        const formData = {
            type: currentTiersType,
            code: document.getElementById('tiers-code').value,
            raison_sociale: document.getElementById('tiers-raison-sociale').value,
            contact: document.getElementById('tiers-contact').value,
            telephone: document.getElementById('tiers-telephone').value,
            email: document.getElementById('tiers-email').value,
            siret: document.getElementById('tiers-siret').value,
            adresse: document.getElementById('tiers-adresse').value,
            notes: document.getElementById('tiers-notes').value
        };
        
        // Validation
        if (!formData.raison_sociale) {
            showNotification('La raison sociale est obligatoire', 'error');
            return;
        }
        
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/tiers.php/${editingId}` : '/tiers.php';
        
        await apiCall(url, {
            method: method,
            body: formData
        });
        
        const message = editingId ? 'Tiers mis à jour avec succès' : 'Tiers créé avec succès';
        showNotification(message, 'success');
        
        // Recharger les données
        await loadAllData();
        updateTiersSelects();
        updateTiersDisplay();
        
        closeTiersModal();
        
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        showNotification(error.message, 'error');
    }
}

async function editTiers(id) {
    try {
        const response = await apiCall(`/tiers.php/${id}`);
        const tiers = response.data;
        
        if (!tiers) {
            throw new Error('Tiers non trouvé');
        }
        
        editingId = id;
        currentTiersType = tiers.type;
        
        // Remplir le formulaire
        document.getElementById('tiers-code').value = tiers.code || '';
        document.getElementById('tiers-raison-sociale').value = tiers.raison_sociale || '';
        document.getElementById('tiers-contact').value = tiers.contact || '';
        document.getElementById('tiers-telephone').value = tiers.telephone || '';
        document.getElementById('tiers-email').value = tiers.email || '';
        document.getElementById('tiers-siret').value = tiers.siret || '';
        document.getElementById('tiers-adresse').value = tiers.adresse || '';
        document.getElementById('tiers-notes').value = tiers.notes || '';
        
        const titles = {
            client: 'Modifier le Client',
            fournisseur: 'Modifier le Fournisseur'
        };
        
        document.getElementById('tiersModalTitle').textContent = titles[tiers.type];
        document.getElementById('tiersModal').style.display = 'block';
        
    } catch (error) {
        console.error('Erreur lors du chargement du tiers:', error);
        showNotification(error.message, 'error');
    }
}

async function deleteTiers(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce tiers ?')) {
        return;
    }
    
    try {
        await apiCall(`/tiers.php/${id}`, {
            method: 'DELETE'
        });
        
        showNotification('Tiers supprimé avec succès', 'success');
        
        // Recharger les données
        await loadAllData();
        updateTiersSelects();
        updateTiersDisplay();
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification(error.message, 'error');
    }
}

// Gestion des comptes
async function updateBanqueDisplay() {
    const banques = appData.comptes.filter(c => c.type === 'banque');
    updateCompteCards('banque-cards', banques);
    updateCompteTransactions('banque-transactions', 'banque');
}

async function updateCaisseDisplay() {
    const caisses = appData.comptes.filter(c => c.type === 'caisse');
    updateCompteCards('caisse-cards', caisses);
    updateCompteTransactions('caisse-transactions', 'caisse');
}

function updateCompteCards(containerId, comptes) {
    const container = document.getElementById(containerId);
    
    if (!comptes || comptes.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-8 text-gray-500">Aucun compte trouvé</div>';
        return;
    }
    
    container.innerHTML = comptes.map(compte => `
        <div class="bg-white p-6 rounded-lg shadow">
            <div class="flex items-center justify-between mb-4">
                <h4 class="text-lg font-semibold">${compte.name}</h4>
                <div class="flex gap-2">
                    <button onclick="editAccount('${compte.id}')" class="text-blue-600 hover:text-blue-800">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteAccount('${compte.id}')" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="space-y-2">
                ${compte.bank ? `<p class="text-sm text-gray-600"><strong>Banque:</strong> ${compte.bank}</p>` : ''}
                <p class="text-sm text-gray-600"><strong>Solde:</strong> 
                    <span class="font-semibold ${parseFloat(compte.balance) >= 0 ? 'text-green-600' : 'text-red-600'}">
                        ${formatCurrency(compte.balance)}
                    </span>
                </p>
                ${compte.description ? `<p class="text-sm text-gray-600">${compte.description}</p>` : ''}
            </div>
        </div>
    `).join('');
}

async function updateCompteTransactions(tableId, type) {
    try {
        const transactions = appData.transactions.filter(t => {
            const compte = appData.comptes.find(c => c.id === t.account_id);
            return compte && compte.type === type;
        });
        
        const tbody = document.getElementById(tableId);
        
        if (!transactions || transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-500">Aucune transaction trouvée</td></tr>';
            return;
        }
        
        tbody.innerHTML = transactions.slice(0, 20).map(transaction => `
            <tr>
                <td class="px-4 py-3">${formatDate(transaction.date)}</td>
                <td class="px-4 py-3">${transaction.account_name}</td>
                <td class="px-4 py-3">${transaction.description}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs ${getTypeClass(transaction.type)}">
                        ${getTypeLabel(transaction.type)}
                    </span>
                </td>
                <td class="px-4 py-3 text-right ${getAmountClass(transaction.type)}">
                    ${formatCurrency(transaction.amount)}
                </td>
                <td class="px-4 py-3 text-right">
                    ${formatCurrency(transaction.balance_after)}
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Erreur lors du chargement des transactions:', error);
    }
}

function openAccountModal(type) {
    currentAccountType = type;
    editingId = null;
    
    const titles = {
        caisse: 'Nouvelle Caisse',
        banque: 'Nouveau Compte Bancaire'
    };
    
    document.getElementById('accountModalTitle').textContent = titles[type];
    document.getElementById('accountModal').style.display = 'block';
    document.getElementById('accountForm').reset();
    
    // Afficher/masquer le champ banque
    const bankField = document.getElementById('bank-field');
    bankField.style.display = type === 'banque' ? 'block' : 'none';
}

function closeAccountModal() {
    document.getElementById('accountModal').style.display = 'none';
}

async function saveAccount() {
    try {
        const formData = {
            type: currentAccountType,
            name: document.getElementById('account-name').value,
            balance: parseFloat(document.getElementById('account-balance').value) || 0,
            description: document.getElementById('account-description').value
        };
        
        if (currentAccountType === 'banque') {
            formData.bank = document.getElementById('account-bank').value;
        }
        
        // Validation
        if (!formData.name) {
            showNotification('Le nom du compte est obligatoire', 'error');
            return;
        }
        
        const method = editingId ? 'PUT' : 'POST';
        const url = editingId ? `/comptes.php/${editingId}` : '/comptes.php';
        
        await apiCall(url, {
            method: method,
            body: formData
        });
        
        const message = editingId ? 'Compte mis à jour avec succès' : 'Compte créé avec succès';
        showNotification(message, 'success');
        
        // Recharger les données
        await loadAllData();
        updateAccountSelects();
        
        if (currentSection === 'banque') {
            updateBanqueDisplay();
        } else if (currentSection === 'caisse') {
            updateCaisseDisplay();
        }
        
        closeAccountModal();
        
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement:', error);
        showNotification(error.message, 'error');
    }
}

async function editAccount(id) {
    try {
        const response = await apiCall(`/comptes.php/${id}`);
        const compte = response.data;
        
        if (!compte) {
            throw new Error('Compte non trouvé');
        }
        
        editingId = id;
        currentAccountType = compte.type;
        
        // Remplir le formulaire
        document.getElementById('account-name').value = compte.name || '';
        document.getElementById('account-balance').value = compte.balance || 0;
        document.getElementById('account-description').value = compte.description || '';
        
        if (compte.type === 'banque') {
            document.getElementById('account-bank').value = compte.bank || '';
        }
        
        const titles = {
            caisse: 'Modifier la Caisse',
            banque: 'Modifier le Compte Bancaire'
        };
        
        document.getElementById('accountModalTitle').textContent = titles[compte.type];
        
        // Afficher/masquer le champ banque
        const bankField = document.getElementById('bank-field');
        bankField.style.display = compte.type === 'banque' ? 'block' : 'none';
        
        document.getElementById('accountModal').style.display = 'block';
        
    } catch (error) {
        console.error('Erreur lors du chargement du compte:', error);
        showNotification(error.message, 'error');
    }
}

async function deleteAccount(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce compte ?')) {
        return;
    }
    
    try {
        await apiCall(`/comptes.php/${id}`, {
            method: 'DELETE'
        });
        
        showNotification('Compte supprimé avec succès', 'success');
        
        // Recharger les données
        await loadAllData();
        updateAccountSelects();
        
        if (currentSection === 'banque') {
            updateBanqueDisplay();
        } else if (currentSection === 'caisse') {
            updateCaisseDisplay();
        }
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification(error.message, 'error');
    }
}

// Rapports
function updateRapportsDisplay() {
    // Afficher le résumé actuel
    if (appData.transactions) {
        const stats = calculateStatsFromData(appData.transactions);
        
        document.getElementById('rapport-recettes').textContent = formatCurrency(stats.total_recettes);
        document.getElementById('rapport-depenses').textContent = formatCurrency(stats.total_depenses);
        document.getElementById('rapport-solde').textContent = formatCurrency(stats.total_recettes - stats.total_depenses);
        document.getElementById('rapport-nb-transactions').textContent = stats.total_transactions;
    }
}

function calculateStatsFromData(transactions) {
    const recettes = transactions.filter(t => t.type === 'recette');
    const depenses = transactions.filter(t => t.type === 'depense');
    
    return {
        total_recettes: recettes.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        total_depenses: depenses.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        total_transactions: transactions.length
    };
}

function togglePeriodeFields() {
    const type = document.getElementById('rapport-type').value;
    const fields = document.getElementById('periode-fields');
    fields.style.display = type === 'periode' ? 'block' : 'none';
}

async function generateReport() {
    try {
        const type = document.getElementById('rapport-type').value;
        let filters = {};
        
        if (type === 'periode') {
            filters.date_from = document.getElementById('rapport-debut').value;
            filters.date_to = document.getElementById('rapport-fin').value;
            
            if (!filters.date_from || !filters.date_to) {
                showNotification('Veuillez sélectionner une période', 'error');
                return;
            }
        } else if (type === 'mensuel') {
            const now = new Date();
            filters.date_from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
            filters.date_to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-31`;
        } else if (type === 'annuel') {
            const now = new Date();
            filters.date_from = `${now.getFullYear()}-01-01`;
            filters.date_to = `${now.getFullYear()}-12-31`;
        }
        
        const transactions = await loadTransactions(filters);
        updateReportTable(transactions);
        
        document.getElementById('rapport-details').style.display = 'block';
        
        showNotification('Rapport généré avec succès', 'success');
        
    } catch (error) {
        console.error('Erreur lors de la génération du rapport:', error);
        showNotification(error.message, 'error');
    }
}

function updateReportTable(transactions) {
    const tbody = document.getElementById('rapport-table');
    
    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">Aucune transaction dans cette période</td></tr>';
        return;
    }
    
    tbody.innerHTML = transactions.map(transaction => `
        <tr>
            <td class="px-4 py-3">${formatDate(transaction.date)}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 rounded text-xs ${getTypeClass(transaction.type)}">
                    ${getTypeLabel(transaction.type)}
                </span>
            </td>
            <td class="px-4 py-3">${transaction.description}</td>
            <td class="px-4 py-3">${transaction.account_name || 'N/A'}</td>
            <td class="px-4 py-3 text-right ${getAmountClass(transaction.type)}">
                ${formatCurrency(transaction.amount)}
            </td>
        </tr>
    `).join('');
}

// Paramètres
async function updateParametresDisplay() {
    // Charger les catégories
    updateCategoriesList();
    
    // Charger les paramètres
    if (appData.settings) {
        document.getElementById('currency-setting').value = appData.settings.currency || 'EUR';
        document.getElementById('org-name').value = appData.settings.org_name || '';
    }
}

function updateCategoriesList() {
    const container = document.getElementById('categories-list');
    
    if (!appData.categories || appData.categories.length === 0) {
        container.innerHTML = '<p class="text-gray-500">Aucune catégorie</p>';
        return;
    }
    
    container.innerHTML = appData.categories.map(category => `
        <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span>${category.name}</span>
            <button onclick="deleteCategory(${category.id})" class="text-red-600 hover:text-red-800">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

async function addCategory() {
    const name = document.getElementById('new-category').value.trim();
    
    if (!name) {
        showNotification('Veuillez saisir un nom de catégorie', 'error');
        return;
    }
    
    try {
        await apiCall('/categories.php', {
            method: 'POST',
            body: { name: name }
        });
        
        showNotification('Catégorie ajoutée avec succès', 'success');
        
        // Recharger les données
        await loadAllData();
        updateCategorySelects();
        updateCategoriesList();
        
        document.getElementById('new-category').value = '';
        
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la catégorie:', error);
        showNotification(error.message, 'error');
    }
}

async function deleteCategory(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
        return;
    }
    
    try {
        await apiCall(`/categories.php/${id}`, {
            method: 'DELETE'
        });
        
        showNotification('Catégorie supprimée avec succès', 'success');
        
        // Recharger les données
        await loadAllData();
        updateCategorySelects();
        updateCategoriesList();
        
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        showNotification(error.message, 'error');
    }
}

async function saveSettings() {
    try {
        const settings = {
            currency: document.getElementById('currency-setting').value,
            org_name: document.getElementById('org-name').value
        };
        
        await apiCall('/settings.php', {
            method: 'PUT',
            body: settings
        });
        
        showNotification('Paramètres sauvegardés avec succès', 'success');
        
        // Recharger les paramètres
        const response = await apiCall('/settings.php');
        appData.settings = response.data || {};
        
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        showNotification(error.message, 'error');
    }
}

async function exportData() {
    try {
        // Rediriger vers l'endpoint d'export
        window.open(`${API_BASE}/settings.php/export`, '_blank');
        
    } catch (error) {
        console.error('Erreur lors de l\'export:', error);
        showNotification(error.message, 'error');
    }
}

function importData(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    if (file.type !== 'application/json') {
        showNotification('Veuillez sélectionner un fichier JSON', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            await apiCall('/settings.php/import', {
                method: 'POST',
                body: { data: data }
            });
            
            showNotification('Données importées avec succès', 'success');
            
            // Recharger toutes les données
            await loadAllData();
            updateAllDisplays();
            
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            showNotification(error.message, 'error');
        }
    };
    
    reader.readAsText(file);
}

async function clearAllData() {
    if (!confirm('Êtes-vous sûr de vouloir effacer toutes les données ? Cette action est irréversible.')) {
        return;
    }
    
    try {
        // Ici vous pourriez implémenter un endpoint pour vider la base
        showNotification('Fonctionnalité non implémentée', 'warning');
        
    } catch (error) {
        console.error('Erreur lors de l\'effacement:', error);
        showNotification(error.message, 'error');
    }
}

// Export PDF et Excel
function exportToPDF() {
    showNotification('Fonctionnalité en cours de développement', 'info');
}

function exportToExcel() {
    showNotification('Fonctionnalité en cours de développement', 'info');
}

// Graphiques
function updateCharts(stats, comptes) {
    // Graphique répartition recettes/dépenses
    const ctx1 = document.getElementById('repartitionChart').getContext('2d');
    
    if (charts.repartition) {
        charts.repartition.destroy();
    }
    
    charts.repartition = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Recettes', 'Dépenses'],
            datasets: [{
                data: [stats.total_recettes || 0, stats.total_depenses || 0],
                backgroundColor: ['#10B981', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Graphique répartition par compte
    const ctx2 = document.getElementById('comptesChart').getContext('2d');
    
    if (charts.comptes) {
        charts.comptes.destroy();
    }
    
    const comptesData = comptes.map(c => ({
        label: c.name,
        value: Math.abs(parseFloat(c.balance || 0))
    }));
    
    charts.comptes = new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: comptesData.map(c => c.label),
            datasets: [{
                data: comptesData.map(c => c.value),
                backgroundColor: [
                    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Fonctions utilitaires
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount || 0);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
}

function getTypeClass(type) {
    switch (type) {
        case 'recette':
        case 'virement_credit':
            return 'bg-green-100 text-green-800';
        case 'depense':
        case 'virement_debit':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

function getTypeLabel(type) {
    switch (type) {
        case 'recette': return 'Recette';
        case 'depense': return 'Dépense';
        case 'virement_debit': return 'Virement (débit)';
        case 'virement_credit': return 'Virement (crédit)';
        default: return 'Autre';
    }
}

function getAmountClass(type) {
    switch (type) {
        case 'recette':
        case 'virement_credit':
            return 'text-green-600';
        case 'depense':
        case 'virement_debit':
            return 'text-red-600';
        default:
            return '';
    }
}

function showNotification(message, type = 'info') {
    // Créer la notification
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${getNotificationClass(type)}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <div class="flex-shrink-0">
                <i class="fas ${getNotificationIcon(type)}"></i>
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-auto pl-3">
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Supprimer automatiquement après 5 secondes
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationClass(type) {
    switch (type) {
        case 'success': return 'bg-green-100 text-green-800 border border-green-200';
        case 'error': return 'bg-red-100 text-red-800 border border-red-200';
        case 'warning': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
        default: return 'bg-blue-100 text-blue-800 border border-blue-200';
    }
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// Fonction de rafraîchissement
async function refreshData() {
    try {
        showConnectionStatus('loading', 'Actualisation...');
        
        await loadAllData();
        updateAllDisplays();
        
        if (currentSection === 'dashboard') {
            updateDashboard();
        } else if (currentSection === 'transactions') {
            updateTransactionsDisplay();
        } else if (currentSection === 'tiers') {
            updateTiersDisplay();
        } else if (currentSection === 'banque') {
            updateBanqueDisplay();
        } else if (currentSection === 'caisse') {
            updateCaisseDisplay();
        } else if (currentSection === 'rapports') {
            updateRapportsDisplay();
        } else if (currentSection === 'parametres') {
            updateParametresDisplay();
        }
        
        showConnectionStatus('success', 'À jour');
        showNotification('Données actualisées', 'success');
        
    } catch (error) {
        console.error('Erreur lors de l\'actualisation:', error);
        showConnectionStatus('error', 'Erreur');
        showNotification('Erreur lors de l\'actualisation', 'error');
    }
}