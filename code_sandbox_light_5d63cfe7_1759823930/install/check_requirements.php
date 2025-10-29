<?php

/**
 * Vérification des prérequis système
 * Gestion de Caisse Régie - Version 2.0.0
 */

// Configuration des couleurs pour la console
if (PHP_SAPI === 'cli') {
    define('COLOR_GREEN', "\033[32m");
    define('COLOR_RED', "\033[31m");
    define('COLOR_YELLOW', "\033[33m");
    define('COLOR_BLUE', "\033[34m");
    define('COLOR_RESET', "\033[0m");
} else {
    define('COLOR_GREEN', '');
    define('COLOR_RED', '');
    define('COLOR_YELLOW', '');
    define('COLOR_BLUE', '');
    define('COLOR_RESET', '');
}

echo COLOR_BLUE . "================================================================\n";
echo "    VERIFICATION DES PREREQUIS - GESTION DE CAISSE REGIE\n";
echo "================================================================\n" . COLOR_RESET;
echo "\nVersion de l'application: 2.0.0\n";
echo "Date de vérification: " . date('Y-m-d H:i:s') . "\n\n";

$allOk = true;
$warnings = [];
$errors = [];

// =============================================================================
// VERIFICATION PHP
// =============================================================================

echo COLOR_BLUE . "1. VERIFICATION DE PHP\n" . COLOR_RESET;
echo str_repeat("-", 40) . "\n";

// Version PHP
$phpVersion = PHP_VERSION;
$requiredPhpVersion = '7.4.0';

echo sprintf("%-35s: ", "Version PHP");
if (version_compare($phpVersion, $requiredPhpVersion, '>=')) {
    echo COLOR_GREEN . "✓ " . $phpVersion . COLOR_RESET . "\n";
} else {
    echo COLOR_RED . "✗ " . $phpVersion . " (minimum requis: " . $requiredPhpVersion . ")" . COLOR_RESET . "\n";
    $errors[] = "Version PHP insuffisante. Minimum requis: " . $requiredPhpVersion;
    $allOk = false;
}

// Extensions PHP requises
$requiredExtensions = [
    'pdo' => 'PDO (PHP Data Objects)',
    'pdo_pgsql' => 'PDO PostgreSQL driver',
    'pgsql' => 'PostgreSQL functions',
    'json' => 'JSON support',
    'mbstring' => 'Multi-byte string functions',
    'openssl' => 'Cryptographic functions'
];

echo sprintf("%-35s:\n", "Extensions PHP requises");
foreach ($requiredExtensions as $ext => $description) {
    echo sprintf("  %-30s: ", $description);
    if (extension_loaded($ext)) {
        echo COLOR_GREEN . "✓ Installée" . COLOR_RESET . "\n";
    } else {
        echo COLOR_RED . "✗ Manquante" . COLOR_RESET . "\n";
        $errors[] = "Extension PHP manquante: " . $ext;
        $allOk = false;
    }
}

// Extensions PHP recommandées
$recommendedExtensions = [
    'curl' => 'Client URL library',
    'gd' => 'Image processing',
    'zip' => 'ZIP archive handling',
    'intl' => 'Internationalization functions'
];

echo sprintf("%-35s:\n", "Extensions PHP recommandées");
foreach ($recommendedExtensions as $ext => $description) {
    echo sprintf("  %-30s: ", $description);
    if (extension_loaded($ext)) {
        echo COLOR_GREEN . "✓ Installée" . COLOR_RESET . "\n";
    } else {
        echo COLOR_YELLOW . "⚠ Manquante (optionnelle)" . COLOR_RESET . "\n";
        $warnings[] = "Extension PHP recommandée manquante: " . $ext;
    }
}

// Paramètres PHP
echo sprintf("%-35s:\n", "Configuration PHP");

$phpSettings = [
    'memory_limit' => ['minimum' => '128M', 'recommended' => '256M'],
    'max_execution_time' => ['minimum' => 30, 'recommended' => 60],
    'post_max_size' => ['minimum' => '8M', 'recommended' => '16M'],
    'upload_max_filesize' => ['minimum' => '2M', 'recommended' => '8M']
];

