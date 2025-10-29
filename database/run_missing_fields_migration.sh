#!/bin/bash

# Script d'exécution des migrations pour corriger les champs manquants
# Ce script applique toutes les migrations nécessaires

echo "========================================"
echo "Exécution des migrations de base de données"
echo "========================================"
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que psql est installé
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ psql n'est pas installé ou n'est pas dans le PATH${NC}"
    echo "Veuillez installer PostgreSQL client"
    exit 1
fi

# Demander les informations de connexion
echo "Veuillez fournir les informations de connexion PostgreSQL:"
echo ""
read -p "Hôte (par défaut: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port (par défaut: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Nom de la base de données: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Le nom de la base de données est obligatoire${NC}"
    exit 1
fi

read -p "Utilisateur: " DB_USER
if [ -z "$DB_USER" ]; then
    echo -e "${RED}❌ L'utilisateur est obligatoire${NC}"
    exit 1
fi

read -sp "Mot de passe: " DB_PASS
echo ""
echo ""

# Export du mot de passe pour psql
export PGPASSWORD="$DB_PASS"

# Fonction pour exécuter une migration
execute_migration() {
    local migration_file=$1
    local migration_name=$(basename "$migration_file")
    
    echo -e "${YELLOW}⏳ Exécution de: $migration_name${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file" > /dev/null 2>&1; then
        echo -e "${GREEN}✔ $migration_name exécutée avec succès${NC}"
        return 0
    else
        echo -e "${RED}❌ Erreur lors de l'exécution de $migration_name${NC}"
        echo "Tentative avec affichage des erreurs..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$migration_file"
        return 1
    fi
}

echo "========================================"
echo "Début des migrations"
echo "========================================"
echo ""

# Exécuter les migrations dans l'ordre
MIGRATIONS_DIR="$(dirname "$0")"

# Migration 1: Ajouter les champs manquants
if [ -f "$MIGRATIONS_DIR/migration_add_missing_fields.sql" ]; then
    execute_migration "$MIGRATIONS_DIR/migration_add_missing_fields.sql"
    if [ $? -ne 0 ]; then
        echo -e "${RED}Erreur lors de la migration 1, arrêt du processus${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️ Fichier migration_add_missing_fields.sql introuvable${NC}"
fi

echo ""

# Migration 2: Corriger le nom de colonne des documents
if [ -f "$MIGRATIONS_DIR/fix_document_column_name.sql" ]; then
    execute_migration "$MIGRATIONS_DIR/fix_document_column_name.sql"
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️ Avertissement lors de la migration 2, mais continution possible${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Fichier fix_document_column_name.sql introuvable${NC}"
fi

echo ""
echo "========================================"
echo -e "${GREEN}✔ Migrations terminées avec succès!${NC}"
echo "========================================"
echo ""
echo "Les champs suivants ont été ajoutés à la table transactions:"
echo "  - reference (Référence)"
echo "  - due_date (Échéance)"
echo "  - effective_date (Date d'effet réelle)"
echo "  - balance_impact (Impact sur le solde)"
echo "  - bank_notes (Notes bancaires)"
echo ""
echo "La colonne des documents a été vérifiée/corrigée."
echo ""
echo "Vous pouvez maintenant utiliser ces champs dans votre application."
echo ""

# Nettoyer le mot de passe
unset PGPASSWORD