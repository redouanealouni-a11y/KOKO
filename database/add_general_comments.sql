-- Ajout du champ pour les commentaires généraux dans la table transactions
-- Ce champ permet de stocker les remarques internes, contexte, etc.

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS general_comments TEXT DEFAULT NULL;

COMMENT ON COLUMN transactions.general_comments IS 'Commentaires généraux et remarques internes sur la transaction';
