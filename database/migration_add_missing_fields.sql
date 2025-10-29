-- Migration pour ajouter les champs manquants à la table transactions
-- Date: 2025-10-22
-- Description: Ajout des champs reference, due_date, effective_date, balance_impact et bank_notes

-- Ajouter la colonne reference si elle n'existe pas déjà
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS reference VARCHAR(100);

-- Ajouter les nouveaux champs manquants
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS effective_date DATE,
  ADD COLUMN IF NOT EXISTS balance_impact VARCHAR(50),
  ADD COLUMN IF NOT EXISTS bank_notes TEXT;

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_due_date ON transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_transactions_effective_date ON transactions(effective_date);

-- Commentaires pour documenter les colonnes
COMM ENT ON COLUMN transactions.reference IS 'Numéro de référence ou pièce comptable';
COMMENT ON COLUMN transactions.due_date IS 'Date d\'échéance de la transaction';
COMMENT ON COLUMN transactions.effective_date IS 'Date réelle d\'effet sur le compte bancaire';
COMMENT ON COLUMN transactions.balance_impact IS 'Impact sur le solde (Positif/Négatif/Neutre)';
COMMENT ON COLUMN transactions.bank_notes IS 'Notes bancaires spécifiques';

-- Ajouter une contrainte pour balance_impact
ALTER TABLE transactions 
  ADD CONSTRAINT chk_balance_impact 
  CHECK (balance_impact IS NULL OR balance_impact IN ('positif', 'negatif', 'neutre'));

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée avec succès!';
    RAISE NOTICE 'Champs ajoutés: reference, due_date, effective_date, balance_impact, bank_notes';
END $$;