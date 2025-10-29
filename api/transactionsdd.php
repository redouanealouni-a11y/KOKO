<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/Transaction.php';

try {
    $transaction = new Transaction();
    $method = $_SERVER['REQUEST_METHOD'];
    $path = $_SERVER['PATH_INFO'] ?? '';

    // Parse input data
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    // GET /api/transactions - Récupérer toutes les transactions
    if ($method === 'GET' && empty($path)) {
        $filters = [];

        if (isset($_GET['search']) && !empty($_GET['search'])) {
            $filters['search'] = $_GET['search'];
        }

        if (isset($_GET['type']) && !empty($_GET['type'])) {
            $filters['type'] = $_GET['type'];
        }

        if (isset($_GET['account_id']) && !empty($_GET['account_id'])) {
            $filters['account_id'] = $_GET['account_id'];
        }

        if (isset($_GET['month']) && !empty($_GET['month'])) {
            $filters['month'] = $_GET['month'];
        }

        if (isset($_GET['date_from']) && !empty($_GET['date_from'])) {
            $filters['date_from'] = $_GET['date_from'];
        }

        if (isset($_GET['date_to']) && !empty($_GET['date_to'])) {
            $filters['date_to'] = $_GET['date_to'];
        }

        if (isset($_GET['limit']) && !empty($_GET['limit'])) {
            $filters['limit'] = intval($_GET['limit']);
        }

        $transactions = $transaction->getAll($filters);

        jsonResponse([
            'success' => true,
            'data' => $transactions,
            'count' => count($transactions)
        ]);
    }

    // GET /api/transactions/stats - Récupérer les statistiques
    elseif ($method === 'GET' && $path === '/stats') {
        $filters = [];

        if (isset($_GET['date_from']) && !empty($_GET['date_from'])) {
            $filters['date_from'] = $_GET['date_from'];
        }

        if (isset($_GET['date_to']) && !empty($_GET['date_to'])) {
            $filters['date_to'] = $_GET['date_to'];
        }

        $stats = $transaction->getStats($filters);

        jsonResponse([
            'success' => true,
            'data' => $stats
        ]);
    }

    // GET /api/transactions/{id} - Récupérer une transaction par ID
    elseif ($method === 'GET' && !empty($path)) {
        $id = trim($path, '/');
        $transactionData = $transaction->getById($id);

        if (!$transactionData) {
            handleError('Transaction non trouvée', 404);
        }

        jsonResponse([
            'success' => true,
            'data' => $transactionData
        ]);
    }

    // POST /api/transactions - Créer une nouvelle transaction
    elseif ($method === 'POST' && empty($path)) {
        if (empty($input)) {
            handleError('Données manquantes', 400);
        }

        $newTransaction = $transaction->create($input);

        jsonResponse([
            'success' => true,
            'message' => 'Transaction créée avec succès',
            'data' => $newTransaction
        ], 201);
    }

    // POST /api/transactions/transfer - Créer un virement
    elseif ($method === 'POST' && $path === '/transfer') {
        if (empty($input)) {
            handleError('Données manquantes', 400);
        }

        $required = ['from_account_id', 'to_account_id', 'amount'];
        $errors = validateRequired($input, $required);

        if (!empty($errors)) {
            handleError(implode(', ', $errors), 400);
        }

        $description = $input['description'] ?? 'Virement de fonds';

        $transfer = $transaction->createTransfer(
            $input['from_account_id'],
            $input['to_account_id'],
            $input['amount'],
            $description
        );

        jsonResponse([
            'success' => true,
            'message' => 'Virement effectué avec succès',
            'data' => $transfer
        ], 201);
    }

    // DELETE /api/transactions/{id} - Supprimer une transaction
    elseif ($method === 'DELETE' && !empty($path)) {
        $id = trim($path, '/');

        $transaction->delete($id);

        jsonResponse([
            'success' => true,
            'message' => 'Transaction supprimée avec succès'
        ]);
    } else {
        handleError('Endpoint non trouvé', 404);
    }

} catch (Exception $e) {
    handleError($e->getMessage(), 500);
}
