<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/Transaction.php';

if (php_sapi_name() !== 'cli') {
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $transactionHandler = new Transaction();
    $method = $_SERVER['REQUEST_METHOD'];

    // Determine the requested path, prioritizing a simple `action` parameter for reliability
    $path = $_SERVER['PATH_INFO'] ?? '';
    if (empty($path) && !empty($_GET['action'])) {
        $path = '/' . $_GET['action'];
    }

    // Parse input data
    $input = get_request_input();

    // Extract ID from path or query parameter
    $id = null;
    if (!empty($_GET['id'])) {
        $id = $_GET['id'];
    } elseif (preg_match('/^\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/', $path, $matches)) {
        $id = $matches[1];
        $path = ''; // Reset path after extracting ID
    }

    // --- Route based on method and path ---

    // POST /api/transactions/transfer - Transfer between accounts
    if ($method === 'POST' && $path === '/transfer') {
        // ✨ Extraire toutes les données supplémentaires
        $extraData = [
            'date' => $input['date'] ?? date('Y-m-d'),
            'reference' => $input['reference'] ?? null,
            'payment_method' => $input['payment_method'] ?? null,
            'value_date' => $input['value_date'] ?? null,
            'execution_date' => $input['execution_date'] ?? null,
            'status' => $input['status'] ?? 'pending',
            'bank_notes' => $input['bank_notes'] ?? null,
            'general_comments' => $input['general_comments'] ?? null
        ];
        
        $result = $transactionHandler->createTransfer(
            $input['from_account_id'] ?? null,
            $input['to_account_id'] ?? null,
            $input['amount'] ?? null,
            $input['description'] ?? 'Virement de fonds',
            $extraData
        );
        
        // Retourner les IDs pour permettre l'upload de documents
        $responseData = [
            'transfer_id' => $result['debit']['transfer_ref'],
            'debit_transaction_id' => $result['debit']['id'],
            'credit_transaction_id' => $result['credit']['id']
        ];
        
        jsonResponse(['success' => true, 'message' => 'Virement effectué avec succès', 'data' => $responseData], 201);
    }

    // GET /api/transactions/stats - Get statistics
    elseif ($method === 'GET' && $path === '/stats') {
        $stats = $transactionHandler->getStats();
        jsonResponse(['success' => true, 'data' => $stats]);
    }

    // GET /api/transactions?id={id} - Get a single transaction
    elseif ($method === 'GET' && $id) {
        $transaction = $transactionHandler->getById($id);
        if (!$transaction) {
            handleError('Transaction non trouvée', 404);
        }
        jsonResponse(['success' => true, 'data' => $transaction]);
    }

    // GET /api/transactions - Get all transactions (with filters)
    elseif ($method === 'GET' && empty($path) && !$id) {
        // Vérifier si on demande les transactions liées à un transfert
        if (!empty($_GET['transfer_ref'])) {
            $transferRef = $_GET['transfer_ref'];
            $transactions = $transactionHandler->getByTransferRef($transferRef);
            jsonResponse(['success' => true, 'data' => $transactions, 'count' => count($transactions)]);
        }
        
        // Filtres standards pour la liste des transactions
        else {
            $filters = [
                'limit'       => $_GET['limit'] ?? 50,
                'search'      => $_GET['search'] ?? '',
                'type'        => $_GET['type'] ?? '',
                'account_id'  => $_GET['account_id'] ?? '',
                'tiers_id'    => $_GET['tiers_id'] ?? '',
                'category_id' => $_GET['category_id'] ?? '',
                'month'       => $_GET['month'] ?? '',
                'date_from'   => $_GET['date_from'] ?? '',
                'date_to'     => $_GET['date_to'] ?? ''
            ];
            $transactions = $transactionHandler->getAll($filters);
            jsonResponse(['success' => true, 'data' => $transactions, 'count' => count($transactions)]);
        }
    }

    // POST /api/transactions - Create new transaction
    elseif ($method === 'POST' && empty($path)) {
        // Gestion spéciale pour les achats
        if (isset($input['action']) && $input['action'] === 'create_achat') {
            // Calculer l'impact sur le solde (négatif pour les dépenses)
            $amount = floatval($input['amount'] ?? 0);
            $balanceImpact = -$amount; // Impact négatif pour les dépenses
            
            // Préparer les données pour l'achat
            $achatData = [
                'type' => 'depense',
                'description' => $input['description'] ?? '',
                'amount' => $amount,
                'date' => $input['date'] ?? date('Y-m-d'),
                'account_id' => $input['account_id'] ?? null,
                'tiers_id' => $input['tiers_id'] ?? null,
                'category_id' => $input['category_id'] ?? null,
                'reference' => $input['reference'] ?? null,
                'payment_method' => $input['payment_method'] ?? null,
                'payment_status' => $input['payment_status'] ?? 'a_payer',
                'payment_date' => $input['payment_date'] ?? null,
                'notes' => $input['notes'] ?? null,
                'due_date' => $input['due_date'] ?? null,
                'bank_status' => 'pending',
                'balance_impact' => $balanceImpact // Valeur numérique, pas chaîne
            ];
            
            // Validation des données requises pour l'achat
            $missing = [];
            if (empty($achatData['description'])) $missing[] = 'description';
            if (empty($achatData['amount'])) $missing[] = 'amount';
            if (empty($achatData['account_id'])) $missing[] = 'account_id';
            if (empty($achatData['date'])) $missing[] = 'date';
            
            if (!empty($missing)) {
                throw new Exception("Données requises manquantes pour l'achat: " . implode(', ', $missing));
            }
            
            // Créer la transaction d'achat
            $newTransaction = $transactionHandler->create($achatData);
            
            // Message de succès spécifique aux achats
            jsonResponse([
                'success' => true, 
                'message' => 'Achat enregistré avec succès', 
                'data' => $newTransaction
            ], 201);
        }
        
        // Gestion standard pour les autres transactions
        else {
            // Calculer l'impact sur le solde si non fourni
            $amount = floatval($input['amount'] ?? 0);
            $type = $input['type'] ?? '';
            
            if (!isset($input['balance_impact']) || $input['balance_impact'] === '') {
                // Calculer automatiquement l'impact basé sur le type
                if ($type === 'depense' || $type === 'virement_debit') {
                    $input['balance_impact'] = -$amount; // Impact négatif
                } elseif ($type === 'recette' || $type === 'virement_credit') {
                    $input['balance_impact'] = $amount; // Impact positif
                }
            }
            
            $newTransaction = $transactionHandler->create($input);
            jsonResponse(['success' => true, 'message' => 'Transaction créée avec succès', 'data' => $newTransaction], 201);
        }
    }

    // PUT /api/transactions?id={id} - Update a transaction
    elseif ($method === 'PUT' && $id) {
        // Calculer l'impact sur le solde si non fourni ou modifié
        if (isset($input['amount']) || isset($input['type'])) {
            $amount = floatval($input['amount'] ?? 0);
            $type = $input['type'] ?? '';
            
            if (!isset($input['balance_impact']) || $input['balance_impact'] === '') {
                // Calculer automatiquement l'impact basé sur le type
                if ($type === 'depense' || $type === 'virement_debit') {
                    $input['balance_impact'] = -$amount; // Impact négatif
                } elseif ($type === 'recette' || $type === 'virement_credit') {
                    $input['balance_impact'] = $amount; // Impact positif
                }
            }
        }
        
        // Validation des données requises
        if (empty($input['account_id']) || empty($input['type']) || empty($input['description']) || empty($input['amount'])) {
            $missing = [];
            if (empty($input['account_id'])) $missing[] = 'account_id';
            if (empty($input['type'])) $missing[] = 'type';
            if (empty($input['description'])) $missing[] = 'description';
            if (empty($input['amount'])) $missing[] = 'amount';
            throw new Exception("Données requises manquantes pour la modification: " . implode(', ', $missing));
        }
        
        $updatedTransaction = $transactionHandler->update($id, $input);
        jsonResponse(['success' => true, 'message' => 'Transaction mise à jour avec succès', 'data' => $updatedTransaction]);
    }

    // DELETE /api/transactions?id={id} - Delete a transaction
    elseif ($method === 'DELETE' && $id) {
        $transactionHandler->delete($id);
        jsonResponse(['success' => true, 'message' => 'Transaction supprimée avec succès']);
    }

    // No route matched
    else {
        handleError('Endpoint non trouvé', 404);
    }

} catch (Exception $e) {
    error_log("Erreur API transactions: " . $e->getMessage());
    handleError($e->getMessage(), 500);
}
