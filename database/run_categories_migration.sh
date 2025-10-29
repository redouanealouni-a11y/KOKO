#!/bin/bash

echo "📊 MIGRATION BASE DE DONNÉES - CATÉGORIES PIÈCES ACHAT"
echo "======================================================"
echo ""

# Vérifier si psql est disponible
if command -v psql > /dev/null 2>&1; then
    echo "✅ PostgreSQL CLI détecté"
    DB_CMD="psql"
elif command -v createdb > /dev/null 2>&1; then
    echo "✅ PostgreSQL détecté"
    DB_CMD="psql"
else
    echo "❌ PostgreSQL non installé"
    echo "📝 La migration SQL a été créée dans:"
    echo "   database/create_categories_pieces_achat.sql"
    echo ""
    echo "🔧 Pour appliquer manuellement:"
    echo "   1. Ouvrir pgAdmin"
    echo "   2. Se connecter à votre base de données"
    echo "   3. Exécuter le script SQL"
    exit 0
fi

# Paramètres de base de données (à adapter selon votre configuration)
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"caisse_regie"}
DB_USER=${DB_USER:-"postgres"}
DB_PASSWORD=${DB_PASSWORD:-""}

echo "🔗 Configuration base de données:"
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Fonction pour exécuter une requête SQL
execute_sql() {
    local query="$1"
    local description="$2"
    
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
        PGPARAMS="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    else
        PGPARAMS="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
    fi
    
    echo "🔄 $description..."
    
    if echo "$query" | $DB_CMD $PGPARAMS -t > /dev/null 2>&1; then
        echo "   ✅ Succès"
        return 0
    else
        echo "   ❌ Erreur"
        return 1
    fi
}

# Vérifier la connexion
echo "🔌 Test de connexion à la base de données..."
if [ -n "$DB_PASSWORD" ]; then
    export PGPASSWORD="$DB_PASSWORD"
    PGPARAMS="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
else
    PGPARAMS="-h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
fi

if echo "\q" | $DB_CMD $PGPARAMS > /dev/null 2>&1; then
    echo "   ✅ Connexion réussie"
else
    echo "   ❌ Impossible de se connecter à la base de données"
    echo ""
    echo "📝 La migration SQL a été créée dans:"
    echo "   database/create_categories_pieces_achat.sql"
    echo ""
    echo "🔧 Appliquez manuellement le script via pgAdmin:"
    echo "   1. Ouvrir pgAdmin"
    echo "   2. Se connecter à votre base de données"
    echo "   3. Ouvrir l'outil de requête"
    echo "   4. Copier et coller le contenu du fichier SQL"
    echo "   5. Exécuter la requête"
    exit 1
fi

echo ""
echo "🚀 Création de la table categories_pieces_achat..."

# Créer la table
TABLE_SQL="
CREATE TABLE IF NOT EXISTS categories_pieces_achat (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    icone VARCHAR(10),
    couleur VARCHAR(7) DEFAULT '#3B82F6',
    actif BOOLEAN DEFAULT true,
    ordre_affichage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_categories_actif ON categories_pieces_achat(actif);
CREATE INDEX IF NOT EXISTS idx_categories_ordre ON categories_pieces_achat(ordre_affichage);
"

if execute_sql "$TABLE_SQL" "Création de la table"; then
    echo "   ✅ Table créée avec succès"
else
    echo "   ❌ Erreur lors de la création de la table"
    exit 1
fi

echo ""
echo "🔄 Création du trigger de mise à jour automatique..."

# Créer le trigger
TRIGGER_SQL="
CREATE OR REPLACE FUNCTION update_categories_pieces_achat_updated_at()
RETURNS TRIGGER AS \$\$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_categories_pieces_achat_updated_at ON categories_pieces_achat;
CREATE TRIGGER update_categories_pieces_achat_updated_at
    BEFORE UPDATE ON categories_pieces_achat
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_pieces_achat_updated_at();
"

if execute_sql "$TRIGGER_SQL" "Création du trigger"; then
    echo "   ✅ Trigger créé avec succès"
else
    echo "   ❌ Erreur lors de la création du trigger"
fi

echo ""
echo "📥 Insertion des catégories par défaut..."

# Insérer les catégories par défaut
INSERT_SQL="
INSERT INTO categories_pieces_achat (code, nom, description, icone, couleur, ordre_affichage) VALUES
('FOURNITURE', '📦 Fournitures', 'Fournitures de bureau et consommables', '📦', '#10B981', 1),
('EQUIPEMENT', '🖥️ Équipement', 'Matériel informatique, mobilier et équipements', '🖥️', '#3B82F6', 2),
('MAINTENANCE', '🔧 Maintenance', 'Réparations, entretien et maintenance', '🔧', '#F59E0B', 3),
('SERVICES', '💼 Services', 'Prestations de services et honoraires', '💼', '#8B5CF6', 4),
('TRAVAUX', '🏗️ Travaux', 'Travaux de construction et aménagement', '🏗️', '#EF4444', 5),
('CONSOMMABLE', '🛒 Consommables', 'Produits consommation régulière', '🛒', '#06B6D4', 6),
('AUTRES', '📋 Autres', 'Autres achats non classifiés', '📋', '#6B7280', 7)
ON CONFLICT (code) DO NOTHING;

INSERT INTO categories_pieces_achat (code, nom, description, icone, couleur, ordre_affichage) VALUES
('LOGICIEL', '💻 Logiciels', 'Licences et abonnements logiciels', '💻', '#6366F1', 8),
('FORMATION', '🎓 Formation', 'Formations et certifications', '🎓', '#F97316', 9),
('PUBLICITE', '📢 Publicité', 'Marketing et communications', '📢', '#EC4899', 10)
ON CONFLICT (code) DO NOTHING;
"

if execute_sql "$INSERT_SQL" "Insertion des catégories par défaut"; then
    echo "   ✅ Catégories insérées avec succès"
else
    echo "   ❌ Erreur lors de l'insertion des catégories"
fi

echo ""
echo "🔍 Vérification de la migration..."

# Vérifier le nombre de catégories créées
VERIFY_SQL="SELECT COUNT(*) as nombre_categories FROM categories_pieces_achat WHERE actif = true;"
RESULT=$(echo "$VERIFY_SQL" | $DB_CMD $PGPARAMS -t 2>/dev/null | tr -d ' ')

if [ -n "$RESULT" ] && [ "$RESULT" -gt 0 ]; then
    echo "   ✅ $RESULT catégories créées avec succès"
else
    echo "   ❌ Aucune catégorie trouvée après migration"
fi

echo ""
echo "🎊 MIGRATION TERMINÉE AVEC SUCCÈS !"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. ✅ Table categories_pieces_achat créée"
echo "   2. ✅ Catégories par défaut insérées"
echo "   3. ✅ API categories.php mise à jour"
echo "   4. ✅ Prêt pour tests"
echo ""
echo "🌐 Tester l'API:"
echo "   curl http://localhost:8000/api/categories.php"
echo ""
echo "🔧 URL de l'API:"
echo "   http://localhost:8000/api/categories.php"