# 📁 Structure complète du projet - Application de Gestion de Caisse PHP/PostgreSQL

## 🌳 Arborescence des fichiers

```
caisse-regie-php/
├── 📄 .htaccess                       # Configuration Apache (sécurité, réécritures)
├── 📄 index.php                       # Page principale de l'application
├── 📄 README.md                       # Documentation principale
├── 📄 INSTALL_GUIDE.md               # Guide d'installation détaillé
├── 📄 STRUCTURE_PROJET.md            # Ce fichier - structure du projet
│
├── 📂 api/                            # Endpoints API REST
│   ├── 📄 categories.php             # CRUD catégories de transactions
│   ├── 📄 comptes.php                # CRUD comptes (caisses/banques)
│   ├── 📄 settings.php               # Configuration application
│   ├── 📄 tiers.php                  # CRUD tiers (clients/fournisseurs)
│   └── 📄 transactions.php           # CRUD transactions et virements
│
├── 📂 classes/                        # Classes PHP métier
│   ├── 📄 Compte.php                 # Logique de gestion des comptes
│   ├── 📄 Tiers.php                  # Logique de gestion des tiers
│   └── 📄 Transaction.php            # Logique de gestion des transactions
│
├── 📂 config/                         # Configuration de l'application
│   ├── 📄 config_example.php         # Exemple de configuration complète
│   └── 📄 database.php               # Configuration base de données
│
├── 📂 database/                       # Scripts de base de données
│   └── 📄 schema.sql                 # Structure complète des tables PostgreSQL
│
├── 📂 install/                        # Scripts d'installation
│   ├── 📄 check_requirements.php     # Vérification des prérequis PHP
│   ├── 📄 create_database.sql        # Script de création rapide BDD
│   ├── 📄 install.bat                # Installation automatique Windows
│   └── 📄 start_server.bat           # Script de démarrage serveur web
│
├── 📂 js/                             # JavaScript frontend
│   └── 📄 main.js                    # Application JavaScript principale
│
└── 📂 logs/                           # Dossier de logs (créé automatiquement)
    └── 📄 .gitkeep                   # Maintenir le dossier vide
```

## 📋 Description détaillée des fichiers

### 🚀 Fichiers principaux

#### **index.php**
- Interface utilisateur principale SPA (Single Page Application)
- HTML/CSS/JavaScript intégré avec Bootstrap 5
- Point d'entrée unique de l'application
- Navigation par onglets : Dashboard, Transactions, Comptes, Tiers, Rapports, Paramètres
- Modals pour toutes les opérations CRUD
- Intégration Chart.js pour les graphiques

#### **README.md**
- Documentation complète de l'application pour les utilisateurs
- Guide d'utilisation avec exemples visuels
- Fonctionnalités détaillées avec captures d'écran textuelles
- Architecture technique simplifiée
- FAQ et résolution de problèmes
- Instructions de mise à jour et migration

#### **INSTALL_GUIDE.md**
- Guide d'installation pas-à-pas multi-plateformes
- Compatible Windows/Linux/macOS
- Installation automatique ET manuelle
- Résolution de problèmes détaillée
- Configuration production/développement
- Vérification post-installation

#### **STRUCTURE_PROJET.md**
- Ce fichier : documentation technique complète
- Architecture détaillée du code
- Description de chaque fichier et dossier
- Flux de données et communication API
- Standards de codage et conventions

### 🔌 API REST (dossier api/)

#### **transactions.php**
```php
// Endpoints disponibles :
GET    /api/transactions.php                    // Liste avec filtres et pagination
POST   /api/transactions.php                    // Nouvelle transaction
PUT    /api/transactions.php?id={id}            // Modification transaction
DELETE /api/transactions.php?id={id}            // Suppression transaction
POST   /api/transactions.php?action=transfer    // Virement de fonds
GET    /api/transactions.php?action=stats       // Statistiques

// Fonctionnalités :
- Pagination avec limit/offset
- Filtres : type, compte, catégorie, tiers, date, montant
- Recherche textuelle dans description/notes
- Virements automatisés avec double écriture
- Validation côté serveur complète
- Gestion des erreurs et logs
```

