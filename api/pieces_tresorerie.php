<?php
/**
 * API pour la gestion des pièces de trésorerie
 * Table unifiée pour les achats et ventes
 * 
 * Auteur: MiniMax Agent
 * Date: 2025-10-26
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gestion des requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/database.php';
require_once '../classes/Transaction.php';

try {
    $db = getConnection();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';
    $input = json_decode(file_get_contents('php://input'), true) ?? [];

    switch ($method) {
        case 'GET':
            handleGet($db, $action);
            break;
        case 'POST':
            handlePost($db, $input, $action);
            break;
        case 'PUT':
            handlePut($db, $input, $action);
            break;
        case 'DELETE':
            handleDelete($db, $action);
            break;
        default:
            throw new Exception('Méthode non supportée');
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

/**
 * Gestion des requêtes GET
 */
function handleGet($db, $action) {
    switch ($action) {
        case 'list_achats':
            getAchats($db);
            break;
        case 'get_achat':
            $id = $_GET['id'] ?? null;
            getAchat($db, $id);
            break;
        default:
            throw new Exception('Action GET non reconnue');
    }
}

/**
 * Gestion des requêtes POST
 */
function handlePost($db, $input, $action) {
    switch ($action) {
        case 'create_achat':
            createAchat($db, $input);
            break;
        default:
            throw new Exception('Action POST non reconnue');
    }
}

/**
 * Gestion des requêtes PUT
 */
function handlePut($db, $input, $action) {
    switch ($action) {
        case 'update_achat':
            updateAchat($db, $input);
            break;
        default:
            throw new Exception('Action PUT non reconnue');
    }
}

/**
 * Gestion des requêtes DELETE
 */
function handleDelete($db, $action) {
    $id = $_GET['id'] ?? null;
    
    switch ($action) {
        case 'delete_achat':
            deleteAchat($db, $id);
            break;
        default:
            throw new Exception('Action DELETE non reconnue');
    }
}

/**
 * Créer un nouvel achat
 */
function createAchat($db, $data) {
    try {
        // Validation des données requises
        $requiredFields = ['CleTypeDocument', 'CleTiers', 'Label', 'Date', 'MontantHT', 'CleCompte'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field]) || empty($data[$field])) {
                throw new Exception("Le champ '$field' est requis");
            }
        }
        
        // Début de la transaction
        $db->beginTransaction();
        
        // 1. Créer la pièce de trésorerie
        $pieceId = createPiece($db, $data);
        
        // 2. Si l'achat est payé, créer une transaction
        if (in_array($data['CleEtatDocument'] ?? '', ['paye', 'partiellement_paye'])) {
            createTransactionFromAchat($db, $pieceId, $data);
        }
        
        // Validation de la transaction
        $db->commit();
        
        echo json_encode([
            'success' => true, 
            'message' => 'Achat créé avec succès',
            'id' => $pieceId
        ]);
        
    } catch (Exception $e) {
        $db->rollback();
        throw new Exception('Erreur lors de la création de l\'achat: ' . $e->getMessage());
    }
}

/**
 * Créer la pièce de trésorerie
 */
function createPiece($db, $data) {
    $sql = "INSERT INTO pieces_tresorerie (
        CleTypeDocument, CleTiers, CleCompte, Label, Date, DateEcheance, DatePaiement,
        MontantHT, TauxTVA, TotalTVA, MontantTTC, Remise, Timbre,
        Payement, Note, NoteInterne, Reference, MotsCles, CleEtatDocument
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING CleDocument";
    
    $stmt = $db->prepare($sql);
    
    $result = $stmt->execute([
        $data['CleTypeDocument'],
        $data['CleTiers'],
        $data['CleCompte'],
        $data['Label'],
        $data['Date'],
        $data['DateEcheance'] ?? null,
        $data['DatePaiement'] ?? null,
        $data['MontantHT'],
        $data['TauxTVA'] ?? 0,
        $data['TotalTVA'] ?? 0,
        $data['MontantTTC'],
        $data['Remise'] ?? 0,
        $data['Timbre'] ?? 0,
        $data['Payement'] ?? 'especes',
        $data['Note'] ?? null,
        $data['NoteInterne'] ?? null,
        $data['Reference'] ?? null,
        $data['MotsCles'] ?? null,
        $data['CleEtatDocument'] ?? 'a_payer'
    ]);
    
    if (!$result) {
        throw new Exception('Erreur lors de l\'insertion de la pièce');
    }
    
    $pieceId = $stmt->fetch(PDO::FETCH_ASSOC)['CleDocument'];
    return $pieceId;
}

