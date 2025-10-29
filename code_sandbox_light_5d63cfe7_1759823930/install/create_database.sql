-- =============================================================================
-- CREATION RAPIDE DE LA BASE DE DONNEES POSTGRESQL
-- Gestion de Caisse Régie - Version 2.0.0
-- =============================================================================

-- Attention: Ce script doit être exécuté en tant que superutilisateur PostgreSQL
-- Commande: psql -U postgres -f install/create_database.sql

-- =============================================================================
-- CREATION DE L'UTILISATEUR ET DE LA BASE DE DONNEES
-- =============================================================================

-- Terminer les connexions existantes à la base (si elle existe)
SELECT pg_terminate_backend(pg_stat_activity.pid)
FROM pg_stat_activity
WHERE pg_stat_activity.datname = 'caisse_regie' 
  AND pid <> pg_backend_pid();

-- Supprimer la base de données si elle existe déjà (pour réinstallation)
DROP DATABASE IF EXISTS caisse_regie;

-- Supprimer l'utilisateur s'il existe déjà
DROP USER IF EXISTS caisse_user;

-- Créer l'utilisateur pour l'application
CREATE USER caisse_user WITH
    LOGIN
    PASSWORD 'admin'
    CREATEDB
    NOCREATEROLE
    NOINHERIT
    NOREPLICATION
    CONNECTION LIMIT -1;

-- Commentaire sur l'utilisateur
COMMENT ON ROLE caisse_user IS 'Utilisateur pour l''application Gestion de Caisse Régie';

-- Créer la base de données
CREATE DATABASE caisse_regie
    WITH
    OWNER = caisse_user
    ENCODING = 'UTF8'
    LC_COLLATE = 'fr_FR.UTF-8'
    LC_CTYPE = 'fr_FR.UTF-8'
    CONNECTION LIMIT = -1
    TEMPLATE = template0;

-- Commentaire sur la base de données
COMMENT ON DATABASE caisse_regie IS 'Base de données pour l''application Gestion de Caisse Régie';

-- Accorder tous les privilèges sur la base à l'utilisateur
GRANT ALL PRIVILEGES ON DATABASE caisse_regie TO caisse_user;

-- Se connecter à la base nouvellement créée
\c caisse_regie caisse_user

-- Créer le schéma public s'il n'existe pas et donner les droits
CREATE SCHEMA IF NOT EXISTS public;
ALTER SCHEMA public OWNER TO caisse_user;
GRANT ALL ON SCHEMA public TO caisse_user;

-- Définir les privilèges par défaut pour les futurs objets
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO caisse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO caisse_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO caisse_user;

-- =============================================================================
-- VERIFICATION DE LA CREATION
-- =============================================================================

-- Vérifier la connexion et afficher les informations
SELECT 
    current_database() as database_name,
    current_user as current_user,
    version() as postgresql_version;

-- Afficher les informations de la base de données
SELECT 
    datname as database_name,
    pg_encoding_to_char(encoding) as encoding,
    datcollate as collate,
    datctype as ctype
FROM pg_database 
WHERE datname = 'caisse_regie';

-- Afficher les privilèges de l'utilisateur
SELECT 
    rolname as role_name,
    rolcreatedb as can_create_db,
    rolcanlogin as can_login
FROM pg_roles 
WHERE rolname = 'caisse_user';

-- =============================================================================
-- CONFIGURATION ADDITIONNELLE (OPTIONNEL)
-- =============================================================================

-- Augmenter les limites de mémoire pour de meilleures performances
-- (Décommentez si vous avez les droits de superutilisateur)

-- ALTER SYSTEM SET shared_buffers = '128MB';
-- ALTER SYSTEM SET effective_cache_size = '512MB';
-- ALTER SYSTEM SET maintenance_work_mem = '64MB';
-- ALTER SYSTEM SET checkpoint_completion_target = 0.9;
-- ALTER SYSTEM SET wal_buffers = '16MB';
-- ALTER SYSTEM SET default_statistics_target = 100;
-- ALTER SYSTEM SET random_page_cost = 1.1;
-- ALTER SYSTEM SET effective_io_concurrency = 200;

-- Pour appliquer les changements (nécessite un redémarrage PostgreSQL):
-- SELECT pg_reload_conf();

-- =============================================================================
-- EXTENSIONS UTILES (OPTIONNEL)
-- =============================================================================

-- Créer des extensions si disponibles (nécessite les droits de superutilisateur)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";  -- Pour générer des UUID
-- CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- Pour la recherche de texte
-- CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- Pour optimiser les index

-- =============================================================================
-- AFFICHAGE FINAL
-- =============================================================================

\echo
\echo '================================================================'
\echo '         CREATION DE LA BASE DE DONNEES TERMINEE'
\echo '================================================================'
\echo
\echo 'Base de données créée: caisse_regie'
\echo 'Utilisateur créé: caisse_user'
\echo 'Mot de passe: admin'
\echo 'Host: localhost'
\echo 'Port: 5432'
\echo
\echo 'Étapes suivantes:'
\echo '1. Exécutez database/schema.sql pour créer la structure des tables'
\echo '2. Configurez config/config_local.php avec ces paramètres'
\echo '3. Démarrez l''application'
\echo
\echo 'Commandes pour continuer l''installation:'
\echo 'psql -h localhost -U caisse_user -d caisse_regie -f database/schema.sql'
\echo
\echo '================================================================'