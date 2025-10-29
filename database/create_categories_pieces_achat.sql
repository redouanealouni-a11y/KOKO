-- =============================================
-- TABLE: categories_pieces_achat
-- Description: Table pour stocker les catégories de pièces d'achat
-- =============================================

-- Créer la table catégories pièces achat
CREATE TABLE IF NOT EXISTS categories_pieces_achat (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    icone VARCHAR(10), -- Emojis pour l'interface
    couleur VARCHAR(7) DEFAULT '#3B82F6', -- Code couleur hexadécimal
    actif BOOLEAN DEFAULT true,
    ordre_affichage INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_categories_actif ON categories_pieces_achat(actif);
CREATE INDEX IF NOT EXISTS idx_categories_ordre ON categories_pieces_achat(ordre_affichage);

-- Insérer les catégories par défaut
INSERT INTO categories_pieces_achat (code, nom, description, icone, couleur, ordre_affichage) VALUES
('FOURNITURE', '📦 Fournitures', 'Fournitures de bureau et consommables', '#10B981', '1'),
('EQUIPEMENT', '🖥️ Équipement', 'Matériel informatique, mobilier et équipements', '#3B82F6', '2'),
('MAINTENANCE', '🔧 Maintenance', 'Réparations, entretien et maintenance', '#F59E0B', '3'),
('SERVICES', '💼 Services', 'Prestations de services et honoraires', '#8B5CF6', '4'),
('TRAVAUX', '🏗️ Travaux', 'Travaux de construction et aménagement', '#EF4444', '5'),
('CONSOMMABLE', '🛒 Consommables', 'Produits consommation régulière', '#06B6D4', '6'),
('AUTRES', '📋 Autres', 'Autres achats non classifiés', '#6B7280', '7')
ON CONFLICT (code) DO NOTHING;

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_categories_pieces_achat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at automatiquement
DROP TRIGGER IF EXISTS update_categories_pieces_achat_updated_at ON categories_pieces_achat;
CREATE TRIGGER update_categories_pieces_achat_updated_at
    BEFORE UPDATE ON categories_pieces_achat
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_pieces_achat_updated_at();

-- Vue pour l'API - catégorie active triées par ordre
CREATE OR REPLACE VIEW categories_pieces_achat_view AS
SELECT 
    id,
    code,
    nom,
    description,
    icone,
    couleur,
    ordre_affichage,
    actif
FROM categories_pieces_achat
WHERE actif = true
ORDER BY ordre_affichage ASC, nom ASC;

-- =============================================
-- DONNÉES DE TEST SUPPLÉMENTAIRES
-- =============================================

-- Ajouter quelques catégories supplémentaires pour tests futurs
INSERT INTO categories_pieces_achat (code, nom, description, icone, couleur, ordre_affichage) VALUES
('LOGICIEL', '💻 Logiciels', 'Licences et abonnements logiciels', '#6366F1', '8'),
('FORMATION', '🎓 Formation', 'Formations et certifications', '#F97316', '9'),
('PUBLICITE', '📢 Publicité', 'Marketing et communications', '#EC4899', '10')
ON CONFLICT (code) DO NOTHING;

-- Requête de vérification
SELECT 'Catégories créées avec succès!' as status, 
       COUNT(*) as nombre_categories 
FROM categories_pieces_achat 
WHERE actif = true;