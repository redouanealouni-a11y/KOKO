-- Vérifier la structure de la table transaction_documents

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'transaction_documents'
ORDER BY ordinal_position;
