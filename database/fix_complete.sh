#!/bin/bash

# ============================================================================
# Script de correction complet avec nettoyage des données existantes
# ============================================================================

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}"
echo "============================================================================"
echo "  CORRECTION COMPLÈTE - Contraintes avec nettoyage des données"
echo "============================================================================"
echo -e "${NC}"

# ============================================================================
# Configuration
# ============================================================================

echo -e "${YELLOW}🔧 Configuration de la connexion PostgreSQL${NC}"
echo ""

read -p "Nom d'utilisateur PostgreSQL [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -p "Nom de la base de données [gestion_caisse]: " DB_NAME
DB_NAME=${DB_NAME:-gestion_caisse}

read -p "Hôte [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo -e "${BLUE}Paramètres :${NC}"
echo "  Utilisateur: $DB_USER"
echo "  Base: $DB_NAME"
echo "  Hôte: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

read -p "Continuer avec ces paramètres ? (o/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[oO]$ ]]; then
    echo -e "${RED}Opération annulée.${NC}"
    exit 1
fi

echo ""

# ============================================================================
# Sauvegarde
# ============================================================================

echo -e "${YELLOW}⚠️  Sauvegarde recommandée${NC}"
read -p "Créer une sauvegarde ? (O/n): " BACKUP
BACKUP=${BACKUP:-O}

if [[ "$BACKUP" =~ ^[oO]$ ]]; then
    BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${BLUE}Création de la sauvegarde: $BACKUP_FILE${NC}"
    
    if PGPASSWORD="$DB_PASSWORD" pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
        echo -e "${GREEN}✅ Sauvegarde créée avec succès!${NC}"
    else
        echo -e "${YELLOW}⚠️  Erreur lors de la sauvegarde (peut-être pas de mot de passe requis)${NC}"
        if pg_dump -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
            echo -e "${GREEN}✅ Sauvegarde créée!${NC}"
        else
            echo -e "${RED}❌ Impossible de créer la sauvegarde${NC}"
            read -p "Continuer quand même ? (o/N): " CONTINUE
            if [[ ! "$CONTINUE" =~ ^[oO]$ ]]; then
                exit 1
            fi
        fi
    fi
    echo ""
fi

# ============================================================================
# ÉTAPE 1 : Identification des données invalides
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}ÉTAPE 1/3 : Identification des données invalides${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

read -p "Voulez-vous voir les données actuelles ? (O/n): " SHOW_DATA
SHOW_DATA=${SHOW_DATA:-O}

if [[ "$SHOW_DATA" =~ ^[oO]$ ]]; then
    if [ -f "database/01_identify_invalid_data.sql" ]; then
        psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "database/01_identify_invalid_data.sql" 2>&1 | grep -v "ECHO" || true
    else
        echo -e "${YELLOW}⚠️  Fichier 01_identify_invalid_data.sql non trouvé${NC}"
    fi
    echo ""
    read -p "Appuyez sur Entrée pour continuer..."
fi

echo ""

# ============================================================================
# ÉTAPE 2 : Correction des données invalides
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}ÉTAPE 2/3 : Correction des données invalides${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

echo -e "${YELLOW}⚠️  ATTENTION${NC}"
echo "Ce script va mettre à NULL toutes les valeurs invalides de bank_status et payment_method."
echo ""
read -p "Voulez-vous continuer ? (o/N): " FIX_DATA

if [[ ! "$FIX_DATA" =~ ^[oO]$ ]]; then
    echo -e "${RED}Opération annulée.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Correction en cours...${NC}"
echo ""

if [ -f "database/02_fix_invalid_data.sql" ]; then
    if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "database/02_fix_invalid_data.sql"; then
        echo ""
        echo -e "${GREEN}✅ Données corrigées avec succès!${NC}"
    else
        echo ""
        echo -e "${RED}❌ Erreur lors de la correction des données${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ Fichier 02_fix_invalid_data.sql non trouvé${NC}"
    exit 1
fi

echo ""
read -p "Appuyez sur Entrée pour passer à l'étape 3..."
echo ""

# ============================================================================
# ÉTAPE 3 : Application des contraintes
# ============================================================================

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}ÉTAPE 3/3 : Application des contraintes${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

echo -e "${YELLOW}Application des contraintes...${NC}"
echo ""

if [ -f "database/03_apply_constraints.sql" ]; then
    if psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -f "database/03_apply_constraints.sql"; then
        echo ""
        echo -e "${GREEN}============================================================================${NC}"
        echo -e "${GREEN}✅ CORRECTION TERMINÉE AVEC SUCCÈS !${NC}"
        echo -e "${GREEN}============================================================================${NC}"
        echo ""
        echo -e "${BLUE}🎉 Prochaines étapes :${NC}"
        echo "  1. Rechargez votre application web (F5)"
        echo "  2. Testez la création d'une nouvelle transaction"
        echo "  3. Sélectionnez un statut bancaire"
        echo "  4. Enregistrez"
        echo ""
        echo -e "${GREEN}L'application devrait fonctionner parfaitement maintenant ! 🚀${NC}"
        echo ""
    else
        echo ""
        echo -e "${RED}============================================================================${NC}"
        echo -e "${RED}❌ ERREUR lors de l'application des contraintes${NC}"
        echo -e "${RED}============================================================================${NC}"
        echo ""
        
        if [ -f "$BACKUP_FILE" ]; then
            echo -e "${YELLOW}Vous pouvez restaurer la sauvegarde :${NC}"
            echo "  psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME < $BACKUP_FILE"
        fi
        echo ""
        exit 1
    fi
else
    echo -e "${RED}❌ Fichier 03_apply_constraints.sql non trouvé${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Script terminé !${NC}"
echo ""
