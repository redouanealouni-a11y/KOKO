#!/bin/bash

# Script pour exécuter la migration des champs d'achat
# Date: 2025-10-25
# Description: Ajout des champs payment_status et payment_date pour les achats

echo "🚀 Exécution de la migration des champs d'achat..."
echo "==============================================="

# Vérifier si PostgreSQL est disponible
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL n'est pas installé ou pas dans le PATH"
    exit 1
fi

# Demander les paramètres de connexion
echo "📝 Configuration de la base de données:"
read -p "Host (défaut: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port (défaut: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Nom de la base (défaut: mon_projet): " DB_NAME
DB_NAME=${DB_NAME:-mon_projet}

read -p "Utilisateur (défaut: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

# Mot de passe (sans affichage)
read -s -p "Mot de passe: " DB_PASS
echo ""

# Construire la chaîne de connexion
export PGPASSWORD=$DB_PASS
DB_CONN="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"

echo "🔗 Connexion à la base de données..."
echo "Host: $DB_HOST:$DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Vérifier la connexion
if ! psql "$DB_CONN" -c "SELECT version();" > /dev/null 2>&1; then
    echo "❌ Impossible de se connecter à la base de données"
    echo "Vérifiez vos paramètres de connexion"
    exit 1
fi

echo "✅ Connexion établie avec succès"
echo ""

# Créer une sauvegarde avant la migration
echo "💾 Création d'une sauvegarde..."
BACKUP_FILE="backup_avant_migration_achat_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DB_CONN" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Sauvegarde créée: $BACKUP_FILE"
else
    echo "❌ Erreur lors de la création de la sauvegarde"
    exit 1
fi

echo ""

# Exécuter la migration
echo "🔧 Exécution de la migration..."
if psql "$DB_CONN" -f migration_add_achat_fields.sql; then
    echo "✅ Migration exécutée avec succès"
else
    echo "❌ Erreur lors de l'exécution de la migration"
    echo "🔄 Restauration de la sauvegarde..."
    psql "$DB_CONN" < "$BACKUP_FILE"
    exit 1
fi

echo ""

# Vérifier les nouveaux champs
echo "🔍 Vérification des nouveaux champs..."
psql "$DB_CONN" -c "
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name IN ('payment_status', 'payment_date')
ORDER BY column_name;
"

echo ""

# Afficher les contraintes
echo "📋 Vérification des contraintes..."
psql "$DB_CONN" -c "
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'transactions'::regclass 
  AND conname LIKE '%payment%';
"

echo ""

# Statistiques de fin
echo "📊 Statistiques finales:"
psql "$DB_CONN" -c "
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN payment_status IS NOT NULL THEN 1 END) as transactions_avec_statut,
    COUNT(CASE WHEN payment_date IS NOT NULL THEN 1 END) as transactions_avec_date_paiement
FROM transactions;
"

echo ""
echo "🎉 Migration terminée avec succès!"
echo "==============================================="
echo "📝 Nouveaux champs ajoutés:"
echo "   - payment_status: Statut du paiement (À payer, Partiellement payé, Payé, En retard)"
echo "   - payment_date: Date de paiement réelle"
echo ""
echo "💾 Sauvegarde disponible: $BACKUP_FILE"
echo "🔗 Vous pouvez maintenant utiliser la fonctionnalité d'ajout d'achat"

# Nettoyer les variables d'environnement
unset PGPASSWORD

echo ""
echo "✅ Migration terminée!"