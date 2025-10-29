-- Script de vérification des migrations
-- Exécutez ce script après les migrations pour vérifier que tout est correct

\echo '========================================'
\echo 'VÉRIFICATION DES MIGRATIONS'
\echo '========================================'
\echo ''

-- Vérification 1 : Structure de la table transactions
\echo '1. Vérification des colonnes de la table transactions:'
\echo ''
SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('reference', 'due_date', 'effective_date', 'balance_impact', 'bank_notes') 
        THEN '✅ NOUVEAU'
        WHEN column_name IN ('payment_method', 'bank_status', 'value_date') 
        THEN '🔵 EXISTANT (migration précédente)'
        ELSE '🔹 BASE'
    END as statut
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY 
    CASE 
        WHEN column_name IN ('reference', 'due_date', 'effective_date', 'balance_impact', 'bank_notes') THEN 1
        WHEN column_name IN ('payment_method', 'bank_status', 'value_date') THEN 2
        ELSE 3
    END,
    column_name;

\echo ''
\echo '========================================'
\echo ''

-- Vérification 2 : Colonnes spécifiques ajoutées
\echo '2. Vérification des 5 nouveaux champs:'
\echo ''
SELECT 
    CASE 
        WHEN COUNT(*) = 5 THEN '✅ SUCCÈS - Tous les champs sont présents'
        ELSE '❌ ERREUR - ' || (5 - COUNT(*))::text || ' champ(s) manquant(s)'
    END as resultat,
    COUNT(*) as champs_trouves,
    5 as champs_attendus
FROM information_schema.columns 
WHERE table_name = 'transactions'
AND column_name IN ('reference', 'due_date', 'effective_date', 'balance_impact', 'bank_notes');

\echo ''
\echo '========================================'
\echo ''

-- Vérification 3 : Table transaction_documents
\echo '3. Vérification de la table transaction_documents:'
\echo ''
SELECT 
    table_name,
    column_name,
    data_type,
    CASE 
        WHEN column_name = 'upload_date' THEN '✅ NOUVEAU NOM (upload_date)'
        WHEN column_name = 'uploaded_at' THEN '🔵 ANCIEN NOM (uploaded_at) - Compatible'
        ELSE ''
    END as statut
FROM information_schema.columns 
WHERE table_name = 'transaction_documents'
AND column_name IN ('upload_date', 'uploaded_at');

\echo ''
\echo '========================================'
\echo ''

-- Vérification 4 : Index créés
\echo '4. Vérification des index sur les nouveaux champs:'
\echo ''
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'transactions'
AND (
    indexname LIKE '%reference%' OR
    indexname LIKE '%due_date%' OR
    indexname LIKE '%effective_date%'
)
ORDER BY indexname;

\echo ''
\echo '========================================'
\echo ''

-- Vérification 5 : Contraintes
\echo '5. Vérification de la contrainte balance_impact:'
\echo ''
SELECT 
    conname as contrainte_nom,
    contype as type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'transactions'::regclass
AND conname LIKE '%balance_impact%';

\echo ''
\echo '========================================'
\echo ''

-- Vérification 6 : Statistiques des données
\echo '6. Statistiques des transactions:'
\echo ''
SELECT 
    COUNT(*) as total_transactions,
    COUNT(reference) as avec_reference,
    COUNT(due_date) as avec_echeance,
    COUNT(effective_date) as avec_date_effet,
    COUNT(balance_impact) as avec_impact,
    COUNT(bank_notes) as avec_notes_bancaires
FROM transactions;

\echo ''
\echo '========================================'
\echo ''

-- Résumé final
\echo '7. Résumé final:'
\echo ''
WITH verification AS (
    SELECT 
        (SELECT COUNT(*) FROM information_schema.columns 
         WHERE table_name = 'transactions'
         AND column_name IN ('reference', 'due_date', 'effective_date', 'balance_impact', 'bank_notes')
        ) as nouveaux_champs,
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_name = 'transaction_documents'
        ) as table_documents,
        (SELECT COUNT(*) FROM pg_indexes 
         WHERE tablename = 'transactions'
         AND indexname LIKE '%reference%'
        ) as index_reference
)
SELECT 
    CASE 
        WHEN nouveaux_champs = 5 AND table_documents = 1 THEN '✅ MIGRATION RÉUSSIE'
        ELSE '❌ MIGRATION INCOMPLÈTE'
    END as statut_global,
    nouveaux_champs || '/5' as champs_ajoutes,
    CASE WHEN table_documents = 1 THEN '✅' ELSE '❌' END as table_docs,
    CASE WHEN index_reference > 0 THEN '✅' ELSE '⚠️' END as index_ok
FROM verification;

\echo ''
\echo '========================================'
\echo 'FIN DE LA VÉRIFICATION'
\echo '========================================'
\echo ''
\echo 'Légende:'
\echo '  ✅ = OK / Réussi'
\echo '  ❌ = Erreur / Manquant'
\echo '  ⚠️  = Avertissement'
\echo '  🔵 = Information'
\echo ''