# 🏦 Gestion de Caisse Régie - Version PHP/PostgreSQL

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/votre-repo/caisse-regie-php)
[![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4.svg)](https://php.net)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12%2B-336791.svg)](https://postgresql.org)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](#licence)

Application web professionnelle de gestion de caisse régie développée en PHP avec base de données PostgreSQL. Version convertie et améliorée de l'application JavaScript/localStorage originale.

## 📋 Table des matières

- [🎯 Aperçu](#aperçu)
- [✨ Fonctionnalités](#fonctionnalités)
- [🆕 Nouveautés v2.0.0](#nouveautés-v200)
- [🛠️ Prérequis](#prérequis)
- [📥 Installation](#installation)
- [🚀 Utilisation](#utilisation)
- [🏗️ Architecture](#architecture)
- [🔐 Sécurité](#sécurité)
- [📊 API REST](#api-rest)
- [🐛 Résolution de problèmes](#résolution-de-problèmes)
- [📞 Support](#support)

---

## 🎯 Aperçu

**Gestion de Caisse Régie** est une application web complète permettant de gérer efficacement les finances d'une organisation. Elle offre un suivi en temps réel des recettes, dépenses, comptes bancaires et caisses physiques avec une interface moderne et intuitive.

### Captures d'écran

```
🏠 Tableau de Bord      📊 Graphiques temps réel    💰 Gestion Transactions
┌─────────────────┐    ┌─────────────────────┐    ┌──────────────────────┐
│ Solde Total     │    │ Évolution mensuelle │    │ + Nouvelle Transaction│
│ 15,450.00 €     │    │     📈 Chart.js    │    │ 🔄 Virement de fonds │
│                 │    │                     │    │ 🔍 Filtres avancés   │
│ Recettes: +5.2K │    │ Répartition         │    │ 📝 Modification      │
│ Dépenses: -3.1K │    │ par catégories      │    │ 🗑️ Suppression       │
└─────────────────┘    └─────────────────────┘    └──────────────────────┘
```

---

## ✨ Fonctionnalités

### 💰 Gestion Financière Complète
- **Transactions** : Recettes, dépenses avec catégorisation automatique
- **Virements** : Transferts automatisés entre comptes avec double écriture
- **Comptes multiples** : Caisses physiques et comptes bancaires
- **Soldes temps réel** : Calcul automatique des soldes actualisés

### 👥 Gestion des Tiers
- **Clients et Fournisseurs** : Base de données complète avec historique
- **Codes automatiques** : Génération de codes uniques
- **Recherche avancée** : Filtrage et recherche multi-critères
- **Statistiques** : Analyse des relations commerciales

### 📊 Tableau de Bord et Rapports
- **KPIs temps réel** : Indicateurs financiers actualisés
- **Graphiques interactifs** : Chart.js avec données dynamiques
- **Rapports personnalisés** : Génération par période et critères
- **Exports** : JSON, CSV, impression HTML

### ⚙️ Configuration et Administration
- **Paramètres flexibles** : Devise, format de date, organisation
- **Catégories personnalisées** : Classification avec codes couleur
- **Sauvegarde/Restauration** : Export/Import complet des données
- **Logs d'activité** : Traçabilité des opérations

---

## 🆕 Nouveautés v2.0.0

### 🔄 Migration JavaScript → PHP/PostgreSQL

| Avant (v1.x) | Maintenant (v2.0.0) |
|---------------|---------------------|
| localStorage | 🗄️ PostgreSQL robuste |
| Client-side only | 🌐 Architecture client-serveur |
| Données volatiles | 💾 Persistance garantie |
| Pas de virements | 🔄 Virements automatisés |
| Performance limitée | 📈 Optimisations serveur |

### 🚀 Nouvelles Fonctionnalités
- **Virements automatisés** : Double écriture comptable automatique
- **API REST complète** : Architecture modulaire et extensible  
- **Sécurité renforcée** : Validation serveur, protection SQL injection
- **Performance optimisée** : Index PostgreSQL, requêtes optimisées
- **Installation automatique** : Scripts Windows one-click
- **Multi-environnement** : Configuration dev/production

### 🛡️ Sécurité Avancée
- ✅ Protection CSRF et XSS
- ✅ Headers de sécurité HTTP
- ✅ Validation côté serveur
- ✅ Logs de sécurité
- ✅ Configuration .htaccess

---

## 🛠️ Prérequis

### Logiciels Requis

| Composant | Version Min. | Version Rec. | Status |
|-----------|--------------|--------------|--------|
| **PHP** | 7.4.0 | 8.0+ | ✅ Requis |
| **PostgreSQL** | 12.0 | 14+ | ✅ Requis |
| **Serveur Web** | Apache 2.4+ | Apache 2.4+ / Nginx | ✅ Requis |
| **Mémoire RAM** | 2 GB | 4 GB+ | 📊 Recommandé |
| **Espace Disque** | 100 MB | 500 MB+ | 📊 Recommandé |

### Extensions PHP Requises
```bash
✅ pdo                 # PHP Data Objects
✅ pdo_pgsql          # PDO PostgreSQL driver  
✅ pgsql              # PostgreSQL functions
✅ json               # Support JSON
✅ mbstring           # Chaînes multi-octets
✅ openssl            # Fonctions cryptographiques
```

### Extensions PHP Recommandées
```bash
🔧 curl               # Client URL library
🔧 gd                 # Traitement d'images
🔧 zip                # Gestion archives ZIP
🔧 intl               # Internationalisation
```

---

## 📥 Installation

### 🪟 Installation Automatique Windows (Recommandée)

```batch
# 1. Extraire l'application
Extraire l'archive dans: C:\caisse-regie\

# 2. Vérifier les prérequis
cd C:\caisse-regie
php install/check_requirements.php

# 3. Installation automatique (Administrateur requis)
install/install.bat

# 4. Démarrer l'application
install/start_server.bat
```

**🎉 L'application sera accessible sur : http://localhost:8080**

### 🐧 Installation Linux/macOS

#### Ubuntu/Debian
```bash
# Installation des prérequis
sudo apt update && sudo apt upgrade -y
sudo apt install php php-cli php-pgsql php-json php-mbstring postgresql postgresql-contrib -y

# Configuration PostgreSQL
sudo -u postgres createuser -s caisse_user
sudo -u postgres createdb caisse_regie -O caisse_user

# Déploiement de l'application
cd /var/www/html
sudo git clone [url-repo] caisse-regie
cd caisse-regie

# Configuration
sudo cp config/config_example.php config/config_local.php
sudo nano config/config_local.php  # Modifier les paramètres BDD

# Initialisation base de données
psql -h localhost -U caisse_user -d caisse_regie -f database/schema.sql

# Permissions
sudo chown -R www-data:www-data .
sudo chmod 755 .

# Démarrage (développement)
php -S localhost:8080
```

#### macOS (Homebrew)
```bash
# Installation
brew install php postgresql
brew services start postgresql

# Configuration similaire à Linux
createuser -s caisse_user
createdb caisse_regie -O caisse_user
# ... suite identique
```

### ⚙️ Configuration Manuelle

#### 1. Configuration Base de Données
```php
// config/config_local.php
<?php
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'caisse_regie');
define('DB_USER', 'caisse_user');
define('DB_PASS', 'votre_mot_de_passe_securise');

define('APP_NAME', 'Gestion de Caisse Régie');
define('APP_DEBUG', false); // true en développement
date_default_timezone_set('Europe/Paris');
?>
```

#### 2. Initialisation PostgreSQL
```sql
-- Création utilisateur et base
CREATE USER caisse_user WITH PASSWORD 'mot_de_passe_securise';
CREATE DATABASE caisse_regie OWNER caisse_user;
GRANT ALL PRIVILEGES ON DATABASE caisse_regie TO caisse_user;

-- Création structure
\c caisse_regie caisse_user
\i database/schema.sql
```

---

## 🚀 Utilisation

### 🏠 Interface Principale

L'application utilise une **interface SPA (Single Page Application)** avec navigation par onglets :

```
┌─────────────────────────────────────────────────────┐
│ 🏦 Gestion de Caisse Régie                         │
├─────┬─────┬─────┬─────┬─────┬─────────────────────┤
│ 📊  │ 💰 │ 🏦  │ 👥  │ 📈  │ ⚙️                   │
│Board│Trans│Cmpts│Tiers│Rapp.│Param                │
└─────┴─────┴─────┴─────┴─────┴─────────────────────┘
```

### 📊 Tableau de Bord

**KPIs en temps réel :**
- 💰 Solde total (tous comptes)
- 📈 Recettes du mois
- 📉 Dépenses du mois  
- 🏦 Nombre de comptes actifs

**Graphiques dynamiques :**
- 📈 Évolution mensuelle (Chart.js Line)
- 🥧 Répartition par catégorie (Chart.js Doughnut)
- 📋 Dernières transactions

### 💰 Gestion des Transactions

#### ➕ Nouvelle Transaction
```
┌─────────────────────────────────┐
│ Type: [Recette ▼] [Dépense]    │
│ Montant: [1,500.00] €          │
│ Description: [Vente services]   │
│ Date: [2024-12-06]             │
│ Compte: [Caisse Principale ▼] │
│ Catégorie: [Services ▼]       │
│ Tiers: [Entreprise ABC ▼]     │
│ N° Pièce: [FAC-001]           │
│ Notes: [Paiement CB]           │
│                                │
│ [Annuler] [💾 Enregistrer]     │
└─────────────────────────────────┘
```

#### 🔄 Virement de Fonds
```
┌─────────────────────────────────┐
│ Compte Source: [Caisse ▼]      │
│ Compte Destination: [Banque ▼] │
│ Montant: [500.00] €            │
│ Description: [Dépôt quotidien] │
│ Date: [2024-12-06]             │
│                                │
│ [Annuler] [🔄 Effectuer]       │
└─────────────────────────────────┘
```

**Le système crée automatiquement :**
1. Transaction de débit (-500€) sur compte source
2. Transaction de crédit (+500€) sur compte destination
3. Liaison entre les deux transactions
4. Mise à jour des soldes en temps réel

### 🏦 Gestion des Comptes

#### Types de Comptes
- **🏦 Caisses** : Argent liquide physique
- **🏛️ Banques** : Comptes bancaires virtuels

#### Informations Affichées
```
┌─────────────────────────────────┐
│ 🏦 Caisse Principale           │
│ ┌─────────────┬─────────────────┤
│ │Solde initial│ Solde actuel    │
│ │ 1,000.00 € │ 1,350.00 € ✅  │
│ └─────────────┴─────────────────┤
│ Mouvements: +350.00 €          │
│ Transactions: 12               │
│ Dernière: 06/12/2024          │
│                               │
│ [✏️ Modifier] [📊 Stats] [🗑️] │
└─────────────────────────────────┘
```

### 👥 Gestion des Tiers

#### Clients et Fournisseurs
- **Code unique** généré automatiquement
- **Historique complet** des transactions
- **Recherche avancée** multi-critères
- **Statistiques** par période

#### Fiche Tiers
```
┌─────────────────────────────────┐
│ Nom: [Entreprise ABC SARL]     │
│ Code: [CABC2401] (auto)        │
│ Type: [Client ▼]               │
│ Contact: [Jean Dupont]         │
│ Téléphone: [01.23.45.67.89]   │
│ Email: [contact@abc.fr]        │
│ Adresse: [123 Rue de la Paix   │
│          75001 Paris]          │
│ Notes: [Client privilégié]     │
│                               │
│ [Annuler] [💾 Enregistrer]     │
└─────────────────────────────────┘
```

### 📈 Rapports et Analyses

#### Types de Rapports
- 📅 **Mensuel/Annuel** : Périodes prédéfinies
- 🗓️ **Période personnalisée** : Dates au choix
- 🏦 **Par compte** : Analyse individuelle
- 🏷️ **Par catégorie** : Répartition des dépenses

#### Exports Disponibles
- 📄 **JSON** : Données structurées
- 📊 **CSV** : Import Excel/LibreOffice
- 🖨️ **HTML** : Impression directe

### ⚙️ Paramètres et Configuration

#### Onglet Général
```
Organisation: [Mon Entreprise SARL]
Devise: [EUR - Euro (€) ▼]
Format Date: [DD/MM/YYYY ▼]
Langue: [Français ▼]

[💾 Enregistrer les Paramètres]
```

#### Gestion des Catégories
- ➕ **Création** avec couleur personnalisée
- ✏️ **Modification** des propriétés
- 🔴 **Désactivation** (si transactions liées)
- 🎨 **Code couleur** pour l'affichage

#### Sauvegarde/Restauration
```
┌─────────────────┬─────────────────┐
│ 💾 Export      │ 📥 Import       │
│                │                 │
│ Télécharge un  │ Restaure depuis │
│ fichier JSON   │ un fichier JSON │
│ avec toutes    │ (remplace tout) │
│ les données    │                 │
│                │                 │
│ [📥 Télécharg.]│ [📁] [📤 Import]│
└─────────────────┴─────────────────┘
```

---

## 🏗️ Architecture

### 📁 Structure du Projet

```
caisse-regie-php/
├── 🏠 index.php                 # Interface principale (SPA)
├── 📚 README.md                 # Documentation (ce fichier)
├── 📖 INSTALL_GUIDE.md         # Guide d'installation détaillé
├── 🔧 .htaccess                 # Configuration Apache sécurisée
│
├── 📡 api/                      # API REST endpoints
│   ├── transactions.php         # CRUD transactions + virements
│   ├── comptes.php             # CRUD comptes bancaires/caisses
│   ├── tiers.php               # CRUD clients/fournisseurs
│   ├── categories.php          # CRUD catégories
│   └── settings.php            # Configuration + export/import
│
├── 🧩 classes/                  # Classes métier PHP
│   ├── Transaction.php         # Logique transactions & virements
│   ├── Compte.php              # Logique comptes & soldes
│   └── Tiers.php               # Logique tiers & recherche
│
├── ⚙️ config/                   # Configuration application
│   ├── database.php            # Connexion PostgreSQL + utilities
│   └── config_example.php      # Template de configuration
│
├── 🗄️ database/                # Scripts PostgreSQL
│   └── schema.sql              # Structure complète + données test
│
├── 💻 install/                  # Scripts d'installation
│   ├── install.bat             # Installation automatique Windows
│   ├── start_server.bat        # Démarrage serveur développement
│   ├── check_requirements.php  # Vérification prérequis système
│   └── create_database.sql     # Création base de données rapide
│
├── 🎨 js/                       # Frontend JavaScript
│   └── main.js                 # Application SPA + Chart.js
│
└── 📝 logs/                     # Logs application (créé auto)
    └── .gitkeep                # Maintien dossier dans Git
```

### 🔄 Flux de Données

```
📱 Frontend (JavaScript SPA)
           ↕ HTTP/JSON
🌐 API REST (PHP)
           ↕ PDO
🧩 Classes Métier (PHP)
           ↕ SQL
🗄️ PostgreSQL Database
```

### 📡 API REST Endpoints

| Méthode | Endpoint | Description | Exemple |
|---------|----------|-------------|---------|
| `GET` | `/api/transactions.php` | Liste transactions | `?page=1&limit=20&type=recette` |
| `POST` | `/api/transactions.php` | Nouvelle transaction | `{type: "recette", montant: 150.00}` |
| `POST` | `/api/transactions.php?action=transfer` | Virement fonds | `{compte_source: 1, compte_destination: 2}` |
| `DELETE` | `/api/transactions.php?id=123` | Supprimer transaction | - |
| `GET` | `/api/comptes.php` | Liste comptes | `?type=caisse` |
| `GET` | `/api/comptes.php?id=1&action=stats` | Stats compte | - |
| `GET` | `/api/tiers.php?action=search` | Recherche tiers | `?q=entreprise&type=client` |
| `GET` | `/api/settings.php?action=export` | Export données | Télécharge JSON |
| `POST` | `/api/settings.php?action=import` | Import données | Restaure JSON |

---

## 🔐 Sécurité

### 🛡️ Mesures de Protection

#### Sécurité Serveur
```apache
# .htaccess - Protection multicouche
✅ Blocage accès dossiers sensibles (/config, /database, /install)
✅ Protection fichiers système (.sql, .bat, .md, .log)
✅ Headers sécurisés (X-Frame-Options, CSP, HSTS)
✅ Protection injection SQL et XSS
✅ Limitation méthodes HTTP autorisées
```

#### Sécurité Application
```php
// Validation côté serveur systématique
✅ PDO Prepared Statements (anti SQL injection)
✅ Validation et sanitization des données
✅ Gestion d'erreurs sécurisée (pas d'exposition)
✅ Logs de sécurité détaillés
✅ Configuration séparée dev/production
```

#### Sécurité Base de Données
```sql
-- PostgreSQL sécurisé
✅ Utilisateur dédié avec permissions minimales
✅ Contraintes et validation au niveau DB
✅ Transactions ACID pour cohérence
✅ Index pour performances et sécurité
```

### 🔒 Configuration Production

#### 1. HTTPS Obligatoire
```apache
# Décommenter dans .htaccess
Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

# Forcer HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

#### 2. Configuration PHP Durcie
```php
// config/config_local.php - Production
define('APP_DEBUG', false);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', '/var/log/php_errors.log');
```

#### 3. PostgreSQL Sécurisé
```sql
-- Permissions minimales
REVOKE ALL ON DATABASE caisse_regie FROM PUBLIC;
GRANT CONNECT ON DATABASE caisse_regie TO caisse_user;

-- Audit et logs
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d ';
```

---

## 📊 API REST

### 🔄 Format des Réponses

#### Succès
```json
{
  "success": true,
  "timestamp": "2024-12-06 15:30:45",
  "message": "Transaction créée avec succès",
  "data": {
    "id": 123,
    "type": "recette",
    "montant": 1500.00,
    "description": "Vente services informatiques"
  }
}
```

#### Erreur
```json
{
  "success": false,
  "timestamp": "2024-12-06 15:30:45",
  "message": "Données invalides",
  "error": "Le montant doit être supérieur à 0"
}
```

### 📋 Exemples d'Utilisation

#### Créer une Transaction
```javascript
// Frontend JavaScript
const response = await fetch('./api/transactions.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'recette',
    montant: 1500.00,
    description: 'Vente services informatiques',
    date: '2024-12-06',
    compte_id: 1,
    categorie_id: 2,
    tiers_id: 5
  })
});

const result = await response.json();
if (result.success) {
  console.log('Transaction créée:', result.data);
}
```

#### Effectuer un Virement
```javascript
const virement = await fetch('./api/transactions.php?action=transfer', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    compte_source: 1,        // ID caisse
    compte_destination: 2,   // ID banque
    montant: 500.00,
    description: 'Dépôt quotidien',
    date: '2024-12-06'
  })
});
```

#### Rechercher des Tiers
```javascript
const clients = await fetch('./api/tiers.php?action=search&q=entreprise&type=client');
const result = await clients.json();
console.log('Clients trouvés:', result.data);
```

---

## 🐛 Résolution de problèmes

### 🔍 Diagnostic Automatique

```bash
# Windows - Vérification complète du système
php install/check_requirements.php

# Ou utiliser le script de diagnostic
install/diagnostic.bat
```

### ⚠️ Problèmes Courants

#### 1. Erreur de Connexion PostgreSQL
```
❌ SYMPTÔME: SQLSTATE[08006] Could not connect to server

🔧 SOLUTIONS:
1. Vérifier que PostgreSQL est démarré
   Windows: net start postgresql-x64-14
   Linux: sudo systemctl start postgresql

2. Tester la connexion manuelle
   psql -h localhost -U caisse_user -d caisse_regie

3. Vérifier pg_hba.conf
   Ajouter: host caisse_regie caisse_user 127.0.0.1/32 md5
```

#### 2. Extensions PHP Manquantes
```
❌ SYMPTÔME: Call to undefined function pg_connect()

🔧 SOLUTIONS:
1. Ubuntu/Debian:
   sudo apt install php-pgsql php-json php-mbstring
   sudo systemctl restart apache2

2. Windows:
   Décommenter dans php.ini:
   extension=pdo_pgsql
   extension=pgsql

3. Vérification:
   php -m | grep pgsql
```

#### 3. Erreur 500 Internal Server Error
```
❌ SYMPTÔME: Page blanche ou erreur 500

🔧 DIAGNOSTIC:
1. Activer les logs d'erreur:
   // config/config_local.php
   define('APP_DEBUG', true);

2. Consulter les logs:
   tail -f logs/php_errors.log

3. Vérifier les permissions:
   chmod 755 . && chmod 777 logs/ config/
```

#### 4. JavaScript ne Fonctionne Pas
```
❌ SYMPTÔME: Interface figée, pas de données

🔧 SOLUTIONS:
1. Ouvrir Console Navigateur (F12)
2. Vérifier erreurs JavaScript
3. Tester APIs manuellement:
   curl -X GET http://localhost:8080/api/transactions.php
4. Vérifier CORS si nécessaire
```

### 📋 Checklist de Vérification

Avant de demander de l'aide :

- [ ] PHP 7.4+ installé avec extensions
- [ ] PostgreSQL démarré et accessible
- [ ] Base de données créée avec permissions
- [ ] Fichier config_local.php configuré
- [ ] Permissions de fichiers correctes
- [ ] Aucune erreur dans les logs

---

## 📞 Support

### 📚 Ressources Documentation

- 📖 **README.md** : Ce fichier - guide complet utilisateur
- 🔧 **INSTALL_GUIDE.md** : Installation détaillée Windows/Linux/macOS  
- 🏗️ **STRUCTURE_PROJET.md** : Architecture technique détaillée
- 💻 **Code Source** : Commenté et documenté inline

### 🛠️ Outils de Diagnostic

```bash
# Vérification prérequis système
php install/check_requirements.php

# Test connexion base de données
psql -h localhost -U caisse_user -d caisse_regie -c "SELECT version();"

# Vérification permissions
ls -la config/ logs/

# Logs en temps réel
tail -f logs/php_errors.log
```

### 🚨 Signalement de Problèmes

Pour signaler un problème, incluez :

1. **Système d'exploitation** et version
2. **Version PHP** : `php --version`
3. **Version PostgreSQL** : `psql --version`
4. **Message d'erreur complet** avec logs
5. **Étapes de reproduction** du problème
6. **Configuration utilisée** (sans mots de passe)

### 📧 Contact et Assistance

- **Documentation** : Consultez d'abord les fichiers .md
- **Logs** : Vérifiez logs/php_errors.log pour les détails
- **Tests** : Utilisez install/check_requirements.php
- **Configuration** : Vérifiez config/config_local.php

---

## 📈 Roadmap et Évolutions

### 🔜 Fonctionnalités Prévues v2.1.0

- 👥 **Multi-utilisateurs** : Gestion des droits et sessions
- 📱 **Application mobile** : API prête pour app native
- 🔔 **Notifications** : Alertes email/SMS configurables
- 🏦 **Intégrations bancaires** : Import automatique relevés
- 📊 **Analytics avancés** : Tableaux de bord prédictifs

### 🛠️ Améliorations Techniques

- 🐳 **Containerisation Docker** : Déploiement simplifié
- ☸️ **Kubernetes** : Orchestration haute disponibilité
- 🧪 **Tests automatisés** : Couverture PHPUnit complète
- 📊 **Monitoring** : Métriques Prometheus/Grafana
- 🔄 **CI/CD** : Pipeline GitHub Actions

### 🌐 Extensions Possibles

- **Multi-devises** : Support devises multiples
- **Multi-langues** : Interface internationalisée
- **Modules métier** : Extensions spécialisées
- **Thèmes** : Interface personnalisable
- **Plugins** : Architecture extensible

---

## 📄 Licence

```
© 2024 - Application de Gestion de Caisse Régie
Tous droits réservés.

Cette application est développée pour un usage professionnel de gestion financière.
La distribution, modification ou utilisation commerciale nécessite une autorisation explicite.

Version: 2.0.0 (PHP/PostgreSQL)
Dernière mise à jour: Décembre 2024
Compatibilité: PHP 7.4+, PostgreSQL 12+
```

---

## 🙏 Remerciements

- **PostgreSQL Team** : Pour la robustesse de la base de données
- **PHP Community** : Pour l'écosystème et les outils
- **Chart.js** : Pour les graphiques interactifs magnifiques
- **Bootstrap** : Pour l'interface responsive moderne
- **Font Awesome** : Pour les icônes professionnelles

---

<div align="center">

**🎉 Merci d'utiliser Gestion de Caisse Régie v2.0.0 ! 🎉**

*Application développée avec ❤️ pour simplifier la gestion financière*

[![PHP](https://img.shields.io/badge/Made%20with-PHP-777BB4.svg)](https://php.net)
[![PostgreSQL](https://img.shields.io/badge/Powered%20by-PostgreSQL-336791.svg)](https://postgresql.org)
[![JavaScript](https://img.shields.io/badge/Frontend-JavaScript-F7DF1E.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

</div>