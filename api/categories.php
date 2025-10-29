<?php

require_once __DIR__ . '/../config/database.php';

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
    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];
    
    // Gérer les différentes actions via query string ou input
    $action = $_GET['action'] ?? null;
    if (!$action) {
        $input = json_decode(file_get_contents('php://input'), true);
        $action = $input['action'] ?? null;
    }

    // Parse input data
    $input = get_request_input();

    // GET /api/categories - Récupérer toutes les catégories (actives et inactives)
    if ($method === 'GET' && ($action === 'list' || !$action)) {
        $includeInactive = $_GET['include_inactive'] ?? false;
        
        $whereClause = $includeInactive ? "1=1" : "actif = true";
        $categories = $db->fetchAll(
            "SELECT 
                id, 
                code, 
                nom, 
                description, 
                icone, 
                couleur, 
                actif, 
                ordre_affichage,
                created_at,
                updated_at
            FROM categories_pieces_achat 
            WHERE {$whereClause}
            ORDER BY ordre_affichage ASC, nom ASC"
        );

        jsonResponse([
            'success' => true,
            'data' => $categories,
            'count' => count($categories)
        ]);
    }

    // GET /api/categories?id={id} - Récupérer une catégorie par ID
    elseif ($method === 'GET' && !empty($_GET['id'])) {
        $id = $_GET['id'];
        $category = $db->fetchOne(
            "SELECT 
                id, 
                code, 
                nom, 
                description, 
                icone, 
                couleur, 
                actif, 
                ordre_affichage,
                created_at,
                updated_at
            FROM categories_pieces_achat 
            WHERE id = ?",
            [$id]
        );

        if (!$category) {
            handleError('Catégorie non trouvée', 404);
        }

        jsonResponse(['success' => true, 'data' => $category]);
    }

    // POST /api/categories - Créer une nouvelle catégorie
    elseif ($method === 'POST' && (!$action || $action === 'create')) {
        $data = $input;
        
        // Validation des données
        if (empty($data['code']) || empty($data['nom'])) {
            handleError('Le code et le nom sont obligatoires', 400);
        }
        
        // Vérifier que le code n'existe pas déjà
        $existing = $db->fetchOne(
            "SELECT id FROM categories_pieces_achat WHERE code = ?",
            [strtoupper(trim($data['code']))]
        );
        
        if ($existing) {
            handleError('Ce code existe déjà', 409);
        }
        
        // Préparer les données
        $categoryData = [
            'code' => strtoupper(trim($data['code'])),
            'nom' => trim($data['nom']),
            'description' => trim($data['description'] ?? ''),
            'icone' => $data['icone'] ?? 'fas fa-tag',
            'couleur' => $data['couleur'] ?? '#3B82F6',
            'actif' => $data['actif'] ?? true,
            'ordre_affichage' => intval($data['ordre_affichage'] ?? 0)
        ];
        
        // Préparer l'insertion avec toutes les colonnes
        $categoryData['created_at'] = date('Y-m-d H:i:s');
        $categoryData['updated_at'] = date('Y-m-d H:i:s');
        
        // Construire la requête INSERT avec RETURNING id
        $columns = array_keys($categoryData);
        $placeholders = str_repeat('?,', count($categoryData) - 1) . '?';
        $sql = "INSERT INTO categories_pieces_achat (" . implode(', ', $columns) . ") VALUES ($placeholders) RETURNING id";
        
        // Exécuter l'insertion
        $stmt = $db->query($sql, array_values($categoryData));
        $categoryId = $stmt->fetchColumn();
        
        if (!$categoryId) {
            handleError('Erreur lors de la création de la catégorie', 500);
        }
        
        // Récupérer la catégorie créée
        $category = $db->fetchOne(
            "SELECT * FROM categories_pieces_achat WHERE id = ?",
            [$categoryId]
        );
        
        jsonResponse([
            'success' => true,
            'message' => 'Catégorie créée avec succès',
            'data' => $category
        ]);
    }

    // PUT /api/categories - Modifier une catégorie
    elseif ($method === 'PUT' || ($method === 'POST' && $action === 'update')) {
        $data = $input;
        
        if (empty($data['id'])) {
            handleError('ID de la catégorie requis', 400);
        }
        
        $categoryId = $data['id'];
        
        // Vérifier que la catégorie existe
        $existing = $db->fetchOne(
            "SELECT id FROM categories_pieces_achat WHERE id = ?",
            [$categoryId]
        );
        
        if (!$existing) {
            handleError('Catégorie non trouvée', 404);
        }
        
        // Vérifier l'unicité du code (sauf pour la catégorie actuelle)
        if (!empty($data['code'])) {
            $codeExists = $db->fetchOne(
                "SELECT id FROM categories_pieces_achat WHERE code = ? AND id != ?",
                [strtoupper(trim($data['code'])), $categoryId]
            );
            
            if ($codeExists) {
                handleError('Ce code existe déjà', 409);
            }
        }
        
        // Préparer les données de mise à jour
        $updateData = [];
        $allowedFields = ['code', 'nom', 'description', 'icone', 'couleur', 'actif', 'ordre_affichage'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                if ($field === 'code') {
                    $updateData[$field] = strtoupper(trim($data[$field]));
                } elseif ($field === 'ordre_affichage') {
                    $updateData[$field] = intval($data[$field]);
                } elseif ($field === 'actif') {
                    $updateData[$field] = (bool)$data[$field];
                } else {
                    $updateData[$field] = trim($data[$field]);
                }
            }
        }
        
        if (empty($updateData)) {
            handleError('Aucune donnée à mettre à jour', 400);
        }
        
        // Ajouter updated_at
        $updateData['updated_at'] = date('Y-m-d H:i:s');
        
        // Construire la requête UPDATE
        $setParts = [];
        $params = [];
        foreach ($updateData as $column => $value) {
            $setParts[] = "$column = ?";
            $params[] = $value;
        }
        $params[] = $categoryId; // Pour la clause WHERE id = ?
        
        $sql = "UPDATE categories_pieces_achat SET " . implode(', ', $setParts) . " WHERE id = ?";
        
        // Effectuer la mise à jour
        $stmt = $db->execute($sql, $params);
        $rowCount = $stmt->rowCount();
        
        if ($rowCount === 0) {
            handleError('Erreur lors de la mise à jour', 500);
        }
        
        // Récupérer la catégorie mise à jour
        $category = $db->fetchOne(
            "SELECT * FROM categories_pieces_achat WHERE id = ?",
            [$categoryId]
        );
        
        jsonResponse([
            'success' => true,
            'message' => 'Catégorie modifiée avec succès',
            'data' => $category
        ]);
    }

    // POST /api/categories - Basculer le statut actif/inactif
    elseif ($method === 'POST' && $action === 'toggle_status') {
        $data = $input;
        
        if (empty($data['id'])) {
            handleError('ID de la catégorie requis', 400);
        }
        
        $categoryId = $data['id'];
        
        // Récupérer le statut actuel
        $category = $db->fetchOne(
            "SELECT actif FROM categories_pieces_achat WHERE id = ?",
            [$categoryId]
        );
        
        if (!$category) {
            handleError('Catégorie non trouvée', 404);
        }
        
        // Basculer le statut
        $newStatus = !$category['actif'];
        
        $updated = $db->update(
            'categories_pieces_achat',
            ['actif' => $newStatus, 'updated_at' => date('Y-m-d H:i:s')],
            'id = ?',
            [$categoryId]
        );
        
        if (!$updated) {
            handleError('Erreur lors du changement de statut', 500);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Statut modifié avec succès',
            'data' => ['id' => $categoryId, 'actif' => $newStatus]
        ]);
    }

    // DELETE /api/categories - Supprimer une catégorie (soft delete)
    elseif ($method === 'DELETE' || ($method === 'POST' && $action === 'delete')) {
        $data = $input;
        
        if (empty($data['id'])) {
            handleError('ID de la catégorie requis', 400);
        }
        
        $categoryId = $data['id'];
        
        // Soft delete en désactivant la catégorie
        $updated = $db->update(
            'categories_pieces_achat',
            ['actif' => false, 'updated_at' => date('Y-m-d H:i:s')],
            'id = ?',
            [$categoryId]
        );
        
        if (!$updated) {
            handleError('Erreur lors de la suppression', 500);
        }
        
        jsonResponse([
            'success' => true,
            'message' => 'Catégorie supprimée avec succès'
        ]);
    }

    else {
        handleError('Action non supportée', 405);
    }

} catch (Exception $e) {
    error_log('Erreur API Catégories: ' . $e->getMessage());
    handleError('Erreur serveur interne', 500);
}
