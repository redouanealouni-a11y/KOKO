-- Migration pour ajouter les nouveaux champs à la table transactions
-- Date: 2025-10-22
-- Description: Ajout des champs payment_method, bank_status, value_date et création de la table transaction_documents

-- Ajouter les nouveaux champs à la table transactions
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100),
  ADD COLUMN IF NOT EXISTS bank_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS value_date DATE;

-- Créer un index pour optimiser les requêtes sur le statut bancaire
CREATE INDEX IF NOT EXISTS idx_transactions_bank_status ON transactions(bank_status);

-- Créer un index pour optimiser les requêtes sur la date de valeur
CREATE INDEX IF NOT EXISTS idx_transactions_value_date ON transactions(value_date);

-- Créer la table pour stocker les documents liés aux transactions
CREATE TABLE IF NOT EXISTS transaction_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Index pour améliorer les performances
    CONSTRAINT fk_transaction_document FOREIGN KEY (transaction_id) 
        REFERENCES transactions(id) ON DELETE CASCADE
);

-- Créer un index pour optimiser les requêtes de documents par transaction
CREATE INDEX IF NOT EXISTS idx_transaction_documents_transaction_id ON transaction_documents(transaction_id);

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN transactions.payment_method IS 'Méthode de paiement utilisée (Espèces, Chèque, Virement, Carte bancaire, etc.)';
COMMENT ON COLUMN transactions.bank_status IS 'Statut bancaire de la transaction (En attente, Validé, Rejeté)';
COMMENT ON COLUMN transactions.value_date IS 'Date de valeur de la transaction (différente de la date de saisie)';
COMMENT ON TABLE transaction_documents IS 'Documents et fichiers joints aux transactions';

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Migration terminée avec succès! Les nouveaux champs ont été ajoutés à la table transactions.';
    RAISE NOTICE 'Table transaction_documents créée pour gérer les fichiers joints.';
END $$;