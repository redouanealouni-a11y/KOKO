-- Correction du nom de colonne dans transaction_documents
-- Si vous avez changé uploaded_at en upload_date manuellement
-- Cette migration s'assure que le nom est cohérent

-- Vérifier et renommer la colonne si nécessaire
DO $$
BEGIN
    -- Si la colonne upload_date existe déjà, ne rien faire
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_documents' 
        AND column_name = 'upload_date'
    ) THEN
        RAISE NOTICE 'La colonne upload_date existe déjà, aucune modification nécessaire';
    ELSE
        -- Sinon, renommer uploaded_at en upload_date
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'transaction_documents' 
            AND column_name = 'uploaded_at'
        ) THEN
            ALTER TABLE transaction_documents RENAME COLUMN uploaded_at TO upload_date;
            RAISE NOTICE 'Colonne renamed_at renommée en upload_date avec succès';
        ELSE
            -- Si aucune des deux colonnes n'existe, créer upload_date
            ALTER TABLE transaction_documents ADD COLUMN upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            RAISE NOTICE 'Colonne upload_date créée avec succès';
        END IF;
    END IF;
END $$;