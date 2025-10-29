-- Script de diagnostic pour vérifier l'état de la base de données
-- Exécutez ce script pour voir l'état actuel de vos colonnes et contraintes

-- ====================================================================
-- VÉRIFICATION DES COLONNES
-- ====================================================================

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'transactions'
  AND column_name IN ('payment_method', 'bank_status', 'value_date', 'reference')
ORDER BY column_name;

-- ====================================================================
-- VÉRIFICATION DES CONTRAINTES
-- ====================================================================

SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
  AND conname LIKE '%bank_status%' OR conname LIKE '%payment_method%'
ORDER BY conname;

-- ====================================================================
-- VÉRIFICATION DE LA TABLE transaction_documents
-- ====================================================================

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transaction_documents')
        THEN 'Table transaction_documents existe ✅'
        ELSE 'Table transaction_documents n''existe PAS ❌'
    END AS statut_table;

-- ====================================================================
-- LISTE DES INDEX SUR LES NOUVEAUX CHAMPS
-- ====================================================================

SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
  AND (indexname LIKE '%bank_status%' 
       OR indexname LIKE '%payment_method%' 
       OR indexname LIKE '%value_date%')
ORDER BY indexname;
