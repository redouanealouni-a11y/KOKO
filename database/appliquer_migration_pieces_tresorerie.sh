#!/bin/bash

# Script d'application de la migration pieces_tresorerie
# Auteur: MiniMax Agent
# Date: 2025-10-26

echo "🚀 Application de la migration pieces_tresorerie"
echo "=============================================="

# Configuration de la base de données
DB_NAME="${DB_NAME:-comptabilite}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "📋 Configuration:"
echo "   Base de données: $DB_NAME"
echo "   Utilisateur: $DB_USER"
echo "   Hôte: $DB_HOST"
echo "   Port: $DB_PORT"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Vérifier si PostgreSQL est accessible
print_step "Vérification de la connexion PostgreSQL..."
if ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1; then
    print_error "Impossible de se connecter à PostgreSQL"
    exit 1
fi
print_status "✅ Connexion PostgreSQL OK"

# Vérifier si la base de données existe
print_step "Vérification de l'existence de la base de données..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
    print_error "La base de données '$DB_NAME' n'existe pas"
    exit 1
fi
print_status "✅ Base de données '$DB_NAME' trouvée"

# Créer une sauvegarde avant la migration
print_step "Création d'une sauvegarde..."
BACKUP_FILE="backup_pieces_tresorerie_$(date +%Y%m%d_%H%M%S).sql"
if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    print_status "✅ Sauvegarde créée: $BACKUP_FILE"
else
    print_error "Échec de la création de la sauvegarde"
    exit 1
fi

# Vérifier si la table pieces_tresorerie existe déjà
print_step "Vérification de l'existence de la table pieces_tresorerie..."
TABLE_EXISTS=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pieces_tresorerie');" | tr -d ' ')

if [ "$TABLE_EXISTS" = "t" ]; then
    print_warning "⚠️  La table pieces_tresorerie existe déjà"
    read -p "Voulez-vous continuer ? Cela pourrait modifier la structure existante. (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Migration annulée par l'utilisateur"
        exit 0
    fi
else
    print_status "✅ Table pieces_tresorerie n'existe pas encore"
fi

# Appliquer la migration
print_step "Application de la migration..."
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "migration_create_pieces_tresorerie.sql"; then
    print_status "✅ Migration appliquée avec succès"
else
    print_error "Échec de l'application de la migration"
    exit 1
fi

# Vérifier la structure de la table
print_step "Vérification de la structure de la table..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\d pieces_tresorerie"

# Vérifier les index
print_step "Vérification des index créés..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'pieces_tresorerie' 
ORDER BY indexname;
"

# Test d'insertion d'un enregistrement de test
print_step "Test d'insertion..."
TEST_INSERT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
INSERT INTO pieces_tresorerie (CleTypeDocument, Label, MontantTTC, Note) 
VALUES ('facture_achat', 'Test d''insertion migration', 100.00, 'Test de validation de la migration')
RETURNING CleDocument, Label, MontantTTC;
")

if [ $? -eq 0 ]; then
    print_status "✅ Test d'insertion réussi"
    echo "$TEST_INSERT"
    
    # Supprimer l'enregistrement de test
    print_step "Nettoyage de l'enregistrement de test..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "
        DELETE FROM pieces_tresorerie WHERE Label = 'Test d''insertion migration';
    " > /dev/null
    print_status "✅ Nettoyage terminé"
else
    print_error "Échec du test d'insertion"
fi

echo ""
print_status "🎉 Migration pieces_tresorerie terminée avec succès !"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Modifier l'API pour utiliser la nouvelle table"
echo "   2. Adapter les formulaires HTML"
echo "   3. Tester le système complet"
echo ""
echo "💾 Sauvegarde disponible: $BACKUP_FILE"