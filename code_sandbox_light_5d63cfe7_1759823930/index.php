<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gestion de Caisse Régie</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        .section { display: none; }
        .section.active { display: block; }
        .navbar-brand { font-weight: bold; }
        .card { box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .table th { background-color: #f8f9fa; }
        .badge-recette { background-color: #28a745; }
        .badge-depense { background-color: #dc3545; }
        .chart-container { position: relative; height: 400px; }
        .kpi-card { border-left: 4px solid; }
        .kpi-card.success { border-left-color: #28a745; }
        .kpi-card.primary { border-left-color: #007bff; }
        .kpi-card.warning { border-left-color: #ffc107; }
        .kpi-card.info { border-left-color: #17a2b8; }
    </style>
</head>
<body>
    <!-- Navigation principale -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
        <div class="container-fluid">
            <a class="navbar-brand" href="#"><i class="fas fa-cash-register me-2"></i>Gestion de Caisse Régie</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="#" onclick="showSection('dashboard')">
                            <i class="fas fa-tachometer-alt me-1"></i>Tableau de bord
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('transactions')">
                            <i class="fas fa-exchange-alt me-1"></i>Transactions
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('comptes')">
                            <i class="fas fa-university me-1"></i>Comptes
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('tiers')">
                            <i class="fas fa-users me-1"></i>Tiers
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('rapports')">
                            <i class="fas fa-chart-bar me-1"></i>Rapports
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showSection('parametres')">
                            <i class="fas fa-cog me-1"></i>Paramètres
                        </a>
                    </li>
                </ul>
                <span class="navbar-text">
                    <i class="fas fa-calendar me-1"></i><span id="current-date"></span>
                </span>
            </div>
        </div>
    </nav>

    <div class="container-fluid mt-3">
        <!-- Section Tableau de bord -->
        <div id="section-dashboard" class="section active">
            <div class="row mb-4">
                <div class="col-12">
                    <h2><i class="fas fa-tachometer-alt me-2"></i>Tableau de Bord</h2>
                </div>
            </div>
            
            <!-- KPIs -->
            <div class="row mb-4">
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card kpi-card success">
                        <div class="card-body">
                            <div class="d-flex">
                                <div class="flex-grow-1">
                                    <h6 class="text-muted">Solde Total</h6>
                                    <h3 class="mb-0" id="kpi-solde-total">0 €</h3>
                                    <small class="text-muted">Tous comptes confondus</small>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-euro-sign fa-2x text-success"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card kpi-card primary">
                        <div class="card-body">
                            <div class="d-flex">
                                <div class="flex-grow-1">
                                    <h6 class="text-muted">Recettes du Mois</h6>
                                    <h3 class="mb-0" id="kpi-recettes-mois">0 €</h3>
                                    <small class="text-muted" id="kpi-recettes-evolution">--</small>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-arrow-up fa-2x text-primary"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card kpi-card warning">
                        <div class="card-body">
                            <div class="d-flex">
                                <div class="flex-grow-1">
                                    <h6 class="text-muted">Dépenses du Mois</h6>
                                    <h3 class="mb-0" id="kpi-depenses-mois">0 €</h3>
                                    <small class="text-muted" id="kpi-depenses-evolution">--</small>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-arrow-down fa-2x text-warning"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-xl-3 col-md-6 mb-4">
                    <div class="card kpi-card info">
                        <div class="card-body">
                            <div class="d-flex">
                                <div class="flex-grow-1">
                                    <h6 class="text-muted">Nombre de Comptes</h6>
                                    <h3 class="mb-0" id="kpi-nb-comptes">0</h3>
                                    <small class="text-muted">Comptes actifs</small>
                                </div>
                                <div class="align-self-center">
                                    <i class="fas fa-university fa-2x text-info"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Graphiques -->
            <div class="row mb-4">
                <div class="col-lg-8">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-line me-2"></i>Évolution des Finances</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="chart-evolution"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-chart-pie me-2"></i>Répartition par Catégorie</h5>
                        </div>
                        <div class="card-body">
                            <div class="chart-container">
                                <canvas id="chart-categories"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Dernières transactions -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="fas fa-history me-2"></i>Dernières Transactions</h5>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Type</th>
                                            <th>Description</th>
                                            <th>Montant</th>
                                            <th>Compte</th>
                                            <th>Catégorie</th>
                                        </tr>
                                    </thead>
                                    <tbody id="table-dernieres-transactions">
                                        <tr>
                                            <td colspan="6" class="text-center text-muted">
                                                <i class="fas fa-spinner fa-spin me-2"></i>Chargement des données...
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section Transactions -->
        <div id="section-transactions" class="section">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-exchange-alt me-2"></i>Transactions</h2>
                <div>
                    <button class="btn btn-success" onclick="showModal('modalTransaction')">
                        <i class="fas fa-plus me-1"></i>Nouvelle Transaction
                    </button>
                    <button class="btn btn-info" onclick="showModal('modalVirement')">
                        <i class="fas fa-arrows-alt-h me-1"></i>Virement de Fonds
                    </button>
                </div>
            </div>

            <!-- Filtres -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-2">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="filter-type" onchange="loadTransactions()">
                                <option value="">Tous types</option>
                                <option value="recette">Recettes</option>
                                <option value="depense">Dépenses</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Compte</label>
                            <select class="form-select" id="filter-compte" onchange="loadTransactions()">
                                <option value="">Tous comptes</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Catégorie</label>
                            <select class="form-select" id="filter-categorie" onchange="loadTransactions()">
                                <option value="">Toutes catégories</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Du</label>
                            <input type="date" class="form-control" id="filter-date-debut" onchange="loadTransactions()">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Au</label>
                            <input type="date" class="form-control" id="filter-date-fin" onchange="loadTransactions()">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Recherche</label>
                            <input type="text" class="form-control" id="filter-recherche" placeholder="Description..." onkeyup="loadTransactions()">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tableau des transactions -->
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Description</th>
                                    <th>Montant</th>
                                    <th>Compte</th>
                                    <th>Catégorie</th>
                                    <th>Tiers</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="table-transactions">
                                <tr>
                                    <td colspan="8" class="text-center text-muted">
                                        <i class="fas fa-spinner fa-spin me-2"></i>Chargement des transactions...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <!-- Pagination -->
                    <nav aria-label="Pagination des transactions">
                        <ul class="pagination justify-content-center" id="pagination-transactions">
                        </ul>
                    </nav>
                </div>
            </div>
        </div>

        <!-- Section Comptes -->
        <div id="section-comptes" class="section">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-university me-2"></i>Comptes</h2>
                <button class="btn btn-success" onclick="showModal('modalCompte')">
                    <i class="fas fa-plus me-1"></i>Nouveau Compte
                </button>
            </div>

            <!-- Onglets Caisses/Banques -->
            <ul class="nav nav-tabs mb-4" id="comptes-tabs">
                <li class="nav-item">
                    <a class="nav-link active" href="#" onclick="filterComptes('caisse')">
                        <i class="fas fa-cash-register me-1"></i>Caisses
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="filterComptes('banque')">
                        <i class="fas fa-university me-1"></i>Banques
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="filterComptes('')">
                        <i class="fas fa-list me-1"></i>Tous
                    </a>
                </li>
            </ul>

            <!-- Liste des comptes -->
            <div class="row" id="liste-comptes">
                <div class="col-12 text-center text-muted">
                    <i class="fas fa-spinner fa-spin me-2"></i>Chargement des comptes...
                </div>
            </div>
        </div>

        <!-- Section Tiers -->
        <div id="section-tiers" class="section">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2><i class="fas fa-users me-2"></i>Tiers</h2>
                <button class="btn btn-success" onclick="showModal('modalTiers')">
                    <i class="fas fa-plus me-1"></i>Nouveau Tiers
                </button>
            </div>

            <!-- Onglets Clients/Fournisseurs -->
            <ul class="nav nav-tabs mb-4" id="tiers-tabs">
                <li class="nav-item">
                    <a class="nav-link active" href="#" onclick="filterTiers('client')">
                        <i class="fas fa-user-tie me-1"></i>Clients
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="filterTiers('fournisseur')">
                        <i class="fas fa-truck me-1"></i>Fournisseurs
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="filterTiers('')">
                        <i class="fas fa-list me-1"></i>Tous
                    </a>
                </li>
            </ul>

            <!-- Recherche tiers -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-search"></i></span>
                        <input type="text" class="form-control" id="search-tiers" placeholder="Rechercher un tiers..." onkeyup="loadTiers()">
                    </div>
                </div>
            </div>

            <!-- Tableau des tiers -->
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Nom</th>
                                    <th>Type</th>
                                    <th>Contact</th>
                                    <th>Email</th>
                                    <th>Statut</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="table-tiers">
                                <tr>
                                    <td colspan="7" class="text-center text-muted">
                                        <i class="fas fa-spinner fa-spin me-2"></i>Chargement des tiers...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section Rapports -->
        <div id="section-rapports" class="section">
            <div class="row mb-4">
                <div class="col-12">
                    <h2><i class="fas fa-chart-bar me-2"></i>Rapports</h2>
                </div>
            </div>

            <!-- Filtres rapport -->
            <div class="card mb-4">
                <div class="card-header">
                    <h5><i class="fas fa-filter me-2"></i>Paramètres du Rapport</h5>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Type de rapport</label>
                            <select class="form-select" id="rapport-type">
                                <option value="mensuel">Rapport mensuel</option>
                                <option value="annuel">Rapport annuel</option>
                                <option value="periode">Période personnalisée</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Du</label>
                            <input type="date" class="form-control" id="rapport-date-debut">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">Au</label>
                            <input type="date" class="form-control" id="rapport-date-fin">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Compte</label>
                            <select class="form-select" id="rapport-compte">
                                <option value="">Tous comptes</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label">&nbsp;</label>
                            <button class="btn btn-primary d-block" onclick="genererRapport()">
                                <i class="fas fa-chart-bar me-1"></i>Générer
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Résultat rapport -->
            <div id="rapport-results" class="d-none">
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card text-center bg-success text-white">
                            <div class="card-body">
                                <h4 id="rapport-total-recettes">0 €</h4>
                                <small>Total Recettes</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center bg-danger text-white">
                            <div class="card-body">
                                <h4 id="rapport-total-depenses">0 €</h4>
                                <small>Total Dépenses</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center bg-info text-white">
                            <div class="card-body">
                                <h4 id="rapport-benefice">0 €</h4>
                                <small>Bénéfice/Perte</small>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card text-center bg-secondary text-white">
                            <div class="card-body">
                                <h4 id="rapport-nb-operations">0</h4>
                                <small>Nb Opérations</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card mb-4">
                    <div class="card-header d-flex justify-content-between">
                        <h5>Détail des Transactions</h5>
                        <div>
                            <button class="btn btn-outline-success btn-sm" onclick="exporterRapport('json')">
                                <i class="fas fa-download me-1"></i>Export JSON
                            </button>
                            <button class="btn btn-outline-primary btn-sm" onclick="exporterRapport('csv')">
                                <i class="fas fa-file-csv me-1"></i>Export CSV
                            </button>
                            <button class="btn btn-outline-secondary btn-sm" onclick="window.print()">
                                <i class="fas fa-print me-1"></i>Imprimer
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Montant</th>
                                        <th>Compte</th>
                                        <th>Catégorie</th>
                                    </tr>
                                </thead>
                                <tbody id="rapport-transactions">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Section Paramètres -->
        <div id="section-parametres" class="section">
            <div class="row mb-4">
                <div class="col-12">
                    <h2><i class="fas fa-cog me-2"></i>Paramètres</h2>
                </div>
            </div>

            <!-- Onglets paramètres -->
            <ul class="nav nav-tabs mb-4" id="parametres-tabs">
                <li class="nav-item">
                    <a class="nav-link active" href="#" onclick="showParametresTab('general')">
                        <i class="fas fa-cog me-1"></i>Général
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showParametresTab('categories')">
                        <i class="fas fa-tags me-1"></i>Catégories
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#" onclick="showParametresTab('sauvegarde')">
                        <i class="fas fa-database me-1"></i>Sauvegarde
                    </a>
                </li>
            </ul>

            <!-- Onglet Général -->
            <div id="parametres-general" class="parametres-tab">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-building me-2"></i>Configuration Générale</h5>
                    </div>
                    <div class="card-body">
                        <form id="form-parametres-general">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Nom de l'organisation</label>
                                    <input type="text" class="form-control" id="param-organization" name="organization">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Devise</label>
                                    <select class="form-select" id="param-currency" name="currency">
                                        <option value="EUR">Euro (€)</option>
                                        <option value="USD">Dollar ($)</option>
                                        <option value="GBP">Livre (£)</option>
                                        <option value="CHF">Franc suisse (CHF)</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Format de date</label>
                                    <select class="form-select" id="param-date-format" name="date_format">
                                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Langue</label>
                                    <select class="form-select" id="param-language" name="language">
                                        <option value="fr">Français</option>
                                        <option value="en">English</option>
                                    </select>
                                </div>
                            </div>
                            <div class="mt-3">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-save me-1"></i>Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <!-- Onglet Catégories -->
            <div id="parametres-categories" class="parametres-tab d-none">
                <div class="card">
                    <div class="card-header d-flex justify-content-between">
                        <h5><i class="fas fa-tags me-2"></i>Gestion des Catégories</h5>
                        <button class="btn btn-success btn-sm" onclick="showModal('modalCategorie')">
                            <i class="fas fa-plus me-1"></i>Nouvelle Catégorie
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Couleur</th>
                                        <th>Description</th>
                                        <th>Statut</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="table-categories">
                                    <tr>
                                        <td colspan="5" class="text-center text-muted">
                                            <i class="fas fa-spinner fa-spin me-2"></i>Chargement des catégories...
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Onglet Sauvegarde -->
            <div id="parametres-sauvegarde" class="parametres-tab d-none">
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-download me-2"></i>Exporter les Données</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-muted">Téléchargez une sauvegarde complète de toutes vos données au format JSON.</p>
                                <button class="btn btn-primary" onclick="exporterDonnees()">
                                    <i class="fas fa-download me-1"></i>Télécharger la Sauvegarde
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h5><i class="fas fa-upload me-2"></i>Importer les Données</h5>
                            </div>
                            <div class="card-body">
                                <p class="text-muted">Restaurez vos données à partir d'un fichier de sauvegarde JSON.</p>
                                <div class="mb-3">
                                    <input type="file" class="form-control" id="import-file" accept=".json">
                                </div>
                                <button class="btn btn-warning" onclick="importerDonnees()">
                                    <i class="fas fa-upload me-1"></i>Importer la Sauvegarde
                                </button>
                                <small class="d-block text-danger mt-2">
                                    <i class="fas fa-exclamation-triangle me-1"></i>
                                    Cette action remplacera toutes les données existantes !
                                </small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Transaction -->
    <div class="modal fade" id="modalTransaction" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-plus me-2"></i><span id="modal-transaction-title">Nouvelle Transaction</span>
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="form-transaction">
                        <input type="hidden" id="transaction-id" name="id">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Type <span class="text-danger">*</span></label>
                                <select class="form-select" id="transaction-type" name="type" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="recette">Recette</option>
                                    <option value="depense">Dépense</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Montant <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="transaction-montant" name="montant" step="0.01" min="0.01" required>
                                    <span class="input-group-text">€</span>
                                </div>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Description <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="transaction-description" name="description" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="transaction-date" name="date" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Compte <span class="text-danger">*</span></label>
                                <select class="form-select" id="transaction-compte" name="compte_id" required>
                                    <option value="">Sélectionner un compte...</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Catégorie</label>
                                <select class="form-select" id="transaction-categorie" name="categorie_id">
                                    <option value="">Aucune catégorie</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Tiers</label>
                                <select class="form-select" id="transaction-tiers" name="tiers_id">
                                    <option value="">Aucun tiers</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">N° Pièce</label>
                                <input type="text" class="form-control" id="transaction-numero-piece" name="numero_piece">
                            </div>
                            <div class="col-12">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" id="transaction-notes" name="notes" rows="3"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-primary" onclick="saveTransaction()">
                        <i class="fas fa-save me-1"></i>Enregistrer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Virement -->
    <div class="modal fade" id="modalVirement" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-arrows-alt-h me-2"></i>Virement de Fonds
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="form-virement">
                        <div class="row g-3">
                            <div class="col-12">
                                <label class="form-label">Compte Source <span class="text-danger">*</span></label>
                                <select class="form-select" id="virement-compte-source" name="compte_source" required>
                                    <option value="">Sélectionner le compte source...</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Compte Destination <span class="text-danger">*</span></label>
                                <select class="form-select" id="virement-compte-destination" name="compte_destination" required>
                                    <option value="">Sélectionner le compte destination...</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Montant <span class="text-danger">*</span></label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="virement-montant" name="montant" step="0.01" min="0.01" required>
                                    <span class="input-group-text">€</span>
                                </div>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Description <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="virement-description" name="description" value="Virement de fonds" required>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Date <span class="text-danger">*</span></label>
                                <input type="date" class="form-control" id="virement-date" name="date" required>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-primary" onclick="saveVirement()">
                        <i class="fas fa-exchange-alt me-1"></i>Effectuer le Virement
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Compte -->
    <div class="modal fade" id="modalCompte" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-university me-2"></i><span id="modal-compte-title">Nouveau Compte</span>
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="form-compte">
                        <input type="hidden" id="compte-id" name="id">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="form-label">Nom <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="compte-nom" name="nom" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Type <span class="text-danger">*</span></label>
                                <select class="form-select" id="compte-type" name="type" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="caisse">Caisse</option>
                                    <option value="banque">Banque</option>
                                </select>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Solde Initial</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="compte-solde-initial" name="solde_initial" step="0.01" value="0">
                                    <span class="input-group-text">€</span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">N° de Compte</label>
                                <input type="text" class="form-control" id="compte-numero" name="numero_compte">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Banque</label>
                                <input type="text" class="form-control" id="compte-banque" name="banque">
                            </div>
                            <div class="col-12">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="compte-description" name="description" rows="3"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-primary" onclick="saveCompte()">
                        <i class="fas fa-save me-1"></i>Enregistrer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Tiers -->
    <div class="modal fade" id="modalTiers" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-user me-2"></i><span id="modal-tiers-title">Nouveau Tiers</span>
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="form-tiers">
                        <input type="hidden" id="tiers-id" name="id">
                        <div class="row g-3">
                            <div class="col-md-8">
                                <label class="form-label">Nom <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="tiers-nom" name="nom" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Type <span class="text-danger">*</span></label>
                                <select class="form-select" id="tiers-type" name="type" required>
                                    <option value="">Sélectionner...</option>
                                    <option value="client">Client</option>
                                    <option value="fournisseur">Fournisseur</option>
                                </select>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Contact</label>
                                <input type="text" class="form-control" id="tiers-contact" name="contact">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Téléphone</label>
                                <input type="tel" class="form-control" id="tiers-telephone" name="telephone">
                            </div>
                            <div class="col-12">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="tiers-email" name="email">
                            </div>
                            <div class="col-12">
                                <label class="form-label">Adresse</label>
                                <textarea class="form-control" id="tiers-adresse" name="adresse" rows="2"></textarea>
                            </div>
                            <div class="col-12">
                                <label class="form-label">Notes</label>
                                <textarea class="form-control" id="tiers-notes" name="notes" rows="3"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-primary" onclick="saveTiers()">
                        <i class="fas fa-save me-1"></i>Enregistrer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal Catégorie -->
    <div class="modal fade" id="modalCategorie" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-tag me-2"></i><span id="modal-categorie-title">Nouvelle Catégorie</span>
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="form-categorie">
                        <input type="hidden" id="categorie-id" name="id">
                        <div class="row g-3">
                            <div class="col-md-8">
                                <label class="form-label">Nom <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="categorie-nom" name="nom" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Couleur</label>
                                <input type="color" class="form-control form-control-color" id="categorie-couleur" name="couleur" value="#007bff">
                            </div>
                            <div class="col-12">
                                <label class="form-label">Description</label>
                                <textarea class="form-control" id="categorie-description" name="description" rows="3"></textarea>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                    <button type="button" class="btn btn-primary" onclick="saveCategorie()">
                        <i class="fas fa-save me-1"></i>Enregistrer
                    </button>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="js/main.js"></script>
</body>
</html>