foreach ($phpSettings as $setting => $limits) {
    echo sprintf("  %-30s: ", $setting);
    $currentValue = ini_get($setting);

    if ($setting === 'memory_limit' || $setting === 'post_max_size' || $setting === 'upload_max_filesize') {
        $currentBytes = return_bytes($currentValue);
        $minBytes = return_bytes($limits['minimum']);

        if ($currentBytes >= $minBytes || $currentValue === '-1') {
            echo COLOR_GREEN . "✓ " . $currentValue . COLOR_RESET . "\n";
        } else {
            echo COLOR_YELLOW . "⚠ " . $currentValue . " (recommandé: " . $limits['recommended'] . ")" . COLOR_RESET . "\n";
            $warnings[] = "Paramètre PHP $setting trop faible: $currentValue (recommandé: " . $limits['recommended'] . ")";
        }
    } else {
        if ($currentValue >= $limits['minimum'] || $currentValue == 0) {
            echo COLOR_GREEN . "✓ " . $currentValue . COLOR_RESET . "\n";
        } else {
            echo COLOR_YELLOW . "⚠ " . $currentValue . " (recommandé: " . $limits['recommended'] . ")" . COLOR_RESET . "\n";
            $warnings[] = "Paramètre PHP $setting trop faible: $currentValue (recommandé: " . $limits['recommended'] . ")";
        }
    }
}

echo "\n";

// =============================================================================
// VERIFICATION POSTGRESQL
// =============================================================================

echo COLOR_BLUE . "2. VERIFICATION DE POSTGRESQL\n" . COLOR_RESET;
echo str_repeat("-", 40) . "\n";

// Vérifier si PostgreSQL est accessible
echo sprintf("%-35s: ", "Serveur PostgreSQL");

$pgTestPassed = false;
$pgVersion = '';

// Test de connexion PostgreSQL
try {
    if (extension_loaded('pdo_pgsql')) {
        // Utiliser les paramètres par défaut de votre configuration
        $testHost = 'localhost';
        $testPort = '5432';
        $testUser = 'postgres';
        $testPass = 'admin'; // Mot de passe de votre configuration

        $dsn = "pgsql:host={$testHost};port={$testPort}";
        $pdo = new PDO($dsn, $testUser, $testPass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);

        $result = $pdo->query("SELECT version()");
        $versionRow = $result->fetch(PDO::FETCH_ASSOC);
        $pgVersion = $versionRow['version'];

        echo COLOR_GREEN . "✓ Accessible" . COLOR_RESET . "\n";
        $pgTestPassed = true;

    } else {
        throw new Exception("Extension pdo_pgsql non disponible");
    }
} catch (Exception $e) {
    echo COLOR_RED . "✗ Non accessible (" . $e->getMessage() . ")" . COLOR_RESET . "\n";
    $errors[] = "PostgreSQL non accessible: " . $e->getMessage();
    $allOk = false;
}

if ($pgTestPassed) {
    echo sprintf("%-35s: ", "Version PostgreSQL");
    // Extraire la version numérique
    preg_match('/PostgreSQL (\d+\.\d+)/', $pgVersion, $matches);
    $version = isset($matches[1]) ? $matches[1] : 'Inconnue';

    if (version_compare($version, '12.0', '>=')) {
        echo COLOR_GREEN . "✓ " . $version . COLOR_RESET . "\n";
    } else {
        echo COLOR_YELLOW . "⚠ " . $version . " (recommandé: 12.0+)" . COLOR_RESET . "\n";
        $warnings[] = "Version PostgreSQL ancienne: " . $version . " (recommandé: 12.0+)";
    }

    // Test de création de base de données
    echo sprintf("%-35s: ", "Permissions PostgreSQL");
    try {
        $testDb = 'test_caisse_' . time();
        $pdo->exec("CREATE DATABASE {$testDb}");
        $pdo->exec("DROP DATABASE {$testDb}");
        echo COLOR_GREEN . "✓ Permissions suffisantes" . COLOR_RESET . "\n";
    } catch (Exception $e) {
        echo COLOR_YELLOW . "⚠ Permissions limitées (" . $e->getMessage() . ")" . COLOR_RESET . "\n";
        $warnings[] = "Permissions PostgreSQL limitées: " . $e->getMessage();
    }
}

