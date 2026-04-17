/**
 * E-Immo Platform - AI Module
 * Features: Price Estimation, Recommendations, Chatbot, Analytics
 */

(function() {
  'use strict';

  const AIModule = {
    // AI Configuration
    config: {
      modelEndpoint: '/api/ai',
      recommendationsLimit: 4,
      priceFactors: [
        'location', 'surface', 'bedrooms', 'bathrooms', 
        'condition', 'features', 'market_trend'
      ]
    },

    /**
     * Initialize AI module
     */
    init() {
      this.loadModels();
      this.setupEventListeners();
      this.initChatbot();
    },

    /**
     * Load AI models
     */
    async loadModels() {
      // In production, load ML models
      console.log('AI Models loaded');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Price estimator form
      const estimatorForm = document.getElementById('priceEstimatorForm');
      if (estimatorForm) {
        estimatorForm.addEventListener('submit', (e) => this.estimatePrice(e));
      }

      // Chatbot toggle
      const chatbotToggle = document.getElementById('chatbotToggle');
      if (chatbotToggle) {
        chatbotToggle.addEventListener('click', () => this.toggleChatbot());
      }

      // Chatbot input
      const chatbotInput = document.getElementById('chatbotInput');
      if (chatbotInput) {
        chatbotInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this.sendMessage();
        });
      }

      // Recommendation refresh
      const refreshRecBtn = document.getElementById('refreshRecommendations');
      if (refreshRecBtn) {
        refreshRecBtn.addEventListener('click', () => this.refreshRecommendations());
      }
    },

    // ==================== PRICE ESTIMATION ====================

    /**
     * Estimate property price using AI
     */
    async estimatePrice(formData) {
      this.showLoading('Estimation en cours...');

      try {
        // Collect features
        const features = {
          location: formData.location?.value,
          surface: parseInt(formData.surface?.value || 0),
          bedrooms: parseInt(formData.bedrooms?.value || 0),
          bathrooms: parseInt(formData.bathrooms?.value || 0),
          condition: formData.condition?.value,
          type: formData.type?.value,
          yearBuilt: parseInt(formData.yearBuilt?.value || 0)
        };

        // In production, call AI model API
        // For demo, use algorithm
        const estimate = this.calculateEstimate(features);
        
        this.displayPriceEstimate(estimate, features);
        
      } catch (error) {
        this.showError('Erreur lors de l\'estimation');
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Calculate price estimate (demo algorithm)
     */
    calculateEstimate(features) {
      // Base prices per type (in XOF)
      const basePrices = {
        vente: {
          villa: 45000,
          apartment: 35000,
          house: 40000,
          land: 8000,
          bureau: 55000
        },
        location: {
          villa: 150000,
          apartment: 120000,
          house: 130000,
          bureau: 180000
        }
      };

      // Location multipliers
      const locationMultipliers = {
        'Cotonou-Centre': 1.3,
        'Cotonou-Fidjrosse': 1.2,
        'Cotonou-Akpkodome': 1.15,
        'Abomey-Calavi': 1.0,
        'Porto-Novo': 0.85,
        'Ouidah': 0.8
      };

      // Calculate
      let price = features.surface * (basePrices.villa.apartment || 30000);
      
      // Apply location
      if (features.location) {
        const multiplier = locationMultipliers[features.location] || 1.0;
        price *= multiplier;
      }

      // Adjust for bedrooms
      if (features.bedrooms) {
        price += features.bedrooms * 5000000;
      }

      // Adjust for bathrooms
      if (features.bathrooms) {
        price += features.bathrooms * 3000000;
      }

      // Condition adjustment
      if (features.condition === 'neuf') {
        price *= 1.2;
      } else if (features.condition === 'à rénover') {
        price *= 0.7;
      }

      return {
        min: Math.round(price * 0.9),
        max: Math.round(price * 1.1),
        average: Math.round(price),
        confidence: 85
      };
    },

    /**
     * Display price estimate
     */
    displayPriceEstimate(estimate, features) {
      const container = document.getElementById('priceEstimateResult');
      if (!container) return;

      container.innerHTML = `
        <div class="estimate-result">
          <div class="estimate-range">
            <span class="estimate-label">Prix estimé</span>
            <span class="estimate-price">${this.formatPrice(estimate.min)} - ${this.formatPrice(estimate.max)}</span>
          </div>
          <div class="estimate-confidence">
            <span>Confiance: ${estimate.confidence}%</span>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${estimate.confidence}%"></div>
            </div>
          </div>
          <div class="estimate-factors">
            <h4>Facteurs déterminants</h4>
            <ul>
              <li>📍 ${features.location || 'Localisation'}</li>
              <li>📐 ${features.surface} m²</li>
              <li>🛏️ ${features.bedrooms || 0} chambres</li>
              <li>🚿 ${features.bathrooms || 0} salles de bain</li>
            </ul>
          </div>
          <button class="btn btn-primary" onclick="AIModule.bookEvaluation()">
            Réserver une évaluation gratuite
          </button>
        </div>
      `;
    },

    // ==================== RECOMMENDATIONS ====================

    /**
     * Get personalized recommendations
     */
    async getRecommendations(userId, propertyId = null) {
      this.showLoading();

      try {
        // Get user preferences
        const preferences = this.getUserPreferences();
        
        // Get viewed properties
        const history = this.getViewHistory();
        
        // Get similar properties
        let recommendations = this.properties.filter(p => {
          if (propertyId && p.id === propertyId) return false;
          
          // Score based on preferences
          let score = 0;
          
          if (preferences.type === p.type) score += 30;
          if (p.price <= preferences.maxPrice) score += 20;
          if (p.bedrooms >= preferences.minBedrooms) score += 15;
          if (p.location.city === preferences.location) score += 25;
          
          // Boost based on history
          const viewedSimilar = history.some(h => h.type === p.type);
          if (viewedSimilar) score += 10;
          
          return score > 30;
        });

        // Sort by score
        recommendations.sort((a, b) => b.score - a.score);
        
        return recommendations.slice(0, this.config.recommendationsLimit);

      } catch (error) {
        console.error('Error getting recommendations:', error);
        return [];
      } finally {
        this.hideLoading();
      }
    },

    /**
     * Display recommendations
     */
    displayRecommendations(recommendations) {
      const container = document.getElementById('recommendationsGrid');
      if (!container) return;

      if (!recommendations.length) {
        container.innerHTML = '<p class="no-recommendations">Aucune recommandation pour le moment</p>';
        return;
      }

      container.innerHTML = recommendations.map(property => `
        <div class="recommendation-card" data-property-id="${property.id}">
          <div class="rec-image">
            <span class="rec-score">${property.score}%</span>
          </div>
          <div class="rec-content">
            <h4>${property.title}</h4>
            <p>📍 ${property.location}</p>
            <span class="rec-price">${this.formatPrice(property.price)}</span>
          </div>
        </div>
      `).join('');
    },

    /**
     * Refresh recommendations
     */
    refreshRecommendations() {
      this.getRecommendations().then(recs => this.displayRecommendations(recs));
    },

    // ==================== CHATBOT ====================

    /**
     * Initialize chatbot
     */
    initChatbot() {
      // Load chatbot configuration
      this.chatbotConfig = {
        welcome: 'Bonjour! Je suis E-Immo AI, votre assistant immobilier. Comment puis-je vous aider?',
        quickReplies: [
          { label: '🏠 Acheter', action: 'search:type=vente' },
          { label: '🏡 Louer', action: 'search:type=location' },
          { label: '📊 Estimer', action: 'estimator' },
          { label: '❓ FAQ', action: 'faq' }
        ],
        intents: [
          {
            pattern: /acheter|achat|acheter/i,
            response: 'Pour acheter un bien, je vous recommande de définir votre budget et vos critères. Voulez-vous que je vous montre les propriétés en vente?'
          },
          {
            pattern: /louer|location|locat/i,
            response: 'Je peux vous aider à trouver une location. Quel type de bien recherchez-vous? Appartement, maison, bureau?'
          },
          {
            pattern: /prix|estimation|estimer/i,
            response: 'Je peux estimer le prix de votre bien! Cliquez sur "Estimation" pour commencer.'
          },
          {
            pattern: /contact|téléphone|whatsapp/i,
            response: 'Vous pouvez nous contacter au +229 01 977 003 47 ou par email: electronbusiness07@gmail.com'
          },
          {
            pattern: /merci|thanks/i,
            response: 'De rien! N\'hésitez pas si vous avez d\'autres questions. 😊'
          }
        ]
      };

      // Show welcome message
      this.addBotMessage(this.chatbotConfig.welcome);
    },

    /**
     * Toggle chatbot
     */
    toggleChatbot() {
      const chatbot = document.getElementById('chatbot');
      if (chatbot) {
        chatbot.classList.toggle('active');
      }
    },

    /**
     * Send message
     */
    sendMessage() {
      const input = document.getElementById('chatbotInput');
      const message = input?.value?.trim();
      
      if (!message) return;

      this.addUserMessage(message);
      input.value = '';

      // Process message
      this.processMessage(message);
    },

    /**
     * Process message with AI
     */
    processMessage(message) {
      // Check intents
      let response = null;
      
      for (const intent of this.chatbotConfig.intents) {
        if (intent.pattern.test(message)) {
          response = intent.response;
          break;
        }
      }

      // Default response if no match
      if (!response) {
        response = 'Je n\'ai pas bien compris votre demande. pouvez-vous reformuler? Ou utilisez les boutons ci-dessous pour une réponse rapide.';
      }

      // Simulate typing delay
      setTimeout(() => {
        this.addBotMessage(response);
      }, 500);
    },

    /**
     * Add user message to chat
     */
    addUserMessage(message) {
      const container = document.getElementById('chatbotMessages');
      if (!container) return;

      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-message user';
      msgDiv.textContent = message;
      container.appendChild(msgDiv);
      container.scrollTop = container.scrollHeight;
    },

    /**
     * Add bot message to chat
     */
    addBotMessage(message) {
      const container = document.getElementById('chatbotMessages');
      if (!container) return;

      const msgDiv = document.createElement('div');
      msgDiv.className = 'chat-message bot';
      msgDiv.textContent = message;
      container.appendChild(msgDiv);
      container.scrollTop = container.scrollHeight;
    },

    // ==================== MARKET ANALYTICS ====================

    /**
     * Get market trends
     */
    async getMarketTrends(city = 'Cotonou') {
      // Demo data
      return {
        averagePrice: 45000000,
        pricePerSqm: 285000,
        trend: 'up',
        trendValue: 8.5,
        updatedAt: new Date().toISOString(),
        byDistrict: [
          { name: 'Centre', avgPrice: 65000000, trend: 12 },
          { name: 'Fidjrossè', avgPrice: 42000000, trend: 7 },
          { name: 'Akpkodomè', avgPrice: 38000000, trend: 5 },
          { name: 'Abomey-Calavi', avgPrice: 35000000, trend: 15 }
        ]
      };
    },

    /**
     * Display market analytics
     */
    displayMarketAnalytics(trends) {
      const container = document.getElementById('marketAnalytics');
      if (!container) return;

      container.innerHTML = `
        <div class="analytics-summary">
          <div class="analytics-stat">
            <span class="stat-label">Prix moyen</span>
            <span class="stat-value">${this.formatPrice(trends.averagePrice)}</span>
          </div>
          <div class="analytics-stat">
            <span class="stat-label">Prix/m²</span>
            <span class="stat-value">${this.formatPrice(trends.pricePerSqm)}</span>
          </div>
          <div class="analytics-stat">
            <span class="stat-label">Tendance</span>
            <span class="stat-value ${trends.trend === 'up' ? 'up' : 'down'}">
              ${trends.trend === 'up' ? '↗' : '↘'} ${trends.trendValue}%
            </span>
          </div>
        </div>
      `;
    },

    // ==================== HELPERS ====================

    /**
     * Get user preferences
     */
    getUserPreferences() {
      const prefs = localStorage.getItem('eimmo_preferences');
      return prefs ? JSON.parse(prefs) : {
        type: 'vente',
        maxPrice: 100000000,
        minBedrooms: 2,
        location: 'Cotonou'
      };
    },

    /**
     * Get view history
     */
    getViewHistory() {
      const history = localStorage.getItem('eimmo_history');
      return history ? JSON.parse(history) : [];
    },

    /**
     * Format price
     */
    formatPrice(amount) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        maximumFractionDigits: 0
      }).format(amount);
    },

    /**
     * Show loading
     */
    showLoading(message = 'Chargement...') {
      const loader = document.getElementById('aiLoader');
      if (loader) loader.classList.add('active');
    },

    /**
     * Hide loading
     */
    hideLoading() {
      const loader = document.getElementById('aiLoader');
      if (loader) loader.classList.remove('active');
    },

    /**
     * Show error
     */
    showError(message) {
      this.showNotification(message, 'error');
    },

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
      const notif = document.createElement('div');
      notif.className = `notification notification-${type}`;
      notif.textContent = message;
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 3000);
    },

    /**
     * Book evaluation
     */
    bookEvaluation() {
      window.location.href = '/contact.html?subject=evaluation';
    },

    // Demo properties
    properties: [
      { id: '1', title: 'Villa moderna', type: 'vente', price: 85000000, location: 'Cotonou, Akpkodomè', bedrooms: 4, bathrooms: 3, surface: 200 },
      { id: '2', title: 'Appartement F3', type: 'location', price: 350000, location: 'Cotonou, Fidjrossè', bedrooms: 2, bathrooms: 1, surface: 80 },
      { id: '3', title: 'Bureau Premium', type: 'bureaux', price: 2500000, location: 'Cotonou, Centre', bedrooms: 0, bathrooms: 2, surface: 150 }
    ]
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => AIModule.init());

  // Export
  window.AIModule = AIModule;

})();
