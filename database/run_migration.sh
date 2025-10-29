#!/bin/bash

# Script de migration pour ajouter les nouveaux champs à la base de données
# Ce script exécute la migration SQL et crée les répertoires nécessaires

echo "=== Migration de la base de données ==="
echo ""

# Lire les informations de connexion depuis config.php
if [ ! -f "config/config.php" ]; then
    echo "Erreur: Le fichier config/config.php n'existe pas."
    echo "Veuillez créer ce fichier avec vos informations de connexion."
    exit 1
fi

# Extraire les informations de connexion
DB_HOST=$(grep "define('DB_HOST'" config/config.php | cut -d "'" -f 4)
DB_NAME=$(grep "define('DB_NAME'" config/config.php | cut -d "'" -f 4)
DB_USER=$(grep "define('DB_USER'" config/config.php | cut -d "'" -f 4)
DB_PASS=$(grep "define('DB_PASS'" config/config.php | cut -d "'" -f 4)

echo "Connexion à la base de données: $DB_NAME sur $DB_HOST"
echo ""

# Exécuter la migration
echo "Exécution de la migration SQL..."
export PGPASSWORD="$DB_PASS"
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f database/migration_add_new_fields.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ Migration SQL terminée avec succès!"
else
    echo ""
    echo "✗ Erreur lors de la migration SQL"
    exit 1
fi

# Créer le répertoire uploads s'il n'existe pas
echo ""
echo "Création du répertoire pour les documents..."
mkdir -p uploads/documents
chmod 755 uploads
chmod 755 uploads/documents

if [ $? -eq 0 ]; then
    echo "✓ Répertoire uploads/documents créé avec succès!"
else
    echo "✗ Erreur lors de la création du répertoire"
    exit 1
fi

echo ""
echo "=== Migration terminée avec succès! ==="
echo ""
echo "Les nouveaux champs suivants ont été ajoutés:"
echo "  - payment_method (Méthode de paiement)"
echo "  - bank_status (Statut bancaire)"
echo "  - value_date (Date de valeur)"
echo ""
echo "Une nouvelle table a été créée:"
echo "  - transaction_documents (Documents liés aux transactions)"
echo ""
echo "Votre application est maintenant prête à utiliser ces nouvelles fonctionnalités!"
echo ""