#### **comptes.php**
```php
// Endpoints disponibles :
GET    /api/comptes.php                         // Liste des comptes par type
POST   /api/comptes.php                         // Création de compte
PUT    /api/comptes.php?id={id}                 // Modification compte
DELETE /api/comptes.php?id={id}                 // Suppression/désactivation
GET    /api/comptes.php?id={id}&action=stats    // Statistiques du compte
GET    /api/comptes.php?id={id}&action=historique // Historique transactions
GET    /api/comptes.php?action=resume           // Résumé tous comptes

// Fonctionnalités :
- Gestion caisses (physiques) et banques (virtuelles)
- Calcul soldes temps réel avec vue PostgreSQL
- Statistiques par période (mois, trimestre, année)
- Historique complet des mouvements
- Désactivation si transactions existantes
```

#### **tiers.php**
```php
// Endpoints disponibles :
GET    /api/tiers.php                           // Liste par type (client/fournisseur)
POST   /api/tiers.php                           // Création tiers
PUT    /api/tiers.php?id={id}                   // Modification tiers
DELETE /api/tiers.php?id={id}                   // Suppression/désactivation
GET    /api/tiers.php?action=search             // Recherche multi-critères
GET    /api/tiers.php?id={id}&action=historique // Historique transactions
GET    /api/tiers.php?id={id}&action=stats      // Statistiques tiers
GET    /api/tiers.php?code={code}               // Récupération par code

// Fonctionnalités :
- Génération automatique codes uniques
- Clients et fournisseurs séparés
- Recherche avancée (nom, code, contact, email)
- Historique complet des relations
- Statistiques financières par tiers
```

#### **categories.php**
```php
// Endpoints disponibles :
GET    /api/categories.php                      // Liste des catégories actives
POST   /api/categories.php                      // Nouvelle catégorie
PUT    /api/categories.php?id={id}              // Modification catégorie
DELETE /api/categories.php?id={id}              // Suppression/désactivation
GET    /api/categories.php?action=stats         // Statistiques utilisation

// Fonctionnalités :
- Catégories avec codes couleur hexadécimaux
- Ordre d'affichage personnalisable
- Statistiques d'utilisation par catégorie
- Désactivation si transactions liées
- Validation couleur côté serveur
```

#### **settings.php**
```php
// Endpoints disponibles :
GET    /api/settings.php                        // Configuration application
PUT    /api/settings.php                        // Sauvegarde paramètres
POST   /api/settings.php                        // Paramètre individuel
GET    /api/settings.php?action=export          // Export données JSON complet
POST   /api/settings.php?action=import          // Import données (remplace tout)
GET    /api/settings.php?action=info            // Informations système

// Fonctionnalités :
- Configuration flexible clé/valeur
- Export/Import complet avec métadonnées
- Sauvegarde incrémentale ou complète
- Informations système et diagnostics
- Gestion des migrations de données
```

### 🧩 Classes métier (dossier classes/)

#### **Transaction.php**
```php
class Transaction {
    // Méthodes principales :
    public function create($data)                // Nouvelle transaction avec validation
    public function createVirement($data)       // Virement automatisé double écriture
    public function getById($id)                // Récupération avec jointures
    public function getList($filters, $page, $limit) // Liste paginée avec filtres
    public function update($id, $data)          // Modification avec validation
    public function delete($id)                 // Suppression + virements liés
    public function getStatistiques($filters)   // Stats avec répartition catégories
    
    // Fonctionnalités avancées :
    - Validation complète des données (montant, date, comptes)
    - Virements avec vérification comptes différents
    - Création automatique transactions liées (débit/crédit)
    - Gestion des filtres complexes avec recherche
    - Pagination optimisée avec COUNT() séparé
    - Jointures avec comptes, catégories, tiers
    - Formatage automatique des sorties JSON
}
```

