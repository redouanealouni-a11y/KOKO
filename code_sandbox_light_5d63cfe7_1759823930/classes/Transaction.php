<?php

/**
 * Classe Transaction - Gestion des transactions financières
 * Gestion de Caisse Régie - Version 2.0.0
 */

require_once __DIR__ . '/../config/database.php';

class Transaction
{
    private $db;

    public function __construct()
    {
        $this->db = getDatabase();
    }

    /**
     * Créer une nouvelle transaction
     */
    public function create($data)
    {
        // Validation des données
        $validation = $this->validateTransactionData($data);
        if (!$validation['valid']) {
            throw new Exception("Données invalides : " . implode(', ', $validation['errors']));
        }

        $validData = $validation['data'];

        // Vérifier que le compte existe et est actif
        if (!$this->isCompteValid($validData['compte_id'])) {
            throw new Exception("Le compte spécifié n'existe pas ou n'est pas actif");
        }

        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO transactions (type, montant, description, date, compte_id, categorie_id, tiers_id, numero_piece, notes, created_by) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $params = [
                $validData['type'],
                $validData['montant'],
                $validData['description'],
                $validData['date'],
                $validData['compte_id'],
                $validData['categorie_id'],
                $validData['tiers_id'],
                $validData['numero_piece'],
                $validData['notes'],
                $validData['created_by'] ?? 'system'
            ];

            $transactionId = $this->db->insert($sql, $params);

            $this->db->commit();

            return $this->getById($transactionId);

        } catch (Exception $e) {
            $this->db->rollback();
            throw new Exception("Erreur lors de la création de la transaction : " . $e->getMessage());
        }
    }

    /**
     * Effectuer un virement entre deux comptes
     */
    public function createVirement($data)
    {
        // Validation des données de virement
        $validation = $this->validateVirementData($data);
        if (!$validation['valid']) {
            throw new Exception("Données invalides : " . implode(', ', $validation['errors']));
        }

        $validData = $validation['data'];

        // Vérifier que les comptes existent et sont différents
        if (!$this->isCompteValid($validData['compte_source'])) {
            throw new Exception("Le compte source n'existe pas ou n'est pas actif");
        }

        if (!$this->isCompteValid($validData['compte_destination'])) {
            throw new Exception("Le compte destination n'existe pas ou n'est pas actif");
        }

        if ($validData['compte_source'] == $validData['compte_destination']) {
            throw new Exception("Le compte source et destination ne peuvent pas être identiques");
        }

        try {
            $this->db->beginTransaction();

            // Créer la transaction de débit (sortie du compte source)
            $sqlDebit = "INSERT INTO transactions (type, montant, description, date, compte_id, numero_piece, notes, created_by) 
                         VALUES ('depense', ?, ?, ?, ?, ?, ?, ?)";

            $paramsDebit = [
                $validData['montant'],
                $validData['description'] . ' (Débit virement)',
                $validData['date'],
                $validData['compte_source'],
                $validData['numero_piece'],
                $validData['notes'],
                $validData['created_by'] ?? 'system'
            ];

            $debitId = $this->db->insert($sqlDebit, $paramsDebit);

            // Créer la transaction de crédit (entrée du compte destination)
            $sqlCredit = "INSERT INTO transactions (type, montant, description, date, compte_id, virement_id, numero_piece, notes, created_by) 
                          VALUES ('recette', ?, ?, ?, ?, ?, ?, ?, ?)";

            $paramsCredit = [
                $validData['montant'],
                $validData['description'] . ' (Crédit virement)',
                $validData['date'],
                $validData['compte_destination'],
                $debitId,
                $validData['numero_piece'],
                $validData['notes'],
                $validData['created_by'] ?? 'system'
            ];

            $creditId = $this->db->insert($sqlCredit, $paramsCredit);

            // Mettre à jour la transaction de débit avec la référence du crédit
            $this->db->execute(
                "UPDATE transactions SET virement_id = ? WHERE id = ?",
                [$creditId, $debitId]
            );

            $this->db->commit();

            return [
                'debit' => $this->getById($debitId),
                'credit' => $this->getById($creditId),
                'message' => 'Virement effectué avec succès'
            ];

        } catch (Exception $e) {
            $this->db->rollback();
            throw new Exception("Erreur lors du virement : " . $e->getMessage());
        }
    }

    /**
     * Obtenir une transaction par son ID
     */
    public function getById($id)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de transaction invalide");
        }

        $sql = "SELECT t.*, 
                       c.nom as compte_nom, c.type as compte_type,
                       cat.nom as categorie_nom, cat.couleur as categorie_couleur,
                       tier.nom as tiers_nom, tier.type as tiers_type, tier.code as tiers_code
                FROM transactions t
                LEFT JOIN comptes c ON t.compte_id = c.id
                LEFT JOIN categories cat ON t.categorie_id = cat.id
                LEFT JOIN tiers tier ON t.tiers_id = tier.id
                WHERE t.id = ?";

        $transaction = $this->db->queryOne($sql, [$id]);

        if (!$transaction) {
            throw new Exception("Transaction non trouvée");
        }

        return $this->formatTransactionOutput($transaction);
    }

    /**
     * Lister les transactions avec filtres et pagination
     */
    public function getList($filters = [], $page = 1, $limit = 20)
    {
        $where = ['1 = 1'];
        $params = [];

        // Filtres
        if (!empty($filters['type'])) {
            $where[] = "t.type = ?";
            $params[] = $filters['type'];
        }

        if (!empty($filters['compte_id'])) {
            $where[] = "t.compte_id = ?";
            $params[] = $filters['compte_id'];
        }

        if (!empty($filters['categorie_id'])) {
            $where[] = "t.categorie_id = ?";
            $params[] = $filters['categorie_id'];
        }

        if (!empty($filters['tiers_id'])) {
            $where[] = "t.tiers_id = ?";
            $params[] = $filters['tiers_id'];
        }

        if (!empty($filters['date_debut'])) {
            $where[] = "t.date >= ?";
            $params[] = $filters['date_debut'];
        }

        if (!empty($filters['date_fin'])) {
            $where[] = "t.date <= ?";
            $params[] = $filters['date_fin'];
        }

        if (!empty($filters['montant_min'])) {
            $where[] = "t.montant >= ?";
            $params[] = $filters['montant_min'];
        }

        if (!empty($filters['montant_max'])) {
            $where[] = "t.montant <= ?";
            $params[] = $filters['montant_max'];
        }

        if (!empty($filters['search'])) {
            $where[] = "(t.description ILIKE ? OR t.notes ILIKE ? OR t.numero_piece ILIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = implode(' AND ', $where);

        // Compter le total
        $countSql = "SELECT COUNT(*) as total FROM transactions t WHERE " . $whereClause;
        $totalResult = $this->db->queryOne($countSql, $params);
        $total = $totalResult['total'];

        // Calculer pagination
        $offset = ($page - 1) * $limit;
        $totalPages = ceil($total / $limit);

        // Requête principale
        $sql = "SELECT t.*, 
                       c.nom as compte_nom, c.type as compte_type,
                       cat.nom as categorie_nom, cat.couleur as categorie_couleur,
                       tier.nom as tiers_nom, tier.type as tiers_type, tier.code as tiers_code
                FROM transactions t
                LEFT JOIN comptes c ON t.compte_id = c.id
                LEFT JOIN categories cat ON t.categorie_id = cat.id
                LEFT JOIN tiers tier ON t.tiers_id = tier.id
                WHERE " . $whereClause . "
                ORDER BY t.date DESC, t.created_at DESC
                LIMIT ? OFFSET ?";

        $params[] = $limit;
        $params[] = $offset;

        $transactions = $this->db->query($sql, $params);

        return [
            'data' => array_map([$this, 'formatTransactionOutput'], $transactions),
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => $totalPages,
                'has_next' => $page < $totalPages,
                'has_prev' => $page > 1
            ]
        ];
    }

    /**
     * Mettre à jour une transaction
     */
    public function update($id, $data)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de transaction invalide");
        }

        // Vérifier que la transaction existe
        $existing = $this->getById($id);
        if (!$existing) {
            throw new Exception("Transaction non trouvée");
        }

        // Validation des données
        $validation = $this->validateTransactionData($data, false);
        if (!$validation['valid']) {
            throw new Exception("Données invalides : " . implode(', ', $validation['errors']));
        }

        $validData = $validation['data'];

        // Vérifier que le compte existe et est actif
        if (isset($validData['compte_id']) && !$this->isCompteValid($validData['compte_id'])) {
            throw new Exception("Le compte spécifié n'existe pas ou n'est pas actif");
        }

        try {
            $this->db->beginTransaction();

            $fields = [];
            $params = [];

            $allowedFields = ['type', 'montant', 'description', 'date', 'compte_id', 'categorie_id', 'tiers_id', 'numero_piece', 'notes'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $validData)) {
                    $fields[] = "$field = ?";
                    $params[] = $validData[$field];
                }
            }

            if (empty($fields)) {
                throw new Exception("Aucun champ à mettre à jour");
            }

            $sql = "UPDATE transactions SET " . implode(', ', $fields) . " WHERE id = ?";
            $params[] = $id;

            $this->db->execute($sql, $params);

            $this->db->commit();

            return $this->getById($id);

        } catch (Exception $e) {
            $this->db->rollback();
            throw new Exception("Erreur lors de la mise à jour : " . $e->getMessage());
        }
    }

    /**
     * Supprimer une transaction
     */
    public function delete($id)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de transaction invalide");
        }

        // Vérifier que la transaction existe
        $existing = $this->getById($id);
        if (!$existing) {
            throw new Exception("Transaction non trouvée");
        }

        try {
            $this->db->beginTransaction();

            // Si c'est une transaction de virement, supprimer aussi la transaction liée
            if ($existing['virement_id']) {
                $this->db->execute("DELETE FROM transactions WHERE id = ?", [$existing['virement_id']]);
            }

            // Supprimer les transactions qui référencent celle-ci comme virement
            $this->db->execute("DELETE FROM transactions WHERE virement_id = ?", [$id]);

            // Supprimer la transaction principale
            $result = $this->db->execute("DELETE FROM transactions WHERE id = ?", [$id]);

            $this->db->commit();

            if ($result === 0) {
                throw new Exception("Aucune transaction supprimée");
            }

            return ['message' => 'Transaction supprimée avec succès'];

        } catch (Exception $e) {
            $this->db->rollback();
            throw new Exception("Erreur lors de la suppression : " . $e->getMessage());
        }
    }

    /**
     * Obtenir les statistiques des transactions
     */
    public function getStatistiques($filters = [])
    {
        $where = ['1 = 1'];
        $params = [];

        // Appliquer les mêmes filtres que pour la liste
        if (!empty($filters['compte_id'])) {
            $where[] = "compte_id = ?";
            $params[] = $filters['compte_id'];
        }

        if (!empty($filters['date_debut'])) {
            $where[] = "date >= ?";
            $params[] = $filters['date_debut'];
        }

        if (!empty($filters['date_fin'])) {
            $where[] = "date <= ?";
            $params[] = $filters['date_fin'];
        }

        $whereClause = implode(' AND ', $where);

        // Statistiques générales
        $sql = "SELECT 
                    SUM(CASE WHEN type = 'recette' THEN montant ELSE 0 END) as total_recettes,
                    SUM(CASE WHEN type = 'depense' THEN montant ELSE 0 END) as total_depenses,
                    SUM(CASE WHEN type = 'recette' THEN montant ELSE -montant END) as benefice,
                    COUNT(*) as nombre_transactions,
                    COUNT(CASE WHEN type = 'recette' THEN 1 END) as nombre_recettes,
                    COUNT(CASE WHEN type = 'depense' THEN 1 END) as nombre_depenses,
                    AVG(montant) as montant_moyen,
                    MAX(montant) as montant_max,
                    MIN(montant) as montant_min
                FROM transactions 
                WHERE " . $whereClause;

        $stats = $this->db->queryOne($sql, $params);

        // Statistiques par catégorie
        $sqlCategories = "SELECT 
                            c.nom as categorie,
                            c.couleur,
                            t.type,
                            SUM(t.montant) as total,
                            COUNT(*) as nombre
                          FROM transactions t
                          LEFT JOIN categories c ON t.categorie_id = c.id
                          WHERE " . $whereClause . "
                          GROUP BY c.id, c.nom, c.couleur, t.type
                          ORDER BY total DESC";

        $statsCategories = $this->db->query($sqlCategories, $params);

        return [
            'general' => $stats,
            'par_categorie' => $statsCategories
        ];
    }

    /**
     * Valider les données d'une transaction
     */
    private function validateTransactionData($data, $required = true)
    {
        $rules = [
            'type' => ['required' => $required, 'type' => 'enum', 'values' => ['recette', 'depense']],
            'montant' => ['required' => $required, 'type' => 'decimal', 'min' => 0.01],
            'description' => ['required' => $required, 'type' => 'string', 'max_length' => 255],
            'date' => ['required' => $required, 'type' => 'date'],
            'compte_id' => ['required' => $required, 'type' => 'integer'],
            'categorie_id' => ['required' => false, 'type' => 'integer'],
            'tiers_id' => ['required' => false, 'type' => 'integer'],
            'numero_piece' => ['required' => false, 'type' => 'string', 'max_length' => 50],
            'notes' => ['required' => false, 'type' => 'string', 'max_length' => 1000],
            'created_by' => ['required' => false, 'type' => 'string', 'max_length' => 100]
        ];

        return validateInput($data, $rules);
    }

    /**
     * Valider les données d'un virement
     */
    private function validateVirementData($data)
    {
        $rules = [
            'montant' => ['required' => true, 'type' => 'decimal', 'min' => 0.01],
            'description' => ['required' => true, 'type' => 'string', 'max_length' => 255],
            'date' => ['required' => true, 'type' => 'date'],
            'compte_source' => ['required' => true, 'type' => 'integer'],
            'compte_destination' => ['required' => true, 'type' => 'integer'],
            'numero_piece' => ['required' => false, 'type' => 'string', 'max_length' => 50],
            'notes' => ['required' => false, 'type' => 'string', 'max_length' => 1000],
            'created_by' => ['required' => false, 'type' => 'string', 'max_length' => 100]
        ];

        return validateInput($data, $rules);
    }

    /**
     * Vérifier si un compte existe et est actif
     */
    private function isCompteValid($compteId)
    {
        if (!is_numeric($compteId)) {
            return false;
        }

        return $this->db->exists('comptes', 'id = ? AND actif = true', [$compteId]);
    }

    /**
     * Formater les données de sortie d'une transaction
     */
    private function formatTransactionOutput($transaction)
    {
        return [
            'id' => (int) $transaction['id'],
            'type' => $transaction['type'],
            'montant' => (float) $transaction['montant'],
            'description' => $transaction['description'],
            'date' => $transaction['date'],
            'numero_piece' => $transaction['numero_piece'],
            'notes' => $transaction['notes'],
            'virement_id' => $transaction['virement_id'] ? (int) $transaction['virement_id'] : null,
            'created_at' => $transaction['created_at'],
            'updated_at' => $transaction['updated_at'],
            'created_by' => $transaction['created_by'],
            'compte' => [
                'id' => (int) $transaction['compte_id'],
                'nom' => $transaction['compte_nom'],
                'type' => $transaction['compte_type']
            ],
            'categorie' => $transaction['categorie_id'] ? [
                'id' => (int) $transaction['categorie_id'],
                'nom' => $transaction['categorie_nom'],
                'couleur' => $transaction['categorie_couleur']
            ] : null,
            'tiers' => $transaction['tiers_id'] ? [
                'id' => (int) $transaction['tiers_id'],
                'nom' => $transaction['tiers_nom'],
                'type' => $transaction['tiers_type'],
                'code' => $transaction['tiers_code']
            ] : null
        ];
    }
}
