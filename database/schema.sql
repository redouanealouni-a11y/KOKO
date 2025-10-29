-- Création de la base de données pour l'application de gestion de caisse
-- PostgreSQL Schema for Caisse Management System

-- Drop existing tables to ensure a clean slate
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS tiers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS comptes CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des paramètres de l'application
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des comptes (caisses et banques)
CREATE TABLE comptes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('caisse', 'banque')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    bank VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des tiers (clients et fournisseurs)
CREATE TABLE tiers (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('client', 'fournisseur')),
    raison_sociale VARCHAR(255) NOT NULL,
    contact VARCHAR(255),
    telephone VARCHAR(20),
    email VARCHAR(255),
    siret VARCHAR(14),
    adresse TEXT,
    notes TEXT,
    solde NUMERIC(15,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Informations supplémentaires
    code_client VARCHAR(50),
    famille_code VARCHAR(50),
    note_interne TEXT,
    reference VARCHAR(100),
    type_tiers VARCHAR(50) DEFAULT 'particulier',
    statut VARCHAR(50) DEFAULT 'actif',

    -- Adresse et localisation
    code_postal VARCHAR(20),
    ville VARCHAR(100),
    wilaya VARCHAR(100),
    adresse_livraison TEXT,

    -- Contact et communication
    correspondant VARCHAR(255),
    telephone_fixe VARCHAR(50),
    mobile VARCHAR(50),
    fax VARCHAR(50),
    site_web VARCHAR(255),

    -- Informations légales
    identifiant_fiscal VARCHAR(50),
    nis VARCHAR(50),
    registre_commerce VARCHAR(50),
    article_imposition VARCHAR(50),

    -- Informations comptables
    code_comptable VARCHAR(50),
    numero_compte VARCHAR(100),
    rib VARCHAR(100),
    exoneration_tva BOOLEAN DEFAULT FALSE,
    mode_paiement VARCHAR(50),
    conditions_echeance VARCHAR(255),
    solde_actuel NUMERIC(15,2) DEFAULT 0.00,

    -- Dates
    date1 DATE,
    date2 DATE,
    date3 DATE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Divers
    remarques TEXT,
    mots_cles TEXT,
    solvabilite VARCHAR(50),
    commercial_id VARCHAR
);

-- Table des transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('recette', 'depense', 'virement_debit', 'virement_credit')),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    date DATE NOT NULL,
    account_id UUID NOT NULL REFERENCES comptes(id) ON DELETE CASCADE,
    tiers_id UUID REFERENCES tiers(id) ON DELETE SET NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    balance_after DECIMAL(15,2),
    transfer_ref UUID, -- Pour lier les virements
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tiers ON transactions(tiers_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer ON transactions(transfer_ref);
CREATE INDEX IF NOT EXISTS idx_comptes_type ON comptes(type);
CREATE INDEX IF NOT EXISTS idx_tiers_type ON tiers(type);

-- Fonction pour mettre à jour automatically le timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour auto-update des timestamps
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_comptes_updated_at ON comptes;
CREATE TRIGGER update_comptes_updated_at BEFORE UPDATE ON comptes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_tiers_updated_at ON tiers;
CREATE TRIGGER update_tiers_updated_at BEFORE UPDATE ON tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Données initiales
INSERT INTO settings (setting_key, setting_value) VALUES 
('currency', 'EUR'),
('org_name', 'Mon Organisation'),
('decimal_places', '2')
ON CONFLICT (setting_key) DO NOTHING;

INSERT INTO categories (name, description) VALUES 
('Bureau', 'Fournitures et matériel de bureau'),
('Transport', 'Frais de transport et déplacement'),
('Matériel', 'Achat de matériel et équipements'),
('Services', 'Prestations de services'),
('Divers', 'Autres dépenses diverses')
ON CONFLICT (name) DO NOTHING;

-- Comptes par défaut
INSERT INTO comptes (name, type, balance, bank, description) VALUES
('Caisse Principale', 'caisse', 1000.00, '', 'Caisse principale'),
('Compte Courant', 'banque', 5000.00, 'BNP Paribas', 'Compte courant principal')
ON CONFLICT (name) DO NOTHING;

-- Vue pour les statistiques rapides
CREATE OR REPLACE VIEW v_stats AS
SELECT 
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN ('recette', 'virement_credit')) as total_recettes,
    (SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type IN ('depense', 'virement_debit')) as total_depenses,
    (SELECT COUNT(*) FROM transactions) as total_transactions,
    (SELECT COALESCE(SUM(balance), 0) FROM comptes WHERE is_active = TRUE) as total_balance;

-- Vue pour les transactions avec détails
CREATE OR REPLACE VIEW v_transactions_details AS
SELECT
    t.id,
    t.type,
    t.description,
    t.amount,
    t.date,
    t.balance_after,
    t.transfer_ref,
    t.notes,
    t.created_at,
    t.account_id,
    t.tiers_id,
    t.category_id,
    c.name as account_name,
    c.type as account_type,
    tiers.raison_sociale as tiers_name,
    cat.name as category_name
FROM transactions t
LEFT JOIN comptes c ON t.account_id = c.id
LEFT JOIN tiers ON t.tiers_id = tiers.id
LEFT JOIN categories cat ON t.category_id = cat.id
ORDER BY t.date DESC, t.created_at DESC;