-- Script pour corriger les données invalides AVANT d'appliquer les contraintes
-- Exécutez ce script pour nettoyer vos données existantes

-- ====================================================================
-- CORRECTION DES DONNÉES INVALIDES
-- ====================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'CORRECTION DES DONNÉES INVALIDES';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- 1. CORRECTION DES VALEURS bank_status
-- ====================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '1. Correction des valeurs bank_status...';
    
    -- Mettre à NULL toutes les valeurs invalides
    UPDATE transactions
    SET bank_status = NULL
    WHERE bank_status IS NOT NULL 
      AND bank_status NOT IN ('pending', 'cleared', 'rejected', 'cancelled');
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   → % lignes mises à NULL', v_count;
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- 2. CORRECTION DES VALEURS payment_method
-- ====================================================================

DO $$
DECLARE
    v_count INTEGER;
BEGIN
    RAISE NOTICE '2. Correction des valeurs payment_method...';
    
    -- Mettre à NULL toutes les valeurs invalides
    UPDATE transactions
    SET payment_method = NULL
    WHERE payment_method IS NOT NULL 
      AND payment_method NOT IN (
        'especes', 'cheque', 'virement', 'carte', 'prelevement',
        'sepa', 'tip', 'lcr', 'paypal', 'autre'
      );
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   → % lignes mises à NULL', v_count;
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- VÉRIFICATION FINALE
-- ====================================================================

DO $$
DECLARE
    v_invalid_bank INTEGER;
    v_invalid_payment INTEGER;
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'VÉRIFICATION FINALE';
    RAISE NOTICE '============================================================================';
    
    -- Vérifier bank_status
    SELECT COUNT(*) INTO v_invalid_bank
    FROM transactions
    WHERE bank_status IS NOT NULL 
      AND bank_status NOT IN ('pending', 'cleared', 'rejected', 'cancelled');
    
    -- Vérifier payment_method
    SELECT COUNT(*) INTO v_invalid_payment
    FROM transactions
    WHERE payment_method IS NOT NULL 
      AND payment_method NOT IN (
        'especes', 'cheque', 'virement', 'carte', 'prelevement',
        'sepa', 'tip', 'lcr', 'paypal', 'autre'
      );
    
    RAISE NOTICE '';
    RAISE NOTICE 'Résultats :';
    RAISE NOTICE '  - bank_status invalides restants : %', v_invalid_bank;
    RAISE NOTICE '  - payment_method invalides restants : %', v_invalid_payment;
    RAISE NOTICE '';
    
    IF v_invalid_bank = 0 AND v_invalid_payment = 0 THEN
        RAISE NOTICE '✅ SUCCÈS : Toutes les données sont maintenant valides!';
        RAISE NOTICE '✅ Vous pouvez maintenant exécuter le script 03_apply_constraints.sql';
    ELSE
        RAISE NOTICE '❌ ATTENTION : Il reste des données invalides!';
        RAISE EXCEPTION 'Des données invalides subsistent. Veuillez les corriger manuellement.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
END $$;

COMMIT;

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Données corrigées avec succès!';
    RAISE NOTICE '➡️  Prochaine étape : Exécutez 03_apply_constraints.sql';
    RAISE NOTICE '';
END $$;
