-- Script de vérification de la table transaction_documents

DO $$
BEGIN
    -- Vérifier l'existence de la table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'transaction_documents'
    ) THEN
        RAISE NOTICE '✅ Table transaction_documents existe';
        
        -- Afficher les colonnes
        RAISE NOTICE '📋 Colonnes de la table:';
    ELSE
        RAISE NOTICE '❌ Table transaction_documents N''EXISTE PAS!';
        RAISE NOTICE '⚠️ Vous devez exécuter migration_add_new_fields.sql';
    END IF;
END $$;

-- Afficher la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'transaction_documents'
ORDER BY ordinal_position;

-- Compter les documents
SELECT COUNT(*) as nombre_documents FROM transaction_documents;
