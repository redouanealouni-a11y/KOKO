<?php

/**
 * Classe Tiers - Gestion des clients et fournisseurs
 * Gestion de Caisse Régie - Version 2.0.0
 */

require_once __DIR__ . '/../config/database.php';

class Tiers
{
    private $db;

    public function __construct()
    {
        $this->db = getDatabase();
    }

    /**
     * Créer un nouveau tiers
     */
    public function create($data)
    {
        // Validation des données
        $validation = $this->validateTiersData($data);
        if (!$validation['valid']) {
            throw new Exception("Données invalides : " . implode(', ', $validation['errors']));
        }

        $validData = $validation['data'];

        // Générer un code unique si non fourni
        if (empty($validData['code'])) {
            $validData['code'] = $this->generateUniqueCode($validData['type'], $validData['nom']);
        } else {
            // Vérifier l'unicité du code fourni
            if ($this->db->exists('tiers', 'code = ?', [$validData['code']])) {
                throw new Exception("Un tiers avec ce code existe déjà");
            }
        }

        try {
            $sql = "INSERT INTO tiers (nom, code, type, contact, telephone, email, adresse, notes) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

            $params = [
                $validData['nom'],
                $validData['code'],
                $validData['type'],
                $validData['contact'],
                $validData['telephone'],
                $validData['email'],
                $validData['adresse'],
                $validData['notes']
            ];

            $tiersId = $this->db->insert($sql, $params);

            return $this->getById($tiersId);

        } catch (Exception $e) {
            throw new Exception("Erreur lors de la création du tiers : " . $e->getMessage());
        }
    }

