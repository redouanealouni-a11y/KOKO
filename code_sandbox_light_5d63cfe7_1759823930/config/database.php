<?php

/**
 * Configuration et classe de connexion à la base de données PostgreSQL
 * Gestion de Caisse Régie - Version 2.0.0
 */

// Configuration par défaut (peut être surchargée par config_local.php)
if (!defined('DB_HOST')) {
    define('DB_HOST', 'localhost');
}
if (!defined('DB_PORT')) {
    define('DB_PORT', '5432');
}
if (!defined('DB_NAME')) {
    define('DB_NAME', 'caisse_regie');
}
if (!defined('DB_USER')) {
    define('DB_USER', 'postgres');
}
if (!defined('DB_PASS')) {
    define('DB_PASS', 'admin');
}

// Configuration application
if (!defined('APP_NAME')) {
    define('APP_NAME', 'Gestion de Caisse Régie');
}
if (!defined('APP_DEBUG')) {
    define('APP_DEBUG', false);
}
if (!defined('APP_TIMEZONE')) {
    define('APP_TIMEZONE', 'Europe/Paris');
}

// Configuration des erreurs
if (APP_DEBUG) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
    ini_set('log_errors', 1);
    ini_set('error_log', __DIR__ . '/../logs/php_errors.log');
}

// Fuseau horaire
date_default_timezone_set(APP_TIMEZONE);

/**
 * Classe de gestion de la base de données PostgreSQL
 */
class Database
{
    private static $instance = null;
    private $pdo;
    private $host;
    private $port;
    private $dbname;
    private $username;
    private $password;

    /**
     * Constructeur privé pour le pattern Singleton
     */
    private function __construct()
    {
        $this->host = DB_HOST;
        $this->port = DB_PORT;
        $this->dbname = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;

        $this->connect();
    }

    /**
     * Obtenir l'instance unique de Database (Singleton)
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Établir la connexion à PostgreSQL
     */
    private function connect()
    {
        try {
            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->dbname}";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::ATTR_PERSISTENT => false
            ];

            $this->pdo = new PDO($dsn, $this->username, $this->password, $options);

            // Configuration PostgreSQL pour UTF-8
            $this->pdo->exec("SET NAMES 'UTF8'");

