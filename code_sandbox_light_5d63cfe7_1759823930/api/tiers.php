<?php

/**
 * API REST - Gestion des tiers (clients et fournisseurs)
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
    require_once __DIR__ . '/../classes/Tiers.php';

    $tiers = new Tiers();
    $method = $_SERVER['REQUEST_METHOD'];

    // Récupérer les paramètres GET
    $params = $_GET;

    // Récupérer les données POST/PUT
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];

    // Router selon la méthode HTTP
    switch ($method) {
        case 'GET':
            handleGet($tiers, $params);
            break;

        case 'POST':
            handlePost($tiers, $data);
            break;

        case 'PUT':
            handlePut($tiers, $data, $params);
            break;

        case 'DELETE':
            handleDelete($tiers, $params);
            break;

        default:
            jsonError('Méthode HTTP non supportée', 405);
    }

} catch (Exception $e) {
    error_log("Erreur API tiers: " . $e->getMessage());
    jsonError('Erreur serveur: ' . $e->getMessage(), 500);
}

/**
 * Gérer les requêtes GET
 */
function handleGet($tiers, $params)
{
    // GET /api/tiers.php?id=123 - Obtenir un tiers
    if (isset($params['id'])) {
        try {
            $result = $tiers->getById($params['id']);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 404);
        }
        return;
    }

    // GET /api/tiers.php?code=ABC123 - Obtenir un tiers par code
    if (isset($params['code'])) {
        try {
            $result = $tiers->getByCode($params['code']);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 404);
        }
        return;
    }

    // GET /api/tiers.php?action=search - Recherche de tiers
    if (isset($params['action']) && $params['action'] === 'search') {
        try {
            $terme = $params['q'] ?? $params['search'] ?? '';
            $type = $params['type'] ?? null;
            $limite = (int)($params['limit'] ?? 20);

            $result = $tiers->search($terme, $type, $limite);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/tiers.php?id=123&action=historique - Historique d'un tiers
    if (isset($params['id']) && isset($params['action']) && $params['action'] === 'historique') {
        try {
            $limite = (int)($params['limit'] ?? 50);
            $result = $tiers->getHistorique($params['id'], $limite);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/tiers.php?id=123&action=stats - Statistiques d'un tiers
    if (isset($params['id']) && isset($params['action']) && $params['action'] === 'stats') {
        try {
            $periode = $params['periode'] ?? null;
            $result = $tiers->getStatistiques($params['id'], $periode);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/tiers.php?action=resume - Résumé de tous les tiers
    if (isset($params['action']) && $params['action'] === 'resume') {
        try {
            $result = $tiers->getResume();
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/tiers.php - Liste des tiers
    try {
        $filters = [
            'type' => $params['type'] ?? null,
            'search' => $params['search'] ?? null
        ];

        $result = $tiers->getList($filters);
        jsonSuccess($result);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes POST
 */
function handlePost($tiers, $data)
{
    // POST /api/tiers.php - Créer un nouveau tiers
    try {
        $result = $tiers->create($data);
        jsonSuccess($result, 'Tiers créé avec succès', 201);
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes PUT
 */
function handlePut($tiers, $data, $params)
{
    // PUT /api/tiers.php?id=123 - Mettre à jour un tiers
    if (!isset($params['id'])) {
        jsonError('ID de tiers requis', 400);
        return;
    }

    try {
        $result = $tiers->update($params['id'], $data);
        jsonSuccess($result, 'Tiers mis à jour avec succès');
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes DELETE
 */
function handleDelete($tiers, $params)
{
    // DELETE /api/tiers.php?id=123 - Supprimer un tiers
    if (!isset($params['id'])) {
        jsonError('ID de tiers requis', 400);
        return;
    }

    try {
        $result = $tiers->delete($params['id']);
        jsonSuccess($result);
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}
