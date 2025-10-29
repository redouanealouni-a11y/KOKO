<?php

/**
 * API REST - Gestion des paramètres et sauvegarde
 * Gestion de Caisse Régie - Version 2.0.0
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

// CORS headers pour développement
if (defined('APP_DEBUG') && APP_DEBUG) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

// Gérer les requêtes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Charger la configuration
    require_once __DIR__ . '/../config/database.php';

    $db = getDatabase();
    $method = $_SERVER['REQUEST_METHOD'];

    // Récupérer les paramètres GET
    $params = $_GET;

    // Récupérer les données POST/PUT
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];

    // Router selon la méthode HTTP et l'action
    switch ($method) {
        case 'GET':
            handleGet($db, $params);
            break;

        case 'POST':
            handlePost($db, $data, $params);
            break;

        case 'PUT':
            handlePut($db, $data);
            break;

        default:
            jsonError('Méthode HTTP non supportée', 405);
    }

} catch (Exception $e) {
    error_log("Erreur API settings: " . $e->getMessage());
    jsonError('Erreur serveur: ' . $e->getMessage(), 500);
}

/**
 * Gérer les requêtes GET
 */
function handleGet($db, $params)
{
    // GET /api/settings.php?action=export - Exporter toutes les données
    if (isset($params['action']) && $params['action'] === 'export') {
        try {
            $export = exportAllData($db);

            // Headers pour téléchargement
            header('Content-Disposition: attachment; filename="caisse_regie_backup_' . date('Y-m-d_H-i-s') . '.json"');
            header('Content-Type: application/octet-stream');

            echo json_encode($export, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            exit;
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/settings.php?action=info - Informations système
    if (isset($params['action']) && $params['action'] === 'info') {
        try {
            $info = getSystemInfo($db);
            jsonSuccess($info);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/settings.php?cle=param - Obtenir un paramètre spécifique
    if (isset($params['cle'])) {
        try {
            $setting = $db->queryOne("SELECT * FROM settings WHERE cle = ?", [$params['cle']]);

            if (!$setting) {
                jsonError('Paramètre non trouvé', 404);
                return;
            }

            jsonSuccess(formatSettingOutput($setting));
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/settings.php - Obtenir tous les paramètres
    try {
        $settings = $db->query("SELECT * FROM settings ORDER BY cle");

        // Convertir en objet clé-valeur pour faciliter l'utilisation côté client
        $result = [];
        foreach ($settings as $setting) {
            $result[$setting['cle']] = $setting['valeur'];
        }

        jsonSuccess($result);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes POST
 */
function handlePost($db, $data, $params)
{
    // POST /api/settings.php?action=import - Importer des données
    if (isset($params['action']) && $params['action'] === 'import') {
        try {
            if (empty($data)) {
                jsonError('Aucune donnée à importer', 400);
                return;
            }

            $result = importAllData($db, $data);
            jsonSuccess($result, 'Données importées avec succès');
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // POST /api/settings.php - Créer/Mettre à jour un paramètre
    try {
        if (!isset($data['cle']) || !isset($data['valeur'])) {
            jsonError('Clé et valeur requises', 400);
            return;
        }

        $validation = validateSettingData($data);
        if (!$validation['valid']) {
            jsonError("Données invalides : " . implode(', ', $validation['errors']), 400);
            return;
        }

        $validData = $validation['data'];

        // Vérifier si le paramètre existe déjà
        $existing = $db->queryOne("SELECT id FROM settings WHERE cle = ?", [$validData['cle']]);

        if ($existing) {
            // Mise à jour
            $sql = "UPDATE settings SET valeur = ?, description = ? WHERE cle = ?";
            $params = [$validData['valeur'], $validData['description'], $validData['cle']];
            $db->execute($sql, $params);
        } else {
            // Création
            $sql = "INSERT INTO settings (cle, valeur, description) VALUES (?, ?, ?)";
            $params = [$validData['cle'], $validData['valeur'], $validData['description']];
            $db->insert($sql, $params);
        }

        // Récupérer le paramètre mis à jour
        $setting = $db->queryOne("SELECT * FROM settings WHERE cle = ?", [$validData['cle']]);

        jsonSuccess(formatSettingOutput($setting), 'Paramètre enregistré avec succès');

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes PUT
 */
function handlePut($db, $data)
{
    // PUT /api/settings.php - Mettre à jour plusieurs paramètres
    try {
        if (empty($data) || !is_array($data)) {
            jsonError('Données de paramètres requises', 400);
            return;
        }

        $db->beginTransaction();

        $updated = 0;
        foreach ($data as $cle => $valeur) {
            $validation = validateSettingData(['cle' => $cle, 'valeur' => $valeur]);
            if ($validation['valid']) {
                $validData = $validation['data'];

                // Vérifier si le paramètre existe
                $existing = $db->queryOne("SELECT id FROM settings WHERE cle = ?", [$cle]);

                if ($existing) {
                    $db->execute("UPDATE settings SET valeur = ? WHERE cle = ?", [$valeur, $cle]);
                } else {
                    $db->insert("INSERT INTO settings (cle, valeur) VALUES (?, ?)", [$cle, $valeur]);
                }
                $updated++;
            }
        }

        $db->commit();

        jsonSuccess(['updated' => $updated], "Paramètres mis à jour avec succès");

    } catch (Exception $e) {
        $db->rollback();
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Exporter toutes les données
 */
function exportAllData($db)
{
    $export = [
        'metadata' => [
            'version' => '2.0.0',
            'export_date' => date('Y-m-d H:i:s'),
            'database_version' => $db->queryOne("SELECT version() as version")['version']
        ],
        'settings' => $db->query("SELECT * FROM settings ORDER BY cle"),
        'categories' => $db->query("SELECT * FROM categories ORDER BY ordre, nom"),
        'comptes' => $db->query("SELECT * FROM comptes ORDER BY nom"),
        'tiers' => $db->query("SELECT * FROM tiers ORDER BY nom"),
        'transactions' => $db->query("SELECT * FROM transactions ORDER BY date DESC, id DESC")
    ];

    // Mettre à jour la date de dernière sauvegarde
    $db->execute(
        "INSERT INTO settings (cle, valeur) VALUES ('last_backup', ?) 
         ON CONFLICT (cle) DO UPDATE SET valeur = EXCLUDED.valeur",
        [date('Y-m-d H:i:s')]
    );

    return $export;
}

/**
 * Importer toutes les données
 */
function importAllData($db, $data)
{
    // Vérifier la structure des données
    $requiredTables = ['settings', 'categories', 'comptes', 'tiers', 'transactions'];
    foreach ($requiredTables as $table) {
        if (!isset($data[$table]) || !is_array($data[$table])) {
            throw new Exception("Données manquantes pour la table '$table'");
        }
    }

    $db->beginTransaction();

    try {
        // Sauvegarder les données existantes au cas où
        $backup = [
            'settings_count' => $db->count('settings'),
            'categories_count' => $db->count('categories'),
            'comptes_count' => $db->count('comptes'),
            'tiers_count' => $db->count('tiers'),
            'transactions_count' => $db->count('transactions')
        ];

        // Vider les tables (en respectant les contraintes)
        $db->execute("DELETE FROM transactions");
        $db->execute("DELETE FROM tiers");
        $db->execute("DELETE FROM categories");
        $db->execute("DELETE FROM comptes");
        $db->execute("DELETE FROM settings WHERE cle != 'initialized'");

        // Réinitialiser les séquences
        $db->execute("SELECT setval('settings_id_seq', 1)");
        $db->execute("SELECT setval('categories_id_seq', 1)");
        $db->execute("SELECT setval('comptes_id_seq', 1)");
        $db->execute("SELECT setval('tiers_id_seq', 1)");
        $db->execute("SELECT setval('transactions_id_seq', 1)");

        // Importer les données
        $imported = [];

        // Settings
        foreach ($data['settings'] as $setting) {
            if ($setting['cle'] !== 'initialized') { // Garder le flag d'initialisation
                $db->insert(
                    "INSERT INTO settings (cle, valeur, description) VALUES (?, ?, ?)",
                    [$setting['cle'], $setting['valeur'], $setting['description'] ?? null]
                );
            }
        }
        $imported['settings'] = count($data['settings']);

        // Categories
        foreach ($data['categories'] as $categorie) {
            $db->insert(
                "INSERT INTO categories (nom, couleur, description, ordre, actif) VALUES (?, ?, ?, ?, ?)",
                [
                    $categorie['nom'],
                    $categorie['couleur'] ?? '#007bff',
                    $categorie['description'] ?? null,
                    $categorie['ordre'] ?? 0,
                    $categorie['actif'] ?? true
                ]
            );
        }
        $imported['categories'] = count($data['categories']);

        // Comptes
        foreach ($data['comptes'] as $compte) {
            $db->insert(
                "INSERT INTO comptes (nom, type, solde_initial, description, numero_compte, banque, actif) VALUES (?, ?, ?, ?, ?, ?, ?)",
                [
                    $compte['nom'],
                    $compte['type'],
                    $compte['solde_initial'] ?? 0,
                    $compte['description'] ?? null,
                    $compte['numero_compte'] ?? null,
                    $compte['banque'] ?? null,
                    $compte['actif'] ?? true
                ]
            );
        }
        $imported['comptes'] = count($data['comptes']);

        // Tiers
        foreach ($data['tiers'] as $tiers) {
            $db->insert(
                "INSERT INTO tiers (nom, code, type, contact, telephone, email, adresse, notes, actif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $tiers['nom'],
                    $tiers['code'],
                    $tiers['type'],
                    $tiers['contact'] ?? null,
                    $tiers['telephone'] ?? null,
                    $tiers['email'] ?? null,
                    $tiers['adresse'] ?? null,
                    $tiers['notes'] ?? null,
                    $tiers['actif'] ?? true
                ]
            );
        }
        $imported['tiers'] = count($data['tiers']);

        // Transactions
        foreach ($data['transactions'] as $transaction) {
            $db->insert(
                "INSERT INTO transactions (type, montant, description, date, compte_id, categorie_id, tiers_id, virement_id, numero_piece, notes, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    $transaction['type'],
                    $transaction['montant'],
                    $transaction['description'],
                    $transaction['date'],
                    $transaction['compte_id'],
                    $transaction['categorie_id'] ?? null,
                    $transaction['tiers_id'] ?? null,
                    $transaction['virement_id'] ?? null,
                    $transaction['numero_piece'] ?? null,
                    $transaction['notes'] ?? null,
                    $transaction['created_by'] ?? 'import'
                ]
            );
        }
        $imported['transactions'] = count($data['transactions']);

        // Mettre à jour la date d'import
        $db->insert(
            "INSERT INTO settings (cle, valeur, description) VALUES (?, ?, ?)",
            ['last_import', date('Y-m-d H:i:s'), 'Date du dernier import de données']
        );

        $db->commit();

        return [
            'imported' => $imported,
            'backup_info' => $backup,
            'message' => 'Import terminé avec succès'
        ];

    } catch (Exception $e) {
        $db->rollback();
        throw new Exception("Erreur lors de l'import : " . $e->getMessage());
    }
}

/**
 * Obtenir les informations système
 */
function getSystemInfo($db)
{
    $dbInfo = $db->getDatabaseInfo();

    return [
        'application' => [
            'name' => APP_NAME,
            'version' => '2.0.0',
            'timezone' => date_default_timezone_get()
        ],
        'database' => [
            'version' => $dbInfo['version'],
            'tables' => count($dbInfo['tables']),
            'connection' => $dbInfo['connection_info']
        ],
        'php' => [
            'version' => PHP_VERSION,
            'extensions' => [
                'pdo' => extension_loaded('pdo'),
                'pdo_pgsql' => extension_loaded('pdo_pgsql'),
                'json' => extension_loaded('json'),
                'mbstring' => extension_loaded('mbstring')
            ]
        ],
        'statistics' => [
            'settings' => $db->count('settings'),
            'categories' => $db->count('categories'),
            'comptes' => $db->count('comptes'),
            'tiers' => $db->count('tiers'),
            'transactions' => $db->count('transactions')
        ]
    ];
}

/**
 * Valider les données d'un paramètre
 */
function validateSettingData($data)
{
    $rules = [
        'cle' => ['required' => true, 'type' => 'string', 'max_length' => 100],
        'valeur' => ['required' => false, 'type' => 'string'],
        'description' => ['required' => false, 'type' => 'string', 'max_length' => 1000]
    ];

    return validateInput($data, $rules);
}

/**
 * Formater les données de sortie d'un paramètre
 */
function formatSettingOutput($setting)
{
    return [
        'id' => (int) $setting['id'],
        'cle' => $setting['cle'],
        'valeur' => $setting['valeur'],
        'description' => $setting['description'],
        'created_at' => $setting['created_at'],
        'updated_at' => $setting['updated_at']
    ];
}