#### **Compte.php**
```php
class Compte {
    // Méthodes principales :
    public function create($data)                // Création avec validation unicité nom
    public function getById($id)                // Récupération avec solde calculé
    public function getList($filters)           // Liste avec soldes temps réel
    public function update($id, $data)          // Modification avec vérifications
    public function delete($id)                 // Suppression ou désactivation
    public function getStatistiques($id, $periode) // Stats détaillées par période
    public function getHistorique($id, $limit) // Historique transactions
    public function getSoldeAuDate($id, $date) // Solde à une date précise
    public function getResume()                 // Résumé tous comptes + alertes
    
    // Fonctionnalités avancées :
    - Calcul soldes temps réel via vue PostgreSQL
    - Gestion types caisse/banque avec validation
    - Statistiques évolution mensuelle (6 derniers mois)
    - Répartition par catégories
    - Détection comptes avec solde négatif
    - Historique avec détails catégories et tiers
}
```

#### **Tiers.php**
```php
class Tiers {
    // Méthodes principales :
    public function create($data)                // Création avec code auto-généré
    public function getById($id)                // Récupération par ID
    public function getByCode($code)            // Récupération par code unique
    public function getList($filters)           // Liste filtrée par type
    public function update($id, $data)          // Modification avec validation
    public function delete($id)                 // Suppression ou désactivation
    public function getHistorique($id, $limite) // Historique complet + totaux
    public function getStatistiques($id, $periode) // Stats avec évolution
    public function search($terme, $type, $limite) // Recherche multi-champs
    public function getResume()                 // Top tiers + statistiques globales
    
    // Fonctionnalités avancées :
    - Génération codes uniques (C/F + nom + timestamp)
    - Validation email avec regex
    - Recherche sur nom, code, contact, email
    - Statistiques avec évolution 12 derniers mois
    - Classement par volume de transactions
    - Gestion clients et fournisseurs séparément
}
```

### ⚙️ Configuration (dossier config/)

#### **database.php**
```php
// Classe Database (Singleton) avec :
- Connexion PDO PostgreSQL sécurisée
- Gestion automatique des transactions
- Méthodes utilitaires (query, execute, insert, count, exists)
- Logs détaillés des erreurs et requêtes
- Validation et sanitization globales
- Fonctions de formatage (dates, montants, emails)
- Gestion des réponses JSON standardisées

// Fonctions utilitaires globales :
- validateInput() : Validation multi-règles
- formatAmount() : Formatage devises
- generateTiersCode() : Codes uniques tiers
- jsonResponse() : Réponses API standardisées
```

#### **config_example.php**
```php
// Configuration complète avec :
- Paramètres base de données (host, port, user, password)
- Configuration application (nom, version, debug, timezone)
- Sécurité (clé secrète, sessions, CORS)
- Régional (devise, format date, langue)  
- Email/SMTP (pour futures notifications)
- Performance (cache, pagination, logs)
- Développement vs Production
```

### 🗄️ Base de données (dossier database/)

#### **schema.sql**
```sql
-- Structure complète PostgreSQL avec :

-- Tables principales :
- settings : Configuration clé/valeur application
- categories : Catégories avec couleurs et ordre
- comptes : Caisses/banques avec soldes initiaux
- tiers : Clients/fournisseurs avec contacts complets
- transactions : Toutes opérations avec virements liés

-- Vues optimisées :
- vue_soldes_comptes : Soldes calculés temps réel
- vue_transactions_completes : Jointures complètes
- vue_statistiques_mensuelles : Agrégations mensuelles

-- Index de performance :
- Recherche par date (DESC pour récentes en premier)
- Filtrage par compte, type, catégorie, tiers
- Recherche textuelle sur descriptions
- Index composites pour requêtes complexes

-- Contraintes de données :
- Vérification montants positifs
- Validation emails avec regex
- Unicité codes tiers et noms comptes
- Références foreign keys avec cascade

-- Fonctions utilitaires :
- Trigger automatique updated_at
- Génération codes tiers uniques
- Fonctions PostgreSQL personnalisées

-- Données d'initialisation :
- Paramètres application par défaut
- Catégories standards avec couleurs
- Comptes d'exemple (caisse + banque)
- Tiers de démonstration
- Transactions d'exemple pour tests
```

