-- Script de correction pour les contraintes des nouveaux champs
-- Date: 2025-10-22
-- Description: Supprime les anciennes contraintes et en crée de nouvelles avec les bonnes valeurs

-- ====================================================================
-- CORRECTION DE LA CONTRAINTE bank_status
-- ====================================================================

-- Étape 1: Supprimer la contrainte existante sur bank_status
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_bank_status_check;

-- Étape 2: Ajouter la nouvelle contrainte avec les valeurs correctes
ALTER TABLE transactions 
ADD CONSTRAINT transactions_bank_status_check 
CHECK (bank_status IS NULL OR bank_status IN ('pending', 'cleared', 'rejected', 'cancelled'));

-- ====================================================================
-- CORRECTION DE LA CONTRAINTE payment_method (si elle existe)
-- ====================================================================

-- Étape 3: Supprimer la contrainte existante sur payment_method
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_payment_method_check;

-- Étape 4: Ajouter une contrainte pour payment_method avec toutes les valeurs autorisées
ALTER TABLE transactions 
ADD CONSTRAINT transactions_payment_method_check 
CHECK (payment_method IS NULL OR payment_method IN (
    'especes', 'cheque', 'virement', 'carte', 'prelevement', 
    'sepa', 'tip', 'lcr', 'paypal', 'autre'
));

-- ====================================================================
-- CONFIRMATION
-- ====================================================================
DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'Contraintes mises à jour avec succès!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'bank_status - Valeurs autorisées:';
    RAISE NOTICE '  - pending (En attente)';
    RAISE NOTICE '  - cleared (Encaissé/Payé)';
    RAISE NOTICE '  - rejected (Rejeté)';
    RAISE NOTICE '  - cancelled (Annulé)';
    RAISE NOTICE '';
    RAISE NOTICE 'payment_method - Valeurs autorisées:';
    RAISE NOTICE '  - especes, cheque, virement, carte';
    RAISE NOTICE '  - prelevement, sepa, tip, lcr';
    RAISE NOTICE '  - paypal, autre';
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
END $$;
