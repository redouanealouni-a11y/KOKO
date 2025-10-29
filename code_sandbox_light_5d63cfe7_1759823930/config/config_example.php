<?php

/**
 * Fichier de configuration d'exemple - Gestion de Caisse Régie
 *
 * Copiez ce fichier vers config_local.php et modifiez les valeurs selon votre environnement
 *
 * IMPORTANT: Ne jamais commiter config_local.php dans le système de contrôle de version !
 */

// =============================================================================
// CONFIGURATION BASE DE DONNÉES
// =============================================================================

// Serveur PostgreSQL
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'caisse_regie');
define('DB_USER', 'postgres');
define('DB_PASS', 'admin');

// =============================================================================
// CONFIGURATION APPLICATION
// =============================================================================

// Informations générales
define('APP_NAME', 'Gestion de Caisse Régie');
define('APP_VERSION', '2.0.0');
define('APP_DEBUG', false); // ATTENTION: Mettre à false en production !

// Fuseau horaire
define('APP_TIMEZONE', 'Europe/Paris');

// =============================================================================
// CONFIGURATION SÉCURITÉ
// =============================================================================

// Clé secrète pour le chiffrement (générez une clé unique !)
define('APP_SECRET_KEY', 'CHANGEZ_CETTE_CLE_SECRETE_' . md5(uniqid()));

// Configuration des sessions (optionnel pour future extension)
define('SESSION_LIFETIME', 3600); // 1 heure
define('SESSION_NAME', 'caisse_regie_session');

// =============================================================================
// CONFIGURATION RÉGIONALE
// =============================================================================

// Devise par défaut
define('DEFAULT_CURRENCY', 'EUR');

// Format de date par défaut
define('DEFAULT_DATE_FORMAT', 'DD/MM/YYYY');

// Langue par défaut
define('DEFAULT_LANGUAGE', 'fr');

// =============================================================================
// CONFIGURATION EMAIL (pour futures notifications)
// =============================================================================

// Serveur SMTP
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 587);
define('SMTP_USER', '');
define('SMTP_PASS', '');
define('SMTP_ENCRYPTION', 'tls'); // tls ou ssl

// Email expéditeur
define('FROM_EMAIL', 'noreply@votre-domaine.com');
define('FROM_NAME', 'Gestion de Caisse Régie');

// =============================================================================
// CONFIGURATION PERFORMANCE
// =============================================================================

// Cache (pour futures optimisations)
define('CACHE_ENABLED', false);
define('CACHE_LIFETIME', 300); // 5 minutes

// Pagination
define('DEFAULT_PAGE_SIZE', 20);
define('MAX_PAGE_SIZE', 100);

// =============================================================================
// CONFIGURATION LOGS
// =============================================================================

// Niveau de logs (DEBUG, INFO, WARNING, ERROR)
define('LOG_LEVEL', 'ERROR');

// Rotation des logs
define('LOG_MAX_SIZE', 10485760); // 10MB
define('LOG_MAX_FILES', 5);

// =============================================================================
// CONFIGURATION SAUVEGARDE
// =============================================================================

// Dossier de sauvegarde
define('BACKUP_DIR', __DIR__ . '/../backups');

// Sauvegarde automatique
define('AUTO_BACKUP_ENABLED', false);
define('AUTO_BACKUP_INTERVAL', 86400); // 24 heures

// =============================================================================
// CONFIGURATION DÉVELOPPEMENT
// =============================================================================

if (APP_DEBUG) {
    // Configuration pour le développement
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);

    // Headers CORS pour développement
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
} else {
    // Configuration pour la production
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);

    // Headers de sécurité
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('X-XSS-Protection: 1; mode=block');
    header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
}

// =============================================================================
// CONFIGURATION PERSONNALISÉE
// =============================================================================

// Ajoutez ici vos propres paramètres de configuration
// Exemple:
// define('CUSTOM_PARAMETER', 'valeur');