    /**
     * Obtenir un tiers par son ID
     */
    public function getById($id)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de tiers invalide");
        }

        $sql = "SELECT * FROM tiers WHERE id = ?";
        $tiers = $this->db->queryOne($sql, [$id]);

        if (!$tiers) {
            throw new Exception("Tiers non trouvé");
        }

        return $this->formatTiersOutput($tiers);
    }

    /**
     * Obtenir un tiers par son code
     */
    public function getByCode($code)
    {
        if (empty($code)) {
            throw new Exception("Code de tiers invalide");
        }

        $sql = "SELECT * FROM tiers WHERE code = ?";
        $tiers = $this->db->queryOne($sql, [$code]);

        if (!$tiers) {
            throw new Exception("Tiers non trouvé");
        }

        return $this->formatTiersOutput($tiers);
    }

    /**
     * Lister les tiers avec filtres
     */
    public function getList($filters = [])
    {
        $where = ['actif = true'];
        $params = [];

        // Filtres
        if (!empty($filters['type'])) {
            $where[] = "type = ?";
            $params[] = $filters['type'];
        }

        if (!empty($filters['search'])) {
            $where[] = "(nom ILIKE ? OR code ILIKE ? OR contact ILIKE ? OR email ILIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = implode(' AND ', $where);

        $sql = "SELECT * FROM tiers WHERE " . $whereClause . " ORDER BY nom";
        $tiers = $this->db->query($sql, $params);

        return array_map([$this, 'formatTiersOutput'], $tiers);
    }

    /**
     * Mettre à jour un tiers
     */
    public function update($id, $data)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de tiers invalide");
        }

        // Vérifier que le tiers existe
        $existing = $this->getById($id);
        if (!$existing) {
            throw new Exception("Tiers non trouvé");
        }

        // Validation des données
        $validation = $this->validateTiersData($data, false);
        if (!$validation['valid']) {
            throw new Exception("Données invalides : " . implode(', ', $validation['errors']));
        }

        $validData = $validation['data'];

        // Vérifier l'unicité du code (sauf pour le tiers courant)
        if (isset($validData['code']) && $validData['code'] !== $existing['code']) {
            if ($this->db->exists('tiers', 'code = ? AND id != ?', [$validData['code'], $id])) {
                throw new Exception("Un tiers avec ce code existe déjà");
            }
        }

        try {
            $fields = [];
            $params = [];

            $allowedFields = ['nom', 'code', 'type', 'contact', 'telephone', 'email', 'adresse', 'notes', 'actif'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $validData)) {
                    $fields[] = "$field = ?";
                    $params[] = $validData[$field];
                }
            }

            if (empty($fields)) {
                throw new Exception("Aucun champ à mettre à jour");
            }

            $sql = "UPDATE tiers SET " . implode(', ', $fields) . " WHERE id = ?";
            $params[] = $id;

            $this->db->execute($sql, $params);

            return $this->getById($id);

        } catch (Exception $e) {
            throw new Exception("Erreur lors de la mise à jour : " . $e->getMessage());
        }
    }

    /**
     * Supprimer un tiers (désactivation)
     */
    public function delete($id)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de tiers invalide");
        }

        // Vérifier que le tiers existe
        $existing = $this->getById($id);
        if (!$existing) {
            throw new Exception("Tiers non trouvé");
        }

        // Vérifier qu'il n'y a pas de transactions liées
        $nbTransactions = $this->db->count('transactions', 'tiers_id = ?', [$id]);
        if ($nbTransactions > 0) {
            // Ne pas supprimer physiquement, juste désactiver
            $this->db->execute("UPDATE tiers SET actif = false WHERE id = ?", [$id]);
            return ['message' => 'Tiers désactivé (transactions existantes)'];
        }

        // Suppression physique possible
        $result = $this->db->execute("DELETE FROM tiers WHERE id = ?", [$id]);

        if ($result === 0) {
            throw new Exception("Aucun tiers supprimé");
        }

        return ['message' => 'Tiers supprimé avec succès'];
    }

    /**
     * Obtenir l'historique des transactions d'un tiers
     */
    public function getHistorique($id, $limite = 50)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de tiers invalide");
        }

        // Vérifier que le tiers existe
        $tiers = $this->getById($id);
        if (!$tiers) {
            throw new Exception("Tiers non trouvé");
        }

        $sql = "SELECT t.*, 
                       c.nom as compte_nom, c.type as compte_type,
                       cat.nom as categorie_nom, cat.couleur as categorie_couleur
                FROM transactions t
                LEFT JOIN comptes c ON t.compte_id = c.id
                LEFT JOIN categories cat ON t.categorie_id = cat.id
                WHERE t.tiers_id = ?
                ORDER BY t.date DESC, t.created_at DESC
                LIMIT ?";

        $transactions = $this->db->query($sql, [$id, $limite]);

        // Calculer les totaux
        $sqlTotaux = "SELECT 
                        SUM(CASE WHEN type = 'recette' THEN montant ELSE 0 END) as total_recettes,
                        SUM(CASE WHEN type = 'depense' THEN montant ELSE 0 END) as total_depenses,
                        SUM(CASE WHEN type = 'recette' THEN montant ELSE -montant END) as solde,
                        COUNT(*) as nombre_transactions,
                        MAX(date) as derniere_transaction,
                        MIN(date) as premiere_transaction
                      FROM transactions 
                      WHERE tiers_id = ?";

        $totaux = $this->db->queryOne($sqlTotaux, [$id]);

        return [
            'tiers' => $tiers,
            'totaux' => $totaux,
            'transactions' => array_map(function ($t) {
                return [
                    'id' => (int) $t['id'],
                    'type' => $t['type'],
                    'montant' => (float) $t['montant'],
                    'description' => $t['description'],
                    'date' => $t['date'],
                    'numero_piece' => $t['numero_piece'],
                    'notes' => $t['notes'],
                    'created_at' => $t['created_at'],
                    'compte' => [
                        'nom' => $t['compte_nom'],
                        'type' => $t['compte_type']
                    ],
                    'categorie' => $t['categorie_id'] ? [
                        'nom' => $t['categorie_nom'],
                        'couleur' => $t['categorie_couleur']
                    ] : null
                ];
            }, $transactions)
        ];
    }

    /**
     * Obtenir les statistiques d'un tiers
     */
    public function getStatistiques($id, $periode = null)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de tiers invalide");
        }

        // Vérifier que le tiers existe
        $tiers = $this->getById($id);
        if (!$tiers) {
            throw new Exception("Tiers non trouvé");
        }

        $where = ['tiers_id = ?'];
        $params = [$id];

        // Filtrer par période si spécifiée
        if ($periode) {
            switch ($periode) {
                case 'mois':
                    $where[] = "date >= DATE_TRUNC('month', CURRENT_DATE)";
                    break;
                case 'trimestre':
                    $where[] = "date >= DATE_TRUNC('quarter', CURRENT_DATE)";
                    break;
                case 'annee':
                    $where[] = "date >= DATE_TRUNC('year', CURRENT_DATE)";
                    break;
                case '30j':
                    $where[] = "date >= CURRENT_DATE - INTERVAL '30 days'";
                    break;
            }
        }

        $whereClause = implode(' AND ', $where);

        // Statistiques générales
        $sql = "SELECT 
                    COUNT(*) as nombre_transactions,
                    SUM(CASE WHEN type = 'recette' THEN montant ELSE 0 END) as total_recettes,
                    SUM(CASE WHEN type = 'depense' THEN montant ELSE 0 END) as total_depenses,
                    SUM(CASE WHEN type = 'recette' THEN montant ELSE -montant END) as solde_periode,
                    AVG(montant) as montant_moyen,
                    MAX(montant) as montant_max,
                    MIN(montant) as montant_min,
                    MAX(date) as derniere_transaction,
                    MIN(date) as premiere_transaction
                FROM transactions 
                WHERE " . $whereClause;

        $stats = $this->db->queryOne($sql, $params);

        // Évolution mensuelle (12 derniers mois)
        $sqlEvolution = "SELECT 
                            DATE_TRUNC('month', date) as mois,
                            SUM(CASE WHEN type = 'recette' THEN montant ELSE 0 END) as recettes,
                            SUM(CASE WHEN type = 'depense' THEN montant ELSE 0 END) as depenses,
                            COUNT(*) as transactions
                         FROM transactions 
                         WHERE tiers_id = ? AND date >= CURRENT_DATE - INTERVAL '12 months'
                         GROUP BY DATE_TRUNC('month', date)
                         ORDER BY mois DESC";

        $evolution = $this->db->query($sqlEvolution, [$id]);

        return [
            'tiers' => $tiers,
            'periode' => $periode,
            'statistiques' => $stats,
            'evolution_mensuelle' => $evolution
        ];
    }

    /**
     * Rechercher des tiers
     */
    public function search($terme, $type = null, $limite = 20)
    {
        $where = ['actif = true'];
        $params = [];

        if (!empty($terme)) {
            $where[] = "(nom ILIKE ? OR code ILIKE ? OR contact ILIKE ? OR email ILIKE ?)";
            $searchTerm = '%' . $terme . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        if ($type) {
            $where[] = "type = ?";
            $params[] = $type;
        }

        $whereClause = implode(' AND ', $where);

        $sql = "SELECT id, nom, code, type, contact, email FROM tiers 
                WHERE " . $whereClause . " 
                ORDER BY nom 
                LIMIT ?";

        $params[] = $limite;

        return $this->db->query($sql, $params);
    }

    /**
     * Obtenir un résumé de tous les tiers
     */
    public function getResume()
    {
        $sql = "SELECT 
                    COUNT(*) as total_tiers,
                    COUNT(CASE WHEN type = 'client' AND actif = true THEN 1 END) as nb_clients,
                    COUNT(CASE WHEN type = 'fournisseur' AND actif = true THEN 1 END) as nb_fournisseurs,
                    COUNT(CASE WHEN actif = false THEN 1 END) as nb_inactifs
                FROM tiers";

        $resume = $this->db->queryOne($sql);

        // Top 10 des tiers par volume de transactions
        $sqlTop = "SELECT 
                     t.id, t.nom, t.code, t.type,
                     COUNT(tr.id) as nb_transactions,
                     SUM(tr.montant) as volume_total,
                     MAX(tr.date) as derniere_transaction
                   FROM tiers t
                   LEFT JOIN transactions tr ON t.id = tr.tiers_id
                   WHERE t.actif = true
                   GROUP BY t.id, t.nom, t.code, t.type
                   HAVING COUNT(tr.id) > 0
                   ORDER BY volume_total DESC
                   LIMIT 10";

        $topTiers = $this->db->query($sqlTop);

        return [
            'statistiques' => $resume,
            'top_tiers' => $topTiers
        ];
    }

    /**
     * Générer un code unique pour un tiers
     */
    private function generateUniqueCode($type, $nom)
    {
        $prefix = strtoupper(substr($type, 0, 1)); // C pour Client, F pour Fournisseur

        // Nettoyer le nom et prendre les 3 premiers caractères
        $nomClean = preg_replace('/[^A-Za-z0-9]/', '', $nom);
        $nomCode = strtoupper(substr($nomClean, 0, 3));

        // Ajouter un suffixe basé sur le timestamp
        $suffix = substr(time(), -4);

        $baseCode = $prefix . $nomCode . $suffix;

        // Vérifier l'unicité et ajouter un compteur si nécessaire
        $code = $baseCode;
        $counter = 1;

        while ($this->db->exists('tiers', 'code = ?', [$code])) {
            $code = $baseCode . str_pad($counter, 2, '0', STR_PAD_LEFT);
            $counter++;
        }

        return $code;
    }

    /**
     * Valider les données d'un tiers
     */
    private function validateTiersData($data, $required = true)
    {
        $rules = [
            'nom' => ['required' => $required, 'type' => 'string', 'max_length' => 100],
            'code' => ['required' => false, 'type' => 'string', 'max_length' => 20],
            'type' => ['required' => $required, 'type' => 'enum', 'values' => ['client', 'fournisseur']],
            'contact' => ['required' => false, 'type' => 'string', 'max_length' => 100],
            'telephone' => ['required' => false, 'type' => 'string', 'max_length' => 20],
            'email' => ['required' => false, 'type' => 'email', 'max_length' => 100],
            'adresse' => ['required' => false, 'type' => 'string', 'max_length' => 1000],
            'notes' => ['required' => false, 'type' => 'string', 'max_length' => 1000],
            'actif' => ['required' => false, 'type' => 'boolean']
        ];

        return validateInput($data, $rules);
    }

    /**
     * Formater les données de sortie d'un tiers
     */
    private function formatTiersOutput($tiers)
    {
        return [
            'id' => (int) $tiers['id'],
            'nom' => $tiers['nom'],
            'code' => $tiers['code'],
            'type' => $tiers['type'],
            'contact' => $tiers['contact'],
            'telephone' => $tiers['telephone'],
            'email' => $tiers['email'],
            'adresse' => $tiers['adresse'],
            'notes' => $tiers['notes'],
            'actif' => (bool) $tiers['actif'],
            'created_at' => $tiers['created_at'],
            'updated_at' => $tiers['updated_at']
        ];
    }
}
