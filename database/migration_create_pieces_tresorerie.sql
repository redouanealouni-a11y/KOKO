-- Migration pour créer la table pieces_tresorerie
-- Table unifiée pour les achats et ventes

CREATE TABLE IF NOT EXISTS pieces_tresorerie (
    CleDocument UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    CleTypeDocument VARCHAR(50) NOT NULL DEFAULT 'facture_achat',
    CleTiers UUID REFERENCES tiers(id),
    CleEntreprise UUID,
    Reference VARCHAR(100),
    Date DATE NOT NULL DEFAULT CURRENT_DATE,
    Date2 DATE,
    Label VARCHAR(500),
    Note TEXT,
    MontantHT DECIMAL(15,2) DEFAULT 0,
    RemisePourcent DECIMAL(5,2) DEFAULT 0,
    Remise DECIMAL(15,2) DEFAULT 0,
    TotalTVA DECIMAL(15,2) DEFAULT 0,
    Timbre DECIMAL(15,2) DEFAULT 0,
    MontantTTC DECIMAL(15,2) NOT NULL DEFAULT 0,
    Payement VARCHAR(50),
    Marge DECIMAL(15,2),
    Cloture BOOLEAN DEFAULT FALSE,
    RefAssocie VARCHAR(100),
    CleUser UUID,
    CleCommercial UUID,
    CleMode VARCHAR(50),
    CleDevise VARCHAR(10) DEFAULT 'XAF',
    TauxChange DECIMAL(10,4) DEFAULT 1.0000,
    CleCompte INTEGER REFERENCES comptes(id),
    CreateDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    LastModifiedDate TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CleEtatDocument VARCHAR(50) DEFAULT 'brouillon',
    DateEtat DATE DEFAULT CURRENT_DATE,
    ConnectionState VARCHAR(20) DEFAULT 'local',
    ReceiveState VARCHAR(20) DEFAULT 'received',
    bModeTTC BOOLEAN DEFAULT TRUE,
    BaseRistourne DECIMAL(15,2)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_pieces_tresorerie_date ON pieces_tresorerie(Date);
CREATE INDEX IF NOT EXISTS idx_pieces_tresorerie_tiers ON pieces_tresorerie(CleTiers);
CREATE INDEX IF NOT EXISTS idx_pieces_tresorerie_type ON pieces_tresorerie(CleTypeDocument);
CREATE INDEX IF NOT EXISTS idx_pieces_tresorerie_etat ON pieces_tresorerie(CleEtatDocument);
CREATE INDEX IF NOT EXISTS idx_pieces_tresorerie_montant ON pieces_tresorerie(MontantTTC);

-- Contraintes pour garantir la cohérence des données
ALTER TABLE pieces_tresorerie 
ADD CONSTRAINT chk_montants_positifs 
CHECK (MontantHT >= 0 AND MontantTTC >= 0 AND TotalTVA >= 0);

ALTER TABLE pieces_tresorerie 
ADD CONSTRAINT chk_remise_valide 
CHECK (RemisePourcent >= 0 AND RemisePourcent <= 100 AND Remise >= 0);

ALTER TABLE pieces_tresorerie 
ADD CONSTRAINT chk_taux_change_valide 
CHECK (TauxChange > 0);

-- Trigger pour mettre à jour LastModifiedDate automatiquement
CREATE OR REPLACE FUNCTION update_lastmodified_pieces_tresorerie()
RETURNS TRIGGER AS $$
BEGIN
    NEW.LastModifiedDate = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lastmodified_pieces_tresorerie ON pieces_tresorerie;
CREATE TRIGGER trigger_update_lastmodified_pieces_tresorerie
    BEFORE UPDATE ON pieces_tresorerie
    FOR EACH ROW
    EXECUTE FUNCTION update_lastmodified_pieces_tresorerie();

-- Insertion de données de test (optionnel)
COMMENT ON TABLE pieces_tresorerie IS 'Table unifiée pour la gestion des pièces de trésorerie (achats, ventes, paiements)';
COMMENT ON COLUMN pieces_tresorerie.CleDocument IS 'Clé primaire UUID du document';
COMMENT ON COLUMN pieces_tresorerie.CleTypeDocument IS 'Type de document: facture_achat, facture_vente, avoir, paiement, etc.';
COMMENT ON COLUMN pieces_tresorerie.MontantHT IS 'Montant hors taxes';
COMMENT ON COLUMN pieces_tresorerie.MontantTTC IS 'Montant TTC (montant total)';
COMMENT ON COLUMN pieces_tresorerie.bModeTTC IS 'TRUE si le montant est saisi TTC, FALSE si HT';