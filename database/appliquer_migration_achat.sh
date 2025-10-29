#!/bin/bash

# Script pour appliquer la migration des achats
# EXÉCUTEZ CE SCRIPT AVANT D'UTILISER LE FORMULAIRE

echo "🚀 Application de la migration des champs d'achat..."
echo "=================================================="

# Variables de configuration (à adapter)
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="mon_projet" 
DB_USER="postgres"

# Vous pouvez aussi passer les paramètres en arguments
if [ ! -z "$1" ]; then DB_HOST="$1"; fi
if [ ! -z "$2" ]; then DB_PORT="$2"; fi
if [ ! -z "$3" ]; then DB_NAME="$3"; fi
if [ ! -z "$4" ]; then DB_USER="$4"; fi

echo "📊 Configuration :"
echo "  Host: $DB_HOST:$DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Demander le mot de passe
read -s -p "🔑 Mot de passe pour $DB_USER: " DB_PASS
echo ""

# Construire la chaîne de connexion
export PGPASSWORD=$DB_PASS
DB_CONN="postgresql://$DB_USER:$DB_PASS@$DB_HOST:$DB_PORT/$DB_NAME"

# Vérifier la connexion
echo "🔗 Test de connexion..."
if ! psql "$DB_CONN" -c "SELECT version();" > /dev/null 2>&1; then
    echo "❌ Impossible de se connecter. Vérifiez vos paramètres."
    exit 1
fi
echo "✅ Connexion réussie"

# Créer une sauvegarde
echo "💾 Création d'une sauvegarde..."
BACKUP_FILE="backup_achat_$(date +%Y%m%d_%H%M%S).sql"
pg_dump "$DB_CONN" > "$BACKUP_FILE"
echo "✅ Sauvegarde créée: $BACKUP_FILE"

# Appliquer la migration
echo "🔧 Application de la migration..."
if psql "$DB_CONN" -f migration_add_achat_fields.sql; then
    echo "✅ Migration appliquée avec succès"
else
    echo "❌ Erreur lors de la migration. Restauration de la sauvegarde..."
    psql "$DB_CONN" < "$BACKUP_FILE"
    exit 1
fi

# Vérification finale
echo ""
echo "🔍 Vérification des nouveaux champs :"
psql "$DB_CONN" -c "
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'transactions' 
  AND column_name IN ('payment_status', 'payment_date')
ORDER BY column_name;"

echo ""
echo "🎉 Migration terminée avec succès!"
echo "   Vous pouvez maintenant utiliser le formulaire d'ajout d'achat"
echo ""
echo "💾 Sauvegarde disponible: $BACKUP_FILE"

unset PGPASSWORD