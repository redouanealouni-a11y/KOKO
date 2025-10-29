#!/bin/bash

# Script pour corriger le type de colonne balance_impact

echo "========================================"
echo "Correction du type de balance_impact"
echo "========================================"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Demander les informations de connexion
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

export PGPASSWORD="$DB_PASS"

echo -e "${YELLOW}⏳ Exécution de la migration...${NC}"
MIGRATIONS_DIR="$(dirname "$0")"

if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATIONS_DIR/fix_balance_impact_type.sql"; then
    echo ""
    echo -e "${GREEN}✔ Migration réussie!${NC}"
    echo ""
    echo "La colonne balance_impact est maintenant de type NUMERIC(15,2)"
    echo "Vous pouvez maintenant enregistrer des montants avec symbole €"
else
    echo ""
    echo -e "${RED}❌ Erreur lors de la migration${NC}"
    exit 1
fi

unset PGPASSWORD