            $this->logMessage("Connexion à la base de données établie avec succès");
        } catch (PDOException $e) {
            $this->logError("Erreur de connexion à la base de données", $e);
            throw new Exception("Impossible de se connecter à la base de données");
        }
    }

    /**
     * Obtenir la connexion PDO
     */
    public function getConnection()
    {
        return $this->pdo;
    }

    /**
     * Exécuter une requête SELECT avec paramètres
     */
    public function query($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            $this->logError("Erreur lors de l'exécution de la requête SELECT", $e, $sql);
            throw new Exception("Erreur lors de l'exécution de la requête");
        }
    }

    /**
     * Exécuter une requête SELECT et récupérer une seule ligne
     */
    public function queryOne($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt->fetch();
        } catch (PDOException $e) {
            $this->logError("Erreur lors de l'exécution de la requête SELECT ONE", $e, $sql);
            throw new Exception("Erreur lors de l'exécution de la requête");
        }
    }

    /**
     * Exécuter une requête INSERT/UPDATE/DELETE
     */
    public function execute($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $result = $stmt->execute($params);
            return $stmt->rowCount();
        } catch (PDOException $e) {
            $this->logError("Erreur lors de l'exécution de la requête", $e, $sql);
            throw new Exception("Erreur lors de l'exécution de la requête");
        }
    }

    /**
     * Exécuter une requête INSERT et retourner l'ID généré
     */
    public function insert($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $this->pdo->lastInsertId();
        } catch (PDOException $e) {
            $this->logError("Erreur lors de l'insertion", $e, $sql);
            throw new Exception("Erreur lors de l'insertion des données");
        }
    }

    /**
     * Commencer une transaction
     */
    public function beginTransaction()
    {
        return $this->pdo->beginTransaction();
    }

    /**
     * Valider une transaction
     */
    public function commit()
    {
        return $this->pdo->commit();
    }

    /**
     * Annuler une transaction
     */
    public function rollback()
    {
        return $this->pdo->rollback();
    }

    /**
     * Vérifier si une transaction est active
     */
    public function inTransaction()
    {
        return $this->pdo->inTransaction();
    }

    /**
     * Compter les enregistrements
     */
    public function count($table, $where = '', $params = [])
    {
        $sql = "SELECT COUNT(*) as total FROM {$table}";
        if ($where) {
            $sql .= " WHERE {$where}";
        }

        $result = $this->queryOne($sql, $params);
        return (int) $result['total'];
    }

    /**
     * Vérifier si un enregistrement existe
     */
    public function exists($table, $where, $params = [])
    {
        return $this->count($table, $where, $params) > 0;
    }

    /**
     * Logger un message d'information
     */
    private function logMessage($message)
    {
        if (APP_DEBUG) {
            error_log("[DB INFO] " . date('Y-m-d H:i:s') . " - " . $message);
        }
    }

    /**
     * Logger une erreur
     */
    private function logError($message, $exception, $sql = null)
    {
        $errorMessage = "[DB ERROR] " . date('Y-m-d H:i:s') . " - " . $message;
        $errorMessage .= " - Exception: " . $exception->getMessage();

        if ($sql) {
            $errorMessage .= " - SQL: " . $sql;
        }

        error_log($errorMessage);
    }

    /**
     * Tester la connexion à la base de données
     */
    public function testConnection()
    {
        try {
            $result = $this->queryOne("SELECT version() as version");
            return [
                'success' => true,
                'version' => $result['version'],
                'message' => 'Connexion à la base de données réussie'
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Échec de la connexion à la base de données'
            ];
        }
    }

    /**
     * Obtenir des informations sur la base de données
     */
    public function getDatabaseInfo()
    {
        try {
            $version = $this->queryOne("SELECT version() as version");
            $tables = $this->query("
                SELECT table_name, table_type 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            ");

            return [
                'version' => $version['version'],
                'tables' => $tables,
                'connection_info' => [
                    'host' => $this->host,
                    'port' => $this->port,
                    'database' => $this->dbname,
                    'user' => $this->username
                ]
            ];
        } catch (Exception $e) {
            throw new Exception("Impossible d'obtenir les informations de la base de données");
        }
    }
}

/**
 * Fonctions utilitaires globales
 */

/**
 * Obtenir une instance de la base de données
 */
function getDatabase()
{
    return Database::getInstance();
}

/**
 * Valider et nettoyer une chaîne de caractères
 */
function sanitizeString($str, $maxLength = 255)
{
    if ($str === null) {
        return null;
    }
    $str = trim(strip_tags($str));
    return substr($str, 0, $maxLength);
}

/**
 * Valider un nombre décimal
 */
function validateDecimal($value, $min = null, $max = null)
{
    if (!is_numeric($value)) {
        return false;
    }

    $value = (float) $value;

    if ($min !== null && $value < $min) {
        return false;
    }

    if ($max !== null && $value > $max) {
        return false;
    }

    return $value;
}

/**
 * Valider une date au format Y-m-d
 */
function validateDate($date)
{
    if (!$date) {
        return false;
    }

    $d = DateTime::createFromFormat('Y-m-d', $date);
    return $d && $d->format('Y-m-d') === $date;
}

/**
 * Formater un montant avec la devise
 */
function formatAmount($amount, $currency = 'EUR')
{
    $symbols = [
        'EUR' => '€',
        'USD' => '$',
        'GBP' => '£',
        'CHF' => 'CHF'
    ];

    $symbol = isset($symbols[$currency]) ? $symbols[$currency] : $currency;
    return number_format($amount, 2, ',', ' ') . ' ' . $symbol;
}

/**
 * Générer un code unique pour un tiers
 */
