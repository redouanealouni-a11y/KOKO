-- Migration pour ajouter la colonne original_name à transaction_documents
-- Date: 2025-10-23
-- Description: Ajout de la colonne original_name pour stocker le nom original des fichiers uploadés

-- Ajouter la colonne original_name si elle n'existe pas
ALTER TABLE transaction_documents 
  ADD COLUMN IF NOT EXISTS original_name VARCHAR(255);

-- Mettre à jour les enregistrements existants qui n'ont pas de original_name
-- (copier file_name dans original_name pour les anciens enregistrements)
UPDATE transaction_documents 
SET original_name = file_name 
WHERE original_name IS NULL;

-- Commentaire pour documenter la colonne
COMMENT ON COLUMN transaction_documents.original_name IS 'Nom original du fichier tel qu''uploadé par l''utilisateur';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Migration terminée! La colonne original_name a été ajoutée à transaction_documents.';
END $$;