/**
 * Créer une transaction à partir d'un achat
 */
function createTransactionFromAchat($db, $pieceId, $data) {
    $transaction = new Transaction($db);
    
    // Préparer les données de la transaction
    $transactionData = [
        'type' => 'depense',
        'description' => $data['Label'],
        'amount' => $data['MontantTTC'],
        'date' => $data['DatePaiement'] ?? $data['Date'],
        'account_id' => $data['CleCompte'],
        'tiers_id' => $data['CleTiers'],
        'reference' => $data['Reference'],
        'notes' => $data['Note'],
        'payment_method' => $data['Payement'],
        'balance_impact' => -$data['MontantTTC'],
        'bank_status' => 'completed',
        'value_date' => $data['DatePaiement'] ?? $data['Date'],
        'effective_date' => $data['DatePaiement'] ?? $data['Date'],
        'general_comments' => "Achat créé depuis le modal - Pièce ID: " . $pieceId
    ];
    
    $transactionId = $transaction->insertTransaction(
        $transactionData['type'],
        $transactionData['description'],
        $transactionData['amount'],
        $transactionData['date'],
        $transactionData['account_id'],
        $transactionData['tiers_id'],
        null, // category_id
        $transactionData['reference'],
        $transactionData['notes'],
        $transactionData['payment_method'],
        $transactionData['bank_status'],
        $transactionData['value_date'],
        null, // due_date
        $transactionData['effective_date'],
        null, // transfer_ref
        $transactionData['balance_impact'],
        $transactionData['bank_notes'] ?? null,
        $transactionData['general_comments']
    );
    
    return $transactionId;
}

/**
 * Récupérer la liste des achats
 */
function getAchats($db) {
    $sql = "SELECT p.*, t.libelle as tiers_libelle, c.libelle as compte_libelle
            FROM pieces_tresorerie p
            LEFT JOIN tiers t ON p.CleTiers = t.id
            LEFT JOIN comptes c ON p.CleCompte = c.id
            WHERE p.CleTypeDocument = 'facture_achat'
            ORDER BY p.Date DESC";
    
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $achats = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $achats]);
}

/**
 * Récupérer un achat par ID
 */
function getAchat($db, $id) {
    if (!$id) {
        throw new Exception('ID de l\'achat requis');
    }
    
    $sql = "SELECT p.*, t.libelle as tiers_libelle, c.libelle as compte_libelle
            FROM pieces_tresorerie p
            LEFT JOIN tiers t ON p.CleTiers = t.id
            LEFT JOIN comptes c ON p.CleCompte = c.id
            WHERE p.CleDocument = ? AND p.CleTypeDocument = 'facture_achat'";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([$id]);
    $achat = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$achat) {
        throw new Exception('Achat non trouvé');
    }
    
    echo json_encode(['success' => true, 'data' => $achat]);
}

/**
 * Mettre à jour un achat
 */