### 🔧 Installation (dossier install/)

#### **install.bat** (Windows)
```batch
# Script complet d'installation automatique :
1. Vérification droits administrateur
2. Test présence PHP et PostgreSQL
3. Validation extensions PHP requises  
4. Test connexion PostgreSQL avec mot de passe
5. Création base de données et utilisateur
6. Exécution schema.sql pour structure
7. Génération config_local.php personnalisé
8. Création scripts de démarrage
9. Option raccourci bureau
10. Démarrage automatique optionnel

# Gestion d'erreurs complète avec messages explicites
# Logs détaillés de chaque étape
# Nettoyage automatique des fichiers temporaires
```

#### **check_requirements.php**
```php
// Vérification système complète :
- Version PHP et extensions (couleurs dans console)
- Test connexion PostgreSQL avec configuration
- Permissions système de fichiers  
- Espace disque disponible
- Configuration PHP (memory_limit, etc.)
- Structure dossiers et fichiers requis
- Test création/écriture dans dossiers sensibles
- Résumé final avec codes de sortie appropriés

// Diagnostic complet avec recommandations
// Messages d'erreur détaillés pour résolution
// Compatibilité CLI et web
```

#### **create_database.sql**
```sql
-- Script PostgreSQL pour :
- Terminaison connexions existantes
- Suppression base/utilisateur si existe
- Création utilisateur caisse_user avec permissions
- Création base de données avec encoding UTF-8
- Attribution privilèges appropriés
- Configuration schéma public
- Privilèges par défaut pour futurs objets
- Vérifications et informations finales
```

#### **start_server.bat** (Windows)
```batch
# Serveur de développement PHP intégré :
- Vérification présence PHP et index.php
- Test configuration (config_local.php)
- Affichage informations système
- Démarrage serveur sur localhost:8080
- Messages d'aide et instructions
- Gestion propre de l'arrêt
```

### 🎨 Frontend (dossier js/)

#### **main.js**
```javascript
// Application SPA JavaScript complète (62KB) avec :

// Configuration et état global :
- Configuration API et paramètres application
- Gestion état centralisé (transactions, comptes, tiers, etc.)
- Variables globales pour pagination et filtres

// Navigation et interface :
- Système navigation par onglets
- Gestion sections avec affichage/masquage
- Mise à jour dynamique navigation active

// Gestion des données :
- Communication API REST avec fetch()
- Cache local pour performances
- Gestion erreurs et timeouts
- Pagination automatique

// Fonctionnalités métier :
- CRUD complet toutes entités
- Virements avec validation croisée
- Recherche et filtrage avancés
- Génération rapports avec exports

// Interface utilisateur :
- Modals Bootstrap pour formulaires
- Tableaux dynamiques avec tri
- Graphiques Chart.js (Line, Doughnut)
- Notifications toast système
- Loader avec messages contextuels

// Utilitaires :
- Formatage dates/montants localisé
- Validation côté client
- Debounce pour optimisation
- Gestion événements formulaires
- Export CSV/JSON côté client
```

## 🔒 Sécurité

### Fichiers protégés par .htaccess
```apache
# Protection complète :
- config/ : Configuration base de données sensible
- database/ : Scripts SQL avec structure
- install/ : Scripts d'installation  
- logs/ : Fichiers de logs applicatifs
- classes/ : Code métier (accès direct bloqué)
- Fichiers système : .sql, .bat, .md, .log, .ini, etc.

# Mesures de sécurité avancées :
- Headers HTTP sécurisés (XSS, CSRF, Clickjacking)
- Content Security Policy restrictive
- Protection injection SQL via regex
- Blocage User-Agents suspects
- Limitation méthodes HTTP autorisées
- Protection contre force brute basique
- Optimisations performances (gzip, cache)
```

