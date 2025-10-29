<?php

/**
 * API REST - Gestion des comptes
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
    require_once __DIR__ . '/../classes/Compte.php';

    $compte = new Compte();
    $method = $_SERVER['REQUEST_METHOD'];

    // Récupérer les paramètres GET
    $params = $_GET;

    // Récupérer les données POST/PUT
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];

    // Router selon la méthode HTTP
    switch ($method) {
        case 'GET':
            handleGet($compte, $params);
            break;

        case 'POST':
            handlePost($compte, $data);
            break;

        case 'PUT':
            handlePut($compte, $data, $params);
            break;

        case 'DELETE':
            handleDelete($compte, $params);
            break;

        default:
            jsonError('Méthode HTTP non supportée', 405);
    }

} catch (Exception $e) {
    error_log("Erreur API comptes: " . $e->getMessage());
    jsonError('Erreur serveur: ' . $e->getMessage(), 500);
}

/**
 * Gérer les requêtes GET
 */
function handleGet($compte, $params)
{
    // GET /api/comptes.php?id=123 - Obtenir un compte
    if (isset($params['id'])) {
        try {
            $result = $compte->getById($params['id']);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 404);
        }
        return;
    }

    // GET /api/comptes.php?id=123&action=stats - Statistiques d'un compte
    if (isset($params['id']) && isset($params['action']) && $params['action'] === 'stats') {
        try {
            $periode = $params['periode'] ?? null;
            $result = $compte->getStatistiques($params['id'], $periode);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/comptes.php?id=123&action=historique - Historique d'un compte
    if (isset($params['id']) && isset($params['action']) && $params['action'] === 'historique') {
        try {
            $limite = (int)($params['limit'] ?? 50);
            $result = $compte->getHistorique($params['id'], $limite);
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/comptes.php?action=resume - Résumé de tous les comptes
    if (isset($params['action']) && $params['action'] === 'resume') {
        try {
            $result = $compte->getResume();
            jsonSuccess($result);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/comptes.php?id=123&action=solde&date=YYYY-MM-DD - Solde à une date
    if (isset($params['id']) && isset($params['action']) && $params['action'] === 'solde') {
        try {
            $date = $params['date'] ?? date('Y-m-d');
            $solde = $compte->getSoldeAuDate($params['id'], $date);
            jsonSuccess(['solde' => $solde, 'date' => $date]);
        } catch (Exception $e) {
            jsonError($e->getMessage(), 400);
        }
        return;
    }

    // GET /api/comptes.php - Liste des comptes
    try {
        $filters = [
            'type' => $params['type'] ?? null,
            'search' => $params['search'] ?? null
        ];

        $result = $compte->getList($filters);
        jsonSuccess($result);

    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes POST
 */
function handlePost($compte, $data)
{
    // POST /api/comptes.php - Créer un nouveau compte
    try {
        $result = $compte->create($data);
        jsonSuccess($result, 'Compte créé avec succès', 201);
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes PUT
 */
function handlePut($compte, $data, $params)
{
    // PUT /api/comptes.php?id=123 - Mettre à jour un compte
    if (!isset($params['id'])) {
        jsonError('ID de compte requis', 400);
        return;
    }

    try {
        $result = $compte->update($params['id'], $data);
        jsonSuccess($result, 'Compte mis à jour avec succès');
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}

/**
 * Gérer les requêtes DELETE
 */
function handleDelete($compte, $params)
{
    // DELETE /api/comptes.php?id=123 - Supprimer un compte
    if (!isset($params['id'])) {
        jsonError('ID de compte requis', 400);
        return;
    }

    try {
        $result = $compte->delete($params['id']);
        jsonSuccess($result);
    } catch (Exception $e) {
        jsonError($e->getMessage(), 400);
    }
}
