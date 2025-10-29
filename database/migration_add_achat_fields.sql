-- Migration pour ajouter les champs spécifiques aux achats
-- Date: 2025-10-25
-- Description: Ajout des champs payment_status et payment_date pour la gestion des achats

-- Ajouter les nouveaux champs pour les achats
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'a_payer',
  ADD COLUMN IF NOT EXISTS payment_date DATE;

-- Créer un index pour optimiser les requêtes sur le statut de paiement
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON transactions(payment_status);

-- Créer un index pour optimiser les requêtes sur la date de paiement
CREATE INDEX IF NOT EXISTS idx_transactions_payment_date ON transactions(payment_date);

-- Ajouter une contrainte pour le statut de paiement
ALTER TABLE transactions 
  ADD CONSTRAINT chk_payment_status 
  CHECK (payment_status IS NULL OR payment_status IN ('a_payer', 'partiellement_paye', 'paye', 'en_retard'));

-- Commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN transactions.payment_status IS 'Statut du paiement (À payer, Partiellement payé, Payé, En retard)';
COMMENT ON COLUMN transactions.payment_date IS 'Date de paiement réelle de la transaction';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée avec succès!';
    RAISE NOTICE 'Champs ajoutés pour les achats: payment_status, payment_date';
    RAISE NOTICE 'Contrainte de validation ajoutée pour payment_status';
END $$;