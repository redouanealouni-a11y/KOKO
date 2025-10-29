-- =============================================================================
-- SCHEMA POSTGRESQL - GESTION DE CAISSE REGIE
-- Version: 2.0.0
-- Base de données: PostgreSQL 12+
-- =============================================================================

-- Définir l'encodage et la locale
SET client_encoding = 'UTF8';
SET default_with_oids = false;

-- =============================================================================
-- SUPPRESSION DES TABLES EXISTANTES (SI NECESSAIRE)
-- =============================================================================

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS tiers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS comptes CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Suppression des vues
DROP VIEW IF EXISTS vue_soldes_comptes CASCADE;
DROP VIEW IF EXISTS vue_transactions_completes CASCADE;
DROP VIEW IF EXISTS vue_statistiques_mensuelles CASCADE;

-- =============================================================================
-- TABLE: SETTINGS - Configuration de l'application
-- =============================================================================

CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    cle VARCHAR(100) UNIQUE NOT NULL,
    valeur TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_settings_cle ON settings(cle);

-- Commentaires
COMMENT ON TABLE settings IS 'Configuration et paramètres de l''application';
COMMENT ON COLUMN settings.cle IS 'Clé unique du paramètre';
COMMENT ON COLUMN settings.valeur IS 'Valeur du paramètre (stockage JSON possible)';
COMMENT ON COLUMN settings.description IS 'Description du paramètre';

-- =============================================================================
-- TABLE: CATEGORIES - Catégories des transactions
-- =============================================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    couleur VARCHAR(7) DEFAULT '#007bff' CHECK (couleur ~ '^#[0-9A-Fa-f]{6}$'),
    description TEXT,
    actif BOOLEAN DEFAULT true,
    ordre INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_categories_actif ON categories(actif);
CREATE INDEX idx_categories_ordre ON categories(ordre);

-- Contraintes
ALTER TABLE categories ADD CONSTRAINT uk_categories_nom UNIQUE(nom);

-- Commentaires
COMMENT ON TABLE categories IS 'Catégories pour classifier les transactions';
COMMENT ON COLUMN categories.nom IS 'Nom de la catégorie (unique)';
COMMENT ON COLUMN categories.couleur IS 'Code couleur hexadécimal pour l''affichage';
COMMENT ON COLUMN categories.ordre IS 'Ordre d''affichage dans les listes';

-- =============================================================================
-- TABLE: COMPTES - Comptes bancaires et caisses
-- =============================================================================

CREATE TABLE comptes (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('caisse', 'banque')),
    solde_initial DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    numero_compte VARCHAR(50),
    banque VARCHAR(100),
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_comptes_type ON comptes(type);
CREATE INDEX idx_comptes_actif ON comptes(actif);
CREATE INDEX idx_comptes_nom ON comptes(nom);

-- Contraintes
ALTER TABLE comptes ADD CONSTRAINT uk_comptes_nom UNIQUE(nom);
ALTER TABLE comptes ADD CONSTRAINT chk_comptes_solde_initial CHECK (solde_initial >= -999999999999.99);

-- Commentaires
COMMENT ON TABLE comptes IS 'Comptes bancaires et caisses physiques';
COMMENT ON COLUMN comptes.type IS 'Type de compte: caisse (physique) ou banque (virtuel)';
COMMENT ON COLUMN comptes.solde_initial IS 'Solde initial lors de la création du compte';
COMMENT ON COLUMN comptes.numero_compte IS 'Numéro de compte bancaire (optionnel)';
COMMENT ON COLUMN comptes.banque IS 'Nom de la banque (pour les comptes bancaires)';

-- =============================================================================
-- TABLE: TIERS - Clients et fournisseurs
-- =============================================================================

CREATE TABLE tiers (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'fournisseur')),
    contact VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(100),
    adresse TEXT,
    notes TEXT,
    actif BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les performances
CREATE INDEX idx_tiers_type ON tiers(type);
CREATE INDEX idx_tiers_actif ON tiers(actif);
CREATE INDEX idx_tiers_nom ON tiers(nom);
CREATE INDEX idx_tiers_code ON tiers(code);

-- Contraintes
ALTER TABLE tiers ADD CONSTRAINT chk_tiers_email CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Commentaires
COMMENT ON TABLE tiers IS 'Clients et fournisseurs de l''organisation';
COMMENT ON COLUMN tiers.code IS 'Code unique auto-généré pour le tiers';
COMMENT ON COLUMN tiers.type IS 'Type de tiers: client ou fournisseur';
COMMENT ON COLUMN tiers.contact IS 'Nom de la personne de contact';

-- =============================================================================
-- TABLE: TRANSACTIONS - Toutes les opérations financières
-- =============================================================================

CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('recette', 'depense')),
    montant DECIMAL(15,2) NOT NULL CHECK (montant > 0),
    description TEXT NOT NULL,
    date DATE NOT NULL,
    compte_id INTEGER NOT NULL REFERENCES comptes(id) ON DELETE RESTRICT,
    categorie_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    tiers_id INTEGER REFERENCES tiers(id) ON DELETE SET NULL,
    virement_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    numero_piece VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system'
);

-- Index pour les performances (très important pour les requêtes)
CREATE INDEX idx_transactions_date ON transactions(date DESC);
CREATE INDEX idx_transactions_compte_date ON transactions(compte_id, date DESC);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_categorie ON transactions(categorie_id);
CREATE INDEX idx_transactions_tiers ON transactions(tiers_id);
CREATE INDEX idx_transactions_virement ON transactions(virement_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Index composites pour les requêtes complexes
CREATE INDEX idx_transactions_type_date ON transactions(type, date DESC);
CREATE INDEX idx_transactions_compte_type_date ON transactions(compte_id, type, date DESC);

-- Contraintes
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_montant CHECK (montant > 0);
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_description CHECK (char_length(trim(description)) > 0);

-- Contrainte pour éviter les virements vers soi-même
ALTER TABLE transactions ADD CONSTRAINT chk_transactions_virement_different 
    CHECK (virement_id IS NULL OR virement_id != id);

-- Commentaires
COMMENT ON TABLE transactions IS 'Toutes les transactions financières (recettes, dépenses, virements)';
COMMENT ON COLUMN transactions.type IS 'Type de transaction: recette ou depense';
COMMENT ON COLUMN transactions.montant IS 'Montant de la transaction (toujours positif)';
COMMENT ON COLUMN transactions.date IS 'Date de la transaction (peut différer de created_at)';
COMMENT ON COLUMN transactions.virement_id IS 'ID de la transaction liée (pour les virements)';
COMMENT ON COLUMN transactions.numero_piece IS 'Numéro de pièce justificative (facture, reçu, etc.)';
COMMENT ON COLUMN transactions.created_by IS 'Utilisateur ayant créé la transaction';

-- =============================================================================
-- VUES POUR LES STATISTIQUES ET REQUÊTES COMPLEXES
-- =============================================================================

-- Vue pour les soldes des comptes en temps réel
CREATE OR REPLACE VIEW vue_soldes_comptes AS
SELECT 
    c.id,
    c.nom,
    c.type,
    c.solde_initial,
    c.numero_compte,
    c.banque,
    c.actif,
    c.created_at,
    COALESCE(SUM(CASE WHEN t.type = 'recette' THEN t.montant ELSE -t.montant END), 0) AS mouvements,
    c.solde_initial + COALESCE(SUM(CASE WHEN t.type = 'recette' THEN t.montant ELSE -t.montant END), 0) AS solde_actuel,
    COUNT(t.id) AS nombre_transactions,
    MAX(t.date) AS derniere_transaction
FROM comptes c
LEFT JOIN transactions t ON c.id = t.compte_id
GROUP BY c.id, c.nom, c.type, c.solde_initial, c.numero_compte, c.banque, c.actif, c.created_at
ORDER BY c.nom;

COMMENT ON VIEW vue_soldes_comptes IS 'Vue des comptes avec soldes calculés en temps réel';

-- Vue pour les transactions complètes avec toutes les informations
CREATE OR REPLACE VIEW vue_transactions_completes AS
SELECT 
    t.id,
    t.type,
    t.montant,
    t.description,
    t.date,
    t.numero_piece,
    t.notes,
    t.created_at,
    t.updated_at,
    t.created_by,
    -- Informations du compte
    c.nom AS compte_nom,
    c.type AS compte_type,
    -- Informations de la catégorie
    cat.nom AS categorie_nom,
    cat.couleur AS categorie_couleur,
    -- Informations du tiers
    tier.nom AS tiers_nom,
    tier.type AS tiers_type,
    tier.code AS tiers_code,
    -- Informations du virement
    tv.id AS virement_transaction_id,
    tv.description AS virement_description
FROM transactions t
LEFT JOIN comptes c ON t.compte_id = c.id
LEFT JOIN categories cat ON t.categorie_id = cat.id
LEFT JOIN tiers tier ON t.tiers_id = tier.id
LEFT JOIN transactions tv ON t.virement_id = tv.id;

COMMENT ON VIEW vue_transactions_completes IS 'Vue des transactions avec toutes les informations liées';

-- Vue pour les statistiques mensuelles
CREATE OR REPLACE VIEW vue_statistiques_mensuelles AS
SELECT 
    DATE_TRUNC('month', t.date) AS mois,
    SUM(CASE WHEN t.type = 'recette' THEN t.montant ELSE 0 END) AS total_recettes,
    SUM(CASE WHEN t.type = 'depense' THEN t.montant ELSE 0 END) AS total_depenses,
    SUM(CASE WHEN t.type = 'recette' THEN t.montant ELSE -t.montant END) AS benefice,
    COUNT(*) AS nombre_transactions,
    COUNT(DISTINCT t.compte_id) AS nombre_comptes_utilises
FROM transactions t
GROUP BY DATE_TRUNC('month', t.date)
ORDER BY mois DESC;

COMMENT ON VIEW vue_statistiques_mensuelles IS 'Statistiques financières par mois';

-- =============================================================================
-- FONCTIONS UTILITAIRES
-- =============================================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mise à jour automatique de updated_at
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comptes_updated_at BEFORE UPDATE ON comptes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tiers_updated_at BEFORE UPDATE ON tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour générer un code tiers unique
CREATE OR REPLACE FUNCTION generate_tiers_code(p_type VARCHAR, p_nom VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    code_prefix VARCHAR(1);
    code_base VARCHAR(10);
    code_final VARCHAR(20);
    counter INTEGER := 1;
BEGIN
    -- Déterminer le préfixe selon le type
    code_prefix := CASE 
        WHEN p_type = 'client' THEN 'C'
        WHEN p_type = 'fournisseur' THEN 'F'
        ELSE 'T'
    END;
    
    -- Créer la base du code (3 premières lettres du nom + timestamp)
    code_base := code_prefix || 
                 UPPER(SUBSTRING(REGEXP_REPLACE(p_nom, '[^A-Za-z0-9]', '', 'g'), 1, 3)) || 
                 LPAD(EXTRACT(EPOCH FROM NOW())::INTEGER % 10000, 4, '0');
    
    -- Vérifier l'unicité et ajouter un suffixe si nécessaire
    code_final := code_base;
    WHILE EXISTS(SELECT 1 FROM tiers WHERE code = code_final) LOOP
        code_final := code_base || LPAD(counter::TEXT, 2, '0');
        counter := counter + 1;
    END LOOP;
    
    RETURN code_final;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DONNÉES D'INITIALISATION
-- =============================================================================

-- Paramètres de l'application
INSERT INTO settings (cle, valeur, description) VALUES 
('app_name', 'Gestion de Caisse Régie', 'Nom de l''application'),
('app_version', '2.0.0', 'Version de l''application'),
('currency', 'EUR', 'Devise par défaut'),
('date_format', 'DD/MM/YYYY', 'Format d''affichage des dates'),
('language', 'fr', 'Langue de l''interface'),
('organization', 'Mon Organisation', 'Nom de l''organisation'),
('timezone', 'Europe/Paris', 'Fuseau horaire'),
('initialized', 'true', 'Indicateur d''initialisation'),
('last_backup', NULL, 'Date de la dernière sauvegarde'),
('auto_backup', 'false', 'Sauvegarde automatique activée');

-- Catégories par défaut
INSERT INTO categories (nom, couleur, description, ordre) VALUES 
('Ventes', '#28a745', 'Recettes provenant des ventes de produits ou services', 1),
('Services', '#17a2b8', 'Recettes provenant de prestations de services', 2),
('Subventions', '#6f42c1', 'Subventions et aides publiques', 3),
('Autres Recettes', '#20c997', 'Autres types de recettes', 4),
('Achats', '#dc3545', 'Achats de marchandises et matières premières', 5),
('Charges Personnel', '#fd7e14', 'Salaires, charges sociales et frais de personnel', 6),
('Charges Externes', '#ffc107', 'Loyers, assurances, téléphone, etc.', 7),
('Charges Fiscales', '#e83e8c', 'Impôts et taxes', 8),
('Charges Financières', '#6c757d', 'Intérêts d''emprunts et frais bancaires', 9),
('Investissements', '#495057', 'Achats d''équipements et investissements', 10),
('Frais Généraux', '#adb5bd', 'Autres charges d''exploitation', 11);

-- Comptes par défaut
INSERT INTO comptes (nom, type, solde_initial, description) VALUES 
('Caisse Principale', 'caisse', 1000.00, 'Caisse physique principale pour les encaissements quotidiens'),
('Caisse Secondaire', 'caisse', 200.00, 'Caisse secondaire pour les petites dépenses'),
('Compte Courant Principal', 'banque', 5000.00, 'Compte bancaire principal de l''organisation'),
('Compte Épargne', 'banque', 10000.00, 'Compte d''épargne pour les réserves');

-- Tiers d'exemple
INSERT INTO tiers (nom, code, type, contact, telephone, email, adresse, notes) VALUES 
('Entreprise ABC', 'CABC2401', 'client', 'Jean Dupont', '01.23.45.67.89', 'contact@abc-entreprise.fr', '123 Rue de la Paix, 75001 Paris', 'Client privilégié depuis 2020'),
('Société XYZ', 'CXYZ2402', 'client', 'Marie Martin', '01.98.76.54.32', 'marie.martin@xyz-societe.com', '456 Avenue des Champs, 69000 Lyon', 'Facturation mensuelle'),
('Fournisseur Matériel', 'FMAT2403', 'fournisseur', 'Pierre Durand', '01.11.22.33.44', 'pierre@materiel-pro.fr', '789 Boulevard du Commerce, 13000 Marseille', 'Délai de paiement 30 jours'),
('Services Comptables', 'FSER2404', 'fournisseur', 'Sophie Leclerc', '01.55.66.77.88', 'sophie@compta-services.fr', '321 Rue de l''Expertise, 33000 Bordeaux', 'Expert-comptable de l''organisation');

-- Transactions d'exemple pour démonstration
INSERT INTO transactions (type, montant, description, date, compte_id, categorie_id, tiers_id, numero_piece, notes) VALUES 
-- Recettes
('recette', 1500.00, 'Vente de services informatiques', CURRENT_DATE - INTERVAL '5 days', 1, 2, 1, 'FAC001', 'Paiement en espèces'),
('recette', 2500.00, 'Vente de produits', CURRENT_DATE - INTERVAL '3 days', 3, 1, 2, 'FAC002', 'Virement bancaire'),
('recette', 800.00, 'Prestation de conseil', CURRENT_DATE - INTERVAL '1 day', 1, 2, 1, 'FAC003', 'Chèque'),
-- Dépenses
('depense', 450.00, 'Achat de matériel informatique', CURRENT_DATE - INTERVAL '4 days', 3, 10, 3, 'ACH001', 'Équipement bureau'),
('depense', 120.00, 'Frais de déplacement', CURRENT_DATE - INTERVAL '2 days', 2, 11, NULL, 'NOTE001', 'Mission client'),
('depense', 300.00, 'Services comptables', CURRENT_DATE, 3, 6, 4, 'FACT001', 'Honoraires mensuels');

-- =============================================================================
-- OPTIMISATIONS FINALES
-- =============================================================================

-- Analyse des tables pour optimiser les performances
ANALYZE settings;
ANALYZE categories;
ANALYZE comptes;
ANALYZE tiers;
ANALYZE transactions;

-- Mise à jour des statistiques
VACUUM ANALYZE;

-- =============================================================================
-- INFORMATIONS DE FIN D'INSTALLATION
-- =============================================================================

-- Afficher un résumé de l'installation
DO $$
DECLARE
    nb_tables INTEGER;
    nb_index INTEGER;
    nb_vues INTEGER;
    nb_fonctions INTEGER;
BEGIN
    SELECT COUNT(*) INTO nb_tables FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    SELECT COUNT(*) INTO nb_index FROM pg_indexes WHERE schemaname = 'public';
    SELECT COUNT(*) INTO nb_vues FROM information_schema.views WHERE table_schema = 'public';
    SELECT COUNT(*) INTO nb_fonctions FROM information_schema.routines WHERE routine_schema = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE 'INSTALLATION DU SCHEMA POSTGRESQL TERMINEE AVEC SUCCES !';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Statistiques de la base de données :';
    RAISE NOTICE '- Tables créées : %', nb_tables;
    RAISE NOTICE '- Index créés : %', nb_index;
    RAISE NOTICE '- Vues créées : %', nb_vues;
    RAISE NOTICE '- Fonctions créées : %', nb_fonctions;
    RAISE NOTICE '';
    RAISE NOTICE 'Tables principales :';
    RAISE NOTICE '- settings : % enregistrements', (SELECT COUNT(*) FROM settings);
    RAISE NOTICE '- categories : % enregistrements', (SELECT COUNT(*) FROM categories);
    RAISE NOTICE '- comptes : % enregistrements', (SELECT COUNT(*) FROM comptes);
    RAISE NOTICE '- tiers : % enregistrements', (SELECT COUNT(*) FROM tiers);
    RAISE NOTICE '- transactions : % enregistrements', (SELECT COUNT(*) FROM transactions);
    RAISE NOTICE '';
    RAISE NOTICE 'La base de données est prête à être utilisée !';
    RAISE NOTICE '=============================================================================';
    RAISE NOTICE '';
END $$;