function updateAchat($db, $data) {
    if (!isset($data['CleDocument'])) {
        throw new Exception('ID de l\'achat requis');
    }
    
    try {
        $sql = "UPDATE pieces_tresorerie SET 
                Label = ?, Date = ?, DateEcheance = ?, MontantHT = ?, 
                TauxTVA = ?, TotalTVA = ?, MontantTTC = ?, Remise = ?, Timbre = ?,
                Payement = ?, Note = ?, Reference = ?, MotsCles = ?,
                CleCompte = ?, CleTiers = ?, LastModifiedDate = CURRENT_TIMESTAMP
                WHERE CleDocument = ? AND CleTypeDocument = 'facture_achat'";
        
        $stmt = $db->prepare($sql);
        
        $result = $stmt->execute([
            $data['Label'],
            $data['Date'],
            $data['DateEcheance'],
            $data['MontantHT'],
            $data['TauxTVA'],
            $data['TotalTVA'],
            $data['MontantTTC'],
            $data['Remise'],
            $data['Timbre'],
            $data['Payement'],
            $data['Note'],
            $data['Reference'],
            $data['MotsCles'],
            $data['CleCompte'],
            $data['CleTiers'],
            $data['CleDocument']
        ]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Achat mis à jour avec succès']);
        } else {
            throw new Exception('Erreur lors de la mise à jour');
        }
        
    } catch (Exception $e) {
        throw new Exception('Erreur: ' . $e->getMessage());
    }
}

/**
 * Supprimer un achat (soft delete)
 */
function deleteAchat($db, $id) {
    if (!$id) {
        throw new Exception('ID de l\'achat requis');
    }
    
    try {
        $sql = "UPDATE pieces_tresorerie SET CleEtatDocument = 'supprime'
                WHERE CleDocument = ? AND CleTypeDocument = 'facture_achat'";
        
        $stmt = $db->prepare($sql);
        $result = $stmt->execute([$id]);
        
        if ($result) {
            echo json_encode(['success' => true, 'message' => 'Achat supprimé avec succès']);
        } else {
            throw new Exception('Erreur lors de la suppression');
        }
        
    } catch (Exception $e) {
        throw new Exception('Erreur: ' . $e->getMessage());
    }
}
?>
 * Gestion des requêtes GET
 */
function handleGet($db, $path) {
    switch ($path) {
        case 'list':
            $pieces = getPiecesList($db);
            echo json_encode(['success' => true, 'data' => $pieces]);
            break;
            
        case 'types':
            $types = [
                'facture_achat' => 'Facture Achat',
                'facture_vente' => 'Facture Vente',
                'avoir_achat' => 'Avoir Achat',
                'avoir_vente' => 'Avoir Vente',
                'paiement' => 'Paiement',
                'recu' => 'Reçu'
            ];
            echo json_encode(['success' => true, 'data' => $types]);
            break;
            
        case 'etats':
            $etats = [
                'brouillon' => 'Brouillon',
                'valide' => 'Validé',
                'payé' => 'Payé',
                'partiellement_payé' => 'Partiellement Payé',
                'annulé' => 'Annulé'
            ];
            echo json_encode(['success' => true, 'data' => $etats]);
            break;
            
        default:
            if (preg_match('/^piece\/([a-f0-9\-]+)$/', $path, $matches)) {
                $piece = getPieceById($db, $matches[1]);
                echo json_encode(['success' => true, 'data' => $piece]);
            } else {
                throw new Exception('Route non trouvée');
            }
    }
}

/**
 * Gestion des requêtes POST
 */
function handlePost($db, $input, $path) {
    switch ($path) {
        case 'create':
            $piece = createPiece($db, $input);
            echo json_encode(['success' => true, 'data' => $piece]);
            break;
            
        case 'create_achat':
            $piece = createAchat($db, $input);
            echo json_encode(['success' => true, 'data' => $piece]);
            break;
            
        default:
            throw new Exception('Route non trouvée');
    }
}

/**
 * Gestion des requêtes PUT
 */
function handlePut($db, $input, $path) {
    if (preg_match('/^piece\/([a-f0-9\-]+)$/', $path, $matches)) {
        $pieceId = $matches[1];
        $piece = updatePiece($db, $pieceId, $input);
        echo json_encode(['success' => true, 'data' => $piece]);
    } else {
        throw new Exception('Route non trouvée');
    }
}

