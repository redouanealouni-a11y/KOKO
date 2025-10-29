#!/bin/bash

# Script pour ajouter le champ general_comments à la table transactions

echo "=== Ajout du champ general_comments ==="

# Configuration de la base de données
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="gestion_db"
DB_USER="postgres"
DB_PASSWORD="postgres"

# Chemin vers le fichier SQL
SQL_FILE="$(dirname "$0")/add_general_comments.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Erreur: Le fichier $SQL_FILE n'existe pas"
    exit 1
fi

echo "📄 Fichier SQL trouvé: $SQL_FILE"
echo "🔄 Exécution de la migration..."

# Exécuter le fichier SQL
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Migration exécutée avec succès !"
    echo "🎉 Le champ 'general_comments' a été ajouté à la table transactions"
else
    echo "❌ Erreur lors de l'exécution de la migration"
    exit 1
fi
