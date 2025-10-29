-- Script pour identifier les données problématiques dans la table transactions
-- Exécutez ce script AVANT la correction pour voir ce qui pose problème

-- ====================================================================
-- IDENTIFICATION DES VALEURS INVALIDES
-- ====================================================================

ECHO '============================================================================';
ECHO 'ANALYSE DES DONNÉES EXISTANTES';
ECHO '============================================================================';
ECHO '';

-- 1. Vérifier les valeurs actuelles de bank_status
ECHO '1. VALEURS ACTUELLES DE bank_status :';
ECHO '-----------------------------------';

SELECT 
    bank_status,
    COUNT(*) as nombre_transactions
FROM transactions
WHERE bank_status IS NOT NULL
GROUP BY bank_status
ORDER BY nombre_transactions DESC;

ECHO '';

-- 2. Identifier les valeurs qui seront REJETÉES par la nouvelle contrainte
ECHO '2. VALEURS QUI POSENT PROBLÈME (à corriger) :';
ECHO '---------------------------------------------';

SELECT 
    bank_status,
    COUNT(*) as nombre_transactions,
    'INVALIDE - sera rejeté' as statut
FROM transactions
WHERE bank_status IS NOT NULL 
  AND bank_status NOT IN ('pending', 'cleared', 'rejected', 'cancelled')
GROUP BY bank_status
ORDER BY nombre_transactions DESC;

ECHO '';

-- 3. Vérifier les valeurs de payment_method
ECHO '3. VALEURS ACTUELLES DE payment_method :';
ECHO '---------------------------------------';

SELECT 
    payment_method,
    COUNT(*) as nombre_transactions
FROM transactions
WHERE payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY nombre_transactions DESC;

ECHO '';

-- 4. Identifier les valeurs payment_method problématiques
ECHO '4. VALEURS payment_method QUI POSENT PROBLÈME :';
ECHO '------------------------------------------------';

SELECT 
    payment_method,
    COUNT(*) as nombre_transactions,
    'INVALIDE - sera rejeté' as statut
FROM transactions
WHERE payment_method IS NOT NULL 
  AND payment_method NOT IN (
    'especes', 'cheque', 'virement', 'carte', 'prelevement',
    'sepa', 'tip', 'lcr', 'paypal', 'autre'
  )
GROUP BY payment_method
ORDER BY nombre_transactions DESC;

ECHO '';
ECHO '============================================================================';
ECHO 'FIN DE L''ANALYSE';
ECHO '============================================================================';