/**
 * Gestion des requêtes DELETE
 */
function handleDelete($db, $path) {
    if (preg_match('/^piece\/([a-f0-9\-]+)$/', $path, $matches)) {
        $pieceId = $matches[1];
        deletePiece($db, $pieceId);
        echo json_encode(['success' => true, 'message' => 'Pièce supprimée']);
    } else {
        throw new Exception('Route non trouvée');
    }
}

/**
 * Récupérer la liste des pièces de trésorerie
 */
function getPiecesList($db) {
    $stmt = $db->prepare("
        SELECT 
            pt.*,
            t.nom as tiers_nom,
            c.nom as compte_nom
        FROM pieces_tresorerie pt
        LEFT JOIN tiers t ON pt.CleTiers = t.id
        LEFT JOIN comptes c ON pt.CleCompte = c.id
        ORDER BY pt.Date DESC, pt.CreateDate DESC
        LIMIT 100
    ");
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Récupérer une pièce par son ID
 */
function getPieceById($db, $id) {
    $stmt = $db->prepare("
        SELECT 
            pt.*,
            t.nom as tiers_nom,
            c.nom as compte_nom
        FROM pieces_tresorerie pt
        LEFT JOIN tiers t ON pt.CleTiers = t.id
        LEFT JOIN comptes c ON pt.CleCompte = c.id
        WHERE pt.CleDocument = ?
    ");
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Créer une nouvelle pièce de trésorerie
 */
function createPiece($db, $input) {
    // Validation des champs obligatoires
    requiredFields($input, ['Label', 'MontantTTC']);
    
    $amount = floatval($input['MontantTTC'] ?? 0);
    
    $stmt = $db->prepare("
        INSERT INTO pieces_tresorerie (
            CleTypeDocument, CleTiers, Reference, Date, Date2, Label, Note,
            MontantHT, RemisePourcent, Remise, TotalTVA, Timbre,
            MontantTTC, Payement, Marge, Cloture, RefAssocie,
            CleUser, CleCommercial, CleMode, CleDevise, TauxChange,
            CleCompte, CleEtatDocument, DateEtat, bModeTTC, BaseRistourne
        ) VALUES (
            :CleTypeDocument, :CleTiers, :Reference, :Date, :Date2, :Label, :Note,
            :MontantHT, :RemisePourcent, :Remise, :TotalTVA, :Timbre,
            :MontantTTC, :Payement, :Marge, :Cloture, :RefAssocie,
            :CleUser, :CleCommercial, :CleMode, :CleDevise, :TauxChange,
            :CleCompte, :CleEtatDocument, :DateEtat, :bModeTTC, :BaseRistourne
        ) RETURNING *
    ");
    
    $params = [
        ':CleTypeDocument' => $input['CleTypeDocument'] ?? 'facture_achat',
        ':CleTiers' => $input['CleTiers'] ?? null,
        ':Reference' => $input['Reference'] ?? null,
        ':Date' => $input['Date'] ?? date('Y-m-d'),
        ':Date2' => $input['Date2'] ?? null,
        ':Label' => $input['Label'],
        ':Note' => $input['Note'] ?? null,
        ':MontantHT' => floatval($input['MontantHT'] ?? $amount / 1.19),
        ':RemisePourcent' => floatval($input['RemisePourcent'] ?? 0),
        ':Remise' => floatval($input['Remise'] ?? 0),
        ':TotalTVA' => floatval($input['TotalTVA'] ?? $amount * 0.19 / 1.19),
        ':Timbre' => floatval($input['Timbre'] ?? 0),
        ':MontantTTC' => $amount,
        ':Payement' => $input['Payement'] ?? null,
        ':Marge' => floatval($input['Marge'] ?? 0),
        ':Cloture' => $input['Cloture'] ?? false,
        ':RefAssocie' => $input['RefAssocie'] ?? null,
        ':CleUser' => $input['CleUser'] ?? null,
        ':CleCommercial' => $input['CleCommercial'] ?? null,
        ':CleMode' => $input['CleMode'] ?? null,
        ':CleDevise' => $input['CleDevise'] ?? 'XAF',
        ':TauxChange' => floatval($input['TauxChange'] ?? 1.0),
        ':CleCompte' => $input['CleCompte'] ?? null,
        ':CleEtatDocument' => $input['CleEtatDocument'] ?? 'brouillon',
        ':DateEtat' => $input['DateEtat'] ?? date('Y-m-d'),
        ':bModeTTC' => $input['bModeTTC'] ?? true,
        ':BaseRistourne' => floatval($input['BaseRistourne'] ?? 0)
    ];
    
    $stmt->execute($params);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Créer un achat (action spécifique pour les achats)
 */
function createAchat($db, $input) {
    // Validation des champs obligatoires pour un achat
    requiredFields($input, ['Label', 'MontantTTC']);
    
    // Conversion de la structure achat vers piece_tresorerie
    $pieceInput = [
        'CleTypeDocument' => 'facture_achat',
        'CleTiers' => $input['CleTiers'] ?? null,
        'Reference' => $input['Reference'] ?? null,
        'Date' => $input['Date'] ?? date('Y-m-d'),
        'Date2' => $input['Date2'] ?? null, // Date d'échéance
        'Label' => $input['Label'],
        'Note' => $input['Note'] ?? null,
        'MontantHT' => $input['MontantHT'] ?? null,
        'RemisePourcent' => $input['RemisePourcent'] ?? 0,
        'Remise' => $input['Remise'] ?? 0,
        'TotalTVA' => $input['TotalTVA'] ?? null,
        'Timbre' => $input['Timbre'] ?? 0,
        'MontantTTC' => $input['MontantTTC'],
        'Payement' => $input['Payement'] ?? $input['mode_paiement'] ?? null,
        'Marge' => null, // Pas applicable pour les achats
        'Cloture' => false,
        'RefAssocie' => $input['RefAssocie'] ?? null,
        'CleUser' => $input['CleUser'] ?? null,
        'CleCommercial' => null,
        'CleMode' => $input['CleMode'] ?? null,
        'CleDevise' => $input['CleDevise'] ?? 'XAF',
        'TauxChange' => floatval($input['TauxChange'] ?? 1.0),
        'CleCompte' => $input['CleCompte'] ?? $input['compte_id'] ?? null,
        'CleEtatDocument' => 'brouillon',
        'DateEtat' => date('Y-m-d'),
        'bModeTTC' => true,
        'BaseRistourne' => null
    ];
    
    return createPiece($db, $pieceInput);
}

/**
 * Mettre à jour une pièce
 */
function updatePiece($db, $id, $input) {
    $fields = [];
    $params = [':id' => $id];
    
    // Construire dynamiquement la requête UPDATE
    foreach ($input as $key => $value) {
        $fields[] = "$key = :$key";
        $params[":$key"] = $value;
    }
    
    if (empty($fields)) {
        throw new Exception('Aucune donnée à mettre à jour');
    }
    
    $sql = "UPDATE pieces_tresorerie SET " . implode(', ', $fields) . " WHERE CleDocument = :id RETURNING *";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Supprimer une pièce
 */
function deletePiece($db, $id) {
    $stmt = $db->prepare("DELETE FROM pieces_tresorerie WHERE CleDocument = ?");
    $stmt->execute([$id]);
}

/**
 * Validation des champs obligatoires
 */
function requiredFields($input, $fields) {
    foreach ($fields as $field) {
        if (!isset($input[$field]) || empty($input[$field])) {
            throw new Exception("Le champ '$field' est obligatoire");
        }
    }
}
?>