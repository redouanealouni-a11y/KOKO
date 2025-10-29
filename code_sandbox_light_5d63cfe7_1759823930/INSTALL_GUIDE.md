# 🔧 Guide d'Installation Complet - Gestion de Caisse Régie PHP/PostgreSQL

## 📋 Table des matières

1. [Prérequis système](#prérequis-système)
2. [Installation sur Windows](#installation-sur-windows)
3. [Installation sur Linux/macOS](#installation-sur-linuxmacos)
4. [Configuration manuelle](#configuration-manuelle)
5. [Vérification de l'installation](#vérification-de-linstallation)
6. [Résolution de problèmes](#résolution-de-problèmes)

---

## 🖥️ Prérequis système

### Logiciels requis

| Composant | Version minimale | Version recommandée |
|-----------|------------------|---------------------|
| PHP | 7.4.0 | 8.0+ |
| PostgreSQL | 12.0 | 14+ |
| Mémoire RAM | 2 GB | 4 GB+ |
| Espace disque | 100 MB | 500 MB+ |

### Extensions PHP obligatoires

- ✅ `pdo` - PHP Data Objects
- ✅ `pdo_pgsql` - PDO PostgreSQL driver
- ✅ `pgsql` - PostgreSQL functions
- ✅ `json` - JSON support
- ✅ `mbstring` - Multi-byte string functions
- ✅ `openssl` - Cryptographic functions

### Extensions PHP recommandées

- 🔧 `curl` - Client URL library
- 🔧 `gd` - Image processing
- 🔧 `zip` - ZIP archive handling
- 🔧 `intl` - Internationalization functions

---

## 🪟 Installation sur Windows

### Méthode automatique (Recommandée)

#### Étape 1 : Préparation

1. **Télécharger l'application**
   ```
   Extraire l'archive dans : C:\caisse-regie\
   ```

2. **Ouvrir PowerShell en tant qu'administrateur**
   ```
   Clic droit sur le menu Démarrer > Windows PowerShell (Admin)
   ```

#### Étape 2 : Vérification automatique

```bash
cd C:\caisse-regie
php install/check_requirements.php
```

**Sortie attendue :**
```
✓ TOUS LES PRÉREQUIS SONT SATISFAITS !
Vous pouvez procéder à l'installation.
```

#### Étape 3 : Installation automatique

```bash
install/install.bat
```

Le script va :
- ✅ Vérifier PHP et PostgreSQL
- ✅ Créer la base de données
- ✅ Configurer l'application
- ✅ Générer les scripts de démarrage

#### Étape 4 : Démarrage

```bash
# Démarrer le serveur web
install/start_server.bat
```

**Accès à l'application :** http://localhost:8080

### Installation manuelle des prérequis

#### PostgreSQL sur Windows

1. **Téléchargement**
   - Site : https://www.postgresql.org/download/windows/
   - Version recommandée : PostgreSQL 14+

2. **Installation**
   ```
   - Exécuter l'installateur
   - Port par défaut : 5432
   - Mot de passe : Noter le mot de passe postgres
   - Locale : French, France
   ```

3. **Vérification**
   ```bash
   psql --version
   ```

#### PHP sur Windows

1. **Téléchargement**
   - Site : https://windows.php.net/download/
   - Version : Thread Safe x64

2. **Installation**
   ```
   - Extraire dans C:\php\
   - Ajouter C:\php\ au PATH Windows
   - Copier php.ini-development vers php.ini
   ```

3. **Configuration PHP (php.ini)**
   ```ini
   ; Décommenter ces lignes
   extension=pdo_pgsql
   extension=pgsql
   extension=mbstring
   extension=openssl
   extension=curl
   
   ; Configurer les chemins
   extension_dir = "ext"
   
   ; Timezone
   date.timezone = "Europe/Paris"
   ```

4. **Vérification**
   ```bash
   php --version
   php -m | findstr pgsql
   ```

---

## 🐧 Installation sur Linux/macOS

### Ubuntu/Debian

#### Étape 1 : Installation des prérequis

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Installation PHP et extensions
sudo apt install php php-cli php-pgsql php-json php-mbstring php-curl php-gd php-zip -y

# Démarrage des services
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### Étape 2 : Configuration PostgreSQL

```bash
# Connexion en tant que postgres
sudo -u postgres psql

# Dans psql, exécuter :
CREATE USER caisse_user WITH PASSWORD 'votre_mot_de_passe';
CREATE DATABASE caisse_regie OWNER caisse_user;
GRANT ALL PRIVILEGES ON DATABASE caisse_regie TO caisse_user;
\q
```

#### Étape 3 : Déploiement de l'application

```bash
# Télécharger l'application
cd /var/www/html
sudo git clone [url-de-l-application] caisse-regie

# Permissions
sudo chown -R www-data:www-data caisse-regie/
sudo chmod 755 caisse-regie/

# Configuration
cd caisse-regie/
sudo cp config/config_example.php config/config_local.php
sudo nano config/config_local.php
```

#### Étape 4 : Initialisation de la base

```bash
# Création de la structure
psql -h localhost -U caisse_user -d caisse_regie -f database/schema.sql
```

### macOS (avec Homebrew)

#### Étape 1 : Installation des prérequis

```bash
# Installation Homebrew si nécessaire
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installation PostgreSQL
brew install postgresql
brew services start postgresql

# Installation PHP
brew install php
brew install php-pgsql
```

#### Étape 2 : Configuration

```bash
# Créer l'utilisateur PostgreSQL
createuser -s postgres

# Suivre les mêmes étapes que Linux pour la base de données
```

---

## ⚙️ Configuration manuelle

### Fichier de configuration principal

Créer `config/config_local.php` :

```php
<?php
// Configuration base de données
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'caisse_regie');
define('DB_USER', 'caisse_user');
define('DB_PASS', 'votre_mot_de_passe_securise');

// Configuration application
define('APP_NAME', 'Gestion de Caisse Régie');
define('APP_DEBUG', false); // true en développement
date_default_timezone_set('Europe/Paris');
?>
```

### Configuration Apache (Production)

Créer `/etc/apache2/sites-available/caisse-regie.conf` :

```apache
<VirtualHost *:80>
    ServerName caisse-regie.local
    DocumentRoot /var/www/html/caisse-regie
    
    <Directory /var/www/html/caisse-regie>
        AllowOverride All
        Require all granted
        DirectoryIndex index.php
    </Directory>
    
    # Protection des dossiers sensibles
    <Directory /var/www/html/caisse-regie/config>
        Deny from all
    </Directory>
    
    <Directory /var/www/html/caisse-regie/database>
        Deny from all
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/caisse-regie_error.log
    CustomLog ${APACHE_LOG_DIR}/caisse-regie_access.log combined
</VirtualHost>
```

Activer le site :
```bash
sudo a2ensite caisse-regie.conf
sudo systemctl reload apache2
```

### Configuration Nginx (Production)

Créer `/etc/nginx/sites-available/caisse-regie` :

```nginx
server {
    listen 80;
    server_name caisse-regie.local;
    root /var/www/html/caisse-regie;
    index index.php index.html;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.0-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
    
    # Sécurité
    location ~ /\.(ht|git) {
        deny all;
    }
    
    location ~ /(config|database|install)/ {
        deny all;
    }
}
```

---

## ✅ Vérification de l'installation

### Tests automatiques

```bash
# Test des prérequis
php install/check_requirements.php

# Test de connexion base de données
php -r "
try {
    \$pdo = new PDO('pgsql:host=localhost;dbname=caisse_regie', 'caisse_user', 'mot_de_passe');
    echo 'Connexion BDD : OK\n';
} catch (Exception \$e) {
    echo 'Erreur BDD : ' . \$e->getMessage() . '\n';
}
"
```

### Tests manuels

#### 1. Interface web
- ✅ Accès à http://localhost:8080
- ✅ Affichage du tableau de bord
- ✅ Navigation entre les sections

#### 2. Fonctionnalités de base
- ✅ Création d'une transaction
- ✅ Ajout d'un compte
- ✅ Création d'un tiers
- ✅ Génération d'un rapport

#### 3. Base de données
```sql
-- Vérifier les tables
\c caisse_regie caisse_user
\dt

-- Tester les données
SELECT COUNT(*) FROM transactions;
SELECT COUNT(*) FROM comptes;
SELECT COUNT(*) FROM categories;
```

### Indicateurs de succès

✅ **Installation réussie si :**
- Interface accessible sans erreur
- Transactions enregistrées en base
- Graphiques affichés correctement
- Aucune erreur dans les logs

---

## 🐛 Résolution de problèmes

### Problème 1 : Erreur de connexion PostgreSQL

**Symptôme :**
```
SQLSTATE[08006] Could not connect to server
```

**Solutions :**

1. **Vérifier que PostgreSQL fonctionne**
   ```bash
   # Windows
   net start postgresql-x64-14
   
   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   ```

2. **Vérifier la configuration**
   ```bash
   # Tester la connexion manuelle
   psql -h localhost -U caisse_user -d caisse_regie
   ```

3. **Vérifier pg_hba.conf**
   ```
   # Localisation du fichier
   sudo -u postgres psql -c "SHOW hba_file;"
   
   # Ajouter cette ligne si nécessaire
   local   caisse_regie    caisse_user                     md5
   host    caisse_regie    caisse_user     127.0.0.1/32   md5
   ```

### Problème 2 : Extensions PHP manquantes

**Symptôme :**
```
Call to undefined function pg_connect()
```

**Solutions :**

1. **Ubuntu/Debian**
   ```bash
   sudo apt install php-pgsql php-json php-mbstring
   sudo systemctl restart apache2
   ```

2. **Windows**
   ```ini
   ; Dans php.ini, décommenter :
   extension=pdo_pgsql
   extension=pgsql
   ```

3. **Vérification**
   ```bash
   php -m | grep pgsql
   ```

### Problème 3 : Erreur 500 Internal Server Error

**Diagnostic :**

1. **Activer les logs d'erreur**
   ```php
   // config/config_local.php
   define('APP_DEBUG', true);
   ini_set('display_errors', 1);
   ```

2. **Consulter les logs**
   ```bash
   # Apache
   tail -f /var/log/apache2/error.log
   
   # Nginx
   tail -f /var/log/nginx/error.log
   
   # PHP
   tail -f logs/php_errors.log
   ```

### Problème 4 : Permissions de fichiers

**Symptôme :**
```
Permission denied
```

**Solutions :**

1. **Linux/macOS**
   ```bash
   sudo chown -R www-data:www-data /var/www/html/caisse-regie/
   sudo chmod -R 755 /var/www/html/caisse-regie/
   sudo chmod -R 777 logs/ config/
   ```

2. **Windows**
   ```
   Clic droit sur le dossier > Propriétés > Sécurité
   Donner contrôle total à l'utilisateur IIS_IUSRS
   ```

### Problème 5 : Base de données vide

**Solutions :**

1. **Réexécuter le schéma**
   ```bash
   psql -h localhost -U caisse_user -d caisse_regie -f database/schema.sql
   ```

2. **Vérifier les tables créées**
   ```sql
   \dt
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   ```

3. **Recréer complètement**
   ```bash
   # Supprimer et recréer
   dropdb -h localhost -U postgres caisse_regie
   createdb -h localhost -U postgres -O caisse_user caisse_regie
   psql -h localhost -U caisse_user -d caisse_regie -f database/schema.sql
   ```

### Problème 6 : JavaScript ne fonctionne pas

**Diagnostic :**

1. **Console navigateur (F12)**
   ```javascript
   // Erreurs courantes :
   - 404 sur les API calls
   - CORS policy errors
   - Syntax errors
   ```

2. **Vérifier les APIs**
   ```bash
   curl -X GET http://localhost:8080/api/transactions.php
   ```

**Solutions :**

1. **Vérifier les URLs des APIs**
   ```javascript
   // js/main.js - vérifier API_BASE
   const API_BASE = './api';
   ```

2. **Headers CORS manquants**
   ```php
   // Ajouter dans chaque fichier API
   header('Access-Control-Allow-Origin: *');
   ```

---

## 📞 Support d'installation

### Checklist finale

Avant de demander de l'aide, vérifier :

- [ ] PHP version 7.4+ installé
- [ ] Extensions PHP pgsql activées
- [ ] PostgreSQL démarré et accessible
- [ ] Base de données créée avec les bonnes permissions
- [ ] Fichier config/config_local.php configuré
- [ ] Permissions de fichiers correctes
- [ ] Aucune erreur dans les logs

### Informations à fournir

En cas de problème, inclure :

1. **Système d'exploitation** et version
2. **Version PHP** : `php --version`
3. **Version PostgreSQL** : `psql --version`
4. **Extensions PHP** : `php -m`
5. **Messages d'erreur** complets
6. **Contenu des logs** d'erreur
7. **Configuration** (sans mots de passe)

### Commandes de diagnostic

```bash
# Informations système
php --version
psql --version
php -m | grep -E "(pdo|pgsql|json|mbstring)"

# Test de connexion
php -r "echo 'PHP OK\n'; \$pdo = new PDO('pgsql:host=localhost;dbname=caisse_regie', 'caisse_user', 'password'); echo 'DB OK\n';"

# Permissions
ls -la config/ logs/

# Processus
ps aux | grep -E "(php|postgres|apache|nginx)"
```

---

**🎉 Une fois l'installation terminée avec succès, consultez le [README.md](README.md) pour apprendre à utiliser l'application !**