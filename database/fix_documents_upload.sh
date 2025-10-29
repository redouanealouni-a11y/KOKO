#!/bin/bash

# Script tout-en-un pour vérifier et corriger l'upload de documents

echo "=========================================="
echo "🔧 CORRECTION COMPLÈTE - UPLOAD DOCUMENTS"
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
    echo -e "${RED}❌ Base obligatoire${NC}"
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

echo -e "${BLUE}=== ÉTAPE 1 : Vérification de la table transaction_documents ===${NC}"
echo ""

# Vérifier si la table existe
TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_name = 'transaction_documents';
" | tr -d ' ')

if [ "$TABLE_EXISTS" -eq "1" ]; then
    echo -e "${GREEN}✅ Table transaction_documents existe${NC}"
    
    # Afficher la structure
    echo ""
    echo -e "${BLUE}Structure de la table :${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'transaction_documents' 
    ORDER BY ordinal_position;
    "
    
    # Compter les documents
    DOC_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM transaction_documents;" | tr -d ' ')
    echo ""
    echo -e "${GREEN}📄 Nombre de documents dans la base : $DOC_COUNT${NC}"
    
else
    echo -e "${RED}❌ Table transaction_documents N'EXISTE PAS${NC}"
    echo ""
    echo -e "${YELLOW}🔧 Exécution de la migration...${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$MIGRATIONS_DIR/migration_add_new_fields.sql"; then
        echo -e "${GREEN}✅ Table créée avec succès${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la création de la table${NC}"
        unset PGPASSWORD
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}=== ÉTAPE 2 : Vérification du répertoire uploads ===${NC}"
echo ""

UPLOADS_DIR="$MIGRATIONS_DIR/../uploads/documents"
if [ -d "$UPLOADS_DIR" ]; then
    echo -e "${GREEN}✅ Répertoire uploads/documents existe${NC}"
    
    # Compter les fichiers
    FILE_COUNT=$(find "$UPLOADS_DIR" -type f 2>/dev/null | wc -l)
    echo -e "${GREEN}📁 Nombre de fichiers : $FILE_COUNT${NC}"
    
    # Vérifier les permissions
    if [ -w "$UPLOADS_DIR" ]; then
        echo -e "${GREEN}✅ Permissions d'écriture OK${NC}"
    else
        echo -e "${YELLOW}⚠️ Permissions d'écriture manquantes${NC}"
        echo -e "${YELLOW}Exécutez : chmod 755 $UPLOADS_DIR${NC}"
    fi
else
    echo -e "${YELLOW}⚠️ Répertoire uploads/documents n'existe pas${NC}"
    echo -e "${BLUE}Création du répertoire...${NC}"
    mkdir -p "$UPLOADS_DIR"
    chmod 755 "$UPLOADS_DIR"
    echo -e "${GREEN}✅ Répertoire créé${NC}"
fi

echo ""
echo -e "${BLUE}=== ÉTAPE 3 : Test de compatibilité ===${NC}"
echo ""

# Vérifier que uuid_generate_v4 est disponible
UUID_AVAILABLE=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM pg_proc WHERE proname = 'uuid_generate_v4';" | tr -d ' ')

if [ "$UUID_AVAILABLE" -gt "0" ]; then
    echo -e "${GREEN}✅ Extension uuid-ossp disponible${NC}"
else
    echo -e "${RED}❌ Extension uuid-ossp manquante${NC}"
    echo -e "${YELLOW}Exécutez : CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}🎯 DIAGNOSTIC TERMINÉ${NC}"
echo "=========================================="
echo ""
echo -e "${BLUE}Prochaines étapes :${NC}"
echo "1. Rafraîchissez votre navigateur (Ctrl+F5)"
echo "2. Créez une transaction avec un document"
echo "3. Vérifiez la console du navigateur (F12)"
echo ""
echo -e "${GREEN}📚 Documentation : CORRECTION_UPLOAD_DOCUMENTS.md${NC}"
echo ""

unset PGPASSWORD
