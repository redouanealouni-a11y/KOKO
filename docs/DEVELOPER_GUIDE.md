# 📚 GUIDE DÉVELOPPEUR

## Bienvenue !

Ce guide vous aidera à comprendre et contribuer au projet de gestion de caisse.

## 📋 Table des Matières

1. [Configuration de l'Environnement](#configuration-de-lenvironnement)
2. [Structure du Projet](#structure-du-projet)
3. [Conventions de Code](#conventions-de-code)
4. [Workflow de Développement](#workflow-de-développement)
5. [Tests](#tests)
6. [Débogage](#débogage)
7. [Contribuer](#contribuer)

---

## 🛠️ Configuration de l'Environnement

### Prérequis

- PHP 8.0 ou supérieur
- PostgreSQL 12 ou supérieur
- Serveur web (Apache/Nginx) ou serveur PHP intégré
- Git
- Éditeur de code (VS Code recommandé)

### Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-repo/caisse-regie.git
cd caisse-regie

# Copier la configuration
cp config/config_example.php config/config.php

# Éditer avec vos paramètres
nano config/config.php

# Créer la base de données
psql -U postgres -f database/schema.sql

# Démarrer le serveur
php -S localhost:8080
```

### Extensions PHP Requises

```bash
# Vérifier les extensions
php -m | grep -E "pdo|pgsql|mbstring|json"

# Installer si nécessaire (Ubuntu/Debian)
sudo apt-get install php-pdo php-pgsql php-mbstring php-json
```

---

## 📁 Structure du Projet

### Vue d'Ensemble

```
Mon-projet/
├── index.php                 # Point d'entrée HTML
├── api/                      # Backend API REST
├── classes/                  # Modèles PHP
├── config/                   # Configuration
├── includes/                 # Fichiers PHP partagés
├── js-refactored/            # Frontend modulaire
│   ├── core/                # Coeur application
│   ├── services/            # Logique métier JS
│   ├── components/          # Composants UI
│   ├── utils/               # Utilitaires
│   └── main.js              # Point d'entrée JS
├── database/                 # Scripts SQL
└── docs/                     # Documentation
```

### Fichiers Clés

| Fichier | Responsabilité |
|---------|------------------|
| `js-refactored/core/app.js` | Initialisation application |
| `js-refactored/core/api.js` | Client HTTP |
| `js-refactored/core/store.js` | Gestion d'état |
| `api/transactions.php` | API transactions |
| `classes/Transaction.php` | Modèle transactions |
| `config/database.php` | Connexion BDD |

---

## ✏️ Conventions de Code

### JavaScript

```javascript
// ✅ BON - ESDoc comments
/**
 * Create a new transaction
 * @param {Object} data Transaction data
 * @returns {Promise<Object>} Created transaction
 */
async function createTransaction(data) {
    // Use camelCase for variables
    const transactionData = { ...data };
    
    // Use const/let, never var
    const result = await api.post('/transactions.php', transactionData);
    
    return result;
}

// ❌ MAUVAIS
function CreateTransaction(data) {  // PascalCase for functions
    var result = api.post(...);      // var instead of const/let
    return result;                   // No async/await
}
```

**Règles:**
- Utiliser ES6+ (modules, async/await, arrow functions)
- camelCase pour variables et fonctions
- PascalCase pour classes
- UPPER_CASE pour constantes
- Commentaires ESDoc pour les fonctions exportées
- Indentation: 4 espaces

### PHP

```php
<?php
// ✅ BON - PHPDoc comments
/**
 * Create a new transaction
 * 
 * @param array $data Transaction data
 * @return array Created transaction
 * @throws Exception if validation fails
 */
public function createTransaction($data)
{
    // Use camelCase for methods
    $validationResult = $this->validateData($data);
    
    // Use type hints
    if (!$validationResult) {
        throw new Exception("Invalid data");
    }
    
    return $this->insert($data);
}

// ❌ MAUVAIS
function create_transaction($data) {  // snake_case for methods
    $result = $this->insert($data);   // No validation
    return $result;                    // No type hints
}
```

**Règles:**
- PSR-12 coding standard
- camelCase pour méthodes
- PascalCase pour classes
- Type hints obligatoires
- PHPDoc pour toutes les méthodes publiques
- Indentation: 4 espaces
- Accolades sur nouvelle ligne pour classes/méthodes

### SQL

```sql
-- ✅ BON
SELECT 
    t.id,
    t.description,
    t.amount,
    c.name AS account_name
FROM transactions t
INNER JOIN comptes c ON t.account_id = c.id
WHERE t.date >= ?
    AND t.type = ?
ORDER BY t.date DESC
LIMIT ?;

-- ❌ MAUVAIS
select * from transactions where date>='2024-01-01' and type='recette';
```

**Règles:**
- Mots-clés SQL en MAJUSCULES
- Indentation pour lisibilité
- Alias explicites
- Toujours utiliser des prepared statements
- Pas de SELECT *

---

## 💼 Workflow de Développement

### 1. Créer une Branche

```bash
# Feature
git checkout -b feature/nom-fonctionnalite

# Bug fix
git checkout -b fix/nom-bug

# Hot fix
git checkout -b hotfix/nom-urgent
```

### 2. Développer

```bash
# Faire vos modifications
# Tester localement
# Commiter régulièrement

git add .
git commit -m "feat: ajouter filtres avancés transactions"
```

### 3. Convention de Commit

Format: `<type>: <description>`

**Types:**
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage, pas de changement de code
- `refactor`: Refactoring
- `test`: Ajout/modification de tests
- `chore`: Maintenance

**Exemples:**
```bash
git commit -m "feat: ajouter export PDF des rapports"
git commit -m "fix: corriger calcul solde après virement"
git commit -m "docs: mettre à jour guide API"
git commit -m "refactor: extraire logique filtres en service"
```

### 4. Tester

```bash
# Tests manuels
- Tester toutes les fonctionnalités modifiées
- Vérifier dans différents navigateurs
- Tester les cas limites

# Tests automatiques (si disponibles)
phpunit tests/
npm test
```

### 5. Pull Request

```bash
# Pousser la branche
git push origin feature/nom-fonctionnalite

# Créer une PR sur GitHub/GitLab
# Remplir le template:
- Description des changements
- Captures d'écran si UI
- Tests effectués
- Breaking changes
```

---

## 🧪 Tests

### Tests Manuels

**Checklist Frontend:**
- [ ] Interface s'affiche correctement
- [ ] Formulaires valident les données
- [ ] Messages d'erreur affichés
- [ ] Notifications apparaissent
- [ ] Navigation fonctionne
- [ ] Pas d'erreurs console

**Checklist Backend:**
- [ ] API retourne les bonnes données
- [ ] Erreurs gérées correctement
- [ ] Codes HTTP appropriés
- [ ] Pas d'erreurs PHP logs
- [ ] Transactions BDD cohérentes

### Tests Automatiques

```php
// Exemple test PHPUnit
class TransactionTest extends TestCase
{
    public function testCreateTransaction()
    {
        $transaction = new Transaction();
        $data = [
            'type' => 'recette',
            'description' => 'Test',
            'amount' => 100,
            'account_id' => 'uuid-test'
        ];
        
        $result = $transaction->create($data);
        
        $this->assertNotNull($result['id']);
        $this->assertEquals(100, $result['amount']);
    }
}
```

### Test de l'API avec cURL

```bash
# GET transactions
curl http://localhost:8080/api/transactions.php

# POST nouvelle transaction
curl -X POST http://localhost:8080/api/transactions.php \
  -H "Content-Type: application/json" \
  -d '{
    "type": "recette",
    "description": "Test",
    "amount": 100,
    "account_id": "uuid",
    "date": "2024-01-15"
  }'

# DELETE transaction
curl -X DELETE http://localhost:8080/api/transactions.php?id=uuid
```

---

## 🐛 Débogage

### Frontend (JavaScript)

```javascript
// Console logging
console.log('Variable:', myVar);
console.table(arrayData);
console.error('Error:', error);

// Breakpoints
debugger; // Pause l'exécution

// Network inspection
// Ouvrir DevTools > Network pour voir les requêtes API

// State inspection
console.log('Current state:', store.getState());
```

### Backend (PHP)

```php
// Logging
error_log("Debug: " . print_r($variable, true));

// Var dump
var_dump($data);
die(); // Stoppe l'exécution

// Xdebug (si installé)
// Configurer dans php.ini:
zend_extension=xdebug.so
xdebug.mode=debug
xdebug.start_with_request=yes
```

### Base de Données

```sql
-- Voir les transactions récentes
SELECT * FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- Vérifier les soldes
SELECT 
    c.name,
    c.balance,
    COUNT(t.id) as nb_transactions
FROM comptes c
LEFT JOIN transactions t ON t.account_id = c.id
GROUP BY c.id, c.name, c.balance;

-- Logs d'erreurs PostgreSQL
-- Voir /var/log/postgresql/postgresql-XX-main.log
```

### Problèmes Courants

**"API non trouvée"**
```javascript
// Solution: Vérifier le chemin API
console.log('API Base:', api.baseURL);
// Forcer le chemin si nécessaire
api.baseURL = './api';
```

**"Erreur de connexion BDD"**
```php
// Vérifier config/database.php
define('DB_HOST', 'localhost');
define('DB_NAME', 'caisse_regie');
define('DB_USER', 'caisse_user');
define('DB_PASS', 'votre_password');

// Tester la connexion
psql -h localhost -U caisse_user -d caisse_regie
```

**"Soldes incorrects"**
```php
// Recalculer tous les soldes
php scripts/recalculate_balances.php
```

---

## 🤝 Contribuer

### Processus de Contribution

1. **Fork** le dépôt
2. **Créer** une branche pour votre feature
3. **Développer** en suivant les conventions
4. **Tester** soigneusement
5. **Documenter** vos changements
6. **Commiter** avec des messages clairs
7. **Pousser** vers votre fork
8. **Créer** une Pull Request

### Bonnes Pratiques

✅ **À Faire:**
- Lire toute la documentation avant
- Tester localement avant de pousser
- Écrire du code clair et documenté
- Suivre les conventions du projet
- Demander de l'aide si bloqué
- Être respectueux et constructif

❌ **À Éviter:**
- Pousser du code non testé
- Ignorer les conventions
- Commit avec "wip" ou "test"
- Modifier des fichiers non liés
- Copier-coller sans comprendre

### Template Pull Request

```markdown
## Description
Brève description des changements.

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Tests effectués
- [ ] Tests manuels
- [ ] Tests automatiques
- [ ] Tests navigateurs multiples

## Captures d'écran
(Si changements UI)

## Checklist
- [ ] Code suit les conventions
- [ ] Auto-review effectué
- [ ] Documentation mise à jour
- [ ] Pas de warnings/errors
```

---

## 📚 Ressources Utiles

### Documentation
- [Architecture](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [README Principal](../README.md)

### Liens Externes
- [PHP Manual](https://www.php.net/manual/fr/)
- [MDN JavaScript](https://developer.mozilla.org/fr/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [REST API Best Practices](https://restfulapi.net/)

### Outils
- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/)
- [pgAdmin](https://www.pgadmin.org/)
- [Git Documentation](https://git-scm.com/doc)

---

## ❓ Besoin d'Aide ?

- **Issues GitHub:** Pour signaler des bugs
- **Discussions:** Pour poser des questions
- **Documentation:** Lisez d'abord la doc complète
- **Code Review:** Demandez une revue de code

---

**Bon développement ! 🚀**

---

**Dernière mise à jour:** 2025-10-22  
**Auteur:** MiniMax Agent
