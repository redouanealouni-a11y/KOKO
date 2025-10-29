<?php

/**
 * API REST - Gestion des transactions
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
    // Charger la configuration et les classes
    require_once __DIR__ . '/../config/database.php';
    require_once __DIR__ . '/../classes/Transaction.php';

    $transaction = new Transaction();
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['REQUEST_URI'];

    // Récupérer les paramètres GET
    $params = $_GET;

    // Récupérer les données POST/PUT
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];

    // Router selon la méthode HTTP
    switch ($method) {
        case 'GET':
            handleGet($transaction, $params);
            break;

        case 'POST':
            handlePost($transaction, $data, $params);
            break;

        case 'PUT':
            handlePut($transaction, $data, $params);
            break;

        case 'DELETE':
            handleDelete($transaction, $params);
            break;

        default:
            jsonError('Méthode HTTP non supportée', 405);
    }

} catch (Exception $e) {
    error_log("Erreur API transactions: " . $e->getMessage());
    jsonError('Erreur serveur: ' . $e->getMessage(), 500);
}

/**
 * Gérer les requêtes GET
 */
function handleGet($transaction, $params)
{
    // GET /api/transactions.php?id=123 - Obtenir une transaction
    if (isset($params['id'])) {
        try {
            $result = $transaction->getById($params['id']);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 404);
        }
        return;
    }

    // GET /api/transactions.php?action=stats - Statistiques
    if (isset($params['action']) && $params['action'] === 'stats') {
        try {
            $filters = [
                'compte_id' => $params['compte_id'] ?? null,
                'date_debut' => $params['date_debut'] ?? null,
                'date_fin' => $params['date_fin'] ?? null
            ];

            $result = $transaction->getStatistiques($filters);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/transactions.php - Liste des transactions
    try {
        $filters = [
            'type' => $params['type'] ?? null,
            'compte_id' => $params['compte_id'] ?? null,
            'categorie_id' => $params['categorie_id'] ?? null,
            'tiers_id' => $params['tiers_id'] ?? null,
            'date_debut' => $params['date_debut'] ?? null,
            'date_fin' => $params['date_fin'] ?? null,
            'montant_min' => $params['montant_min'] ?? null,
            'montant_max' => $params['montant_max'] ?? null,
            'search' => $params['search'] ?? null
        ];

        $page = max(1, (int)($params['page'] ?? 1));
        $limit = min(100, max(1, (int)($params['limit'] ?? 20)));

        $result = $transaction->getList($filters, $page, $limit);
        jsonSuccess($result);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes POST
 */
function handlePost($transaction, $data, $params)
{
    // POST /api/transactions.php?action=transfer - Virement de fonds
    if (isset($params['action']) && $params['action'] === 'transfer') {
        try {
            $result = $transaction->createVirement($data);
            jsonSuccess($result, 'Virement effectué avec succès', 201);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // POST /api/transactions.php - Créer une nouvelle transaction
    try {
        $result = $transaction->create($data);
        jsonSuccess($result, 'Transaction créée avec succès', 201);
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes PUT
 */
function handlePut($transaction, $data, $params)
{
    // PUT /api/transactions.php?id=123 - Mettre à jour une transaction
    if (!isset($params['id'])) {
        jsonError('ID de transaction requis', 400);
        return;
    }

    try {
        $result = $transaction->update($params['id'], $data);
        jsonSuccess($result, 'Transaction mise à jour avec succès');
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes DELETE
 */
function handleDelete($transaction, $params)
{
    // DELETE /api/transactions.php?id=123 - Supprimer une transaction
    if (!isset($params['id'])) {
        jsonError('ID de transaction requis', 400);
        return;
    }

    try {
        $result = $transaction->delete($params['id']);
        jsonSuccess($result, 'Transaction supprimée avec succès');
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}