function generateTiersCode($type, $nom)
{
    $prefix = strtoupper(substr($type, 0, 1)); // C pour Client, F pour Fournisseur
    $nomCode = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', $nom), 0, 3));
    $timestamp = substr(time(), -4); // 4 derniers chiffres du timestamp

    return $prefix . $nomCode . $timestamp;
}

/**
 * Valider un email
 */
function validateEmail($email)
{
    if (!$email) {
        return true;
    } // Email optionnel
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Générer une réponse JSON standardisée
 */
function jsonResponse($success, $data = null, $message = '', $httpCode = 200)
{
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');

    $response = [
        'success' => $success,
        'timestamp' => date('Y-m-d H:i:s')
    ];

    if ($message) {
        $response['message'] = $message;
    }

    if ($success && $data !== null) {
        $response['data'] = $data;
    } elseif (!$success && $data !== null) {
        $response['error'] = $data;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Générer une réponse d'erreur JSON
 */
function jsonError($message, $httpCode = 400, $details = null)
{
    jsonResponse(false, $details, $message, $httpCode);
}

/**
 * Générer une réponse de succès JSON
 */
function jsonSuccess($data = null, $message = '', $httpCode = 200)
{
    jsonResponse(true, $data, $message, $httpCode);
}

/**
 * Valider les données d'entrée selon des règles
 */
function validateInput($data, $rules)
{
    $errors = [];
    $validatedData = [];

    foreach ($rules as $field => $rule) {
        $value = isset($data[$field]) ? $data[$field] : null;

        // Vérifier si le champ est requis
        if (isset($rule['required']) && $rule['required'] && empty($value)) {
            $errors[] = "Le champ '$field' est requis";
            continue;
        }

        // Si la valeur est vide et non requise, passer au champ suivant
        if (empty($value) && (!isset($rule['required']) || !$rule['required'])) {
            $validatedData[$field] = null;
            continue;
        }

        // Validation selon le type
        switch ($rule['type']) {
            case 'string':
                $maxLength = isset($rule['max_length']) ? $rule['max_length'] : 255;
                $validatedData[$field] = sanitizeString($value, $maxLength);
                break;

            case 'decimal':
                $min = isset($rule['min']) ? $rule['min'] : null;
                $max = isset($rule['max']) ? $rule['max'] : null;
                $validated = validateDecimal($value, $min, $max);

                if ($validated === false) {
                    $errors[] = "Le champ '$field' doit être un nombre valide";
                } else {
                    $validatedData[$field] = $validated;
                }
                break;

            case 'integer':
                if (!is_numeric($value) || (int)$value != $value) {
                    $errors[] = "Le champ '$field' doit être un nombre entier";
                } else {
                    $validatedData[$field] = (int)$value;
                }
                break;

            case 'date':
                if (!validateDate($value)) {
                    $errors[] = "Le champ '$field' doit être une date valide (YYYY-MM-DD)";
                } else {
                    $validatedData[$field] = $value;
                }
                break;

            case 'email':
                if (!validateEmail($value)) {
                    $errors[] = "Le champ '$field' doit être un email valide";
                } else {
                    $validatedData[$field] = sanitizeString($value);
                }
                break;

            case 'enum':
                if (!in_array($value, $rule['values'])) {
                    $errors[] = "Le champ '$field' doit être l'une des valeurs: " . implode(', ', $rule['values']);
                } else {
                    $validatedData[$field] = $value;
                }
                break;

            default:
                $validatedData[$field] = sanitizeString($value);
        }
    }

    return [
        'valid' => empty($errors),
        'errors' => $errors,
        'data' => $validatedData
    ];
}

// Initialiser les dossiers nécessaires
$logsDir = __DIR__ . '/../logs';
if (!is_dir($logsDir)) {
    mkdir($logsDir, 0755, true);
}

// Charger la configuration locale si elle existe
$configLocal = __DIR__ . '/config_local.php';
if (file_exists($configLocal)) {
    require_once $configLocal;
}
