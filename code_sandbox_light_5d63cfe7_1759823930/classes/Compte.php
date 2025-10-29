<?php

/**
 * Classe Compte - Gestion des comptes bancaires et caisses
 * Gestion de Caisse Régie - Version 2.0.0
 */

require_once __DIR__ . '/../config/database.php';

class Compte
{
    private $db;

    public function __construct()
    {
        $this->db = getDatabase();
    }

    /**
     * Créer un nouveau compte
     */
    public function create($data)
    {
        // Validation des données
        $validation = $this->validateCompteData($data);
        if (!$validation['valid']) {
            throw new Exception("Données invalides : " . implode(', ', $validation['errors']));
        }

        $validData = $validation['data'];

        // Vérifier l'unicité du nom
        if ($this->db->exists('comptes', 'nom = ?', [$validData['nom']])) {
            throw new Exception("Un compte avec ce nom existe déjà");
        }

        try {
            $sql = "INSERT INTO comptes (nom, type, solde_initial, description, numero_compte, banque) 
                    VALUES (?, ?, ?, ?, ?, ?)";

            $params = [
                $validData['nom'],
                $validData['type'],
                $validData['solde_initial'] ?? 0.00,
                $validData['description'],
                $validData['numero_compte'],
                $validData['banque']
            ];

            $compteId = $this->db->insert($sql, $params);

            return $this->getById($compteId);

        } catch (Exception $e) {
            throw new Exception("Erreur lors de la création du compte : " . $e->getMessage());
        }
    }

