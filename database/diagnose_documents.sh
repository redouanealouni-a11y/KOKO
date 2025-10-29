#!/bin/bash

# Script de diagnostic pour les documents

echo "=========================================="
echo "🔍 DIAGNOSTIC DES DOCUMENTS"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

read -p "Hôte (localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port (5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Nom de la base: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Base de données obligatoire${NC}"
    exit 1
fi

read -p "Utilisateur: " DB_USER
if [ -z "$DB_USER" ]; then
    echo -e "${RED}❌ Utilisateur obligatoire${NC}"
    exit 1
fi

read -sp "Mot de passe: " DB_PASS
echo ""
echo ""

export PGPASSWORD="$DB_PASS"

MIGRATIONS_DIR="$(dirname "$0")"

echo -e "${BLUE}=== Vérification de la table transaction_documents ===${NC}"
echo ""

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATIONS_DIR/verify_documents_table.sql"

echo ""
echo -e "${BLUE}=== Vérification du répertoire uploads ===${NC}"
echo ""

UPLOADS_DIR="$MIGRATIONS_DIR/../uploads/documents"
if [ -d "$UPLOADS_DIR" ]; then
    echo -e "${GREEN}✅ Répertoire uploads/documents existe${NC}"
    FILE_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
    echo -e "${GREEN}📁 Nombre de fichiers: $FILE_COUNT${NC}"
else
    echo -e "${RED}❌ Répertoire uploads/documents N'EXISTE PAS${NC}"
    echo -e "${YELLOW}⚠️ Création automatique lors du premier upload${NC}"
fi

echo ""
echo -e "${BLUE}=== Vérification des permissions ===${NC}"
echo ""

if [ -d "$UPLOADS_DIR" ]; then
    PERMS=$(stat -c "%a" "$UPLOADS_DIR" 2>/dev/null || stat -f "%Lp" "$UPLOADS_DIR" 2>/dev/null)
    if [ ! -z "$PERMS" ]; then
        echo -e "${GREEN}Permissions: $PERMS${NC}"
        if [ "$PERMS" -ge "755" ]; then
            echo -e "${GREEN}✅ Permissions correctes${NC}"
        else
            echo -e "${YELLOW}⚠️ Permissions insuffisantes${NC}"
        fi
    fi
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎯 DIAGNOSTIC TERMINÉ${NC}"
echo "=========================================="

unset PGPASSWORD
