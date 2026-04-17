/**
 * E-Immo Platform - Client Module
 * Features: Favorites, Alerts, History, Calculator, Comparator
 */

(function() {
  'use strict';

  const ClientModule = {
    storage: {
      favorites: 'eimmo_favorites',
      alerts: 'eimmo_alerts',
      history: 'eimmo_history',
      searches: 'eimmo_searches',
      comparator: 'eimmo_comparator'
    },

    /**
     * Initialize client module
     */
    init() {
      this.loadData();
      this.setupEventListeners();
    },

    /**
     * Load data from localStorage
     */
    loadData() {
      this.favorites = this.getFromStorage(this.storage.favorites) || [];
      this.alerts = this.getFromStorage(this.storage.alerts) || [];
      this.history = this.getFromStorage(this.storage.history) || [];
      this.searches = this.getFromStorage(this.storage.searches) || [];
      this.comparator = this.getFromStorage(this.storage.comparator) || [];
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Favorite buttons
      document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const propertyId = btn.dataset.propertyId;
          this.toggleFavorite(propertyId, btn);
        });
      });

      // Alert buttons
      document.querySelectorAll('.alert-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          this.showAlertModal(btn.dataset.propertyId);
        });
      });

      // Comparator buttons
      document.querySelectorAll('.compare-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const propertyId = btn.dataset.propertyId;
          this.addToComparator(propertyId, btn);
        });
      });

      // Remove from comparator
      document.querySelectorAll('.remove-compare').forEach(btn => {
        btn.addEventListener('click', () => {
          this.removeFromComparator(btn.dataset.propertyId);
        });
      });

      // Save search
      document.querySelectorAll('.save-search-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.saveCurrentSearch();
        });
      });
    },

    // ==================== FAVORITES ====================

    /**
     * Toggle favorite
     */
    toggleFavorite(propertyId, btn) {
      const index = this.favorites.indexOf(propertyId);
      
      if (index > -1) {
        this.favorites.splice(index, 1);
        if (btn) btn.classList.remove('active');
        this.showNotification('Retiré des favoris', 'info');
      } else {
        if (this.favorites.length >= 50) {
          this.showNotification('Maximum 50 favoris atteint', 'warning');
          return;
        }
        this.favorites.push(propertyId);
        if (btn) btn.classList.add('active');
        this.showNotification('Ajouté aux favoris', 'success');
      }
      
      this.saveToStorage(this.storage.favorites, this.favorites);
      this.updateFavoritesCount();
    },

    /**
     * Check if property is favorite
     */
    isFavorite(propertyId) {
      return this.favorites.includes(propertyId);
    },

    /**
     * Get all favorites
     */
    getFavorites() {
      return this.favorites;
    },

    /**
     * Update favorites count in UI
     */
    updateFavoritesCount() {
      const countElements = document.querySelectorAll('.favorites-count');
      countElements.forEach(el => {
        el.textContent = this.favorites.length;
      });
    },

    // ==================== ALERTS ====================

    /**
     * Create alert for new properties
     */
    createAlert(alertData) {
      const alert = {
        id: this.generateId(),
        ...alertData,
        active: true,
        createdAt: new Date().toISOString()
      };
      
      this.alerts.push(alert);
      this.saveToStorage(this.storage.alerts, this.alerts);
      
      this.showNotification('Alerte créée! Vous serez notifié des nouvelles annonces', 'success');
      return alert;
    },

    /**
     * Delete alert
     */
    deleteAlert(alertId) {
      const index = this.alerts.findIndex(a => a.id === alertId);
      if (index > -1) {
        this.alerts.splice(index, 1);
        this.saveToStorage(this.storage.alerts, this.alerts);
        this.showNotification('Alerte supprimée', 'info');
      }
    },

    /**
     * Get all alerts
     */
    getAlerts() {
      return this.alerts;
    },

    // ==================== HISTORY ====================

    /**
     * Add to view history
     */
    addToHistory(property) {
      // Remove if already exists
      const existing = this.history.findIndex(h => h.id === property.id);
      if (existing > -1) {
        this.history.splice(existing, 1);
      }
      
      // Add to beginning
      this.history.unshift({
        id: property.id,
        title: property.title,
        price: property.price,
        image: property.image,
        viewedAt: new Date().toISOString()
      });
      
      // Keep only last 50
      if (this.history.length > 50) {
        this.history = this.history.slice(0, 50);
      }
      
      this.saveToStorage(this.storage.history, this.history);
    },

    /**
     * Get view history
     */
    getHistory() {
      return this.history;
    },

    /**
     * Clear history
     */
    clearHistory() {
      this.history = [];
      this.saveToStorage(this.storage.history, this.history);
      this.showNotification('Historique effacé', 'info');
    },

    // ==================== SEARCHES ====================

    /**
     * Save current search
     */
    saveCurrentSearch() {
      const searchParams = new URLSearchParams(window.location.search);
      const search = {
        id: this.generateId(),
        params: Object.fromEntries(searchParams),
        savedAt: new Date().toISOString()
      };
      
      this.searches.push(search);
      this.saveToStorage(this.storage.searches, this.searches);
      
      this.showNotification('Recherche sauvegardée!', 'success');
    },

    /**
     * Get saved searches
     */
    getSearches() {
      return this.searches;
    },

    /**
     * Delete saved search
     */
    deleteSearch(searchId) {
      const index = this.searches.findIndex(s => s.id === searchId);
      if (index > -1) {
        this.searches.splice(index, 1);
        this.saveToStorage(this.storage.searches, this.searches);
      }
    },

    // ==================== COMPARATOR ====================

    /**
     * Add to comparator
     */
    addToComparator(propertyId, btn) {
      if (this.comparator.includes(propertyId)) {
        this.showNotification('Propriété déjà dans le comparateur', 'info');
        return;
      }
      
      if (this.comparator.length >= 4) {
        this.showNotification('Maximum 4 propriétés à comparer', 'warning');
        return;
      }
      
      this.comparator.push(propertyId);
      this.saveToStorage(this.storage.comparator, this.comparator);
      
      if (btn) btn.classList.add('active');
      this.updateComparatorUI();
      this.showNotification('Ajouté au comparateur', 'success');
    },

    /**
     * Remove from comparator
     */
    removeFromComparator(propertyId) {
      const index = this.comparator.indexOf(propertyId);
      if (index > -1) {
        this.comparator.splice(index, 1);
        this.saveToStorage(this.storage.comparator, this.comparator);
        this.updateComparatorUI();
      }
    },

    /**
     * Get comparator
     */
    getComparator() {
      return this.comparator;
    },

    /**
     * Update comparator UI
     */
    updateComparatorUI() {
      // Update count
      const countElements = document.querySelectorAll('.compare-count');
      countElements.forEach(el => {
        el.textContent = this.comparator.length;
      });
      
      // Show/hide comparator bar
      const comparatorBar = document.getElementById('comparatorBar');
      if (comparatorBar) {
        if (this.comparator.length > 0) {
          comparatorBar.classList.add('active');
        } else {
          comparatorBar.classList.remove('active');
        }
      }
    },

    // ==================== CALCULATOR ====================

    /**
     * Calculate mortgage
     */
    calculateMortgage(principal, rate, years) {
      const monthlyRate = rate / 100 / 12;
      const payments = years * 12;
      
      if (monthlyRate === 0) {
        return principal / payments;
      }
      
      const monthly = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, payments)) / 
        (Math.pow(1 + monthlyRate, payments) - 1);
      
      return Math.round(monthly);
    },

    /**
     * Calculate total cost
     */
    calculateTotal(monthlyPayment, years, principal) {
      const totalPaid = monthlyPayment * years * 12;
      const interest = totalPaid - principal;
      return {
        total: totalPaid,
        interest: interest,
        monthly: monthlyPayment
      };
    },

    // ==================== HELPERS ====================

    /**
     * Get from localStorage
     */
    getFromStorage(key) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (e) {
        return null;
      }
    },

    /**
     * Save to localStorage
     */
    saveToStorage(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        console.error('Error saving to storage:', e);
      }
    },

    /**
     * Generate unique ID
     */
    generateId() {
      return 'cl_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">×</button>
      `;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('show');
      }, 10);
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },

    /**
     * Show alert modal
     */
    showAlertModal(propertyId) {
      const modal = document.getElementById('alertModal');
      if (modal) {
        modal.dataset.propertyId = propertyId;
        modal.classList.add('active');
      }
    }
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => ClientModule.init());

  // Export
  window.EImmoClient = ClientModule;

})();