    /**
     * Obtenir un compte par son ID avec solde calculé
     */
    public function getById($id)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de compte invalide");
        }

        $sql = "SELECT * FROM vue_soldes_comptes WHERE id = ?";
        $compte = $this->db->queryOne($sql, [$id]);

        if (!$compte) {
            throw new Exception("Compte non trouvé");
        }

        return $this->formatCompteOutput($compte);
    }

    /**
     * Lister les comptes avec soldes calculés
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
            $where[] = "(nom ILIKE ? OR description ILIKE ? OR numero_compte ILIKE ?)";
            $searchTerm = '%' . $filters['search'] . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $whereClause = implode(' AND ', $where);

        $sql = "SELECT * FROM vue_soldes_comptes WHERE " . $whereClause . " ORDER BY nom";
        $comptes = $this->db->query($sql, $params);

        return array_map([$this, 'formatCompteOutput'], $comptes);
    }

    /**
     * Mettre à jour un compte
     */
    public function update($id, $data)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de compte invalide");
        }

        // Vérifier que le compte existe
        $existing = $this->getById($id);
        if (!$existing) {
            throw new Exception("Compte non trouvé");
        }

        // Validation des données
        $validation = $this->validateCompteData($data, false);
        if (!$validation['valid']) {
            throw new Exception("Données invalides : " . implode(', ', $validation['errors']));
        }

        $validData = $validation['data'];

        // Vérifier l'unicité du nom (sauf pour le compte courant)
        if (isset($validData['nom']) && $validData['nom'] !== $existing['nom']) {
            if ($this->db->exists('comptes', 'nom = ? AND id != ?', [$validData['nom'], $id])) {
                throw new Exception("Un compte avec ce nom existe déjà");
            }
        }

        try {
            $fields = [];
            $params = [];

            $allowedFields = ['nom', 'type', 'solde_initial', 'description', 'numero_compte', 'banque', 'actif'];

            foreach ($allowedFields as $field) {
                if (array_key_exists($field, $validData)) {
                    $fields[] = "$field = ?";
                    $params[] = $validData[$field];
                }
            }

            if (empty($fields)) {
                throw new Exception("Aucun champ à mettre à jour");
            }

            $sql = "UPDATE comptes SET " . implode(', ', $fields) . " WHERE id = ?";
            $params[] = $id;

            $this->db->execute($sql, $params);

            return $this->getById($id);

        } catch (Exception $e) {
            throw new Exception("Erreur lors de la mise à jour : " . $e->getMessage());
        }
    }

    /**
     * Supprimer un compte (désactivation)
     */
    public function delete($id)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de compte invalide");
        }

        // Vérifier que le compte existe
        $existing = $this->getById($id);
        if (!$existing) {
            throw new Exception("Compte non trouvé");
        }

        // Vérifier qu'il n'y a pas de transactions liées
        $nbTransactions = $this->db->count('transactions', 'compte_id = ?', [$id]);
        if ($nbTransactions > 0) {
            // Ne pas supprimer physiquement, juste désactiver
            $this->db->execute("UPDATE comptes SET actif = false WHERE id = ?", [$id]);
            return ['message' => 'Compte désactivé (transactions existantes)'];
        }

        // Suppression physique possible
        $result = $this->db->execute("DELETE FROM comptes WHERE id = ?", [$id]);

        if ($result === 0) {
            throw new Exception("Aucun compte supprimé");
        }

        return ['message' => 'Compte supprimé avec succès'];
    }

    /**
     * Obtenir les statistiques d'un compte
     */
    public function getStatistiques($id, $periode = null)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de compte invalide");
        }

        // Vérifier que le compte existe
        $compte = $this->getById($id);
        if (!$compte) {
            throw new Exception("Compte non trouvé");
        }

        $where = ['compte_id = ?'];
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

        // Évolution mensuelle (6 derniers mois)
        $sqlEvolution = "SELECT 
                            DATE_TRUNC('month', date) as mois,
                            SUM(CASE WHEN type = 'recette' THEN montant ELSE 0 END) as recettes,
                            SUM(CASE WHEN type = 'depense' THEN montant ELSE 0 END) as depenses,
                            COUNT(*) as transactions
                         FROM transactions 
                         WHERE compte_id = ? AND date >= CURRENT_DATE - INTERVAL '6 months'
                         GROUP BY DATE_TRUNC('month', date)
                         ORDER BY mois DESC";

        $evolution = $this->db->query($sqlEvolution, [$id]);

        // Répartition par catégorie
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

        $categories = $this->db->query($sqlCategories, $params);

        return [
            'compte' => $compte,
            'periode' => $periode,
            'statistiques' => $stats,
            'evolution_mensuelle' => $evolution,
            'repartition_categories' => $categories
        ];
    }

    /**
     * Obtenir l'historique des transactions d'un compte
     */
    public function getHistorique($id, $limit = 50)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de compte invalide");
        }

        $sql = "SELECT t.*, 
                       cat.nom as categorie_nom, cat.couleur as categorie_couleur,
                       tier.nom as tiers_nom, tier.type as tiers_type
                FROM transactions t
                LEFT JOIN categories cat ON t.categorie_id = cat.id
                LEFT JOIN tiers tier ON t.tiers_id = tier.id
                WHERE t.compte_id = ?
                ORDER BY t.date DESC, t.created_at DESC
                LIMIT ?";

        $transactions = $this->db->query($sql, [$id, $limit]);

        return array_map(function ($t) {
            return [
                'id' => (int) $t['id'],
                'type' => $t['type'],
                'montant' => (float) $t['montant'],
                'description' => $t['description'],
                'date' => $t['date'],
                'numero_piece' => $t['numero_piece'],
                'notes' => $t['notes'],
                'virement_id' => $t['virement_id'] ? (int) $t['virement_id'] : null,
                'created_at' => $t['created_at'],
                'categorie' => $t['categorie_id'] ? [
                    'nom' => $t['categorie_nom'],
                    'couleur' => $t['categorie_couleur']
                ] : null,
                'tiers' => $t['tiers_id'] ? [
                    'nom' => $t['tiers_nom'],
                    'type' => $t['tiers_type']
                ] : null
            ];
        }, $transactions);
    }

    /**
     * Calculer le solde d'un compte à une date donnée
     */
    public function getSoldeAuDate($id, $date)
    {
        if (!is_numeric($id) || $id <= 0) {
            throw new Exception("ID de compte invalide");
        }

        if (!validateDate($date)) {
            throw new Exception("Date invalide");
        }

        // Récupérer le solde initial
        $compte = $this->db->queryOne("SELECT solde_initial FROM comptes WHERE id = ?", [$id]);
        if (!$compte) {
            throw new Exception("Compte non trouvé");
        }

        $soldeInitial = (float) $compte['solde_initial'];

        // Calculer les mouvements jusqu'à la date
        $sql = "SELECT SUM(CASE WHEN type = 'recette' THEN montant ELSE -montant END) as mouvements
                FROM transactions 
                WHERE compte_id = ? AND date <= ?";

        $result = $this->db->queryOne($sql, [$id, $date]);
        $mouvements = (float) ($result['mouvements'] ?? 0);

        return $soldeInitial + $mouvements;
    }

    /**
     * Obtenir un résumé de tous les comptes
     */
    public function getResume()
    {
        $sql = "SELECT 
                    COUNT(*) as total_comptes,
                    COUNT(CASE WHEN type = 'caisse' AND actif = true THEN 1 END) as nb_caisses,
                    COUNT(CASE WHEN type = 'banque' AND actif = true THEN 1 END) as nb_banques,
                    SUM(solde_actuel) as solde_total_actuel,
                    SUM(CASE WHEN type = 'caisse' THEN solde_actuel ELSE 0 END) as solde_caisses,
                    SUM(CASE WHEN type = 'banque' THEN solde_actuel ELSE 0 END) as solde_banques
                FROM vue_soldes_comptes 
                WHERE actif = true";

        $resume = $this->db->queryOne($sql);

        // Comptes avec solde négatif
        $comptesNegatifs = $this->db->query(
            "SELECT nom, solde_actuel FROM vue_soldes_comptes WHERE actif = true AND solde_actuel < 0 ORDER BY solde_actuel"
        );

        return [
            'statistiques' => $resume,
            'comptes_negatifs' => $comptesNegatifs
        ];
    }

    /**
     * Valider les données d'un compte
     */
    private function validateCompteData($data, $required = true)
    {
        $rules = [
            'nom' => ['required' => $required, 'type' => 'string', 'max_length' => 100],
            'type' => ['required' => $required, 'type' => 'enum', 'values' => ['caisse', 'banque']],
            'solde_initial' => ['required' => false, 'type' => 'decimal'],
            'description' => ['required' => false, 'type' => 'string', 'max_length' => 1000],
            'numero_compte' => ['required' => false, 'type' => 'string', 'max_length' => 50],
            'banque' => ['required' => false, 'type' => 'string', 'max_length' => 100],
            'actif' => ['required' => false, 'type' => 'boolean']
        ];

        return validateInput($data, $rules);
    }

    /**
     * Formater les données de sortie d'un compte
     */
    private function formatCompteOutput($compte)
    {
        return [
            'id' => (int) $compte['id'],
            'nom' => $compte['nom'],
            'type' => $compte['type'],
            'solde_initial' => (float) $compte['solde_initial'],
            'solde_actuel' => (float) $compte['solde_actuel'],
            'mouvements' => (float) $compte['mouvements'],
            'nombre_transactions' => (int) $compte['nombre_transactions'],
            'description' => $compte['description'],
            'numero_compte' => $compte['numero_compte'],
            'banque' => $compte['banque'],
            'actif' => (bool) $compte['actif'],
            'derniere_transaction' => $compte['derniere_transaction'],
            'created_at' => $compte['created_at']
        ];
    }
}
