-- Correction du type de colonne balance_impact
-- Change VARCHAR vers NUMERIC pour stocker le montant calculé

-- Supprimer d'abord la contrainte existante
ALTER TABLE transactions 
  DROP CONSTRAINT IF EXISTS chk_balance_impact;

-- Modifier le type de colonne pour accepter des montants
ALTER TABLE transactions 
  ALTER COLUMN balance_impact TYPE NUMERIC(15,2) USING 
    CASE 
      WHEN balance_impact IS NULL THEN NULL
      WHEN balance_impact ~ '^[+-]?[0-9]+(\.[0-9]+)?$' THEN balance_impact::NUMERIC
      ELSE 0
    END;

-- Ajouter un commentaire
COMMENT ON COLUMN transactions.balance_impact IS 'Montant calculé de l''impact sur le solde (peut être positif ou négatif)';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Type de balance_impact corrigé vers NUMERIC(15,2)';
END $$;
