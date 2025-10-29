#!/bin/bash

# Script de test rapide après migration
# Vérifie que toutes les migrations ont été appliquées correctement

echo "=========================================="
echo "TEST RAPIDE POST-MIGRATION"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Demander les informations de connexion
read -p "Hôte (défaut: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port (défaut: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Base de données: " DB_NAME
if [ -z "$DB_NAME" ]; then
    echo -e "${RED}❌ Nom de base obligatoire${NC}"
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

echo -e "${BLUE}🔍 Connexion à la base de données...${NC}"
echo ""

# Test de connexion
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Connexion réussie${NC}"
else
    echo -e "${RED}❌ Échec de connexion${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo ""

# Exécuter le script de vérification
SCRIPT_DIR="$(dirname "$0")"

if [ -f "$SCRIPT_DIR/verify_migrations.sql" ]; then
    echo -e "${BLUE}📋 Exécution du script de vérification...${NC}"
    echo ""
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/verify_migrations.sql"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Vérification terminée${NC}"
    else
        echo ""
        echo -e "${RED}❌ Erreur lors de la vérification${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Fichier verify_migrations.sql introuvable${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo -e "${GREEN}TEST TERMINÉ${NC}"
echo "=========================================="
echo ""
echo "Interprétation des résultats:"
echo ""
echo -e "${GREEN}✅ MIGRATION RÉUSSIE${NC} = Tous les champs sont présents"
echo -e "${YELLOW}⚠️  MIGRATION INCOMPLÈTE${NC} = Certains éléments manquent"
echo -e "${RED}❌ MIGRATION ÉCHOUÉE${NC} = Les champs ne sont pas présents"
echo ""
echo "Si le statut est 'MIGRATION RÉUSSIE', vous pouvez:"
echo "  1. Redémarrer votre serveur web"
echo "  2. Vider le cache du navigateur (Ctrl+F5)"
echo "  3. Tester la création/modification de transactions"
echo ""

unset PGPASSWORD