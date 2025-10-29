@echo off
chcp 65001 >nul 2>&1
title Serveur Web - Gestion de Caisse Régie v2.0.0

echo ================================================================
echo           SERVEUR WEB - GESTION DE CAISSE REGIE v2.0.0
echo ================================================================
echo.
echo Démarrage du serveur web PHP intégré
echo URL d'accès: http://localhost:8080
echo.
echo INSTRUCTIONS:
echo - Gardez cette fenêtre ouverte pendant l'utilisation
echo - Pour arrêter le serveur, fermez cette fenêtre ou appuyez sur Ctrl+C  
echo - En cas de problème, exécutez install\diagnostic.bat
echo.

:: Vérifier que PHP est disponible
php --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERREUR] PHP non trouvé !
    echo          Vérifiez que PHP est installé et ajouté au PATH Windows.
    echo          Consultez INSTALL_GUIDE.md pour plus d'informations.
    echo.
    pause
    exit /b 1
)

:: Vérifier que le fichier index.php existe
if not exist "index.php" (
    echo [ERREUR] Fichier index.php non trouvé !
    echo          Assurez-vous que le script est exécuté depuis le dossier racine
    echo          de l'application Gestion de Caisse Régie.
    echo.
    pause
    exit /b 1
)

:: Vérifier la configuration
if not exist "config\config_local.php" (
    echo [AVERTISSEMENT] Fichier de configuration non trouvé !
    echo                 L'application va utiliser la configuration par défaut.
    echo                 Pour configurer: copiez config_example.php vers config_local.php
    echo.
)

:: Afficher les informations système
echo INFORMATIONS SYSTEME:
for /f "tokens=2" %%a in ('php --version ^| findstr /r "^PHP"') do echo   PHP: %%a
echo   Répertoire: %CD%
echo   Date/Heure: %date% %time%
echo.

echo ================================================================
echo                    DEMARRAGE DU SERVEUR WEB
echo ================================================================
echo.
echo Le serveur démarre...
echo.
echo Une fois démarré, ouvrez votre navigateur web à l'adresse:
echo   ^> http://localhost:8080
echo.
echo Appuyez sur Ctrl+C pour arrêter le serveur.
echo.

:: Changer vers le répertoire de l'application
cd /d "%~dp0\.."

:: Démarrer le serveur PHP intégré
php -S localhost:8080 -t .

:: Message affiché quand le serveur s'arrête
echo.
echo ================================================================
echo                      SERVEUR ARRETE
echo ================================================================
echo.
echo Le serveur web a été arrêté.
echo Pour redémarrer l'application, relancez ce script.
echo.
pause