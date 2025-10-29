@echo off
chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

:: =============================================================================
:: SCRIPT D'INSTALLATION AUTOMATIQUE WINDOWS
:: Gestion de Caisse Régie - Version 2.0.0
:: =============================================================================

title Installation Gestion de Caisse Régie v2.0.0

echo ================================================================
echo     APPLICATION DE GESTION DE CAISSE REGIE PHP/POSTGRESQL
echo                    INSTALLATION AUTOMATIQUE
echo ================================================================
echo.
echo Version: 2.0.0
echo Date: %date% %time%
echo Système: Windows
echo.

:: Vérifier les droits administrateur
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Droits administrateur détectés ✓
) else (
    echo [ERREUR] Ce script doit être exécuté en tant qu'administrateur !
    echo          Clic droit sur le fichier ^> "Exécuter en tant qu'administrateur"
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================================
echo                   ETAPE 1: VERIFICATION DES PREREQUIS
echo ================================================================
echo.

:: Vérifier PHP
echo [1/4] Vérification de PHP...
php --version >nul 2>&1
if %errorLevel% == 0 (
    echo       ✓ PHP trouvé
    for /f "tokens=2" %%a in ('php --version ^| findstr /r "^PHP"') do set PHP_VERSION=%%a
    echo         Version: !PHP_VERSION!
) else (
    echo       ✗ PHP non trouvé dans le PATH
    echo.
    echo [ERREUR] PHP n'est pas installé ou non accessible.
    echo          Téléchargez PHP depuis: https://windows.php.net/download/
    echo          Assurez-vous qu'il soit ajouté au PATH Windows.
    echo.
    goto :error_end
)

:: Vérifier les extensions PHP
echo [2/4] Vérification des extensions PHP...
php install/check_requirements.php >nul 2>&1
if %errorLevel% == 0 (
    echo       ✓ Toutes les extensions requises sont présentes
) else (
    echo       ✗ Extensions PHP manquantes
    echo.
    echo [INFO] Exécution du diagnostic complet...
    echo.
    php install/check_requirements.php
    echo.
    echo [ERREUR] Veuillez installer les extensions manquantes avant de continuer.
    echo.
    goto :error_end
)

:: Vérifier PostgreSQL
echo [3/4] Vérification de PostgreSQL...
psql --version >nul 2>&1
if %errorLevel% == 0 (
    echo       ✓ PostgreSQL trouvé
    for /f "tokens=3" %%a in ('psql --version') do set PG_VERSION=%%a
    echo         Version: !PG_VERSION!
) else (
    echo       ✗ PostgreSQL non trouvé
    echo.
    echo [ERREUR] PostgreSQL n'est pas installé ou non accessible.
    echo          Téléchargez PostgreSQL depuis: https://www.postgresql.org/download/windows/
    echo          Assurez-vous que psql soit ajouté au PATH Windows.
    echo.
    goto :error_end
)

:: Vérifier la structure des fichiers
echo [4/4] Vérification de la structure des fichiers...
set MISSING_FILES=0

if not exist "config\database.php" (
    echo       ✗ config\database.php manquant
    set MISSING_FILES=1
)

if not exist "database\schema.sql" (
    echo       ✗ database\schema.sql manquant
    set MISSING_FILES=1
)

if not exist "config\config_example.php" (
    echo       ✗ config\config_example.php manquant
    set MISSING_FILES=1
)

if !MISSING_FILES! == 1 (
    echo.
    echo [ERREUR] Des fichiers essentiels sont manquants.
    echo          Vérifiez que l'extraction de l'archive est complète.
    echo.
    goto :error_end
)

echo       ✓ Structure des fichiers correcte

echo.
echo ================================================================
echo                 ETAPE 2: CONFIGURATION DE POSTGRESQL
echo ================================================================
echo.

:: Demander les informations de connexion PostgreSQL
echo Configuration de la base de données PostgreSQL:
echo.

:ask_pg_password
set /p PG_PASSWORD=Mot de passe de l'utilisateur 'postgres': 
if "!PG_PASSWORD!" == "" (
    echo [ERREUR] Le mot de passe ne peut pas être vide.
    goto :ask_pg_password
)

echo.
echo [INFO] Test de connexion à PostgreSQL...

:: Créer un fichier temporaire avec le mot de passe
echo !PG_PASSWORD! > temp_pgpass.txt

:: Tester la connexion
psql -h localhost -U postgres -c "SELECT version();" < temp_pgpass.txt >nul 2>&1
if %errorLevel% == 0 (
    echo       ✓ Connexion PostgreSQL réussie
) else (
    echo       ✗ Échec de connexion PostgreSQL
    del temp_pgpass.txt
    echo.
    echo [ERREUR] Impossible de se connecter à PostgreSQL avec ces identifiants.
    echo          Vérifiez que:
    echo          - PostgreSQL est démarré
    echo          - L'utilisateur 'postgres' existe
    echo          - Le mot de passe est correct
    echo          - pg_hba.conf permet les connexions locales
    echo.
    goto :error_end
)

echo.
echo [INFO] Création de la base de données et de l'utilisateur...

:: Exécuter le script de création de base de données
psql -h localhost -U postgres -f install\create_database.sql < temp_pgpass.txt
if %errorLevel% == 0 (
    echo       ✓ Base de données 'caisse_regie' créée
    echo       ✓ Utilisateur 'caisse_user' créé
) else (
    echo       ✗ Échec de création de la base de données
    del temp_pgpass.txt
    echo.
    echo [ERREUR] Impossible de créer la base de données.
    echo          Vérifiez les permissions de l'utilisateur postgres.
    echo.
    goto :error_end
)

:: Nettoyer le fichier temporaire
del temp_pgpass.txt

echo.
echo ================================================================
echo              ETAPE 3: CREATION DE LA STRUCTURE DES DONNEES
echo ================================================================
echo.

echo [INFO] Création des tables et insertion des données d'exemple...

:: Créer un fichier pgpass temporaire pour caisse_user
echo localhost:5432:caisse_regie:caisse_user:admin > temp_caisse_pgpass.txt

:: Exécuter le schéma de base de données
set PGPASSFILE=temp_caisse_pgpass.txt
psql -h localhost -U caisse_user -d caisse_regie -f database\schema.sql
if %errorLevel% == 0 (
    echo       ✓ Structure de la base de données créée
    echo       ✓ Données d'exemple insérées
) else (
    echo       ✗ Échec de création de la structure
    del temp_caisse_pgpass.txt
    echo.
    echo [ERREUR] Impossible de créer la structure de la base de données.
    echo          Vérifiez le fichier database\schema.sql
    echo.
    goto :error_end
)

:: Nettoyer le fichier pgpass
del temp_caisse_pgpass.txt

echo.
echo ================================================================
echo                ETAPE 4: CONFIGURATION DE L'APPLICATION
echo ================================================================
echo.

echo [INFO] Création du fichier de configuration...

:: Copier le fichier de configuration d'exemple
if exist "config\config_local.php" (
    echo       ⚠ config\config_local.php existe déjà
    set /p OVERWRITE=Voulez-vous le remplacer? (o/N): 
    if /i "!OVERWRITE!" == "o" (
        copy "config\config_example.php" "config\config_local.php" >nul
        echo       ✓ config\config_local.php remplacé
    ) else (
        echo       - Configuration existante conservée
    )
) else (
    copy "config\config_example.php" "config\config_local.php" >nul
    echo       ✓ config\config_local.php créé
)

:: Modifier la configuration avec les bonnes valeurs
echo [INFO] Mise à jour des paramètres de base de données...

:: Utiliser PowerShell pour modifier le fichier de configuration
powershell -Command "(Get-Content 'config\config_local.php') -replace \"define\('DB_HOST', 'localhost'\)\", \"define('DB_HOST', 'localhost')\" -replace \"define\('DB_USER', 'postgres'\)\", \"define('DB_USER', 'caisse_user')\" -replace \"define\('DB_PASS', 'admin'\)\", \"define('DB_PASS', 'admin')\" | Set-Content 'config\config_local.php'"

echo       ✓ Configuration mise à jour

:: Créer les dossiers nécessaires
echo [INFO] Création des dossiers nécessaires...

if not exist "logs" mkdir logs
if not exist "backups" mkdir backups

echo       ✓ Dossiers créés

echo.
echo ================================================================
echo              ETAPE 5: GENERATION DES SCRIPTS DE DEMARRAGE
echo ================================================================
echo.

:: Générer le script de démarrage
echo [INFO] Génération du script de démarrage...

(
echo @echo off
echo title Serveur Web - Gestion de Caisse Régie
echo echo ================================================================
echo echo           SERVEUR WEB - GESTION DE CAISSE REGIE
echo echo ================================================================
echo echo.
echo echo Démarrage du serveur web PHP sur http://localhost:8080
echo echo.
echo echo IMPORTANT:
echo echo - Gardez cette fenêtre ouverte
echo echo - Pour arrêter le serveur, fermez cette fenêtre ou appuyez sur Ctrl+C
echo echo - L'application sera accessible sur: http://localhost:8080
echo echo.
echo echo Appuyez sur une touche pour démarrer le serveur...
echo pause ^> nul
echo.
echo echo Démarrage du serveur...
echo php -S localhost:8080
echo echo.
echo echo Le serveur a été arrêté.
echo pause
) > install\start_server.bat

echo       ✓ install\start_server.bat créé

:: Générer un script de diagnostic
(
echo @echo off
echo title Diagnostic - Gestion de Caisse Régie
echo echo ================================================================
echo echo            DIAGNOSTIC - GESTION DE CAISSE REGIE
echo echo ================================================================
echo echo.
echo php install\check_requirements.php
echo echo.
echo pause
) > install\diagnostic.bat

echo       ✓ install\diagnostic.bat créé

:: Créer un raccourci bureau (optionnel)
set /p CREATE_SHORTCUT=Créer un raccourci sur le bureau? (o/N): 
if /i "!CREATE_SHORTCUT!" == "o" (
    echo [INFO] Création du raccourci bureau...
    
    set CURRENT_DIR=%CD%
    set SHORTCUT_PATH=%USERPROFILE%\Desktop\Gestion de Caisse Régie.lnk
    
    powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%SHORTCUT_PATH%'); $Shortcut.TargetPath = '%CURRENT_DIR%\install\start_server.bat'; $Shortcut.WorkingDirectory = '%CURRENT_DIR%'; $Shortcut.Description = 'Gestion de Caisse Régie - Serveur Web'; $Shortcut.Save()"
    
    if exist "%SHORTCUT_PATH%" (
        echo       ✓ Raccourci créé sur le bureau
    )
)

echo.
echo ================================================================
echo                    INSTALLATION TERMINEE AVEC SUCCES !
echo ================================================================
echo.
echo ✓ Base de données PostgreSQL configurée
echo ✓ Structure des données créée avec exemples
echo ✓ Configuration de l'application générée
echo ✓ Scripts de démarrage créés
echo.
echo INFORMATIONS DE CONNEXION:
echo   Base de données: caisse_regie
echo   Utilisateur: caisse_user  
echo   Mot de passe: admin
echo   Host: localhost
echo   Port: 5432
echo.
echo POUR DEMARRER L'APPLICATION:
echo 1. Double-cliquez sur: install\start_server.bat
echo 2. Ou exécutez: php -S localhost:8080
echo 3. Ouvrez votre navigateur sur: http://localhost:8080
echo.
echo FICHIERS UTILES:
echo - README.md : Documentation complète
echo - INSTALL_GUIDE.md : Guide d'installation détaillé  
echo - install\diagnostic.bat : Vérification du système
echo - config\config_local.php : Configuration de l'application
echo.
echo L'application est maintenant prête à être utilisée !
echo.

set /p START_NOW=Démarrer l'application maintenant? (o/N): 
if /i "!START_NOW!" == "o" (
    echo.
    echo Démarrage de l'application...
    start "" install\start_server.bat
    
    :: Attendre un peu puis ouvrir le navigateur
    timeout /t 3 /nobreak >nul
    start "" http://localhost:8080
)

echo.
echo ================================================================
pause
exit /b 0

:error_end
echo.
echo ================================================================
echo                         INSTALLATION ECHOUEE
echo ================================================================
echo.
echo L'installation n'a pas pu être completée.
echo.
echo SOLUTIONS POSSIBLES:
echo 1. Vérifiez que vous avez les droits administrateur
echo 2. Installez PHP avec les extensions requises
echo 3. Installez PostgreSQL et démarrez le service
echo 4. Consultez INSTALL_GUIDE.md pour l'installation manuelle
echo 5. Exécutez install\diagnostic.bat pour plus d'informations
echo.
echo Pour une installation manuelle, consultez INSTALL_GUIDE.md
echo.
echo ================================================================
pause
exit /b 1