echo "\n";

// =============================================================================
// VERIFICATION DU SYSTEME DE FICHIERS
// =============================================================================

echo COLOR_BLUE . "3. VERIFICATION DU SYSTEME DE FICHIERS\n" . COLOR_RESET;
echo str_repeat("-", 40) . "\n";

$basePath = dirname(__DIR__);

// Vérifier les permissions d'écriture
$writableDirectories = [
    'logs' => $basePath . '/logs',
    'config' => $basePath . '/config'
];

echo sprintf("%-35s:\n", "Permissions d'écriture");
foreach ($writableDirectories as $name => $path) {
    echo sprintf("  %-30s: ", "Dossier $name");

    if (!is_dir($path)) {
        // Tenter de créer le dossier
        if (@mkdir($path, 0755, true)) {
            echo COLOR_GREEN . "✓ Créé et accessible" . COLOR_RESET . "\n";
        } else {
            echo COLOR_RED . "✗ Impossible de créer" . COLOR_RESET . "\n";
            $errors[] = "Impossible de créer le dossier: " . $path;
            $allOk = false;
        }
    } elseif (is_writable($path)) {
        echo COLOR_GREEN . "✓ Accessible en écriture" . COLOR_RESET . "\n";
    } else {
        echo COLOR_RED . "✗ Non accessible en écriture" . COLOR_RESET . "\n";
        $errors[] = "Dossier non accessible en écriture: " . $path;
        $allOk = false;
    }
}

// Vérifier l'espace disque
echo sprintf("%-35s: ", "Espace disque disponible");
$freeSpace = disk_free_space($basePath);
$minSpace = 100 * 1024 * 1024; // 100 MB

if ($freeSpace !== false && $freeSpace > $minSpace) {
    echo COLOR_GREEN . "✓ " . formatBytes($freeSpace) . " disponibles" . COLOR_RESET . "\n";
} else {
    echo COLOR_YELLOW . "⚠ Espace disque faible" . COLOR_RESET . "\n";
    $warnings[] = "Espace disque faible: " . formatBytes($freeSpace);
}

echo "\n";

// =============================================================================
// VERIFICATION DE LA CONFIGURATION
// =============================================================================

echo COLOR_BLUE . "4. VERIFICATION DE LA CONFIGURATION\n" . COLOR_RESET;
echo str_repeat("-", 40) . "\n";

// Vérifier le fichier de configuration
$configFile = $basePath . '/config/config_local.php';
echo sprintf("%-35s: ", "Fichier de configuration");

if (file_exists($configFile)) {
    echo COLOR_GREEN . "✓ Présent (config_local.php)" . COLOR_RESET . "\n";
} else {
    $exampleFile = $basePath . '/config/config_example.php';
    if (file_exists($exampleFile)) {
        echo COLOR_YELLOW . "⚠ À créer (config_example.php disponible)" . COLOR_RESET . "\n";
        $warnings[] = "Fichier config_local.php à créer à partir de config_example.php";
    } else {
        echo COLOR_RED . "✗ Aucune configuration trouvée" . COLOR_RESET . "\n";
        $errors[] = "Aucun fichier de configuration trouvé";
        $allOk = false;
    }
}

// Vérifier la structure des dossiers
echo sprintf("%-35s:\n", "Structure des dossiers");
$requiredDirectories = [
    'api' => $basePath . '/api',
    'classes' => $basePath . '/classes',
    'config' => $basePath . '/config',
    'database' => $basePath . '/database',
    'js' => $basePath . '/js'
];

