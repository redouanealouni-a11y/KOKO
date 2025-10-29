# Guide d'exécution des migrations

## Problèmes corrigés

Ces migrations corrigent les problèmes suivants :

1. ✅ **Champs manquants dans la table `transactions`** :
   - `reference` - Référence de la transaction
   - `due_date` - Date d'échéance
   - `effective_date` - Date d'effet réelle sur le compte
   - `balance_impact` - Impact calculé sur le solde
   - `bank_notes` - Notes bancaires spécifiques

2. ✅ **Colonne de date des documents** :
   - Correction du nom de colonne `uploaded_at` → `upload_date`

## 📄 Fichiers créés

- `migration_add_missing_fields.sql` - Ajoute les champs manquants
- `fix_document_column_name.sql` - Corrige le nom de la colonne de date
- `run_missing_fields_migration.sh` - Script d'exécution automatique

## 🚀 Exécution

### Méthode 1 : Script automatique (Recommandé)

```bash
cd Mon-projet-test/database
chmod +x run_missing_fields_migration.sh
./run_missing_fields_migration.sh
```

Le script vous demandera :
- Hôte PostgreSQL (défaut: localhost)
- Port (défaut: 5432)
- Nom de la base de données
- Utilisateur
- Mot de passe

### Méthode 2 : Exécution manuelle

```bash
# 1. Ajouter les champs manquants
psql -h localhost -U votre_utilisateur -d votre_base -f migration_add_missing_fields.sql

# 2. Corriger le nom de colonne des documents
psql -h localhost -U votre_utilisateur -d votre_base -f fix_document_column_name.sql
```

### Méthode 3 : Via pgAdmin

1. Ouvrir pgAdmin
2. Connectez-vous à votre base de données
3. Ouvrir l'outil de requête (Query Tool)
4. Copier-coller le contenu de `migration_add_missing_fields.sql`
5. Exécuter (F5)
6. Répéter avec `fix_document_column_name.sql`

## ✅ Vérification

Après exécution, vérifiez que les colonnes ont été ajoutées :

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'transactions'
AND column_name IN ('reference', 'due_date', 'effective_date', 'balance_impact', 'bank_notes')
ORDER BY column_name;
```

Résultat attendu :
```
   column_name    |     data_type      
------------------+--------------------
 balance_impact   | character varying
 bank_notes       | text
 due_date         | date
 effective_date   | date
 reference        | character varying
```

Vérifier la colonne des documents :

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'transaction_documents'
AND column_name IN ('upload_date', 'uploaded_at');
```

Doit retourner soit `upload_date` soit `uploaded_at` (les deux fonctionnent maintenant).

## 📝 Modifications du code

Les fichiers suivants ont été mis à jour pour gérer ces nouveaux champs :

### Backend (PHP)
- ✅ `classes/Transaction.php`
  - Méthode `insertTransaction()` mise à jour
  - Méthode `update()` mise à jour
  - Méthode `getById()` mise à jour
  - Méthode `getTransactionDocuments()` compatible avec les deux noms de colonne

### Frontend (JavaScript)
- ✅ `js/main.js`
  - Fonction `editTransaction()` mise à jour
  - Fonction `saveTransaction()` mise à jour

### Interface (HTML)
- ✅ `index.php`
  - Champ `transaction-effective-date` ajouté
  - Tous les autres champs déjà présents

## ⚠️ Notes importantes

1. **Sauvegarde recommandée** : Avant d'exécuter les migrations, faites une sauvegarde de votre base :
   ```bash
   pg_dump -h localhost -U votre_utilisateur votre_base > backup_avant_migration.sql
   ```

2. **Données existantes** : Les migrations sont conçues pour ne pas affecter les données existantes. Les nouveaux champs seront NULL pour les transactions existantes.

3. **Compatibilité** : Le code est maintenant compatible avec l'ancien et le nouveau schéma, donc aucune interruption de service n'est nécessaire.

## 🔧 Dépannage

### Erreur : "column already exists"
C'est normal si vous exécutez la migration plusieurs fois. Les migrations utilisent `ADD COLUMN IF NOT EXISTS` pour éviter les erreurs.

### Erreur : "relation transaction_documents does not exist"
Exécutez d'abord la migration `migration_add_new_fields.sql` qui crée cette table.

### Les données ne s'affichent toujours pas
Vérifiez :
1. Que les migrations ont bien été exécutées (`SELECT column_name ...`)
2. Que le cache du navigateur a été vidé (Ctrl+F5)
3. Que les fichiers PHP/JS ont bien été mis à jour

## 🎯 Test rapide

1. Exécuter les migrations
2. Rafraîchir la page de l'application (Ctrl+F5)
3. Créer une nouvelle transaction
4. Remplir les nouveaux champs :
   - Date d'échéance
   - Date d'effet réelle
   - Notes bancaires
5. Sauvegarder
6. Modifier la transaction pour vérifier que les données sont bien chargées

## ❓ Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs PostgreSQL
2. Vérifiez la console du navigateur (F12)
3. Vérifiez les logs PHP de votre serveur

---

**Créé par MiniMax Agent** | Date: 2025-10-22