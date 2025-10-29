#!/bin/bash

# ============================================================================
# Script de correction automatique pour l'erreur de contrainte bank_status
# ============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================================================"
echo "  CORRECTION DE LA CONTRAINTE bank_status"
echo "============================================================================"
echo -e "${NC}"

# ============================================================================
# Configuration de la connexion PostgreSQL
# ============================================================================

echo -e "${YELLOW}Configuration de la connexion PostgreSQL${NC}"
echo ""

# Demander les informations de connexion
read -p "Nom d'utilisateur PostgreSQL [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Nom de la base de données [gestion_caisse]: " DB_NAME
DB_NAME=${DB_NAME:-gestion_caisse}

read -p "Hôte [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo -e "${BLUE}Paramètres de connexion :${NC}"
echo "  Utilisateur: $DB_USER"
echo "  Base: $DB_NAME"
echo "  Hôte: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# ============================================================================
# Confirmation
# ============================================================================

read -p "Voulez-vous continuer avec ces paramètres ? (o/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[oO]$ ]]; then
    echo -e "${RED}Opération annulée.${NC}"
    exit 1
fi

echo ""

# ============================================================================
# Sauvegarde (optionnelle mais recommandée)
# ============================================================================

echo -e "${YELLOW}⚠️  Il est fortement recommandé de faire une sauvegarde avant toute modification${NC}"
read -p "Voulez-vous créer une sauvegarde ? (O/n): " BACKUP
BACKUP=${BACKUP:-O}

if [[ "$BACKUP" =~ ^[oO]$ ]]; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${BLUE}Création de la sauvegarde: $BACKUP_FILE${NC}"
    
    if pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${GREEN}✅ Sauvegarde créée avec succès!${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la création de la sauvegarde${NC}"
        read -p "Voulez-vous continuer malgré l'erreur ? (o/N): " CONTINUE
        if [[ ! "$CONTINUE" =~ ^[oO]$ ]]; then
            exit 1
        fi
    fi
    echo ""
fi

# ============================================================================
# Exécution du diagnostic (optionnel)
# ============================================================================

echo -e "${YELLOW}Voulez-vous exécuter le diagnostic d'abord ?${NC}"
read -p "(Cela montrera l'état actuel de votre base) (o/N): " DIAG

if [[ "$DIAG" =~ ^[oO]$ ]]; then
    echo -e "${BLUE}Exécution du diagnostic...${NC}"
    echo ""
    
    if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "database/diagnostic.sql" 2>/dev/null; then
        echo ""
        echo -e "${GREEN}✅ Diagnostic terminé${NC}"
    else
        echo -e "${YELLOW}⚠️  Impossible d'exécuter le diagnostic${NC}"
    fi
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
fi

# ============================================================================
# Exécution du script de correction
# ============================================================================

echo ""
echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}  EXÉCUTION DU SCRIPT DE CORRECTION${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

if [ ! -f "database/fix_bank_status_constraint.sql" ]; then
    echo -e "${RED}❌ Erreur: Le fichier database/fix_bank_status_constraint.sql n'existe pas${NC}"
    exit 1
fi

echo -e "${YELLOW}Exécution de la correction...${NC}"
echo ""

if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "database/fix_bank_status_constraint.sql"; then
    echo ""
    echo -e "${GREEN}============================================================================${NC}"
    echo -e "${GREEN}  ✅ CORRECTION APPLIQUÉE AVEC SUCCÈS !${NC}"
    echo -e "${GREEN}============================================================================${NC}"
    echo ""
    echo -e "${GREEN}Les contraintes ont été mises à jour.${NC}"
    echo ""
    echo -e "${BLUE}Prochaines étapes :${NC}"
    echo "  1. Rechargez votre application web (F5)"
    echo "  2. Testez la création d'une nouvelle transaction"
    echo "  3. Sélectionnez un statut bancaire"
    echo "  4. Enregistrez"
    echo ""
    echo -e "${GREEN}L'erreur devrait disparaître ! 🎉${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}============================================================================${NC}"
    echo -e "${RED}  ❌ ERREUR LORS DE L'APPLICATION DE LA CORRECTION${NC}"
    echo -e "${RED}============================================================================${NC}"
    echo ""
    echo -e "${YELLOW}Vérifiez :${NC}"
    echo "  - Que vous avez les droits ALTER TABLE"
    echo "  - Que la base de données est accessible"
    echo "  - Les logs PostgreSQL pour plus de détails"
    echo ""
    
    if [ -f "$BACKUP_FILE" ]; then
        echo -e "${BLUE}Vous pouvez restaurer la sauvegarde avec :${NC}"
        echo "  psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME < $BACKUP_FILE"
        echo ""
    fi
    
    exit 1
fi

# ============================================================================
# Vérification finale (optionnelle)
# ============================================================================

read -p "Voulez-vous vérifier que la correction a bien été appliquée ? (o/N): " VERIFY

if [[ "$VERIFY" =~ ^[oO]$ ]]; then
    echo ""
    echo -e "${BLUE}Vérification des contraintes...${NC}"
    echo ""
    
    psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "
        SELECT 
            conname AS constraint_name,
            pg_get_constraintdef(oid) AS constraint_definition
        FROM pg_constraint
        WHERE conrelid = 'transactions'::regclass
          AND (conname LIKE '%bank_status%' OR conname LIKE '%payment_method%')
        ORDER BY conname;
    "
    
    echo ""
fi

echo -e "${GREEN}Script terminé !${NC}"
echo ""
