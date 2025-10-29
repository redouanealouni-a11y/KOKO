-- Script pour appliquer les contraintes APRÈS avoir corrigé les données
-- Exécutez ce script UNIQUEMENT après avoir exécuté 02_fix_invalid_data.sql

-- ====================================================================
-- APPLICATION DES CONTRAINTES
-- ====================================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'APPLICATION DES CONTRAINTES';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- 1. SUPPRESSION DES ANCIENNES CONTRAINTES (si elles existent)
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '1. Suppression des anciennes contraintes...';
END $$;

ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_bank_status_check;

ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

DO $$
BEGIN
    RAISE NOTICE '   ✅ Anciennes contraintes supprimées';
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- 2. CRÉATION DE LA CONTRAINTE bank_status
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '2. Création de la contrainte bank_status...';
END $$;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_bank_status_check 
CHECK (bank_status IS NULL OR bank_status IN (
    'pending',    -- ⏳ En attente
    'cleared',    -- ✅ Encaissé/Payé
    'rejected',   -- ❌ Rejeté
    'cancelled'   -- 🚫 Annulé
));

DO $$
BEGIN
    RAISE NOTICE '   ✅ Contrainte bank_status créée';
    RAISE NOTICE '      Valeurs autorisées: pending, cleared, rejected, cancelled';
    RAISE NOTICE '';
END $$;

-- ====================================================================
-- 3. CRÉATION DE LA CONTRAINTE payment_method
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '3. Création de la contrainte payment_method...';
END $$;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN (
    'especes',      -- 💵 Espèces
    'cheque',       -- 📝 Chèque
    'virement',     -- 🏦 Virement bancaire
    'carte',        -- 💳 Carte bancaire
    'prelevement',  -- 🔄 Prélèvement automatique
    'sepa',         -- 🇪🇺 Virement SEPA
    'tip',          -- 📋 TIP
    'lcr',          -- 📄 Lettre de change
    'paypal',       -- 💎 PayPal
    'autre'         -- ⚙️ Autre
));

DO $$
BEGIN
    RAISE NOTICE '   ✅ Contrainte payment_method créée';
    RAISE NOTICE '      Valeurs autorisées: especes, cheque, virement, carte, prelevement,';
    RAISE NOTICE '                          sepa, tip, lcr, paypal, autre';
    RAISE NOTICE '';
END $$;

COMMIT;

-- ====================================================================
-- CONFIRMATION FINALE
-- ====================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '✅ CONTRAINTES APPLIQUÉES AVEC SUCCÈS!';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Récapitulatif :';
    RAISE NOTICE '';
    RAISE NOTICE '   bank_status - Valeurs autorisées :';
    RAISE NOTICE '     • pending    (⏳ En attente)';
    RAISE NOTICE '     • cleared    (✅ Encaissé/Payé)';
    RAISE NOTICE '     • rejected   (❌ Rejeté)';
    RAISE NOTICE '     • cancelled  (🚫 Annulé)';
    RAISE NOTICE '';
    RAISE NOTICE '   payment_method - Valeurs autorisées :';
    RAISE NOTICE '     • especes, cheque, virement, carte';
    RAISE NOTICE '     • prelevement, sepa, tip, lcr';
    RAISE NOTICE '     • paypal, autre';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Vous pouvez maintenant utiliser votre application!';
    RAISE NOTICE '============================================================================';
END $$;