foreach ($requiredDirectories as $name => $path) {
    echo sprintf("  %-30s: ", "Dossier $name");
    if (is_dir($path)) {
        echo COLOR_GREEN . "✓ Présent" . COLOR_RESET . "\n";
    } else {
        echo COLOR_RED . "✗ Manquant" . COLOR_RESET . "\n";
        $errors[] = "Dossier manquant: " . $path;
        $allOk = false;
    }
}

// Vérifier les fichiers essentiels
echo sprintf("%-35s:\n", "Fichiers essentiels");
$requiredFiles = [
    'index.php' => $basePath . '/index.php',
    'database.php' => $basePath . '/config/database.php',
    'schema.sql' => $basePath . '/database/schema.sql',
    'main.js' => $basePath . '/js/main.js'
];

foreach ($requiredFiles as $name => $path) {
    echo sprintf("  %-30s: ", $name);
    if (file_exists($path)) {
        echo COLOR_GREEN . "✓ Présent" . COLOR_RESET . "\n";
    } else {
        echo COLOR_RED . "✗ Manquant" . COLOR_RESET . "\n";
        $errors[] = "Fichier manquant: " . $path;
        $allOk = false;
    }
}

echo "\n";

// =============================================================================
// RESUME FINAL
// =============================================================================

echo COLOR_BLUE . "================================================================\n";
echo "                        RESUME DE VERIFICATION\n";
echo "================================================================\n" . COLOR_RESET;

if ($allOk) {
    echo COLOR_GREEN . "\n✓ TOUS LES PREREQUIS SONT SATISFAITS !\n" . COLOR_RESET;
    echo "\nVous pouvez procéder à l'installation de l'application.\n";

    if (!empty($warnings)) {
        echo COLOR_YELLOW . "\n⚠ AVERTISSEMENTS:\n" . COLOR_RESET;
        foreach ($warnings as $warning) {
            echo "  - " . $warning . "\n";
        }
        echo "\nCes avertissements n'empêchent pas l'installation mais peuvent affecter les performances.\n";
    }

    echo "\nÉtapes suivantes:\n";
    echo "1. Exécutez install/install.bat pour une installation automatique (Windows)\n";
    echo "2. Ou suivez les instructions du fichier INSTALL_GUIDE.md\n";
    echo "3. Configurez config/config_local.php avec vos paramètres\n";
    echo "4. Démarrez l'application avec install/start_server.bat\n";

} else {
    echo COLOR_RED . "\n✗ DES PREREQUIS NE SONT PAS SATISFAITS\n" . COLOR_RESET;
    echo "\nErreurs à corriger:\n";
    foreach ($errors as $error) {
        echo COLOR_RED . "  - " . $error . "\n" . COLOR_RESET;
    }

    if (!empty($warnings)) {
        echo COLOR_YELLOW . "\nAvertissements additionnels:\n" . COLOR_RESET;
        foreach ($warnings as $warning) {
            echo "  - " . $warning . "\n";
        }
    }

    echo "\nVeuillez corriger ces problèmes avant de procéder à l'installation.\n";
    echo "Consultez le fichier INSTALL_GUIDE.md pour plus d'informations.\n";
}

echo "\nPour plus d'aide:\n";
echo "- Consultez INSTALL_GUIDE.md pour les instructions détaillées\n";
echo "- Vérifiez README.md pour la documentation complète\n";
echo "- En cas de problème persistant, vérifiez les logs dans le dossier logs/\n";

echo "\n" . COLOR_BLUE . "================================================================\n" . COLOR_RESET;

// Code de sortie
exit($allOk ? 0 : 1);

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Convertir une taille en octets
 */
function return_bytes($val)
{
    $val = trim($val);
    $last = strtolower($val[strlen($val) - 1]);
    $val = (int) $val;

    switch ($last) {
        case 'g':
            $val *= 1024;
            // no break
        case 'm':
            $val *= 1024;
            // no break
        case 'k':
            $val *= 1024;
    }

    return $val;
}

/**
 * Formater une taille en octets
 */
function formatBytes($size, $precision = 2)
{
    $units = array('B', 'KB', 'MB', 'GB', 'TB');

    for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
        $size /= 1024;
    }

    return round($size, $precision) . ' ' . $units[$i];
}
