# 🏛️ ARCHITECTURE DU PROJET

## Vue d'Ensemble

Ce document décrit l'architecture complète de l'application de gestion de caisse après la restructuration.

## 📋 Table des Matières

1. [Vue Générale](#vue-générale)
2. [Architecture Frontend](#architecture-frontend)
3. [Architecture Backend](#architecture-backend)
4. [Flux de Données](#flux-de-données)
5. [Sécurité](#sécurité)
6. [Déploiement](#déploiement)

---

## 🌐 Vue Générale

### Stack Technique

**Frontend:**
- JavaScript ES6+ (Modules)
- HTML5 + CSS3
- TailwindCSS pour le styling
- Chart.js pour les graphiques

**Backend:**
- PHP 8.0+
- PostgreSQL 12+
- Architecture REST API

**Outils:**
- Git pour le versioning
- npm pour les dépendances frontend (optionnel)

### Principes Architecturaux

1. **Séparation des Responsabilités (SoC)**
   - Frontend/Backend clairement séparés
   - Couche de présentation / Logique métier / Accès données

2. **Architecture en Couches**
   ```
   [Présentation] → [Services] → [API] → [Modèles] → [Base de Données]
   ```

3. **Pattern MVC Adapté**
   - Modèles: Classes PHP (Transaction, Compte, Tiers)
   - Vues: HTML + JavaScript Components
   - Contrôleurs: API Endpoints + Services JavaScript

4. **Single Page Application (SPA)**
   - Navigation côté client sans rechargement
   - Communication asynchrone avec l'API

---

## 💻 Architecture Frontend

### Structure Modulaire

```
js-refactored/
├── 📁 core/              # Coeur de l'application
│   ├── app.js           # Lifecycle & initialisation
│   ├── api.js           # Client HTTP centralisé
│   ├── router.js        # Navigation entre sections
│   ├── store.js         # Gestion d'état (Store pattern)
│   └── config.js        # Configuration & constantes
│
├── 📦 services/         # Logique métier
│   ├── transactionService.js
│   ├── tiersService.js
│   ├── compteService.js
│   └── statsService.js
│
├── 🧩 components/      # Composants UI (future)
│   ├── dashboard.js
│   ├── transactions.js
│   ├── tiers.js
│   └── modal.js
│
├── 🛠️ utils/            # Utilitaires
│   ├── formatters.js    # Formatage dates/monnaie
│   ├── validators.js    # Validations
│   ├── helpers.js       # Fonctions générales
│   └── security.js      # Sécurité XSS
│
└── main.js              # Point d'entrée
```

### Responsabilités des Modules

#### **Core Layer**

**app.js** - Gestionnaire d'application
- Initialisation de l'application
- Gestion du cycle de vie
- Chargement des données initiales
- Affichage du statut de connexion

**api.js** - Client HTTP
- Communication avec le backend
- Gestion des erreurs réseau
- Détection automatique du chemin API
- Retry logic et timeout

**router.js** - Routeur
- Navigation entre les sections
- Gestion de l'historique
- Activation des handlers de section

**store.js** - Gestion d'état
- Stockage centralisé des données
- Pattern Observer pour les écoutes de changement
- Gestion des filtres et de l'état UI

#### **Services Layer**

**transactionService.js**
- CRUD transactions
- Virements entre comptes
- Statistiques de transactions
- Filtrage et recherche

**tiersService.js**
- Gestion clients/fournisseurs
- Recherche multi-critères
- Calcul de soldes

**compteService.js**
- Gestion des comptes banque/caisse
- Calculs de soldes
- Statistiques par compte

**statsService.js**
- Calculs statistiques complexes
- Génération de graphiques
- Analyses de tendances
- Comparaisons de périodes

#### **Utils Layer**

Fonctions réutilisables pour:
- Formatage (dates, monnaies, nombres)
- Validation (emails, téléphones, formulaires)
- Helpers (debounce, notifications, tri, recherche)
- Sécurité (sanitization XSS)

### Flux de Données Frontend

```
[User Action]
     ↓
[Component / Event Handler]
     ↓
[Service Layer] ←→ [Validation]
     ↓
[API Client]
     ↓
[Backend API]
     ↓
[API Response]
     ↓
[Store Update]
     ↓
[UI Update via Observers]
```

### Pattern Store (State Management)

Le store utilise le pattern Observer:

```javascript
// Subscribe to state changes
store.subscribe('transactions', (newValue, oldValue) => {
    console.log('Transactions updated!');
    updateTransactionTable();
});

// Update state (notifies all subscribers)
store.setState({ transactions: newData });
```

---

## ⚙️ Architecture Backend

### Structure Backend

```
Mon-projet/
├── 📡 api/                    # API REST
│   ├── controllers/          # Contrôleurs (nouvelle couche)
│   │   ├── TransactionController.php
│   │   ├── TiersController.php
│   │   └── CompteController.php
│   ├── transactions.php      # Routes
│   ├── tiers.php
│   ├── comptes.php
│   └── categories.php
│
├── 📦 classes/               # Modèles & Services
│   ├── Database.php          # Singleton PDO
│   ├── Transaction.php       # Modèle Transaction
│   ├── Compte.php            # Modèle Compte
│   ├── Tiers.php             # Modèle Tiers
│   ├── Services/             # Services métier
│   │   ├── TransactionService.php
│   │   └── ReportService.php
│   └── Validators/           # Validateurs
│       └── TransactionValidator.php
│
├── ⚙️ config/                 # Configuration
│   ├── database.php          # Config BDD + helpers
│   └── config_example.php    # Template config
│
├── 📝 includes/              # Fichiers inclus
│   └── helpers.php           # Fonctions globales
│
└── 📊 database/              # Scripts SQL
    └── schema.sql            # Structure BDD
```

### Architecture en Couches Backend

```
[API Endpoints] (transactions.php)
       ↓
[Controllers] (TransactionController) - Nouvelle couche
       ↓
[Services] (TransactionService) - Logique métier complexe
       ↓
[Models] (Transaction.php) - Accès données
       ↓
[Database] (Singleton PDO)
       ↓
[PostgreSQL]
```

### Responsabilités des Couches

#### **API Layer** (Routes)
- Routage des requêtes HTTP
- Parsing des paramètres
- Délégation aux contrôleurs
- Réponses JSON

#### **Controller Layer** (Nouveau)
- Orchestration des opérations
- Validation des entrées
- Gestion des erreurs
- Coordination entre services

#### **Service Layer**
- Logique métier complexe
- Opérations multi-modèles
- Calculs et analyses
- Règles de gestion

#### **Model Layer**
- CRUD basique
- Accès direct à la base
- Requêtes SQL
- Mappage objet/table

#### **Database Layer**
- Connexion PDO singleton
- Exécution de requêtes
- Gestion des transactions
- Pool de connexions

---

## 🔄 Flux de Données Global

### Exemple: Création de Transaction

```
1. [Frontend] User remplit le formulaire
   ↓
2. [JS Validator] Vérifie les données côté client
   ↓
3. [TransactionService.js] Appelle l'API
   ↓
4. [API Client] POST /api/transactions.php
   ↓
5. [transactions.php] Reçoit la requête
   ↓
6. [TransactionController] Valide et orchestre
   ↓
7. [Transaction.php] Insère en base
   ↓
8. [Database.php] Exécute la requête SQL
   ↓
9. [PostgreSQL] Stocke les données
   ↓
10. [Response] JSON retourné
    ↓
11. [Store] Met à jour l'état
    ↓
12. [UI] Affiche la notification + rafraîchit
```

### Gestion des Erreurs

```
[Error occurs at any level]
        ↓
[Exception thrown]
        ↓
[Caught by appropriate handler]
        ↓
[Logged for debugging]
        ↓
[User-friendly message]
        ↓
[Notification displayed]
```

---

## 🔒 Sécurité

### Frontend Security

1. **XSS Prevention**
   - Sanitization systématique (security.js)
   - `sanitizeHTML()` avant insertion DOM
   - Validation des attributs

2. **CSRF Protection**
   - Tokens CSRF pour les mutations
   - Vérification côté serveur

3. **Input Validation**
   - Validation côté client (validators.js)
   - Double validation serveur

### Backend Security

1. **SQL Injection Prevention**
   - PDO Prepared Statements
   - Pas de concaténation SQL
   - Validation des types

2. **Authentication & Authorization**
   - Sessions PHP sécurisées
   - Tokens d'accès
   - Contrôle des permissions

3. **Headers Sécurité**
   ```php
   header('X-Content-Type-Options: nosniff');
   header('X-Frame-Options: DENY');
   header('X-XSS-Protection: 1; mode=block');
   ```

4. **Rate Limiting**
   - Limitation des requêtes par IP
   - Protection contre le brute force

5. **File Protection**
   - .htaccess pour bloquer l'accès direct
   - Permissions fichiers appropriées

---

## 🚀 Déploiement

### Environnement de Développement

```bash
# Démarrer le serveur PHP
php -S localhost:8080

# Ou utiliser le script fourni
./install/start_server.bat
```

### Environnement de Production

**Serveur Web:**
- Apache 2.4+ ou Nginx 1.18+
- PHP 8.0+ avec extensions: pdo, pdo_pgsql, mbstring, json
- PostgreSQL 12+

**Configuration Apache:**
```apache
<VirtualHost *:80>
    DocumentRoot /var/www/caisse-regie
    ServerName caisse.example.com
    
    <Directory /var/www/caisse-regie>
        AllowOverride All
        Require all granted
    </Directory>
    
    # Enable HTTPS redirect
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}$1 [R=301,L]
</VirtualHost>
```

**Checklist Production:**
- [ ] HTTPS activé (certificat SSL)
- [ ] APP_DEBUG = false
- [ ] Fichiers sensibles protégés (.htaccess)
- [ ] Logs activés et surveillés
- [ ] Sauvegardes automatiques BDD
- [ ] Permissions fichiers correctes (755/644)
- [ ] Firewall configuré

---

## 📊 Monitoring & Maintenance

### Logs

**Frontend:**
- Console JavaScript pour le développement
- Service de tracking (Google Analytics, Matomo)

**Backend:**
- PHP error logs: `logs/php_errors.log`
- Application logs: `logs/application.log`
- PostgreSQL logs: `/var/log/postgresql/`

### Métriques à Surveiller

1. **Performance**
   - Temps de réponse API
   - Temps de chargement page
   - Taille des requêtes

2. **Disponibilité**
   - Uptime serveur
   - État base de données
   - Erreurs 5xx

3. **Utilisation**
   - Nombre d'utilisateurs actifs
   - Transactions par jour
   - Pic de charge

### Sauvegardes

```bash
# Sauvegarde quotidienne automatique
0 2 * * * pg_dump -h localhost -U caisse_user caisse_regie > /backups/db_$(date +\%Y\%m\%d).sql

# Sauvegarde des fichiers
0 3 * * * tar -czf /backups/files_$(date +\%Y\%m\%d).tar.gz /var/www/caisse-regie
```

---

## 🔧 Outils de Développement

### Recommandés

- **IDE:** VS Code, PhpStorm
- **Extensions:** ESLint, PHP Intelephense
- **Database:** pgAdmin, DBeaver
- **API Testing:** Postman, Insomnia
- **Version Control:** Git

### Scripts Utiles

```bash
# Vérifier la syntaxe PHP
php -l api/transactions.php

# Linter JavaScript
eslint js-refactored/

# Tests unitaires (si configurés)
phpunit tests/
```

---

## 📚 Ressources

- [Documentation PHP](https://www.php.net/manual/fr/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [MDN Web Docs](https://developer.mozilla.org/)
- [TailwindCSS](https://tailwindcss.com/docs)
- [Chart.js](https://www.chartjs.org/docs/)

---

**Dernière mise à jour:** 2025-10-22  
**Auteur:** MiniMax Agent