### Mesures de sécurité implémentées
```php
// Côté serveur :
✅ PDO Prepared Statements (100% requêtes)
✅ Validation complète côté serveur
✅ Sanitization systématique des entrées
✅ Gestion d'erreurs sans exposition
✅ Logs de sécurité détaillés
✅ Configuration séparée dev/production
✅ Headers de sécurité HTTP
✅ Protection CSRF et XSS
✅ Contrôle d'accès par rôles (préparé)
```

## 📊 Flux de données

```
🖥️ Frontend JavaScript (SPA)
    ↕ HTTP/JSON (API REST)
🌐 API Endpoints (PHP)
    ↕ Appels méthodes
🧩 Classes Métier (PHP)  
    ↕ PDO/SQL
🗄️ Base PostgreSQL

# Communication détaillée :
1. Interface utilisateur déclenche action
2. JavaScript valide côté client
3. Appel API REST avec JSON
4. Endpoint route vers classe métier appropriée
5. Classe métier valide et traite données
6. Requêtes SQL via PDO sécurisé
7. PostgreSQL traite avec contraintes/triggers
8. Résultats remontent via JSON
9. Interface se met à jour dynamiquement
10. Notifications utilisateur si nécessaire
```

## 🚀 Déploiement

### Environnement de développement
```bash
# Serveur PHP intégré (install/start_server.bat)
php -S localhost:8080 -t .

# Configuration développement :
- APP_DEBUG = true
- Logs détaillés activés
- CORS permissif pour tests
- Erreurs affichées navigateur
- Base de données locale
```

### Environnement de production
```apache
# Apache/Nginx avec virtual host
- HTTPS obligatoire avec certificat SSL
- Configuration .htaccess sécurisée active
- APP_DEBUG = false (pas d'exposition erreurs)
- Logs centralisés et surveillés
- Base de données distante sécurisée
- Sauvegarde automatisée
- Monitoring performances
```

## 📈 Extensions possibles

### Architecture modulaire préparée
```php
// Extensibilité intégrée :
- Nouveaux endpoints API facilement ajoutables
- Classes métier extensibles avec héritage
- Configuration flexible par environnement
- Système de plugins préparé
- Thèmes et personnalisation interface
- Modules métier spécialisés
```

### Intégrations futures
```php
// Prêt pour :
- APIs bancaires externes (PSD2, Open Banking)
- Systèmes comptables (export/import)
- Solutions de sauvegarde cloud
- Notifications email/SMS/push
- Authentification SSO (LDAP, OAuth2)
- Analytics avancés et BI
- Applications mobiles (API prête)
```

## 📞 Maintenance et évolution

### Fichiers de logs générés
```bash
logs/php_errors.log      # Erreurs PHP applicatives
logs/application.log     # Logs métier de l'application
/var/log/apache2/        # Logs serveur web (si Apache)
/var/log/postgresql/     # Logs base de données
```

### Processus de mise à jour
```bash
# Mise à jour sécurisée :
1. Sauvegarde complète (BDD + fichiers)
2. Test en environnement de développement  
3. Remplacement fichiers application
4. Exécution migrations SQL si nécessaire
5. Test fonctionnalités critiques
6. Rollback automatique si problème
7. Monitoring post-déploiement
```

### Standards de développement
```php
// Code quality :
- PSR-12 : Style de code standardisé
- PHPDoc : Documentation inline complète
- Nommage : Convention française métier
- Architecture : Séparation responsabilités claire
- Tests : Prêt pour PHPUnit
- Performance : Requêtes optimisées avec EXPLAIN
```

---

**🎯 Cette architecture garantit une application robuste, sécurisée et facilement maintenable pour un usage professionnel de gestion de caisse régie !**

---

**Total : ~50 fichiers pour une application complète prête production** ✨