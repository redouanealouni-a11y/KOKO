/**
 * Router for managing navigation between sections
 * @module core/router
 */

import { store } from './store.js';
import { SECTIONS, SECTION_TITLES } from './config.js';

/**
 * Router class for handling navigation
 */
class Router {
    constructor() {
        this.currentSection = SECTIONS.DASHBOARD;
        this.sectionHandlers = new Map();
    }

    /**
     * Register a section handler
     * @param {string} section The section name
     * @param {Function} handler The handler function to call when navigating to this section
     */
    registerSection(section, handler) {
        this.sectionHandlers.set(section, handler);
    }

    /**
     * Navigate to a section
     * @param {string} section The section to navigate to
     */
    navigateTo(section) {
        if (!Object.values(SECTIONS).includes(section)) {
            console.error(`Section invalide: ${section}`);
            return;
        }

        // Hide all sections
        document.querySelectorAll('.section').forEach(s => {
            s.style.display = 'none';
        });

        // Show target section
        const targetSection = document.getElementById(`${section}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }

        // Update sidebar active state
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.remove('sidebar-active');
        });
        
        const activeItem = document.querySelector(`[onclick="showSection('${section}')"]`);
        if (activeItem) {
            activeItem.classList.add('sidebar-active');
        }

        // Update page title
        const title = SECTION_TITLES[section] || section;
        const titleElement = document.getElementById('page-title');
        if (titleElement) {
            titleElement.textContent = title;
        }

        // Update store
        store.setState({ currentSection: section });
        this.currentSection = section;

        // Call section handler if registered
        if (this.sectionHandlers.has(section)) {
            const handler = this.sectionHandlers.get(section);
            handler();
        }

        console.log(`Navigation vers: ${section}`);
    }

    /**
     * Get current section
     * @returns {string} The current section name
     */
    getCurrentSection() {
        return this.currentSection;
    }

    /**
     * Go back to previous section (or dashboard if none)
     */
    goBack() {
        this.navigateTo(SECTIONS.DASHBOARD);
    }
}

// Export singleton instance
export const router = new Router();

/**
 * Global function for backwards compatibility with inline onclick handlers
 * @param {string} section The section to show
 */
window.showSection = function(section) {
    router.navigateTo(section);
};
