/**
 * Script de diagnostic pour le modal de catégorie
 * À exécuter dans la console du navigateur pour tester le modal
 */

function testModalCategorie() {
    console.log('🔍 Test du modal de catégorie...');
    
    // Vérifier que le modal existe
    const modal = document.getElementById('categorieModal');
    console.log('Modal existe:', !!modal);
    
    if (!modal) {
        console.error('❌ Le modal de catégorie n\'existe pas dans le DOM');
        return;
    }
    
    // Vérifier les styles
    const computedStyle = window.getComputedStyle(modal);
    console.log('Display:', computedStyle.display);
    console.log('Position:', computedStyle.position);
    console.log('Z-index:', computedStyle.zIndex);
    
    // Vérifier le contenu du modal
    const modalContent = modal.querySelector('.modal-content');
    console.log('Modal content existe:', !!modalContent);
    
    // Vérifier les boutons
    const buttons = modal.querySelectorAll('button');
    console.log('Nombre de boutons trouvés:', buttons.length);
    
    buttons.forEach((button, index) => {
        console.log(`Bouton ${index}:`, button.textContent.trim());
        const btnComputedStyle = window.getComputedStyle(button);
        console.log(`  - Display: ${btnComputedStyle.display}`);
        console.log(`  - Visibility: ${btnComputedStyle.visibility}`);
    });
    
    // Test d'ouverture
    console.log('🧪 Test d\'ouverture du modal...');
    try {
        openCategoryModal();
        setTimeout(() => {
            const afterOpenStyle = window.getComputedStyle(modal);
            console.log('Après ouverture - Display:', afterOpenStyle.display);
            
            if (afterOpenStyle.display === 'none') {
                console.error('❌ Le modal ne s\'affiche toujours pas après openCategoryModal()');
            } else {
                console.log('✅ Modal ouvert avec succès');
            }
            
            // Test de fermeture
            console.log('🧪 Test de fermeture...');
            closeCategoryModal();
            setTimeout(() => {
                const afterCloseStyle = window.getComputedStyle(modal);
                console.log('Après fermeture - Display:', afterCloseStyle.display);
            }, 100);
        }, 100);
    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    }
}

// Fonction pour tester l'affichage des boutons spécifiquement
function testButtonsDisplay() {
    console.log('🔍 Test d\'affichage des boutons...');
    
    openCategoryModal();
    
    setTimeout(() => {
        const modal = document.getElementById('categorieModal');
        const modalFooter = modal.querySelector('.modal-footer');
        
        if (modalFooter) {
            const footerStyle = window.getComputedStyle(modalFooter);
            console.log('Modal footer display:', footerStyle.display);
            console.log('Modal footer visibility:', footerStyle.visibility);
        }
        
        const buttons = modal.querySelectorAll('.modal-footer button');
        buttons.forEach((button, index) => {
            const btnStyle = window.getComputedStyle(button);
            console.log(`Bouton ${index + 1} (${button.textContent.trim()}):`);
            console.log(`  - Display: ${btnStyle.display}`);
            console.log(`  - Visibility: ${btnStyle.visibility}`);
            console.log(`  - Position: ${btnStyle.position}`);
            console.log(`  - Width: ${btnStyle.width}`);
        });
    }, 200);
}

console.log('✅ Script de diagnostic chargé');
console.log('💡 Utilisez testModalCategorie() ou testButtonsDisplay() pour tester');