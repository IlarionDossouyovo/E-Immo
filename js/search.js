/**
 * E-Immo Platform - Advanced Search Module
 * Features: Advanced filters, Map search, Smart suggestions
 */

(function() {
  'use strict';

  const SearchModule = {
    // Search state
    state: {
      query: '',
      filters: {
        type: null,
        minPrice: null,
        maxPrice: null,
        minSurface: null,
        maxSurface: null,
        bedrooms: null,
        bathrooms: null,
        location: null,
        features: [],
        company: null
      },
      sort: 'newest',
      page: 1,
      perPage: 12
    },

    // Property data (demo)
    properties: [],

    /**
     * Initialize search module
     */
    init() {
      this.loadProperties();
      this.setupEventListeners();
      this.initMap();
      this.loadSavedSearches();
    },

    /**
     * Load properties
     */
    loadProperties() {
      // Demo data - in production, fetch from API
      this.properties = [
        {
          id: 'demo-1',
          title: 'Villa moderne à Akpkodomè',
          type: 'vente',
          price: 85000000,
          surface: 200,
          bedrooms: 4,
          bathrooms: 3,
          location: { city: 'Cotonou', district: 'Akpkodomè', lat: 6.3705, lng: 2.3912 },
          features: ['garage', 'jardin', 'climatisation'],
          company: 'electron',
          images: ['/property/demo-1.html'],
          createdAt: '2025-04-10'
        },
        {
          id: 'demo-2',
          title: 'Appartement F3 meublé',
          type: 'location',
          price: 350000,
          surface: 80,
          bedrooms: 2,
          bathrooms: 1,
          location: { city: 'Cotonou', district: 'Fidjrossè', lat: 6.3852, lng: 2.4189 },
          features: ['meublé', 'wifi', 'parking'],
          company: 'electron',
          images: ['/property/demo-2.html'],
          createdAt: '2025-04-12'
        },
        {
          id: 'demo-3',
          title: 'Bureau Premium',
          type: 'bureaux',
          price: 2500000,
          surface: 150,
          bedrooms: 0,
          bathrooms: 2,
          location: { city: 'Cotonou', district: 'Centre', lat: 6.4969, lng: 2.6288 },
          features: ['parking', 'security', 'internet'],
          company: 'electron',
          images: ['/property/demo-3.html'],
          createdAt: '2025-04-14'
        },
        {
          id: 'demo-4',
          title: 'Maison familiale Abomey-Calavi',
          type: 'vente',
          price: 95000000,
          surface: 280,
          bedrooms: 5,
          bathrooms: 3,
          location: { city: 'Abomey-Calavi', district: 'Glo-Djigbé', lat: 6.4485, lng: 2.3551 },
          features: ['garage', 'jardin', 'terrasse'],
          company: 'electron',
          images: [],
          createdAt: '2025-04-08'
        },
        {
          id: 'demo-5',
          title: 'Studio meublé centre-ville',
          type: 'location',
          price: 200000,
          surface: 45,
          bedrooms: 1,
          bathrooms: 1,
          location: { city: 'Cotonou', district: 'Centre', lat: 6.4969, lng: 2.6288 },
          features: ['meublé', 'wifi'],
          company: 'electron',
          images: [],
          createdAt: '2025-04-15'
        },
        {
          id: 'demo-6',
          title: 'Terrain à vendre Godonou',
          type: 'vente',
          price: 35000000,
          surface: 500,
          bedrooms: 0,
          bathrooms: 0,
          location: { city: 'Cotonou', district: 'Godonou', lat: 6.4037, lng: 2.4433 },
          features: ['titre-foncier'],
          company: 'electron',
          images: [],
          createdAt: '2025-04-05'
        }
      ];
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Search input
      const searchInput = document.getElementById('searchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.state.query = e.target.value;
          this.debouncedSearch();
        });
      }

      // Filter changes
      document.querySelectorAll('.filter-input, .filter-select').forEach(input => {
        input.addEventListener('change', () => this.updateFilters());
      });

      // Price range
      const priceMin = document.getElementById('priceMin');
      const priceMax = document.getElementById('priceMax');
      if (priceMin) {
        priceMin.addEventListener('change', () => this.updateFilters());
      }
      if (priceMax) {
        priceMax.addEventListener('change', () => this.updateFilters());
      }

      // Surface range
      const surfaceMin = document.getElementById('surfaceMin');
      const surfaceMax = document.getElementById('surfaceMax');
      if (surfaceMin) surfaceMin.addEventListener('change', () => this.updateFilters());
      if (surfaceMax) surfaceMax.addEventListener('change', () => this.updateFilters());

      // Bedrooms
      document.querySelectorAll('.bedroom-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.bedroom-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.filters.bedrooms = btn.dataset.value === 'any' ? null : parseInt(btn.dataset.value);
          this.search();
        });
      });

      // Type filter
      document.querySelectorAll('.type-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.type-filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.state.filters.type = btn.dataset.type === 'all' ? null : btn.dataset.type;
          this.search();
        });
      });

      // Sort
      const sortSelect = document.getElementById('sortSelect');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          this.state.sort = sortSelect.value;
          this.search();
        });
      }

      // Clear filters
      const clearFiltersBtn = document.getElementById('clearFilters');
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => this.clearFilters());
      }

      // Map controls
      const mapRefreshBtn = document.getElementById('mapRefresh');
      if (mapRefreshBtn) {
        mapRefreshBtn.addEventListener('click', () => this.searchInMapBounds());
      }

      // Save search
      const saveSearchBtn = document.getElementById('saveSearchBtn');
      if (saveSearchBtn) {
        saveSearchBtn.addEventListener('click', () => this.saveSearch());
      }

      // Voice search
      const voiceSearchBtn = document.getElementById('voiceSearch');
      if (voiceSearchBtn) {
        voiceSearchBtn.addEventListener('click', () => this.startVoiceSearch());
      }
    },

    /**
     * Initialize map (placeholder - would use Leaflet/Google Maps)
     */
    initMap() {
      const mapContainer = document.getElementById('mapContainer');
      if (!mapContainer) return;

      // Initialize map centered on Cotonou, Benin
      // In production, use: L.map('mapContainer').setView([6.4969, 2.6288], 13);
      
      // Add markers for each property
      this.properties.forEach(property => {
        if (property.location.lat && property.location.lng) {
          this.addMapMarker(property);
        }
      });
    },

    /**
     * Add marker to map
     */
    addMapMarker(property) {
      const marker = document.createElement('div');
      marker.className = 'map-marker';
      marker.dataset.propertyId = property.id;
      marker.innerHTML = `
        <div class="marker-price">${this.formatPrice(property.price)}</div>
      `;
      
      marker.addEventListener('click', () => {
        this.showPropertyPreview(property.id);
      });
      
      // In production: L.marker([property.location.lat, property.location.lng]).addTo(map).bindPopup(content);
    },

    /**
     * Search with debounce
     */
    debouncedSearch: (function() {
      let timeout;
      return function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => this.search(), 300);
      };
    })(),

    /**
     * Update filters from form
     */
    updateFilters() {
      const typeSelect = document.getElementById('typeFilter');
      const locationSelect = document.getElementById('locationFilter');
      const companySelect = document.getElementById('companyFilter');
      
      if (typeSelect) this.state.filters.type = typeSelect.value || null;
      if (locationSelect) this.state.filters.location = locationSelect.value || null;
      if (companySelect) this.state.filters.company = companySelect.value || null;
      
      // Price
      const priceMin = document.getElementById('priceMin');
      const priceMax = document.getElementById('priceMax');
      this.state.filters.minPrice = priceMin?.value ? parseInt(priceMin.value) : null;
      this.state.filters.maxPrice = priceMax?.value ? parseInt(priceMax.value) : null;
      
      // Surface
      const surfaceMin = document.getElementById('surfaceMin');
      const surfaceMax = document.getElementById('surfaceMax');
      this.state.filters.minSurface = surfaceMin?.value ? parseInt(surfaceMin.value) : null;
      this.state.filters.maxSurface = surfaceMax?.value ? parseInt(surfaceMax.value) : null;
      
      this.search();
    },

    /**
     * Perform search
     */
    search() {
      let results = [...this.properties];

      // Filter by query
      if (this.state.query) {
        const query = this.state.query.toLowerCase();
        results = results.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.location.city.toLowerCase().includes(query) ||
          p.location.district.toLowerCase().includes(query)
        );
      }

      // Filter by type
      if (this.state.filters.type) {
        results = results.filter(p => p.type === this.state.filters.type);
      }

      // Filter by price
      if (this.state.filters.minPrice) {
        results = results.filter(p => p.price >= this.state.filters.minPrice);
      }
      if (this.state.filters.maxPrice) {
        results = results.filter(p => p.price <= this.state.filters.maxPrice);
      }

      // Filter by surface
      if (this.state.filters.minSurface) {
        results = results.filter(p => p.surface >= this.state.filters.minSurface);
      }
      if (this.state.filters.maxSurface) {
        results = results.filter(p => p.surface <= this.state.filters.maxSurface);
      }

      // Filter by bedrooms
      if (this.state.filters.bedrooms !== null) {
        results = results.filter(p => p.bedrooms >= this.state.filters.bedrooms);
      }

      // Filter by location
      if (this.state.filters.location) {
        results = results.filter(p => p.location.city === this.state.filters.location);
      }

      // Filter by company
      if (this.state.filters.company) {
        results = results.filter(p => p.company === this.state.filters.company);
      }

      // Sort
      switch (this.state.sort) {
        case 'newest':
          results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          results.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'price-asc':
          results.sort((a, b) => a.price - b.price);
          break;
        case 'price-desc':
          results.sort((a, b) => b.price - a.price);
          break;
        case 'surface':
          results.sort((a, b) => b.surface - a.surface);
          break;
      }

      // Paginate
      const start = (this.state.page - 1) * this.state.perPage;
      const paginated = results.slice(start, start + this.state.perPage);

      this.displayResults(paginated, results.length);
      this.updateMapMarkers(results);
      this.updateActiveFilters();
    },

    /**
     * Display search results
     */
    displayResults(results, total) {
      const grid = document.getElementById('searchResults');
      if (!grid) return;

      if (results.length === 0) {
        grid.innerHTML = `
          <div class="no-results">
            <div class="no-results-icon">🔍</div>
            <h3>Aucun résultat trouvé</h3>
            <p>Essayez de modifier vos filtres ou critères de recherche</p>
            <button class="btn btn-primary" onclick="SearchModule.clearFilters()">Réinitialiser les filtres</button>
          </div>
        `;
        return;
      }

      grid.innerHTML = results.map(property => this.renderPropertyCard(property)).join('');

      // Update count
      const countEl = document.getElementById('resultsCount');
      if (countEl) {
        countEl.textContent = `${total} résultat${total > 1 ? 's' : ''}`;
      }

      // Update pagination
      this.updatePagination(total);
    },

    /**
     * Render property card
     */
    renderPropertyCard(property) {
      const typeColors = {
        vente: 'cyan',
        location: 'or',
        bureaux: 'violet'
      };
      
      return `
        <div class="property-card" data-id="${property.id}">
          <div class="property-image">
            <span class="property-badge badge-${typeColors[property.type]}">${property.type}</span>
          </div>
          <div class="property-body">
            <h3 class="property-title">${property.title}</h3>
            <p class="property-location">📍 ${property.location.district}, ${property.location.city}</p>
            <div class="property-features">
              ${property.bedrooms ? `<span>🛏️ ${property.bedrooms} ch.</span>` : ''}
              ${property.bathrooms ? `<span>🚿 ${property.bathrooms} sdb</span>` : ''}
              <span>📐 ${property.surface} m²</span>
            </div>
            <div class="property-price">${this.formatPrice(property.price)}${property.type === 'location' ? '/mois' : ''}</div>
            <div class="property-footer">
              <button class="favorite-btn ${window.EImmoClient?.isFavorite(property.id) ? 'active' : ''}" data-property-id="${property.id}">
                ❤️
              </button>
              <a href="/property/${property.id}" class="btn btn-sm btn-primary">Voir</a>
            </div>
          </div>
        </div>
      `;
    },

    /**
     * Update pagination
     */
    updatePagination(total) {
      const totalPages = Math.ceil(total / this.state.perPage);
      const pagination = document.getElementById('searchPagination');
      
      if (!pagination) return;
      
      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      let html = '';
      
      // Previous
      if (this.state.page > 1) {
        html += `<button onclick="SearchModule.goToPage(${this.state.page - 1})">←</button>`;
      }
      
      // Pages
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= this.state.page - 1 && i <= this.state.page + 1)) {
          html += `<button class="${i === this.state.page ? 'active' : ''}" onclick="SearchModule.goToPage(${i})">${i}</button>`;
        } else if (i === this.state.page - 2 || i === this.state.page + 2) {
          html += `<span>...</span>`;
        }
      }
      
      // Next
      if (this.state.page < totalPages) {
        html += `<button onclick="SearchModule.goToPage(${this.state.page + 1})">→</button>`;
      }
      
      pagination.innerHTML = html;
    },

    /**
     * Go to page
     */
    goToPage(page) {
      this.state.page = page;
      this.search();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    /**
     * Clear all filters
     */
    clearFilters() {
      this.state = {
        query: '',
        filters: {
          type: null,
          minPrice: null,
          maxPrice: null,
          minSurface: null,
          maxSurface: null,
          bedrooms: null,
          bathrooms: null,
          location: null,
          features: [],
          company: null
        },
        sort: 'newest',
        page: 1,
        perPage: 12
      };

      // Reset form elements
      document.querySelectorAll('.filter-input, .filter-select').forEach(input => {
        input.value = '';
      });
      
      document.querySelectorAll('.bedroom-btn, .type-filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.value === 'any' || btn.dataset.type === 'all') {
          btn.classList.add('active');
        }
      });

      this.search();
    },

    /**
     * Update active filters display
     */
    updateActiveFilters() {
      const container = document.getElementById('activeFilters');
      if (!container) return;

      let filters = [];
      
      if (this.state.filters.type) {
        filters.push(`<span class="filter-tag">${this.state.filters.type} <button onclick="SearchModule.removeFilter('type')">×</button></span>`);
      }
      if (this.state.filters.minPrice || this.state.filters.maxPrice) {
        const price = `${this.formatPrice(this.state.filters.minPrice || 0)} - ${this.formatPrice(this.state.filters.maxPrice || Infinity)}`;
        filters.push(`<span class="filter-tag">Prix: ${price} <button onclick="SearchModule.removeFilter('price')">×</button></span>`);
      }
      if (this.state.filters.bedrooms !== null) {
        filters.push(`<span class="filter-tag">${this.state.filters.bedrooms}+ chambres <button onclick="SearchModule.removeFilter('bedrooms')">×</button></span>`);
      }

      container.innerHTML = filters.length > 0 ? filters.join('') : '';
    },

    /**
     * Remove specific filter
     */
    removeFilter(filterName) {
      switch (filterName) {
        case 'type':
          this.state.filters.type = null;
          break;
        case 'price':
          this.state.filters.minPrice = null;
          this.state.filters.maxPrice = null;
          break;
        case 'bedrooms':
          this.state.filters.bedrooms = null;
          break;
      }
      this.search();
    },

    /**
     * Format price
     */
    formatPrice(price) {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(price);
    },

    /**
     * Search in map bounds
     */
    searchInMapBounds() {
      // Get map bounds and search within
      this.search();
    },

    /**
     * Show property preview on map click
     */
    showPropertyPreview(propertyId) {
      const property = this.properties.find(p => p.id === propertyId);
      if (!property) return;

      // Show preview card
      const preview = document.getElementById('mapPreview');
      if (preview) {
        preview.innerHTML = this.renderPropertyCard(property);
        preview.classList.add('active');
      }
    },

    /**
     * Update map markers
     */
    updateMapMarkers(properties) {
      // Update markers visibility based on filtered results
      const ids = properties.map(p => p.id);
      document.querySelectorAll('.map-marker').forEach(marker => {
        const pid = marker.dataset.propertyId;
        marker.style.display = ids.includes(pid) ? 'block' : 'none';
      });
    },

    /**
     * Save current search
     */
    saveSearch() {
      const savedSearches = JSON.parse(localStorage.getItem('eimmo_searches') || '[]');
      savedSearches.push({
        id: Date.now(),
        query: this.state.query,
        filters: { ...this.state.filters },
        savedAt: new Date().toISOString()
      });
      localStorage.setItem('eimmo_searches', JSON.stringify(savedSearches));
      
      // Show notification
      const notification = document.createElement('div');
      notification.className = 'notification notification-success';
      notification.innerHTML = '<span>✓</span><span>Recherche sauvegardée!</span>';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 3000);
    },

    /**
     * Load saved searches
     */
    loadSavedSearches() {
      const savedSearches = JSON.parse(localStorage.getItem('eimmo_searches') || '[]');
      // Display in saved searches dropdown
    },

    /**
     * Start voice search
     */
    startVoiceSearch() {
      if (!('webkitSpeechRecognition' in window)) {
        alert('La recherche vocale n\'est pas supportée par votre navigateur');
        return;
      }

      const recognition = new webkitSpeechRecognition();
      recognition.lang = 'fr-FR';
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = transcript;
          this.state.query = transcript;
          this.search();
        }
      };
      
      recognition.start();
    },

    /**
     * Get smart suggestions
     */
    getSuggestions(query) {
      if (!query || query.length < 2) return [];
      
      const suggestions = new Set();
      
      this.properties.forEach(p => {
        if (p.title.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(p.title);
        }
        if (p.location.district.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(p.location.district);
        }
        if (p.location.city.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(p.location.city);
        }
      });
      
      return Array.from(suggestions).slice(0, 5);
    }
  };

  // Initialize
  document.addEventListener('DOMContentLoaded', () => SearchModule.init());

  // Export
  window.SearchModule = SearchModule;

})();
