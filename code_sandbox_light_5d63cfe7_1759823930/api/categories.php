<?php

/**
 * API REST - Gestion des catégories
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

    // Router selon la méthode HTTP
    switch ($method) {
        case 'GET':
            handleGet($db, $params);
            break;

        case 'POST':
            handlePost($db, $data);
            break;

        case 'PUT':
            handlePut($db, $data, $params);
            break;

        case 'DELETE':
            handleDelete($db, $params);
            break;

        default:
            jsonError('Méthode HTTP non supportée', 405);
    }

} catch (Exception $e) {
    error_log("Erreur API catégories: " . $e->getMessage());
    jsonError('Erreur serveur: ' . $e->getMessage(), 500);
}

/**
 * Gérer les requêtes GET
 */
function handleGet($db, $params)
{
    // GET /api/categories.php?id=123 - Obtenir une catégorie
    if (isset($params['id'])) {
        try {
            $categorie = $db->queryOne("SELECT * FROM categories WHERE id = ?", [$params['id']]);

            if (!$categorie) {
                jsonError('Catégorie non trouvée', 404);
                return;
            }

            jsonSuccess(formatCategorieOutput($categorie));
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/categories.php?action=stats - Statistiques des catégories
    if (isset($params['action']) && $params['action'] === 'stats') {
        try {
            $sql = "SELECT 
                        c.id,
                        c.nom,
                        c.couleur,
                        COUNT(t.id) as nb_transactions,
                        SUM(CASE WHEN t.type = 'recette' THEN t.montant ELSE 0 END) as total_recettes,
                        SUM(CASE WHEN t.type = 'depense' THEN t.montant ELSE 0 END) as total_depenses,
                        SUM(t.montant) as total_montant,
                        MAX(t.date) as derniere_utilisation
                    FROM categories c
                    LEFT JOIN transactions t ON c.id = t.categorie_id
                    WHERE c.actif = true
                    GROUP BY c.id, c.nom, c.couleur, c.ordre
                    ORDER BY c.ordre, c.nom";

            $stats = $db->query($sql);
            jsonSuccess($stats);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/categories.php - Liste des catégories
    try {
        $where = ['1 = 1'];
        $params_sql = [];

        // Filtrer par statut actif/inactif
        if (isset($params['actif'])) {
            $where[] = "actif = ?";
            $params_sql[] = filter_var($params['actif'], FILTER_VALIDATE_BOOLEAN);
        } else {
            // Par défaut, ne récupérer que les catégories actives
            $where[] = "actif = true";
        }

        // Recherche par nom
        if (!empty($params['search'])) {
            $where[] = "(nom ILIKE ? OR description ILIKE ?)";
            $searchTerm = '%' . $params['search'] . '%';
            $params_sql[] = $searchTerm;
            $params_sql[] = $searchTerm;
        }

        $whereClause = implode(' AND ', $where);

        $sql = "SELECT * FROM categories WHERE " . $whereClause . " ORDER BY ordre, nom";
        $categories = $db->query($sql, $params_sql);

        $result = array_map('formatCategorieOutput', $categories);
        jsonSuccess($result);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes POST
 */
function handlePost($db, $data)
{
    // POST /api/categories.php - Créer une nouvelle catégorie
    try {
        // Validation
        $validation = validateCategorieData($data);
        if (!$validation['valid']) {
            jsonError("Données invalides : " . implode(', ', $validation['errors']), 400);
            return;
        }

        $validData = $validation['data'];

        // Vérifier l'unicité du nom
        if ($db->exists('categories', 'nom = ?', [$validData['nom']])) {
            jsonError('Une catégorie avec ce nom existe déjà', 400);
            return;
        }

        // Déterminer l'ordre (dernier + 1)
        $maxOrdre = $db->queryOne("SELECT COALESCE(MAX(ordre), 0) as max_ordre FROM categories");
        $ordre = $maxOrdre['max_ordre'] + 1;

        $sql = "INSERT INTO categories (nom, couleur, description, ordre) VALUES (?, ?, ?, ?)";
        $params = [
            $validData['nom'],
            $validData['couleur'] ?? '#007bff',
            $validData['description'],
            $ordre
        ];

        $categorieId = $db->insert($sql, $params);

        // Récupérer la catégorie créée
        $categorie = $db->queryOne("SELECT * FROM categories WHERE id = ?", [$categorieId]);

        jsonSuccess(formatCategorieOutput($categorie), 'Catégorie créée avec succès', 201);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes PUT
 */
function handlePut($db, $data, $params)
{
    // PUT /api/categories.php?id=123 - Mettre à jour une catégorie
    if (!isset($params['id'])) {
        jsonError('ID de catégorie requis', 400);
        return;
    }

    try {
        // Vérifier que la catégorie existe
        $existing = $db->queryOne("SELECT * FROM categories WHERE id = ?", [$params['id']]);
        if (!$existing) {
            jsonError('Catégorie non trouvée', 404);
            return;
        }

        // Validation
        $validation = validateCategorieData($data, false);
        if (!$validation['valid']) {
            jsonError("Données invalides : " . implode(', ', $validation['errors']), 400);
            return;
        }

        $validData = $validation['data'];

        // Vérifier l'unicité du nom (sauf pour la catégorie courante)
        if (isset($validData['nom']) && $validData['nom'] !== $existing['nom']) {
            if ($db->exists('categories', 'nom = ? AND id != ?', [$validData['nom'], $params['id']])) {
                jsonError('Une catégorie avec ce nom existe déjà', 400);
                return;
            }
        }

        $fields = [];
        $params_sql = [];

        $allowedFields = ['nom', 'couleur', 'description', 'ordre', 'actif'];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $validData)) {
                $fields[] = "$field = ?";
                $params_sql[] = $validData[$field];
            }
        }

        if (empty($fields)) {
            jsonError('Aucun champ à mettre à jour', 400);
            return;
        }

        $sql = "UPDATE categories SET " . implode(', ', $fields) . " WHERE id = ?";
        $params_sql[] = $params['id'];

        $db->execute($sql, $params_sql);

        // Récupérer la catégorie mise à jour
        $categorie = $db->queryOne("SELECT * FROM categories WHERE id = ?", [$params['id']]);

        jsonSuccess(formatCategorieOutput($categorie), 'Catégorie mise à jour avec succès');

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes DELETE
 */
function handleDelete($db, $params)
{
    // DELETE /api/categories.php?id=123 - Supprimer une catégorie
    if (!isset($params['id'])) {
        jsonError('ID de catégorie requis', 400);
        return;
    }

    try {
        // Vérifier que la catégorie existe
        $existing = $db->queryOne("SELECT * FROM categories WHERE id = ?", [$params['id']]);
        if (!$existing) {
            jsonError('Catégorie non trouvée', 404);
            return;
        }

        // Vérifier qu'il n'y a pas de transactions liées
        $nbTransactions = $db->count('transactions', 'categorie_id = ?', [$params['id']]);
        if ($nbTransactions > 0) {
            // Ne pas supprimer physiquement, juste désactiver
            $db->execute("UPDATE categories SET actif = false WHERE id = ?", [$params['id']]);
            jsonSuccess(['message' => 'Catégorie désactivée (transactions existantes)']);
            return;
        }

        // Suppression physique possible
        $result = $db->execute("DELETE FROM categories WHERE id = ?", [$params['id']]);

        if ($result === 0) {
            jsonError('Aucune catégorie supprimée', 400);
            return;
        }

        jsonSuccess(['message' => 'Catégorie supprimée avec succès']);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Valider les données d'une catégorie
 */
function validateCategorieData($data, $required = true)
{
    $rules = [
        'nom' => ['required' => $required, 'type' => 'string', 'max_length' => 100],
        'couleur' => ['required' => false, 'type' => 'string', 'max_length' => 7],
        'description' => ['required' => false, 'type' => 'string', 'max_length' => 1000],
        'ordre' => ['required' => false, 'type' => 'integer'],
        'actif' => ['required' => false, 'type' => 'boolean']
    ];

    $validation = validateInput($data, $rules);

    // Validation spécifique pour la couleur hexadécimale
    if (!empty($validation['data']['couleur'])) {
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $validation['data']['couleur'])) {
            $validation['valid'] = false;
            $validation['errors'][] = 'La couleur doit être au format hexadécimal (#RRGGBB)';
        }
    }

    return $validation;
}

/**
 * Formater les données de sortie d'une catégorie
 */
function formatCategorieOutput($categorie)
{
    return [
        'id' => (int) $categorie['id'],
        'nom' => $categorie['nom'],
        'couleur' => $categorie['couleur'],
        'description' => $categorie['description'],
        'ordre' => (int) $categorie['ordre'],
        'actif' => (bool) $categorie['actif'],
        'created_at' => $categorie['created_at'],
        'updated_at' => $categorie['updated_at']
    ];
}
